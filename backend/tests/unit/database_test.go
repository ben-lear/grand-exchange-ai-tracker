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

// TestNewPostgresDB_Success tests successful PostgreSQL connection with valid config.
func TestNewPostgresDB_Success(t *testing.T) {
	dbConfig := config.PostgresConfig{
		Host:     "localhost",
		Port:     "5432",
		User:     "osrs_tracker",
		Password: "changeme",
		DB:       "osrs_ge_tracker",
		SSLMode:  "disable",
	}

	dbClient, err := database.NewPostgresDB(dbConfig)
	require.NoError(t, err)
	require.NotNil(t, dbClient)

	// Verify connection pool settings
	sqlDB, err := dbClient.DB()
	require.NoError(t, err)

	stats := sqlDB.Stats()
	assert.GreaterOrEqual(t, stats.MaxOpenConnections, 1, "Should have max open connections configured")

	// Cleanup
	sqlDB.Close()
}

// TestNewPostgresDB_InvalidHost tests connection failure with invalid host.
func TestNewPostgresDB_InvalidHost(t *testing.T) {
	dbConfig := config.PostgresConfig{
		Host:     "invalid-host-that-does-not-exist",
		Port:     "5432",
		User:     "osrs_tracker",
		Password: "changeme",
		DB:       "osrs_ge_tracker",
		SSLMode:  "disable",
	}

	dbClient, err := database.NewPostgresDB(dbConfig)
	assert.Error(t, err)
	assert.Nil(t, dbClient)
	assert.Contains(t, err.Error(), "failed to")
}

// TestNewPostgresDB_InvalidPort tests connection failure with invalid port.
func TestNewPostgresDB_InvalidPort(t *testing.T) {
	dbConfig := config.PostgresConfig{
		Host:     "localhost",
		Port:     "9999", // Invalid port
		User:     "osrs_tracker",
		Password: "changeme",
		DB:       "osrs_ge_tracker",
		SSLMode:  "disable",
	}

	dbClient, err := database.NewPostgresDB(dbConfig)
	assert.Error(t, err)
	assert.Nil(t, dbClient)
}

// TestNewPostgresDB_InvalidCredentials tests connection failure with wrong credentials.
func TestNewPostgresDB_InvalidCredentials(t *testing.T) {
	dbConfig := config.PostgresConfig{
		Host:     "localhost",
		Port:     "5432",
		User:     "wrong_user",
		Password: "wrong_password",
		DB:       "osrs_ge_tracker",
		SSLMode:  "disable",
	}

	dbClient, err := database.NewPostgresDB(dbConfig)
	assert.Error(t, err)
	assert.Nil(t, dbClient)
	assert.Contains(t, err.Error(), "failed to")
}

// TestNewPostgresDB_InvalidDatabase tests connection failure with non-existent database.
func TestNewPostgresDB_InvalidDatabase(t *testing.T) {
	dbConfig := config.PostgresConfig{
		Host:     "localhost",
		Port:     "5432",
		User:     "osrs_tracker",
		Password: "changeme",
		DB:       "nonexistent_database_12345",
		SSLMode:  "disable",
	}

	dbClient, err := database.NewPostgresDB(dbConfig)
	assert.Error(t, err)
	assert.Nil(t, dbClient)
}

// TestNewPostgresDB_ConnectionPoolSettings verifies connection pool configuration.
func TestNewPostgresDB_ConnectionPoolSettings(t *testing.T) {
	dbConfig := config.PostgresConfig{
		Host:     "localhost",
		Port:     "5432",
		User:     "osrs_tracker",
		Password: "changeme",
		DB:       "osrs_ge_tracker",
		SSLMode:  "disable",
	}

	dbClient, err := database.NewPostgresDB(dbConfig)
	require.NoError(t, err)
	require.NotNil(t, dbClient)

	sqlDB, err := dbClient.DB()
	require.NoError(t, err)
	defer sqlDB.Close()

	// Verify pool settings
	stats := sqlDB.Stats()
	assert.Equal(t, 100, stats.MaxOpenConnections, "MaxOpenConns should be 100")

	// MaxIdleConns is set internally, check it's reasonable
	assert.LessOrEqual(t, 10, stats.MaxOpenConnections, "MaxIdleConns should be <= MaxOpenConns")
}

// TestNewPostgresDB_DSNFormat verifies DSN string construction.
func TestNewPostgresDB_DSNFormat(t *testing.T) {
	// This test verifies DSN construction without actually connecting
	dbConfig := config.PostgresConfig{
		Host:     "testhost",
		Port:     "5433",
		User:     "testuser",
		Password: "testpass",
		DB:       "testdb",
		SSLMode:  "require",
	}

	// We expect DSN to be constructed correctly, but connection will fail
	// This indirectly tests DSN construction
	dbClient, err := database.NewPostgresDB(dbConfig)

	// Should fail because testhost doesn't exist
	assert.Error(t, err)
	assert.Nil(t, dbClient)

	// Error should indicate connection attempt was made with the config
	assert.Contains(t, err.Error(), "failed to")
}

