package database

import (
	"fmt"
	"time"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"

	"github.com/guavi/osrs-ge-tracker/internal/config"
)

// NewPostgresDB creates a new PostgreSQL database connection using the provided database configuration.
// The function accepts a PostgresConfig struct directly (instead of the full Config) to reduce chaining
// and make the dependency explicit. This follows the naming convention where parameter names are
// descriptive (dbConfig) and match the purpose of the configuration being passed.
//
// The connection includes:
// - GORM with Info-level logging
// - UTC timezone for all timestamps
// - Connection pool with 10 idle and 100 max open connections
// - 1 hour connection lifetime
//
// Returns an error if the connection fails or if the database cannot be pinged.
func NewPostgresDB(dbConfig config.PostgresConfig) (*gorm.DB, error) {
	dsn := fmt.Sprintf(
		"host=%s port=%s user=%s password=%s dbname=%s sslmode=%s",
		dbConfig.Host,
		dbConfig.Port,
		dbConfig.User,
		dbConfig.Password,
		dbConfig.DB,
		dbConfig.SSLMode,
	)

	// Configure GORM
	gormConfig := &gorm.Config{
		Logger: logger.Default.LogMode(logger.Info),
		NowFunc: func() time.Time {
			return time.Now().UTC()
		},
	}

	// Connect to database
	db, err := gorm.Open(postgres.Open(dsn), gormConfig)
	if err != nil {
		return nil, fmt.Errorf("failed to connect to database: %w", err)
	}

	// Get underlying SQL DB for connection pool configuration
	sqlDB, err := db.DB()
	if err != nil {
		return nil, fmt.Errorf("failed to get database instance: %w", err)
	}

	// Connection pool settings
	sqlDB.SetMaxIdleConns(10)
	sqlDB.SetMaxOpenConns(100)
	sqlDB.SetConnMaxLifetime(time.Hour)

	// Test connection
	if err := sqlDB.Ping(); err != nil {
		return nil, fmt.Errorf("failed to ping database: %w", err)
	}

	return db, nil
}
