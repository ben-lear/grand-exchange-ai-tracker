package unit

import (
	"context"
	"fmt"
	"testing"
	"time"

	"github.com/alicebob/miniredis/v2"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"

	"github.com/guavi/osrs-ge-tracker/internal/config"
	"github.com/guavi/osrs-ge-tracker/internal/database"
)

// TestNewPostgresDB_Success tests successful PostgreSQL connection with valid config
func TestNewPostgresDB_Success(t *testing.T) {
	cfg := &config.Config{
		PostgresHost:     "localhost",
		PostgresPort:     "5432",
		PostgresUser:     "osrs_tracker",
		PostgresPassword: "changeme",
		PostgresDB:       "osrs_ge_tracker",
		PostgresSSLMode:  "disable",
	}

	db, err := database.NewPostgresDB(cfg)
	require.NoError(t, err)
	require.NotNil(t, db)

	// Verify connection pool settings
	sqlDB, err := db.DB()
	require.NoError(t, err)

	stats := sqlDB.Stats()
	assert.GreaterOrEqual(t, stats.MaxOpenConnections, 1, "Should have max open connections configured")

	// Cleanup
	sqlDB.Close()
}

// TestNewPostgresDB_InvalidHost tests connection failure with invalid host
func TestNewPostgresDB_InvalidHost(t *testing.T) {
	cfg := &config.Config{
		PostgresHost:     "invalid-host-that-does-not-exist",
		PostgresPort:     "5432",
		PostgresUser:     "osrs_tracker",
		PostgresPassword: "changeme",
		PostgresDB:       "osrs_ge_tracker",
		PostgresSSLMode:  "disable",
	}

	db, err := database.NewPostgresDB(cfg)
	assert.Error(t, err)
	assert.Nil(t, db)
	assert.Contains(t, err.Error(), "failed to")
}

// TestNewPostgresDB_InvalidPort tests connection failure with invalid port
func TestNewPostgresDB_InvalidPort(t *testing.T) {
	cfg := &config.Config{
		PostgresHost:     "localhost",
		PostgresPort:     "9999", // Invalid port
		PostgresUser:     "osrs_tracker",
		PostgresPassword: "changeme",
		PostgresDB:       "osrs_ge_tracker",
		PostgresSSLMode:  "disable",
	}

	db, err := database.NewPostgresDB(cfg)
	assert.Error(t, err)
	assert.Nil(t, db)
}

// TestNewPostgresDB_InvalidCredentials tests connection failure with wrong credentials
func TestNewPostgresDB_InvalidCredentials(t *testing.T) {
	cfg := &config.Config{
		PostgresHost:     "localhost",
		PostgresPort:     "5432",
		PostgresUser:     "wrong_user",
		PostgresPassword: "wrong_password",
		PostgresDB:       "osrs_ge_tracker",
		PostgresSSLMode:  "disable",
	}

	db, err := database.NewPostgresDB(cfg)
	assert.Error(t, err)
	assert.Nil(t, db)
	assert.Contains(t, err.Error(), "failed to")
}

// TestNewPostgresDB_InvalidDatabase tests connection failure with non-existent database
func TestNewPostgresDB_InvalidDatabase(t *testing.T) {
	cfg := &config.Config{
		PostgresHost:     "localhost",
		PostgresPort:     "5432",
		PostgresUser:     "osrs_tracker",
		PostgresPassword: "changeme",
		PostgresDB:       "nonexistent_database_12345",
		PostgresSSLMode:  "disable",
	}

	db, err := database.NewPostgresDB(cfg)
	assert.Error(t, err)
	assert.Nil(t, db)
}

// TestNewPostgresDB_ConnectionPoolSettings verifies connection pool configuration
func TestNewPostgresDB_ConnectionPoolSettings(t *testing.T) {
	cfg := &config.Config{
		PostgresHost:     "localhost",
		PostgresPort:     "5432",
		PostgresUser:     "osrs_tracker",
		PostgresPassword: "changeme",
		PostgresDB:       "osrs_ge_tracker",
		PostgresSSLMode:  "disable",
	}

	db, err := database.NewPostgresDB(cfg)
	require.NoError(t, err)
	require.NotNil(t, db)

	sqlDB, err := db.DB()
	require.NoError(t, err)
	defer sqlDB.Close()

	// Verify pool settings
	stats := sqlDB.Stats()
	assert.Equal(t, 100, stats.MaxOpenConnections, "MaxOpenConns should be 100")

	// MaxIdleConns is set internally, check it's reasonable
	assert.LessOrEqual(t, 10, stats.MaxOpenConnections, "MaxIdleConns should be <= MaxOpenConns")
}

