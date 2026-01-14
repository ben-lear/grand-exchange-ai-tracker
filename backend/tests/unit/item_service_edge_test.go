package unit

import (
	"context"
	"errors"
	"testing"

	"github.com/alicebob/miniredis/v2"
	"github.com/redis/go-redis/v9"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
	"github.com/stretchr/testify/require"
	"go.uber.org/zap"

	"github.com/guavi/osrs-ge-tracker/internal/models"
	"github.com/guavi/osrs-ge-tracker/internal/services"
)

// setupTestRedis creates a miniredis instance for testing
func setupTestRedis(t *testing.T) *redis.Client {
	mr := miniredis.RunT(t)
	client := redis.NewClient(&redis.Options{
		Addr: mr.Addr(),
	})
	return client
}

// TestItemService_ListItems_Alias tests that ListItems is an alias for GetAllItems
func TestItemService_ListItems_Alias(t *testing.T) {
	mockRepo := new(MockItemRepository)
	mockCache := services.NewCacheService(setupTestRedis(t), zap.NewNop().Sugar())
	logger := zap.NewNop().Sugar()

	svc := services.NewItemService(mockRepo, mockCache, logger)

	params := models.ItemListParams{
		Limit:  10,
		Offset: 0,
	}
	expectedItems := []models.Item{
		{ItemID: 1, Name: "Test Item"},
	}
	expectedCount := int64(1)

	mockRepo.On("GetAll", mock.Anything, params).Return(expectedItems, expectedCount, nil)

	items, count, err := svc.ListItems(context.Background(), params)
	require.NoError(t, err)
	assert.Equal(t, expectedItems, items)
	assert.Equal(t, expectedCount, count)
	mockRepo.AssertExpectations(t)
}

// TestItemService_GetAllItems_EmptyResult tests GetAllItems with no results
func TestItemService_GetAllItems_EmptyResult(t *testing.T) {
	mockRepo := new(MockItemRepository)
	mockCache := services.NewCacheService(setupTestRedis(t), zap.NewNop().Sugar())
	logger := zap.NewNop().Sugar()

	svc := services.NewItemService(mockRepo, mockCache, logger)

	params := models.ItemListParams{Limit: 10, Offset: 0}
	mockRepo.On("GetAll", mock.Anything, params).Return([]models.Item{}, int64(0), nil)

	items, count, err := svc.GetAllItems(context.Background(), params)
	require.NoError(t, err)
	assert.Empty(t, items)
	assert.Equal(t, int64(0), count)
	mockRepo.AssertExpectations(t)
}

// TestItemService_GetAllItems_WithMembersFilter tests GetAllItems with members filter
func TestItemService_GetAllItems_WithMembersFilter(t *testing.T) {
	mockRepo := new(MockItemRepository)
	mockCache := services.NewCacheService(setupTestRedis(t), zap.NewNop().Sugar())
	logger := zap.NewNop().Sugar()

	svc := services.NewItemService(mockRepo, mockCache, logger)

	membersTrue := true
	params := models.ItemListParams{
		Members: &membersTrue,
		Limit:   10,
		Offset:  0,
	}
	expectedItems := []models.Item{
		{ItemID: 1, Name: "Members Item", Members: true},
	}

	mockRepo.On("GetAll", mock.Anything, params).Return(expectedItems, int64(1), nil)

	items, count, err := svc.GetAllItems(context.Background(), params)
	require.NoError(t, err)
	assert.Len(t, items, 1)
	assert.True(t, items[0].Members)
	assert.Equal(t, int64(1), count)
	mockRepo.AssertExpectations(t)
}

// TestItemService_GetAllItems_RepositoryError tests GetAllItems with repository error
func TestItemService_GetAllItems_RepositoryError(t *testing.T) {
	mockRepo := new(MockItemRepository)
	mockCache := services.NewCacheService(setupTestRedis(t), zap.NewNop().Sugar())
	logger := zap.NewNop().Sugar()

	svc := services.NewItemService(mockRepo, mockCache, logger)

	params := models.ItemListParams{Limit: 10, Offset: 0}
	expectedErr := errors.New("database error")
	mockRepo.On("GetAll", mock.Anything, params).Return([]models.Item(nil), int64(0), expectedErr)

	items, count, err := svc.GetAllItems(context.Background(), params)
	assert.Error(t, err)
	assert.Equal(t, expectedErr, err)
	assert.Nil(t, items)
	assert.Equal(t, int64(0), count)
	mockRepo.AssertExpectations(t)
}

