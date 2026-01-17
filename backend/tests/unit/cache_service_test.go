package unit

import (
	"context"
	"encoding/json"
	"fmt"
	"testing"
	"time"

	"github.com/alicebob/miniredis/v2"
	"github.com/redis/go-redis/v9"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"go.uber.org/zap"

	"github.com/guavi/osrs-ge-tracker/internal/models"
	"github.com/guavi/osrs-ge-tracker/internal/services"
)

func setupMiniRedis(t *testing.T) (*miniredis.Miniredis, *redis.Client, services.CacheService) {
	mr := miniredis.RunT(t)

	client := redis.NewClient(&redis.Options{
		Addr: mr.Addr(),
	})

	logger := zap.NewNop().Sugar()
	cacheService := services.NewCacheService(client, logger)

	return mr, client, cacheService
}

func TestNewCacheService(t *testing.T) {
	_, client, cacheService := setupMiniRedis(t)
	defer client.Close()

	assert.NotNil(t, cacheService, "CacheService should not be nil")
}

func TestCacheService_Set_Success(t *testing.T) {
	mr, client, cacheService := setupMiniRedis(t)
	defer client.Close()

	ctx := context.Background()
	key := "test:key"
	value := "test value"

	err := cacheService.Set(ctx, key, value, 5*time.Minute)
	assert.NoError(t, err, "Set should not return an error")

	// Verify the value was set in miniredis
	storedValue, err := mr.Get(key)
	assert.NoError(t, err)
	assert.Equal(t, value, storedValue)
}

func TestCacheService_Set_WithExpiration(t *testing.T) {
	mr, client, cacheService := setupMiniRedis(t)
	defer client.Close()

	ctx := context.Background()
	key := "test:expiring"
	value := "temporary value"

	err := cacheService.Set(ctx, key, value, 1*time.Second)
	assert.NoError(t, err)

	// Value should exist initially
	exists := mr.Exists(key)
	assert.True(t, exists)

	// Fast forward time in miniredis
	mr.FastForward(2 * time.Second)

	// Value should be expired now
	exists = mr.Exists(key)
	assert.False(t, exists, "Key should have expired")
}

func TestCacheService_Get_Success(t *testing.T) {
	mr, client, cacheService := setupMiniRedis(t)
	defer client.Close()

	ctx := context.Background()
	key := "test:get"
	expectedValue := "retrieved value"

	// Set value directly in miniredis
	mr.Set(key, expectedValue)

	value, err := cacheService.Get(ctx, key)
	assert.NoError(t, err)
	assert.Equal(t, expectedValue, value)
}

func TestCacheService_Get_KeyNotFound(t *testing.T) {
	_, client, cacheService := setupMiniRedis(t)
	defer client.Close()

	ctx := context.Background()
	key := "test:nonexistent"

	value, err := cacheService.Get(ctx, key)
	assert.Error(t, err, "Get should return an error for non-existent key")
	assert.Contains(t, err.Error(), "key not found")
	assert.Empty(t, value)
}

func TestCacheService_Delete_Success(t *testing.T) {
	mr, client, cacheService := setupMiniRedis(t)
	defer client.Close()

	ctx := context.Background()
	key := "test:delete"

	// Set a value first
	mr.Set(key, "value to delete")
	assert.True(t, mr.Exists(key))

	// Delete the key
	err := cacheService.Delete(ctx, key)
	assert.NoError(t, err)

	// Verify it's deleted
	assert.False(t, mr.Exists(key))
}

func TestCacheService_Delete_NonExistentKey(t *testing.T) {
	_, client, cacheService := setupMiniRedis(t)
	defer client.Close()

	ctx := context.Background()
	key := "test:nonexistent"

	// Deleting a non-existent key should not error
	err := cacheService.Delete(ctx, key)
	assert.NoError(t, err)
}

func TestCacheService_DeletePattern_Success(t *testing.T) {
	mr, client, cacheService := setupMiniRedis(t)
	defer client.Close()

	ctx := context.Background()

	// Set multiple keys with pattern
	mr.Set("user:1:profile", "data1")
	mr.Set("user:2:profile", "data2")
	mr.Set("user:3:profile", "data3")
	mr.Set("product:1", "other data")

	// Delete keys matching pattern
	err := cacheService.DeletePattern(ctx, "user:*:profile")
	assert.NoError(t, err)

	// Verify user keys are deleted
	assert.False(t, mr.Exists("user:1:profile"))
	assert.False(t, mr.Exists("user:2:profile"))
	assert.False(t, mr.Exists("user:3:profile"))

	// Verify other keys still exist
	assert.True(t, mr.Exists("product:1"))
}