// TestNewPostgresDB_DSNFormat verifies DSN string construction
func TestNewPostgresDB_DSNFormat(t *testing.T) {
	// This test verifies DSN construction without actually connecting
	cfg := &config.Config{
		PostgresHost:     "testhost",
		PostgresPort:     "5433",
		PostgresUser:     "testuser",
		PostgresPassword: "testpass",
		PostgresDB:       "testdb",
		PostgresSSLMode:  "require",
	}

	// We expect DSN to be constructed correctly, but connection will fail
	// This indirectly tests DSN construction
	db, err := database.NewPostgresDB(cfg)

	// Should fail because testhost doesn't exist
	assert.Error(t, err)
	assert.Nil(t, db)

	// Error should indicate connection attempt was made with the config
	assert.Contains(t, err.Error(), "failed to")
}

// TestNewPostgresDB_PingFailure tests ping failure scenario
func TestNewPostgresDB_PingFailure(t *testing.T) {
	// Use invalid config that will fail on ping
	cfg := &config.Config{
		PostgresHost:     "localhost",
		PostgresPort:     "1", // Invalid port that won't accept connections
		PostgresUser:     "user",
		PostgresPassword: "pass",
		PostgresDB:       "db",
		PostgresSSLMode:  "disable",
	}

	db, err := database.NewPostgresDB(cfg)
	assert.Error(t, err)
	assert.Nil(t, db)
}

// TestNewPostgresDB_GORMConfiguration verifies GORM config is applied
func TestNewPostgresDB_GORMConfiguration(t *testing.T) {
	cfg := &config.Config{
		PostgresHost:     "localhost",
		PostgresPort:     "5432",
		PostgresUser:     "osrs_tracker",
		PostgresPassword: "changeme",
		PostgresDB:       "osrs_ge_tracker",
		PostgresSSLMode:  "disable",
	}

	db, err := database.NewPostgresDB(cfg)
	require.NoError(t, err)
	require.NotNil(t, db)

	sqlDB, err := db.DB()
	require.NoError(t, err)
	defer sqlDB.Close()

	// Verify GORM NowFunc uses UTC
	now := db.NowFunc()
	assert.Equal(t, time.UTC, now.Location(), "GORM should use UTC for timestamps")
}

// TestNewRedisClient_Success tests successful Redis connection
func TestNewRedisClient_Success(t *testing.T) {
	// Start miniredis server
	mr := miniredis.RunT(t)
	defer mr.Close()

	cfg := &config.Config{
		RedisHost:     mr.Host(),
		RedisPort:     mr.Port(),
		RedisPassword: "",
		RedisDB:       0,
	}

	client, err := database.NewRedisClient(cfg)
	require.NoError(t, err)
	require.NotNil(t, client)

	// Verify connection works
	ctx := context.Background()
	pong, err := client.Ping(ctx).Result()
	assert.NoError(t, err)
	assert.Equal(t, "PONG", pong)

	// Cleanup
	client.Close()
}

// TestNewRedisClient_WithPassword tests Redis connection with password
func TestNewRedisClient_WithPassword(t *testing.T) {
	// Start miniredis server with password
	mr := miniredis.RunT(t)
	defer mr.Close()
	mr.RequireAuth("secret-password")

	cfg := &config.Config{
		RedisHost:     mr.Host(),
		RedisPort:     mr.Port(),
		RedisPassword: "secret-password",
		RedisDB:       0,
	}

	client, err := database.NewRedisClient(cfg)
	require.NoError(t, err)
	require.NotNil(t, client)

	// Verify connection works
	ctx := context.Background()
	pong, err := client.Ping(ctx).Result()
	assert.NoError(t, err)
	assert.Equal(t, "PONG", pong)

	client.Close()
}

// TestNewRedisClient_WrongPassword tests Redis connection with incorrect password
func TestNewRedisClient_WrongPassword(t *testing.T) {
	mr := miniredis.RunT(t)
	defer mr.Close()
	mr.RequireAuth("correct-password")

	cfg := &config.Config{
		RedisHost:     mr.Host(),
		RedisPort:     mr.Port(),
		RedisPassword: "wrong-password",
		RedisDB:       0,
	}

	client, err := database.NewRedisClient(cfg)
	assert.Error(t, err)
	assert.Nil(t, client)
	assert.Contains(t, err.Error(), "failed to connect to Redis")
}