// TestItemService_GetItemByID_Success tests GetItemByID with valid ID
func TestItemService_GetItemByID_Success(t *testing.T) {
	mockRepo := new(MockItemRepository)
	mockCache := services.NewCacheService(setupTestRedis(t), zap.NewNop().Sugar())
	logger := zap.NewNop().Sugar()

	svc := services.NewItemService(mockRepo, mockCache, logger)

	expectedItem := &models.Item{ID: 1, ItemID: 123, Name: "Test Item"}
	mockRepo.On("GetByID", mock.Anything, uint(1)).Return(expectedItem, nil)

	item, err := svc.GetItemByID(context.Background(), 1)
	require.NoError(t, err)
	assert.Equal(t, expectedItem, item)
	mockRepo.AssertExpectations(t)
}

// TestItemService_GetItemByID_NotFound tests GetItemByID when item doesn't exist
func TestItemService_GetItemByID_NotFound(t *testing.T) {
	mockRepo := new(MockItemRepository)
	mockCache := services.NewCacheService(setupTestRedis(t), zap.NewNop().Sugar())
	logger := zap.NewNop().Sugar()

	svc := services.NewItemService(mockRepo, mockCache, logger)

	mockRepo.On("GetByID", mock.Anything, uint(999)).Return((*models.Item)(nil), errors.New("not found"))

	item, err := svc.GetItemByID(context.Background(), 999)
	assert.Error(t, err)
	assert.Nil(t, item)
	mockRepo.AssertExpectations(t)
}

// TestItemService_GetItemByItemID_CacheMiss tests GetItemByItemID when cache misses
func TestItemService_GetItemByItemID_CacheMiss(t *testing.T) {
	mockRepo := new(MockItemRepository)
	mockCache := services.NewCacheService(setupTestRedis(t), zap.NewNop().Sugar())
	logger := zap.NewNop().Sugar()

	svc := services.NewItemService(mockRepo, mockCache, logger)

	expectedItem := &models.Item{ItemID: 123, Name: "Test Item"}
	mockRepo.On("GetByItemID", mock.Anything, 123).Return(expectedItem, nil)

	item, err := svc.GetItemByItemID(context.Background(), 123)
	require.NoError(t, err)
	assert.Equal(t, expectedItem, item)
	mockRepo.AssertExpectations(t)
}

// TestItemService_GetItemByItemID_NotFound tests GetItemByItemID when item doesn't exist
func TestItemService_GetItemByItemID_NotFound(t *testing.T) {
	mockRepo := new(MockItemRepository)
	mockCache := services.NewCacheService(setupTestRedis(t), zap.NewNop().Sugar())
	logger := zap.NewNop().Sugar()

	svc := services.NewItemService(mockRepo, mockCache, logger)

	mockRepo.On("GetByItemID", mock.Anything, 999).Return((*models.Item)(nil), errors.New("not found"))

	item, err := svc.GetItemByItemID(context.Background(), 999)
	assert.Error(t, err)
	assert.Nil(t, item)
	mockRepo.AssertExpectations(t)
}

// TestItemService_GetItemByItemID_NilItem tests GetItemByItemID when repo returns nil without error
func TestItemService_GetItemByItemID_NilItem(t *testing.T) {
	mockRepo := new(MockItemRepository)
	mockCache := services.NewCacheService(setupTestRedis(t), zap.NewNop().Sugar())
	logger := zap.NewNop().Sugar()

	svc := services.NewItemService(mockRepo, mockCache, logger)

	mockRepo.On("GetByItemID", mock.Anything, 123).Return((*models.Item)(nil), nil)

	item, err := svc.GetItemByItemID(context.Background(), 123)
	require.NoError(t, err)
	assert.Nil(t, item)
	mockRepo.AssertExpectations(t)
}