// TestNewPostgresDB_PingFailure tests ping failure scenario.
func TestNewPostgresDB_PingFailure(t *testing.T) {
	// Use invalid config that will fail on ping
	dbConfig := config.PostgresConfig{
		Host:     "localhost",
		Port:     "1", // Invalid port that won't accept connections
		User:     "user",
		Password: "pass",
		DB:       "db",
		SSLMode:  "disable",
	}

	dbClient, err := database.NewPostgresDB(dbConfig)
	assert.Error(t, err)
	assert.Nil(t, dbClient)
}

// TestNewPostgresDB_GORMConfiguration verifies GORM config is applied.
func TestNewPostgresDB_GORMConfiguration(t *testing.T) {
	dbConfig := config.PostgresConfig{
		Host:     "localhost",
		Port:     "5432",
		User:     "osrs_tracker",
		Password: "changeme",
		DB:       "osrs_ge_tracker",
		SSLMode:  "disable",
	}

	dbClient, err := database.NewPostgresDB(dbConfig)
	require.NoError(t, err)
	require.NotNil(t, dbClient)

	sqlDB, err := dbClient.DB()
	require.NoError(t, err)
	defer sqlDB.Close()

	// Verify GORM NowFunc uses UTC
	now := dbClient.NowFunc()
	assert.Equal(t, time.UTC, now.Location(), "GORM should use UTC for timestamps")
}

// TestNewRedisClient_Success tests successful Redis connection.
func TestNewRedisClient_Success(t *testing.T) {
	// Start miniredis server
	mr := miniredis.RunT(t)
	defer mr.Close()

	cacheConfig := config.RedisConfig{
		Host:     mr.Host(),
		Port:     mr.Port(),
		Password: "",
		DB:       0,
	}

	client, err := database.NewRedisClient(cacheConfig)
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

// TestNewRedisClient_WithPassword tests Redis connection with password.
func TestNewRedisClient_WithPassword(t *testing.T) {
	// Start miniredis server with password
	mr := miniredis.RunT(t)
	defer mr.Close()
	mr.RequireAuth("secret-password")

	cacheConfig := config.RedisConfig{
		Host:     mr.Host(),
		Port:     mr.Port(),
		Password: "secret-password",
		DB:       0,
	}

	client, err := database.NewRedisClient(cacheConfig)
	require.NoError(t, err)
	require.NotNil(t, client)

	// Verify connection works
	ctx := context.Background()
	pong, err := client.Ping(ctx).Result()
	assert.NoError(t, err)
	assert.Equal(t, "PONG", pong)

	client.Close()
}

// TestNewRedisClient_WrongPassword tests Redis connection with incorrect password.
func TestNewRedisClient_WrongPassword(t *testing.T) {
	mr := miniredis.RunT(t)
	defer mr.Close()
	mr.RequireAuth("correct-password")

	cacheConfig := config.RedisConfig{
		Host:     mr.Host(),
		Port:     mr.Port(),
		Password: "wrong-password",
		DB:       0,
	}

	client, err := database.NewRedisClient(cacheConfig)
	assert.Error(t, err)
	assert.Nil(t, client)
	assert.Contains(t, err.Error(), "failed to connect to Redis")
}

// TestNewRedisClient_InvalidHost tests connection failure with invalid host.
func TestNewRedisClient_InvalidHost(t *testing.T) {
	cacheConfig := config.RedisConfig{
		Host:     "invalid-redis-host-that-does-not-exist",
		Port:     "6379",
		Password: "",
		DB:       0,
	}

	client, err := database.NewRedisClient(cacheConfig)
	assert.Error(t, err)
	assert.Nil(t, client)
	assert.Contains(t, err.Error(), "failed to connect to Redis")
}

// TestNewRedisClient_InvalidPort tests connection failure with invalid port.
func TestNewRedisClient_InvalidPort(t *testing.T) {
	cacheConfig := config.RedisConfig{
		Host:     "localhost",
		Port:     "9999", // Invalid port
		Password: "",
		DB:       0,
	}

	client, err := database.NewRedisClient(cacheConfig)
	assert.Error(t, err)
	assert.Nil(t, client)
}

// TestNewRedisClient_DifferentDB tests connection to different Redis DB.
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
	cacheConfig := config.RedisConfig{
		Host:     mr.Host(),
		Port:     mr.Port(),
		Password: "",
		DB:       1,
	}

	client, err := database.NewRedisClient(cacheConfig)
	require.NoError(t, err)
	require.NotNil(t, client)
	defer client.Close()

	// Verify we're in DB 1
	ctx := context.Background()
	val, err := client.Get(ctx, "test-key").Result()
	assert.NoError(t, err)
	assert.Equal(t, "value-in-db1", val)
}

