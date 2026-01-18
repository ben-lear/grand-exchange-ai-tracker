package unit

import (
	"context"
	"encoding/json"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"go.uber.org/zap"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"

	"github.com/guavi/osrs-ge-tracker/internal/models"
	"github.com/guavi/osrs-ge-tracker/internal/services"
)

// setupWatchlistTestDB creates an in-memory SQLite database for testing.
func setupWatchlistTestDB(t *testing.T) *gorm.DB {
	db, err := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Silent),
	})
	require.NoError(t, err)

	// Migrate the schema
	err = db.AutoMigrate(&models.WatchlistShare{})
	require.NoError(t, err)

	return db
}

// TestWatchlistService_CreateShare tests creating a watchlist share.
func TestWatchlistService_CreateShare(t *testing.T) {
	db := setupWatchlistTestDB(t)
	zapLogger, _ := zap.NewDevelopment()
	sugaredLogger := zapLogger.Sugar()

	service := services.NewWatchlistService(db, sugaredLogger)

	watchlistData := map[string]interface{}{
		"id":        "123e4567-e89b-12d3-a456-426614174000",
		"name":      "Test Watchlist",
		"items":     []interface{}{},
		"createdAt": time.Now().Unix(),
		"updatedAt": time.Now().Unix(),
		"isDefault": false,
	}

	ctx := context.Background()
	response, err := service.CreateShare(ctx, watchlistData)

	require.NoError(t, err)
	require.NotNil(t, response)

	// Check response structure
	assert.NotEmpty(t, response.Token)
	assert.NotZero(t, response.ExpiresAt)
	assert.Contains(t, response.ShareURL, response.Token)

	// Verify token format
	assert.Regexp(t, `^[a-z]+-[a-z]+-[a-z]+$`, response.Token)

	// Verify expiration is approximately 7 days from now
	expectedExpiry := time.Now().Add(7 * 24 * time.Hour)
	timeDiff := response.ExpiresAt.Sub(expectedExpiry)
	assert.Less(t, timeDiff.Abs().Minutes(), 5.0, "Expiration should be ~7 days from now")
}

// TestWatchlistService_CreateShare_InvalidData tests creating a share with invalid data.
func TestWatchlistService_CreateShare_InvalidData(t *testing.T) {
	db := setupWatchlistTestDB(t)
	zapLogger, _ := zap.NewDevelopment()
	sugaredLogger := zapLogger.Sugar()

	service := services.NewWatchlistService(db, sugaredLogger)

	tests := []struct {
		name string
		data interface{}
	}{
		{
			name: "nil data",
			data: nil,
		},
		{
			name: "channel data (not JSON serializable)",
			data: make(chan int),
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			ctx := context.Background()
			response, err := service.CreateShare(ctx, tt.data)

			assert.Error(t, err)
			assert.Nil(t, response)
		})
	}
}

// TestWatchlistService_GetShare tests retrieving a watchlist share.
func TestWatchlistService_GetShare(t *testing.T) {
	db := setupWatchlistTestDB(t)
	zapLogger, _ := zap.NewDevelopment()
	sugaredLogger := zapLogger.Sugar()

	service := services.NewWatchlistService(db, sugaredLogger)

	// Create a share first
	watchlistData := map[string]interface{}{
		"id":        "123e4567-e89b-12d3-a456-426614174000",
		"name":      "Test Watchlist",
		"items":     []interface{}{},
		"createdAt": time.Now().Unix(),
		"updatedAt": time.Now().Unix(),
		"isDefault": false,
	}

	ctx := context.Background()
	createResponse, err := service.CreateShare(ctx, watchlistData)
	require.NoError(t, err)

	// Now retrieve it
	getResponse, err := service.GetShare(ctx, createResponse.Token)

	require.NoError(t, err)
	require.NotNil(t, getResponse)

	// Verify data
	assert.NotNil(t, getResponse.WatchlistData)
	assert.NotZero(t, getResponse.CreatedAt)
	assert.NotZero(t, getResponse.ExpiresAt)
	assert.Equal(t, 1, getResponse.AccessCount) // First access

	// Verify watchlist data matches
	dataMap, ok := getResponse.WatchlistData.(map[string]interface{})
	require.True(t, ok, "Watchlist data should be a map")
	assert.Equal(t, "Test Watchlist", dataMap["name"])
}