func TestCacheService_DeletePattern_NoMatches(t *testing.T) {
	mr, client, cacheService := setupMiniRedis(t)
	defer client.Close()

	ctx := context.Background()

	// Set some keys
	mr.Set("item:1", "data")
	mr.Set("item:2", "data")

	// Delete with pattern that doesn't match
	err := cacheService.DeletePattern(ctx, "user:*")
	assert.NoError(t, err, "DeletePattern should not error when no keys match")

	// Verify original keys still exist
	assert.True(t, mr.Exists("item:1"))
	assert.True(t, mr.Exists("item:2"))
}

func TestCacheService_DeletePattern_ManyKeys(t *testing.T) {
	mr, client, cacheService := setupMiniRedis(t)
	defer client.Close()

	ctx := context.Background()

	// Set many keys (more than scan batch size of 100)
	for i := 0; i < 150; i++ {
		mr.Set(fmt.Sprintf("batch:%d", i), "data")
	}

	// Delete all batch keys
	err := cacheService.DeletePattern(ctx, "batch:*")
	assert.NoError(t, err)

	// Verify all are deleted
	keys := mr.Keys()
	for _, key := range keys {
		assert.NotContains(t, key, "batch:")
	}
}

func TestCacheService_GetJSON_Success(t *testing.T) {
	mr, client, cacheService := setupMiniRedis(t)
	defer client.Close()

	ctx := context.Background()
	key := "test:json"

	// Create test data
	highPrice := int64(1000)
	lowPrice := int64(900)
	testData := models.CurrentPrice{
		ItemID:    123,
		HighPrice: &highPrice,
		LowPrice:  &lowPrice,
	}

	// Marshal and set in miniredis
	jsonData, err := json.Marshal(testData)
	require.NoError(t, err)
	mr.Set(key, string(jsonData))

	// Retrieve using GetJSON
	var retrieved models.CurrentPrice
	err = cacheService.GetJSON(ctx, key, &retrieved)
	assert.NoError(t, err)
	assert.Equal(t, testData.ItemID, retrieved.ItemID)
	assert.Equal(t, *testData.HighPrice, *retrieved.HighPrice)
	assert.Equal(t, *testData.LowPrice, *retrieved.LowPrice)
}

func TestCacheService_GetJSON_KeyNotFound(t *testing.T) {
	_, client, cacheService := setupMiniRedis(t)
	defer client.Close()

	ctx := context.Background()
	key := "test:nonexistent"

	var result models.CurrentPrice
	err := cacheService.GetJSON(ctx, key, &result)
	assert.Error(t, err, "GetJSON should return an error for non-existent key")
	assert.Contains(t, err.Error(), "key not found")
}

func TestCacheService_GetJSON_InvalidJSON(t *testing.T) {
	mr, client, cacheService := setupMiniRedis(t)
	defer client.Close()

	ctx := context.Background()
	key := "test:invalid"

	// Set invalid JSON
	mr.Set(key, "not valid json{{{")

	var result models.CurrentPrice
	err := cacheService.GetJSON(ctx, key, &result)
	assert.Error(t, err, "GetJSON should return an error for invalid JSON")
	assert.Contains(t, err.Error(), "failed to unmarshal JSON")
}

func TestCacheService_SetJSON_Success(t *testing.T) {
	mr, client, cacheService := setupMiniRedis(t)
	defer client.Close()

	ctx := context.Background()
	key := "test:setjson"

	// Create test data
	testData := models.Item{
		ItemID:  456,
		Name:    "Test Item",
		Members: true,
	}

	err := cacheService.SetJSON(ctx, key, testData, 10*time.Minute)
	assert.NoError(t, err)

	// Verify data was stored correctly
	storedValue, err := mr.Get(key)
	require.NoError(t, err)

	var retrieved models.Item
	err = json.Unmarshal([]byte(storedValue), &retrieved)
	require.NoError(t, err)
	assert.Equal(t, testData.ItemID, retrieved.ItemID)
	assert.Equal(t, testData.Name, retrieved.Name)
	assert.Equal(t, testData.Members, retrieved.Members)
}

func TestCacheService_SetJSON_WithExpiration(t *testing.T) {
	mr, client, cacheService := setupMiniRedis(t)
	defer client.Close()

	ctx := context.Background()
	key := "test:jsonexpire"

	testData := map[string]string{"key": "value"}

	err := cacheService.SetJSON(ctx, key, testData, 1*time.Second)
	assert.NoError(t, err)

	// Value should exist
	assert.True(t, mr.Exists(key))

	// Fast forward
	mr.FastForward(2 * time.Second)

	// Should be expired
	assert.False(t, mr.Exists(key))
}

func TestCacheService_SetJSON_UnmarshallableData(t *testing.T) {
	_, client, cacheService := setupMiniRedis(t)
	defer client.Close()

	ctx := context.Background()
	key := "test:invalid"

	// Channels cannot be marshaled to JSON
	invalidData := make(chan int)

	err := cacheService.SetJSON(ctx, key, invalidData, 1*time.Minute)
	assert.Error(t, err, "SetJSON should return an error for unmarshallable data")
	assert.Contains(t, err.Error(), "failed to marshal JSON")
}