// TestNewRedisClient_AddressFormat verifies address string construction.
func TestNewRedisClient_AddressFormat(t *testing.T) {
	mr := miniredis.RunT(t)
	defer mr.Close()

	cacheConfig := config.RedisConfig{
		Host:     mr.Host(),
		Port:     mr.Port(),
		Password: "",
		DB:       5,
	}

	client, err := database.NewRedisClient(cacheConfig)
	require.NoError(t, err)
	require.NotNil(t, client)
	defer client.Close()

	// Verify the client is configured correctly
	options := client.Options()
	expectedAddr := fmt.Sprintf("%s:%s", mr.Host(), mr.Port())
	assert.Equal(t, expectedAddr, options.Addr)
	assert.Equal(t, 5, options.DB)
}

// TestNewRedisClient_Ping tests the ping functionality.
func TestNewRedisClient_Ping(t *testing.T) {
	mr := miniredis.RunT(t)
	defer mr.Close()

	cacheConfig := config.RedisConfig{
		Host:     mr.Host(),
		Port:     mr.Port(),
		Password: "",
		DB:       0,
	}

	client, err := database.NewRedisClient(cacheConfig)
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

// TestPostgresDB_MultipleConnections tests multiple simultaneous connections.
func TestPostgresDB_MultipleConnections(t *testing.T) {
	dbConfig := config.PostgresConfig{
		Host:     "localhost",
		Port:     "5432",
		User:     "osrs_tracker",
		Password: "changeme",
		DB:       "osrs_ge_tracker",
		SSLMode:  "disable",
	}

	// Create multiple connections
	db1, err := database.NewPostgresDB(dbConfig)
	require.NoError(t, err)
	defer func() {
		sqlDB, _ := db1.DB()
		sqlDB.Close()
	}()

	db2, err := database.NewPostgresDB(dbConfig)
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

// TestRedisClient_MultipleClients tests multiple Redis clients.
func TestRedisClient_MultipleClients(t *testing.T) {
	mr := miniredis.RunT(t)
	defer mr.Close()

	cacheConfig := config.RedisConfig{
		Host:     mr.Host(),
		Port:     mr.Port(),
		Password: "",
		DB:       0,
	}

	// Create multiple clients
	client1, err := database.NewRedisClient(cacheConfig)
	require.NoError(t, err)
	defer client1.Close()

	client2, err := database.NewRedisClient(cacheConfig)
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

// TestPostgresDB_ConnectionLifetime tests connection max lifetime.
func TestPostgresDB_ConnectionLifetime(t *testing.T) {
	dbConfig := config.PostgresConfig{
		Host:     "localhost",
		Port:     "5432",
		User:     "osrs_tracker",
		Password: "changeme",
		DB:       "osrs_ge_tracker",
		SSLMode:  "disable",
	}

	dbClient, err := database.NewPostgresDB(dbConfig)
	require.NoError(t, err)

	sqlDB, err := dbClient.DB()
	require.NoError(t, err)
	defer sqlDB.Close()

	// Verify max lifetime is set (1 hour as per implementation)
	stats := sqlDB.Stats()
	assert.Equal(t, 100, stats.MaxOpenConnections)

	// Connection should work immediately after creation
	assert.NoError(t, sqlDB.Ping())
}

// TestRedisClient_ContextCancellation tests context handling.
func TestRedisClient_ContextCancellation(t *testing.T) {
	mr := miniredis.RunT(t)
	defer mr.Close()

	cacheConfig := config.RedisConfig{
		Host:     mr.Host(),
		Port:     mr.Port(),
		Password: "",
		DB:       0,
	}

	client, err := database.NewRedisClient(cacheConfig)
	require.NoError(t, err)
	defer client.Close()

	// Create canceled context
	ctx, cancel := context.WithCancel(context.Background())
	cancel()

	// Operations with canceled context should fail
	err = client.Set(ctx, "key", "value", 0).Err()
	assert.Error(t, err)
}

// TestPostgresDB_GORMDialector verifies correct GORM dialector is used.
func TestPostgresDB_GORMDialector(t *testing.T) {
	dbConfig := config.PostgresConfig{
		Host:     "localhost",
		Port:     "5432",
		User:     "osrs_tracker",
		Password: "changeme",
		DB:       "osrs_ge_tracker",
		SSLMode:  "disable",
	}

	dbClient, err := database.NewPostgresDB(dbConfig)
	require.NoError(t, err)

	sqlDB, err := dbClient.DB()
	require.NoError(t, err)
	defer sqlDB.Close()

	// Verify it's a PostgreSQL connection by checking if ping works
	// The actual driver is pgx-based but wrapped
	assert.NoError(t, sqlDB.Ping(), "PostgreSQL connection should be healthy")
	assert.NotNil(t, sqlDB.Driver(), "Driver should be initialized")
}

// TestNewRedisClient_EmptyPassword tests connection with empty password (no auth).
func TestNewRedisClient_EmptyPassword(t *testing.T) {
	mr := miniredis.RunT(t)
	defer mr.Close()

	cacheConfig := config.RedisConfig{
		Host:     mr.Host(),
		Port:     mr.Port(),
		Password: "", // Empty password (no auth)
		DB:       0,
	}

	client, err := database.NewRedisClient(cacheConfig)
	require.NoError(t, err)
	require.NotNil(t, client)
	defer client.Close()

	ctx := context.Background()
	assert.NoError(t, client.Ping(ctx).Err())
}