// TestWatchlistService_GetShare_IncrementAccessCount tests that access count increments.
func TestWatchlistService_GetShare_IncrementAccessCount(t *testing.T) {
	db := setupWatchlistTestDB(t)
	zapLogger, _ := zap.NewDevelopment()
	sugaredLogger := zapLogger.Sugar()

	service := services.NewWatchlistService(db, sugaredLogger)

	watchlistData := map[string]interface{}{
		"id":   "test-id",
		"name": "Test",
	}

	ctx := context.Background()
	createResponse, err := service.CreateShare(ctx, watchlistData)
	require.NoError(t, err)

	// Access multiple times
	for i := 1; i <= 3; i++ {
		getResponse, err := service.GetShare(ctx, createResponse.Token)
		require.NoError(t, err)
		assert.Equal(t, i, getResponse.AccessCount, "Access count should increment")
	}
}

// TestWatchlistService_GetShare_NotFound tests retrieving a non-existent share.
func TestWatchlistService_GetShare_NotFound(t *testing.T) {
	db := setupWatchlistTestDB(t)
	zapLogger, _ := zap.NewDevelopment()
	sugaredLogger := zapLogger.Sugar()

	service := services.NewWatchlistService(db, sugaredLogger)

	ctx := context.Background()
	response, err := service.GetShare(ctx, "nonexistent-token-here")

	assert.Error(t, err)
	assert.Nil(t, response)
	assert.Contains(t, err.Error(), "share not found")
}

// TestWatchlistService_GetShare_InvalidToken tests retrieving with invalid token format.
func TestWatchlistService_GetShare_InvalidToken(t *testing.T) {
	db := setupWatchlistTestDB(t)
	zapLogger, _ := zap.NewDevelopment()
	sugaredLogger := zapLogger.Sugar()

	service := services.NewWatchlistService(db, sugaredLogger)

	tests := []struct {
		name  string
		token string
	}{
		{
			name:  "invalid format",
			token: "invalid",
		},
		{
			name:  "uppercase letters",
			token: "Swift-Golden-Dragon",
		},
		{
			name:  "too many parts",
			token: "swift-golden-brave-dragon",
		},
		{
			name:  "empty string",
			token: "",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			ctx := context.Background()
			response, err := service.GetShare(ctx, tt.token)

			assert.Error(t, err)
			assert.Nil(t, response)
			assert.Contains(t, err.Error(), "invalid token format")
		})
	}
}

// TestWatchlistService_GetShare_Expired tests retrieving an expired share.
func TestWatchlistService_GetShare_Expired(t *testing.T) {
	db := setupWatchlistTestDB(t)
	zapLogger, _ := zap.NewDevelopment()
	sugaredLogger := zapLogger.Sugar()

	// Create an expired share directly in the database
	watchlistData := map[string]interface{}{
		"id":   "test-id",
		"name": "Expired",
	}
	jsonData, _ := json.Marshal(watchlistData)

	expiredShare := models.WatchlistShare{
		Token:         "expired-test-token",
		WatchlistData: jsonData,
		ExpiresAt:     time.Now().Add(-24 * time.Hour), // Expired 1 day ago
		AccessCount:   0,
	}

	err := db.Create(&expiredShare).Error
	require.NoError(t, err)

	service := services.NewWatchlistService(db, sugaredLogger)

	ctx := context.Background()
	response, err := service.GetShare(ctx, "expired-test-token")

	assert.Error(t, err)
	assert.Nil(t, response)
	assert.Contains(t, err.Error(), "expired")
}

// TestWatchlistService_CleanupExpiredShares tests cleanup of expired shares.
func TestWatchlistService_CleanupExpiredShares(t *testing.T) {
	db := setupWatchlistTestDB(t)
	zapLogger, _ := zap.NewDevelopment()
	sugaredLogger := zapLogger.Sugar()

	service := services.NewWatchlistService(db, sugaredLogger)

	// Create some expired and valid shares
	now := time.Now()
	shares := []models.WatchlistShare{
		{
			Token:         "expired-one",
			WatchlistData: []byte(`{"name":"Expired 1"}`),
			ExpiresAt:     now.Add(-2 * 24 * time.Hour),
		},
		{
			Token:         "expired-two",
			WatchlistData: []byte(`{"name":"Expired 2"}`),
			ExpiresAt:     now.Add(-1 * 24 * time.Hour),
		},
		{
			Token:         "valid-one",
			WatchlistData: []byte(`{"name":"Valid 1"}`),
			ExpiresAt:     now.Add(5 * 24 * time.Hour),
		},
		{
			Token:         "valid-two",
			WatchlistData: []byte(`{"name":"Valid 2"}`),
			ExpiresAt:     now.Add(7 * 24 * time.Hour),
		},
	}

	for _, share := range shares {
		err := db.Create(&share).Error
		require.NoError(t, err)
	}

	// Run cleanup
	ctx := context.Background()
	deletedCount, err := service.CleanupExpiredShares(ctx)

	require.NoError(t, err)
	assert.Equal(t, int64(2), deletedCount, "Should delete 2 expired shares")

	// Verify only valid shares remain
	var remainingShares []models.WatchlistShare
	err = db.Find(&remainingShares).Error
	require.NoError(t, err)

	assert.Equal(t, 2, len(remainingShares), "Should have 2 remaining shares")

	for _, share := range remainingShares {
		assert.True(t, share.ExpiresAt.After(now), "Remaining shares should not be expired")
	}
}