// TestItemService_GetItemWithPrice_Success tests GetItemWithPrice with valid item
func TestItemService_GetItemWithPrice_Success(t *testing.T) {
	mockRepo := new(MockItemRepository)
	mockCache := services.NewCacheService(setupTestRedis(t), zap.NewNop().Sugar())
	logger := zap.NewNop().Sugar()

	svc := services.NewItemService(mockRepo, mockCache, logger)

	expectedItem := &models.Item{ItemID: 123, Name: "Test Item"}
	mockRepo.On("GetByItemID", mock.Anything, 123).Return(expectedItem, nil)

	result, err := svc.GetItemWithPrice(context.Background(), 123)
	require.NoError(t, err)
	assert.NotNil(t, result)
	assert.Equal(t, *expectedItem, result.Item)
	mockRepo.AssertExpectations(t)
}

// TestItemService_GetItemWithPrice_ItemNotFound tests GetItemWithPrice when item doesn't exist
func TestItemService_GetItemWithPrice_ItemNotFound(t *testing.T) {
	mockRepo := new(MockItemRepository)
	mockCache := services.NewCacheService(setupTestRedis(t), zap.NewNop().Sugar())
	logger := zap.NewNop().Sugar()

	svc := services.NewItemService(mockRepo, mockCache, logger)

	mockRepo.On("GetByItemID", mock.Anything, 999).Return((*models.Item)(nil), errors.New("not found"))

	result, err := svc.GetItemWithPrice(context.Background(), 999)
	assert.Error(t, err)
	assert.Nil(t, result)
	mockRepo.AssertExpectations(t)
}

// TestItemService_GetItemWithPrice_NilItem tests GetItemWithPrice when item is nil
func TestItemService_GetItemWithPrice_NilItem(t *testing.T) {
	mockRepo := new(MockItemRepository)
	mockCache := services.NewCacheService(setupTestRedis(t), zap.NewNop().Sugar())
	logger := zap.NewNop().Sugar()

	svc := services.NewItemService(mockRepo, mockCache, logger)

	mockRepo.On("GetByItemID", mock.Anything, 123).Return((*models.Item)(nil), nil)

	result, err := svc.GetItemWithPrice(context.Background(), 123)
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "item not found")
	assert.Nil(t, result)
	mockRepo.AssertExpectations(t)
}

// TestItemService_GetItemCount_NoFilter tests GetItemCount without filter
func TestItemService_GetItemCount_NoFilter(t *testing.T) {
	mockRepo := new(MockItemRepository)
	mockCache := services.NewCacheService(setupTestRedis(t), zap.NewNop().Sugar())
	logger := zap.NewNop().Sugar()

	svc := services.NewItemService(mockRepo, mockCache, logger)

	params := models.ItemListParams{
		Members: nil,
		Limit:   1,
		Offset:  0,
	}
	mockRepo.On("GetAll", mock.Anything, params).Return([]models.Item{}, int64(100), nil)

	count, err := svc.GetItemCount(context.Background(), nil)
	require.NoError(t, err)
	assert.Equal(t, int64(100), count)
	mockRepo.AssertExpectations(t)
}

// TestItemService_GetItemCount_WithMembersFilter tests GetItemCount with members filter
func TestItemService_GetItemCount_WithMembersFilter(t *testing.T) {
	mockRepo := new(MockItemRepository)
	mockCache := services.NewCacheService(setupTestRedis(t), zap.NewNop().Sugar())
	logger := zap.NewNop().Sugar()

	svc := services.NewItemService(mockRepo, mockCache, logger)

	membersTrue := true
	params := models.ItemListParams{
		Members: &membersTrue,
		Limit:   1,
		Offset:  0,
	}
	mockRepo.On("GetAll", mock.Anything, params).Return([]models.Item{}, int64(50), nil)

	count, err := svc.GetItemCount(context.Background(), &membersTrue)
	require.NoError(t, err)
	assert.Equal(t, int64(50), count)
	mockRepo.AssertExpectations(t)
}