func TestCacheService_Exists_KeyExists(t *testing.T) {
	mr, client, cacheService := setupMiniRedis(t)
	defer client.Close()

	ctx := context.Background()
	key := "test:exists"

	// Set a value
	mr.Set(key, "some value")

	exists, err := cacheService.Exists(ctx, key)
	assert.NoError(t, err)
	assert.True(t, exists, "Key should exist")
}

func TestCacheService_Exists_KeyDoesNotExist(t *testing.T) {
	_, client, cacheService := setupMiniRedis(t)
	defer client.Close()

	ctx := context.Background()
	key := "test:nonexistent"

	exists, err := cacheService.Exists(ctx, key)
	assert.NoError(t, err)
	assert.False(t, exists, "Key should not exist")
}

func TestCacheService_Exists_MultipleKeys(t *testing.T) {
	mr, client, cacheService := setupMiniRedis(t)
	defer client.Close()

	ctx := context.Background()

	// Set some keys
	mr.Set("key1", "value1")
	mr.Set("key2", "value2")

	// Check existing key
	exists, err := cacheService.Exists(ctx, "key1")
	assert.NoError(t, err)
	assert.True(t, exists)

	// Check non-existing key
	exists, err = cacheService.Exists(ctx, "key3")
	assert.NoError(t, err)
	assert.False(t, exists)
}

func TestCacheService_ComplexWorkflow(t *testing.T) {
	_, client, cacheService := setupMiniRedis(t)
	defer client.Close()

	ctx := context.Background()

	// 1. Set multiple JSON objects
	hp1, lp1 := int64(100), int64(90)
	hp2, lp2 := int64(200), int64(180)
	hp3, lp3 := int64(300), int64(270)

	prices := []models.CurrentPrice{
		{ItemID: 1, HighPrice: &hp1, LowPrice: &lp1},
		{ItemID: 2, HighPrice: &hp2, LowPrice: &lp2},
		{ItemID: 3, HighPrice: &hp3, LowPrice: &lp3},
	}

	for _, price := range prices {
		key := fmt.Sprintf("price:%d", price.ItemID)
		err := cacheService.SetJSON(ctx, key, price, 5*time.Minute)
		require.NoError(t, err)
	}

	// 2. Verify all exist
	for _, price := range prices {
		key := fmt.Sprintf("price:%d", price.ItemID)
		exists, err := cacheService.Exists(ctx, key)
		require.NoError(t, err)
		assert.True(t, exists)
	}

	// 3. Retrieve and verify one
	var retrieved models.CurrentPrice
	err := cacheService.GetJSON(ctx, "price:2", &retrieved)
	require.NoError(t, err)
	assert.Equal(t, 2, retrieved.ItemID)
	assert.Equal(t, int64(200), *retrieved.HighPrice)

	// 4. Delete using pattern
	err = cacheService.DeletePattern(ctx, "price:*")
	require.NoError(t, err)

	// 5. Verify all are deleted
	for _, price := range prices {
		key := fmt.Sprintf("price:%d", price.ItemID)
		exists, err := cacheService.Exists(ctx, key)
		require.NoError(t, err)
		assert.False(t, exists, "Key %s should be deleted", key)
	}
}

func TestCacheService_ContextCancellation(t *testing.T) {
	_, client, cacheService := setupMiniRedis(t)
	defer client.Close()

	// Create a canceled context
	ctx, cancel := context.WithCancel(context.Background())
	cancel()

	key := "test:canceled"

	// Operations with canceled context should fail
	err := cacheService.Set(ctx, key, "value", time.Minute)
	assert.Error(t, err, "Set should fail with canceled context")

	_, err = cacheService.Get(ctx, key)
	assert.Error(t, err, "Get should fail with canceled context")
}

func TestCacheService_ConcurrentOperations(t *testing.T) {
	mr, client, cacheService := setupMiniRedis(t)
	defer client.Close()

	ctx := context.Background()

	// Perform concurrent operations
	done := make(chan bool, 10)

	for i := 0; i < 10; i++ {
		go func(id int) {
			key := fmt.Sprintf("concurrent:%d", id)
			value := fmt.Sprintf("value-%d", id)

			// Set
			err := cacheService.Set(ctx, key, value, time.Minute)
			assert.NoError(t, err)

			// Get
			retrieved, err := cacheService.Get(ctx, key)
			assert.NoError(t, err)
			assert.Equal(t, value, retrieved)

			// Delete
			err = cacheService.Delete(ctx, key)
			assert.NoError(t, err)

			done <- true
		}(i)
	}

	// Wait for all goroutines
	for i := 0; i < 10; i++ {
		<-done
	}

	// Verify all keys are deleted
	keys := mr.Keys()
	for _, key := range keys {
		assert.NotContains(t, key, "concurrent:")
	}
}