// TestWatchlistService_CleanupExpiredShares_NoExpired tests cleanup with no expired shares.
func TestWatchlistService_CleanupExpiredShares_NoExpired(t *testing.T) {
	db := setupWatchlistTestDB(t)
	zapLogger, _ := zap.NewDevelopment()
	sugaredLogger := zapLogger.Sugar()

	service := services.NewWatchlistService(db, sugaredLogger)

	// Create only valid shares
	now := time.Now()
	shares := []models.WatchlistShare{
		{
			Token:         "valid-one",
			WatchlistData: []byte(`{"name":"Valid 1"}`),
			ExpiresAt:     now.Add(5 * 24 * time.Hour),
		},
		{
			Token:         "valid-two",
			WatchlistData: []byte(`{"name":"Valid 2"}`),
			ExpiresAt:     now.Add(7 * 24 * time.Hour),
		},
	}

	for _, share := range shares {
		err := db.Create(&share).Error
		require.NoError(t, err)
	}

	// Run cleanup
	ctx := context.Background()
	deletedCount, err := service.CleanupExpiredShares(ctx)

	require.NoError(t, err)
	assert.Equal(t, int64(0), deletedCount, "Should delete 0 shares")

	// Verify all shares remain
	var remainingShares []models.WatchlistShare
	err = db.Find(&remainingShares).Error
	require.NoError(t, err)

	assert.Equal(t, 2, len(remainingShares))
}

// TestWatchlistService_TokenCollisionHandling tests token collision retry logic.
func TestWatchlistService_TokenCollisionHandling(t *testing.T) {
	db := setupWatchlistTestDB(t)
	zapLogger, _ := zap.NewDevelopment()
	sugaredLogger := zapLogger.Sugar()

	service := services.NewWatchlistService(db, sugaredLogger)

	// Create multiple shares and ensure they all have unique tokens
	const numShares = 20
	tokens := make(map[string]bool)

	for i := 0; i < numShares; i++ {
		watchlistData := map[string]interface{}{
			"id":   i,
			"name": "Test",
		}

		ctx := context.Background()
		response, err := service.CreateShare(ctx, watchlistData)

		require.NoError(t, err)
		require.NotNil(t, response)

		// Check token is unique
		assert.False(t, tokens[response.Token], "Token should be unique: %s", response.Token)
		tokens[response.Token] = true
	}

	assert.Equal(t, numShares, len(tokens), "All tokens should be unique")
}

// BenchmarkWatchlistService_CreateShare benchmarks share creation.
func BenchmarkWatchlistService_CreateShare(b *testing.B) {
	db, _ := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Silent),
	})
	db.AutoMigrate(&models.WatchlistShare{})

	zapLogger, _ := zap.NewDevelopment()
	sugaredLogger := zapLogger.Sugar()
	service := services.NewWatchlistService(db, sugaredLogger)

	watchlistData := map[string]interface{}{
		"id":   "test",
		"name": "Benchmark",
	}

	ctx := context.Background()
	b.ResetTimer()

	for i := 0; i < b.N; i++ {
		_, _ = service.CreateShare(ctx, watchlistData)
	}
}

// BenchmarkWatchlistService_GetShare benchmarks share retrieval.
func BenchmarkWatchlistService_GetShare(b *testing.B) {
	db, _ := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Silent),
	})
	db.AutoMigrate(&models.WatchlistShare{})

	zapLogger, _ := zap.NewDevelopment()
	sugaredLogger := zapLogger.Sugar()
	service := services.NewWatchlistService(db, sugaredLogger)

	// Create a share
	watchlistData := map[string]interface{}{
		"id":   "test",
		"name": "Benchmark",
	}
	ctx := context.Background()
	response, _ := service.CreateShare(ctx, watchlistData)

	b.ResetTimer()

	for i := 0; i < b.N; i++ {
		_, _ = service.GetShare(ctx, response.Token)
	}
}