// TestItemService_GetItemCount_RepositoryError tests GetItemCount with repository error
func TestItemService_GetItemCount_RepositoryError(t *testing.T) {
	mockRepo := new(MockItemRepository)
	mockCache := services.NewCacheService(setupTestRedis(t), zap.NewNop().Sugar())
	logger := zap.NewNop().Sugar()

	svc := services.NewItemService(mockRepo, mockCache, logger)

	params := models.ItemListParams{
		Members: nil,
		Limit:   1,
		Offset:  0,
	}
	expectedErr := errors.New("database error")
	mockRepo.On("GetAll", mock.Anything, params).Return([]models.Item(nil), int64(0), expectedErr)

	count, err := svc.GetItemCount(context.Background(), nil)
	assert.Error(t, err)
	assert.Equal(t, expectedErr, err)
	assert.Equal(t, int64(0), count)
	mockRepo.AssertExpectations(t)
}

// TestItemService_SearchItems_Success tests SearchItems with results
func TestItemService_SearchItems_Success(t *testing.T) {
	mockRepo := new(MockItemRepository)
	mockCache := services.NewCacheService(setupTestRedis(t), zap.NewNop().Sugar())
	logger := zap.NewNop().Sugar()

	svc := services.NewItemService(mockRepo, mockCache, logger)

	params := models.ItemSearchParams{
		Query: "rune",
		Limit: 10,
	}
	expectedItems := []models.Item{
		{ItemID: 1, Name: "Rune scimitar"},
		{ItemID: 2, Name: "Rune platebody"},
	}

	mockRepo.On("Search", mock.Anything, params).Return(expectedItems, int64(2), nil)

	items, err := svc.SearchItems(context.Background(), params)
	require.NoError(t, err)
	assert.Len(t, items, 2)
	assert.Equal(t, "Rune scimitar", items[0].Name)
	mockRepo.AssertExpectations(t)
}

// TestItemService_SearchItems_EmptyQuery tests SearchItems with empty query
func TestItemService_SearchItems_EmptyQuery(t *testing.T) {
	mockRepo := new(MockItemRepository)
	mockCache := services.NewCacheService(setupTestRedis(t), zap.NewNop().Sugar())
	logger := zap.NewNop().Sugar()

	svc := services.NewItemService(mockRepo, mockCache, logger)

	params := models.ItemSearchParams{
		Query: "",
		Limit: 10,
	}

	mockRepo.On("Search", mock.Anything, params).Return([]models.Item{}, int64(0), nil)

	items, err := svc.SearchItems(context.Background(), params)
	require.NoError(t, err)
	assert.Empty(t, items)
	mockRepo.AssertExpectations(t)
}

// TestItemService_SearchItems_NoResults tests SearchItems with no matching items
func TestItemService_SearchItems_NoResults(t *testing.T) {
	mockRepo := new(MockItemRepository)
	mockCache := services.NewCacheService(setupTestRedis(t), zap.NewNop().Sugar())
	logger := zap.NewNop().Sugar()

	svc := services.NewItemService(mockRepo, mockCache, logger)

	params := models.ItemSearchParams{
		Query: "nonexistent item xyz",
		Limit: 10,
	}

	mockRepo.On("Search", mock.Anything, params).Return([]models.Item{}, int64(0), nil)

	items, err := svc.SearchItems(context.Background(), params)
	require.NoError(t, err)
	assert.Empty(t, items)
	mockRepo.AssertExpectations(t)
}

// TestItemService_SearchItems_RepositoryError tests SearchItems with repository error
func TestItemService_SearchItems_RepositoryError(t *testing.T) {
	mockRepo := new(MockItemRepository)
	mockCache := services.NewCacheService(setupTestRedis(t), zap.NewNop().Sugar())
	logger := zap.NewNop().Sugar()

	svc := services.NewItemService(mockRepo, mockCache, logger)

	params := models.ItemSearchParams{
		Query: "test",
		Limit: 10,
	}
	expectedErr := errors.New("search failed")

	mockRepo.On("Search", mock.Anything, params).Return([]models.Item(nil), int64(0), expectedErr)

	items, err := svc.SearchItems(context.Background(), params)
	assert.Error(t, err)
	assert.Equal(t, expectedErr, err)
	assert.Nil(t, items)
	mockRepo.AssertExpectations(t)
}