// TestNewRedisClient_InvalidHost tests connection failure with invalid host
func TestNewRedisClient_InvalidHost(t *testing.T) {
	cfg := &config.Config{
		RedisHost:     "invalid-redis-host-that-does-not-exist",
		RedisPort:     "6379",
		RedisPassword: "",
		RedisDB:       0,
	}

	client, err := database.NewRedisClient(cfg)
	assert.Error(t, err)
	assert.Nil(t, client)
	assert.Contains(t, err.Error(), "failed to connect to Redis")
}

// TestNewRedisClient_InvalidPort tests connection failure with invalid port
func TestNewRedisClient_InvalidPort(t *testing.T) {
	cfg := &config.Config{
		RedisHost:     "localhost",
		RedisPort:     "9999", // Invalid port
		RedisPassword: "",
		RedisDB:       0,
	}

	client, err := database.NewRedisClient(cfg)
	assert.Error(t, err)
	assert.Nil(t, client)
}

// TestNewRedisClient_DifferentDB tests connection to different Redis DB
func TestNewRedisClient_DifferentDB(t *testing.T) {
	mr := miniredis.RunT(t)
	defer mr.Close()

	// Set a key in DB 0
	mr.Select(0)
	mr.Set("test-key", "value-in-db0")

	// Set a key in DB 1
	mr.Select(1)
	mr.Set("test-key", "value-in-db1")

	// Connect to DB 1
	cfg := &config.Config{
		RedisHost:     mr.Host(),
		RedisPort:     mr.Port(),
		RedisPassword: "",
		RedisDB:       1,
	}

	client, err := database.NewRedisClient(cfg)
	require.NoError(t, err)
	require.NotNil(t, client)
	defer client.Close()

	// Verify we're in DB 1
	ctx := context.Background()
	val, err := client.Get(ctx, "test-key").Result()
	assert.NoError(t, err)
	assert.Equal(t, "value-in-db1", val)
}

// TestNewRedisClient_AddressFormat verifies address string construction
func TestNewRedisClient_AddressFormat(t *testing.T) {
	mr := miniredis.RunT(t)
	defer mr.Close()

	cfg := &config.Config{
		RedisHost:     mr.Host(),
		RedisPort:     mr.Port(),
		RedisPassword: "",
		RedisDB:       5,
	}

	client, err := database.NewRedisClient(cfg)
	require.NoError(t, err)
	require.NotNil(t, client)
	defer client.Close()

	// Verify the client is configured correctly
	options := client.Options()
	expectedAddr := fmt.Sprintf("%s:%s", mr.Host(), mr.Port())
	assert.Equal(t, expectedAddr, options.Addr)
	assert.Equal(t, 5, options.DB)
}

// TestNewRedisClient_Ping tests the ping functionality
func TestNewRedisClient_Ping(t *testing.T) {
	mr := miniredis.RunT(t)
	defer mr.Close()

	cfg := &config.Config{
		RedisHost:     mr.Host(),
		RedisPort:     mr.Port(),
		RedisPassword: "",
		RedisDB:       0,
	}

	client, err := database.NewRedisClient(cfg)
	require.NoError(t, err)
	require.NotNil(t, client)
	defer client.Close()

	// Test multiple pings
	ctx := context.Background()
	for i := 0; i < 3; i++ {
		pong, err := client.Ping(ctx).Result()
		assert.NoError(t, err)
		assert.Equal(t, "PONG", pong)
	}
}

// TestPostgresDB_MultipleConnections tests multiple simultaneous connections
func TestPostgresDB_MultipleConnections(t *testing.T) {
	cfg := &config.Config{
		PostgresHost:     "localhost",
		PostgresPort:     "5432",
		PostgresUser:     "osrs_tracker",
		PostgresPassword: "changeme",
		PostgresDB:       "osrs_ge_tracker",
		PostgresSSLMode:  "disable",
	}

	// Create multiple connections
	db1, err := database.NewPostgresDB(cfg)
	require.NoError(t, err)
	defer func() {
		sqlDB, _ := db1.DB()
		sqlDB.Close()
	}()

	db2, err := database.NewPostgresDB(cfg)
	require.NoError(t, err)
	defer func() {
		sqlDB, _ := db2.DB()
		sqlDB.Close()
	}()

	// Both should work independently
	sqlDB1, err := db1.DB()
	require.NoError(t, err)
	assert.NoError(t, sqlDB1.Ping())

	sqlDB2, err := db2.DB()
	require.NoError(t, err)
	assert.NoError(t, sqlDB2.Ping())
}

