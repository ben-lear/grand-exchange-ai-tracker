package testutil

import (
	"context"
	"fmt"
	"os"
	"path/filepath"
	"runtime"
	"sort"
	"strings"
	"sync"
	"testing"
	"time"

	"github.com/testcontainers/testcontainers-go"
	pgcontainer "github.com/testcontainers/testcontainers-go/modules/postgres"
	"github.com/testcontainers/testcontainers-go/wait"
	gormpg "gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

type PostgresTestDB struct {
	DB        *gorm.DB
	Container *pgcontainer.PostgresContainer
}

var sharedPG struct {
	initErr   error
	container *pgcontainer.PostgresContainer
	db        *gorm.DB
	once      sync.Once
	gate      sync.Mutex
}

// SharedPostgres returns a shared Postgres-backed *gorm.DB for tests.
//
// It starts the Postgres Testcontainer only once per `go test` invocation and
// applies migrations once. To keep test isolation, it truncates all tables and
// returns a release function that must be called (we register it via t.Cleanup).
//
// Note: tests using this helper should not call t.Parallel().
//

//nolint:revive,gocognit // Test container initialization requires retry logic with multiple
// error paths within sync.Once. This complexity is inherent to testcontainers pattern
// (https://testcontainers.com/guides/getting-started-with-testcontainers-for-go/) and
// necessary for reliable CI/CD execution. Complexity: 24 (acceptable for test infrastructure).
func SharedPostgres(t *testing.T) (*gorm.DB, func()) {
	t.Helper()

	sharedPG.once.Do(func() {
		ctx, cancel := context.WithTimeout(context.Background(), 2*time.Minute)
		defer cancel()

		pgContainer, err := pgcontainer.Run(ctx,
			"postgres:16-alpine",
			pgcontainer.WithDatabase("osrs_test"),
			pgcontainer.WithUsername("osrs_test"),
			pgcontainer.WithPassword("osrs_test"),
			testcontainers.WithWaitStrategy(
				wait.ForLog("database system is ready to accept connections").WithOccurrence(1).WithStartupTimeout(90*time.Second),
			),
		)
		if err != nil {
			sharedPG.initErr = fmt.Errorf("failed to start postgres container: %w", err)
			return
		}
		sharedPG.container = pgContainer

		connStr, err := pgContainer.ConnectionString(ctx, "sslmode=disable")
		if err != nil {
			sharedPG.initErr = fmt.Errorf("failed to get postgres connection string: %w", err)
			return
		}

		var gormDB *gorm.DB
		deadline := time.Now().Add(45 * time.Second)
		for {
			gormDB, err = gorm.Open(gormpg.Open(connStr), &gorm.Config{
				Logger: logger.Default.LogMode(logger.Silent),
			})
			if err == nil {
				sqlDB, sqlErr := gormDB.DB()
				if sqlErr == nil {
					pingErr := sqlDB.PingContext(ctx)
					if pingErr == nil {
						break
					}
					err = pingErr
				} else {
					err = sqlErr
				}
			}

			if time.Now().After(deadline) {
				sharedPG.initErr = fmt.Errorf("failed to connect to postgres container: %w", err)
				return
			}
			time.Sleep(750 * time.Millisecond)
		}

		if err := RunMigrations(ctx, gormDB); err != nil {
			sharedPG.initErr = fmt.Errorf("failed to run migrations: %w", err)
			return
		}

		sharedPG.db = gormDB
	})

	if sharedPG.initErr != nil {
		t.Fatalf("failed to initialize shared postgres: %v", sharedPG.initErr)
	}

	sharedPG.gate.Lock()
	TruncateAllTables(t, sharedPG.db)
	return sharedPG.db, func() { sharedPG.gate.Unlock() }
}

func NewPostgresTestDB(t *testing.T) *PostgresTestDB {
	t.Helper()

	ctx, cancel := context.WithTimeout(context.Background(), 2*time.Minute)
	t.Cleanup(cancel)

	pgContainer, err := pgcontainer.Run(ctx,
		"postgres:16-alpine",
		pgcontainer.WithDatabase("osrs_test"),
		pgcontainer.WithUsername("osrs_test"),
		pgcontainer.WithPassword("osrs_test"),
		testcontainers.WithWaitStrategy(
			wait.ForLog("database system is ready to accept connections").WithOccurrence(1).WithStartupTimeout(90*time.Second),
		),
	)
	if err != nil {
		t.Fatalf("failed to start postgres container: %v", err)
	}

	t.Cleanup(func() {
		_ = pgContainer.Terminate(context.Background())
	})

	connStr, err := pgContainer.ConnectionString(ctx, "sslmode=disable")
	if err != nil {
		t.Fatalf("failed to get postgres connection string: %v", err)
	}

	var gormDB *gorm.DB
	deadline := time.Now().Add(45 * time.Second)
	for {
		gormDB, err = gorm.Open(gormpg.Open(connStr), &gorm.Config{
			Logger: logger.Default.LogMode(logger.Silent),
		})
		if err == nil {
			sqlDB, sqlErr := gormDB.DB()
			if sqlErr == nil {
				pingErr := sqlDB.PingContext(ctx)
				if pingErr == nil {
					break
				}
				err = pingErr
			} else {
				err = sqlErr
			}
		}

		if time.Now().After(deadline) {
			t.Fatalf("failed to connect to postgres container: %v", err)
		}
		time.Sleep(750 * time.Millisecond)
	}

	if err := RunMigrations(ctx, gormDB); err != nil {
		t.Fatalf("failed to run migrations: %v", err)
	}

	return &PostgresTestDB{DB: gormDB, Container: pgContainer}
}

func RunMigrations(ctx context.Context, dbClient *gorm.DB) error {
	migrationsDir, err := repoRootRelative("backend", "migrations")
	if err != nil {
		return err
	}

	entries, err := os.ReadDir(migrationsDir)
	if err != nil {
		return fmt.Errorf("read migrations dir %s: %w", migrationsDir, err)
	}

	var migrationFiles []string
	for _, entry := range entries {
		if entry.IsDir() {
			continue
		}
		name := entry.Name()
		if !strings.HasSuffix(strings.ToLower(name), ".sql") {
			continue
		}
		migrationFiles = append(migrationFiles, filepath.Join(migrationsDir, name))
	}

	sort.Strings(migrationFiles)
	if len(migrationFiles) == 0 {
		return fmt.Errorf("no .sql migrations found in %s", migrationsDir)
	}

	sqlDB, err := dbClient.DB()
	if err != nil {
		return fmt.Errorf("get sql db: %w", err)
	}

	// Postgres supports multi-statement execution, including $$ blocks.
	for _, migrationPath := range migrationFiles {
		contents, readErr := os.ReadFile(migrationPath)
		if readErr != nil {
			return fmt.Errorf("read migration %s: %w", migrationPath, readErr)
		}
		if _, execErr := sqlDB.ExecContext(ctx, string(contents)); execErr != nil {
			return fmt.Errorf("exec migration %s: %w", filepath.Base(migrationPath), execErr)
		}
	}
	return nil
}

func TruncateAllTables(t *testing.T, dbClient *gorm.DB) {
	t.Helper()

	// Truncate parent partitioned tables; partitions truncate too.
	// Order is irrelevant due to CASCADE.
	if err := dbClient.Exec(
		"TRUNCATE TABLE " +
			"price_latest, " +
			"price_timeseries_5m, price_timeseries_1h, price_timeseries_6h, price_timeseries_24h, price_timeseries_daily, " +
			"items CASCADE",
	).Error; err != nil {
		t.Fatalf("failed to truncate tables: %v", err)
	}
}

func repoRootRelative(parts ...string) (string, error) {
	// Walk up from this file until we find the repository root (contains backend/go.mod).
	_, thisFile, _, ok := runtime.Caller(0)
	if !ok {
		return "", fmt.Errorf("unable to locate caller")
	}

	dir := filepath.Dir(thisFile)
	for i := 0; i < 10; i++ {
		candidate := filepath.Join(dir, "..", "..", "go.mod")
		candidate = filepath.Clean(candidate)
		if _, err := os.Stat(candidate); err == nil {
			root := filepath.Dir(filepath.Dir(candidate))
			p := filepath.Join(append([]string{root}, parts...)...)
			return filepath.Clean(p), nil
		}
		dir = filepath.Join(dir, "..")
	}

	// Fallback: allow running from backend/ as working dir.
	wd, _ := os.Getwd()
	if strings.HasSuffix(strings.ToLower(filepath.Clean(wd)), strings.ToLower(string(filepath.Separator)+"backend")) {
		p := filepath.Join(append([]string{filepath.Dir(wd)}, parts...)...)
		return filepath.Clean(p), nil
	}

	return "", fmt.Errorf("could not locate repo root to resolve migration path")
}