// TestItemService_UpsertItem_ValidItem tests UpsertItem with valid item
func TestItemService_UpsertItem_ValidItem(t *testing.T) {
	mockRepo := new(MockItemRepository)
	mockCache := services.NewCacheService(setupTestRedis(t), zap.NewNop().Sugar())
	logger := zap.NewNop().Sugar()

	svc := services.NewItemService(mockRepo, mockCache, logger)

	item := &models.Item{
		ItemID:  123,
		Name:    "Test Item",
		Members: true,
	}

	mockRepo.On("Upsert", mock.Anything, item).Return(nil)

	err := svc.UpsertItem(context.Background(), item)
	require.NoError(t, err)
	mockRepo.AssertExpectations(t)
}

// TestItemService_UpsertItem_NilItem tests UpsertItem with nil item
func TestItemService_UpsertItem_NilItem(t *testing.T) {
	mockRepo := new(MockItemRepository)
	mockCache := services.NewCacheService(setupTestRedis(t), zap.NewNop().Sugar())
	logger := zap.NewNop().Sugar()

	svc := services.NewItemService(mockRepo, mockCache, logger)

	var nilItem *models.Item
	mockRepo.On("Upsert", mock.Anything, nilItem).Return(errors.New("nil item"))

	err := svc.UpsertItem(context.Background(), nilItem)
	assert.Error(t, err)
	mockRepo.AssertExpectations(t)
}

// TestItemService_BulkUpsertItems_LargeDataset tests BulkUpsertItems with many items
func TestItemService_BulkUpsertItems_LargeDataset(t *testing.T) {
	mockRepo := new(MockItemRepository)
	mockCache := services.NewCacheService(setupTestRedis(t), zap.NewNop().Sugar())
	logger := zap.NewNop().Sugar()

	svc := services.NewItemService(mockRepo, mockCache, logger)

	// Create 1000 items
	items := make([]models.Item, 1000)
	for i := range items {
		items[i] = models.Item{
			ItemID: i + 1,
			Name:   "Item " + string(rune(i)),
		}
	}

	mockRepo.On("BulkUpsert", mock.Anything, items).Return(nil)

	err := svc.BulkUpsertItems(context.Background(), items)
	require.NoError(t, err)
	mockRepo.AssertExpectations(t)
}

// TestItemService_BulkUpsertItems_DuplicateItemIDs tests BulkUpsertItems with duplicate IDs
func TestItemService_BulkUpsertItems_DuplicateItemIDs(t *testing.T) {
	mockRepo := new(MockItemRepository)
	mockCache := services.NewCacheService(setupTestRedis(t), zap.NewNop().Sugar())
	logger := zap.NewNop().Sugar()

	svc := services.NewItemService(mockRepo, mockCache, logger)

	items := []models.Item{
		{ItemID: 123, Name: "Item 1"},
		{ItemID: 123, Name: "Item 1 Updated"}, // Duplicate ID
	}

	mockRepo.On("BulkUpsert", mock.Anything, items).Return(nil)

	err := svc.BulkUpsertItems(context.Background(), items)
	require.NoError(t, err)
	mockRepo.AssertExpectations(t)
}

// TestItemService_ConcurrentOperations tests concurrent operations on item service
func TestItemService_ConcurrentOperations(t *testing.T) {
	mockRepo := new(MockItemRepository)
	mockCache := services.NewCacheService(setupTestRedis(t), zap.NewNop().Sugar())
	logger := zap.NewNop().Sugar()

	svc := services.NewItemService(mockRepo, mockCache, logger)

	item := &models.Item{ItemID: 123, Name: "Test Item"}

	// Since cache is used, only first miss will hit the repo
	// After that, all reads will come from cache
	mockRepo.On("GetByItemID", mock.Anything, 123).Return(item, nil).Maybe()

	done := make(chan bool, 5)

	// Start 5 concurrent goroutines
	for i := 0; i < 5; i++ {
		go func() {
			result, err := svc.GetItemByItemID(context.Background(), 123)
			assert.NoError(t, err)
			assert.Equal(t, "Test Item", result.Name)
			done <- true
		}()
	}

	// Wait for all goroutines to complete
	for i := 0; i < 5; i++ {
		<-done
	}

	mockRepo.AssertExpectations(t)
}