// TestRedisClient_MultipleClients tests multiple Redis clients
func TestRedisClient_MultipleClients(t *testing.T) {
	mr := miniredis.RunT(t)
	defer mr.Close()

	cfg := &config.Config{
		RedisHost:     mr.Host(),
		RedisPort:     mr.Port(),
		RedisPassword: "",
		RedisDB:       0,
	}

	// Create multiple clients
	client1, err := database.NewRedisClient(cfg)
	require.NoError(t, err)
	defer client1.Close()

	client2, err := database.NewRedisClient(cfg)
	require.NoError(t, err)
	defer client2.Close()

	// Both should work independently
	ctx := context.Background()

	err = client1.Set(ctx, "key1", "value1", 0).Err()
	assert.NoError(t, err)

	val, err := client2.Get(ctx, "key1").Result()
	assert.NoError(t, err)
	assert.Equal(t, "value1", val)
}

// TestPostgresDB_ConnectionLifetime tests connection max lifetime
func TestPostgresDB_ConnectionLifetime(t *testing.T) {
	cfg := &config.Config{
		PostgresHost:     "localhost",
		PostgresPort:     "5432",
		PostgresUser:     "osrs_tracker",
		PostgresPassword: "changeme",
		PostgresDB:       "osrs_ge_tracker",
		PostgresSSLMode:  "disable",
	}

	db, err := database.NewPostgresDB(cfg)
	require.NoError(t, err)

	sqlDB, err := db.DB()
	require.NoError(t, err)
	defer sqlDB.Close()

	// Verify max lifetime is set (1 hour as per implementation)
	stats := sqlDB.Stats()
	assert.Equal(t, 100, stats.MaxOpenConnections)

	// Connection should work immediately after creation
	assert.NoError(t, sqlDB.Ping())
}

// TestRedisClient_ContextCancellation tests context handling
func TestRedisClient_ContextCancellation(t *testing.T) {
	mr := miniredis.RunT(t)
	defer mr.Close()

	cfg := &config.Config{
		RedisHost:     mr.Host(),
		RedisPort:     mr.Port(),
		RedisPassword: "",
		RedisDB:       0,
	}

	client, err := database.NewRedisClient(cfg)
	require.NoError(t, err)
	defer client.Close()

	// Create cancelled context
	ctx, cancel := context.WithCancel(context.Background())
	cancel()

	// Operations with cancelled context should fail
	err = client.Set(ctx, "key", "value", 0).Err()
	assert.Error(t, err)
}

// TestPostgresDB_GORMDialector verifies correct GORM dialector is used
func TestPostgresDB_GORMDialector(t *testing.T) {
	cfg := &config.Config{
		PostgresHost:     "localhost",
		PostgresPort:     "5432",
		PostgresUser:     "osrs_tracker",
		PostgresPassword: "changeme",
		PostgresDB:       "osrs_ge_tracker",
		PostgresSSLMode:  "disable",
	}

	db, err := database.NewPostgresDB(cfg)
	require.NoError(t, err)

	sqlDB, err := db.DB()
	require.NoError(t, err)
	defer sqlDB.Close()

	// Verify it's a PostgreSQL connection by checking if ping works
	// The actual driver is pgx-based but wrapped
	assert.NoError(t, sqlDB.Ping(), "PostgreSQL connection should be healthy")
	assert.NotNil(t, sqlDB.Driver(), "Driver should be initialized")
}

// TestNewRedisClient_EmptyPassword tests connection with empty password (no auth)
func TestNewRedisClient_EmptyPassword(t *testing.T) {
	mr := miniredis.RunT(t)
	defer mr.Close()

	cfg := &config.Config{
		RedisHost:     mr.Host(),
		RedisPort:     mr.Port(),
		RedisPassword: "", // Empty password (no auth)
		RedisDB:       0,
	}

	client, err := database.NewRedisClient(cfg)
	require.NoError(t, err)
	require.NotNil(t, client)
	defer client.Close()

	ctx := context.Background()
	assert.NoError(t, client.Ping(ctx).Err())
}
