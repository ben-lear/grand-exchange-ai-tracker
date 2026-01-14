package unit

import (
	"context"
	"errors"
	"testing"
	"time"

	"github.com/alicebob/miniredis/v2"
	"github.com/redis/go-redis/v9"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
	"github.com/stretchr/testify/require"
	"go.uber.org/zap"

	"github.com/guavi/osrs-ge-tracker/internal/models"
	"github.com/guavi/osrs-ge-tracker/internal/services"
)

// MockOSRSClient is a mock implementation of OSRSClient
type MockOSRSClient struct {
	mock.Mock
}

func (m *MockOSRSClient) FetchBulkDump() (map[int]models.BulkDumpItem, error) {
	args := m.Called()
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(map[int]models.BulkDumpItem), args.Error(1)
}

func (m *MockOSRSClient) FetchLatestPrices(itemIDs []int) (map[int]models.HistoricalDataPoint, error) {
	args := m.Called(itemIDs)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(map[int]models.HistoricalDataPoint), args.Error(1)
}

func (m *MockOSRSClient) FetchHistoricalData(itemID int, period string) ([]models.HistoricalDataPoint, error) {
	args := m.Called(itemID, period)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).([]models.HistoricalDataPoint), args.Error(1)
}

func (m *MockOSRSClient) FetchSampleData(itemID int) ([]models.HistoricalDataPoint, error) {
	args := m.Called(itemID)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).([]models.HistoricalDataPoint), args.Error(1)
}

func (m *MockOSRSClient) FetchAllHistoricalData(itemID int) ([]models.HistoricalDataPoint, error) {
	args := m.Called(itemID)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).([]models.HistoricalDataPoint), args.Error(1)
}

func (m *MockOSRSClient) FetchItemDetail(itemID int) (*models.ItemDetail, error) {
	args := m.Called(itemID)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.ItemDetail), args.Error(1)
}

// MockPriceRepository is a mock implementation of PriceRepository
type MockPriceRepository struct {
	mock.Mock
}

func (m *MockPriceRepository) GetCurrentPrice(ctx context.Context, itemID int) (*models.CurrentPrice, error) {
	args := m.Called(ctx, itemID)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.CurrentPrice), args.Error(1)
}

func (m *MockPriceRepository) GetCurrentPrices(ctx context.Context, itemIDs []int) ([]models.CurrentPrice, error) {
	args := m.Called(ctx, itemIDs)
	return args.Get(0).([]models.CurrentPrice), args.Error(1)
}

func (m *MockPriceRepository) GetAllCurrentPrices(ctx context.Context) ([]models.CurrentPrice, error) {
	args := m.Called(ctx)
	return args.Get(0).([]models.CurrentPrice), args.Error(1)
}

func (m *MockPriceRepository) UpsertCurrentPrice(ctx context.Context, price *models.CurrentPrice) error {
	args := m.Called(ctx, price)
	return args.Error(0)
}

func (m *MockPriceRepository) BulkUpsertCurrentPrices(ctx context.Context, updates []models.BulkPriceUpdate) error {
	args := m.Called(ctx, updates)
	return args.Error(0)
}

func (m *MockPriceRepository) GetHistory(ctx context.Context, params models.PriceHistoryParams) ([]models.PriceHistory, error) {
	args := m.Called(ctx, params)
	return args.Get(0).([]models.PriceHistory), args.Error(1)
}

func (m *MockPriceRepository) BulkInsertHistory(ctx context.Context, inserts []models.BulkHistoryInsert) error {
	args := m.Called(ctx, inserts)
	return args.Error(0)
}

func (m *MockPriceRepository) DeleteOldHistory(ctx context.Context, itemID int, beforeTime int64) error {
	args := m.Called(ctx, itemID, beforeTime)
	return args.Error(0)
}

func (m *MockPriceRepository) InsertHistory(ctx context.Context, history *models.PriceHistory) error {
	args := m.Called(ctx, history)
	return args.Error(0)
}

func (m *MockPriceRepository) GetLatestHistoryTimestamp(ctx context.Context, itemID int) (*models.PriceHistory, error) {
	args := m.Called(ctx, itemID)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.PriceHistory), args.Error(1)
}

// MockItemRepository is a mock implementation of ItemRepository
type MockItemRepository struct {
	mock.Mock
}

func (m *MockItemRepository) GetByID(ctx context.Context, id uint) (*models.Item, error) {
	args := m.Called(ctx, id)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.Item), args.Error(1)
}

func (m *MockItemRepository) GetByItemID(ctx context.Context, itemID int) (*models.Item, error) {
	args := m.Called(ctx, itemID)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.Item), args.Error(1)
}

func (m *MockItemRepository) GetAll(ctx context.Context, params models.ItemListParams) ([]models.Item, int64, error) {
	args := m.Called(ctx, params)
	return args.Get(0).([]models.Item), args.Get(1).(int64), args.Error(2)
}

func (m *MockItemRepository) Search(ctx context.Context, params models.ItemSearchParams) ([]models.Item, int64, error) {
	args := m.Called(ctx, params)
	return args.Get(0).([]models.Item), args.Get(1).(int64), args.Error(2)
}

func (m *MockItemRepository) Create(ctx context.Context, item *models.Item) error {
	args := m.Called(ctx, item)
	return args.Error(0)
}

func (m *MockItemRepository) Update(ctx context.Context, item *models.Item) error {
	args := m.Called(ctx, item)
	return args.Error(0)
}

func (m *MockItemRepository) Upsert(ctx context.Context, item *models.Item) error {
	args := m.Called(ctx, item)
	return args.Error(0)
}

func (m *MockItemRepository) BulkUpsert(ctx context.Context, items []models.Item) error {
	args := m.Called(ctx, items)
	return args.Error(0)
}

func (m *MockItemRepository) Delete(ctx context.Context, id uint) error {
	args := m.Called(ctx, id)
	return args.Error(0)
}

func (m *MockItemRepository) Count(ctx context.Context) (int64, error) {
	args := m.Called(ctx)
	return args.Get(0).(int64), args.Error(1)
}

// ========== PriceService Sync Tests ==========

func TestPriceService_SyncBulkPrices_Success(t *testing.T) {
	logger := zap.NewNop().Sugar()
	mockOSRS := new(MockOSRSClient)
	mockRepo := new(MockPriceRepository)

	// Setup miniredis
	mr := miniredis.RunT(t)
	rdb := redis.NewClient(&redis.Options{Addr: mr.Addr()})
	cache := services.NewCacheService(rdb, logger)

	// Create service
	svc := services.NewPriceService(mockRepo, nil, cache, mockOSRS, logger)

	// Mock bulk dump response
	bulkData := map[int]models.BulkDumpItem{
		2: {High: 1000, Low: 900, HighTime: time.Now().Unix(), LowTime: time.Now().Unix()},
		4: {High: 2000, Low: 1800, HighTime: time.Now().Unix(), LowTime: time.Now().Unix()},
	}
	mockOSRS.On("FetchBulkDump").Return(bulkData, nil)

	// Mock repository bulk upsert
	mockRepo.On("BulkUpsertCurrentPrices", mock.Anything, mock.MatchedBy(func(updates []models.BulkPriceUpdate) bool {
		return len(updates) == 2
	})).Return(nil)

	// Execute
	ctx := context.Background()
	err := svc.SyncBulkPrices(ctx)

	// Assert
	require.NoError(t, err)
	mockOSRS.AssertExpectations(t)
	mockRepo.AssertExpectations(t)
}

func TestPriceService_SyncBulkPrices_FetchError(t *testing.T) {
	logger := zap.NewNop().Sugar()
	mockOSRS := new(MockOSRSClient)
	mockRepo := new(MockPriceRepository)

	mr := miniredis.RunT(t)
	rdb := redis.NewClient(&redis.Options{Addr: mr.Addr()})
	cache := services.NewCacheService(rdb, logger)

	svc := services.NewPriceService(mockRepo, nil, cache, mockOSRS, logger)

	// Mock fetch failure
	mockOSRS.On("FetchBulkDump").Return(nil, errors.New("API error"))

	// Execute
	ctx := context.Background()
	err := svc.SyncBulkPrices(ctx)

	// Assert
	require.Error(t, err)
	assert.Contains(t, err.Error(), "failed to fetch bulk dump")
	mockOSRS.AssertExpectations(t)
	mockRepo.AssertNotCalled(t, "BulkUpsertCurrentPrices", mock.Anything, mock.Anything)
}

func TestPriceService_SyncBulkPrices_RepositoryError(t *testing.T) {
	logger := zap.NewNop().Sugar()
	mockOSRS := new(MockOSRSClient)
	mockRepo := new(MockPriceRepository)

	mr := miniredis.RunT(t)
	rdb := redis.NewClient(&redis.Options{Addr: mr.Addr()})
	cache := services.NewCacheService(rdb, logger)

	svc := services.NewPriceService(mockRepo, nil, cache, mockOSRS, logger)

	// Mock successful fetch
	bulkData := map[int]models.BulkDumpItem{
		2: {High: 1000, Low: 900, HighTime: time.Now().Unix(), LowTime: time.Now().Unix()},
	}
	mockOSRS.On("FetchBulkDump").Return(bulkData, nil)

	// Mock repository failure
	mockRepo.On("BulkUpsertCurrentPrices", mock.Anything, mock.Anything).Return(errors.New("DB error"))

	// Execute
	ctx := context.Background()
	err := svc.SyncBulkPrices(ctx)

	// Assert
	require.Error(t, err)
	assert.Contains(t, err.Error(), "failed to bulk upsert prices")
	mockOSRS.AssertExpectations(t)
	mockRepo.AssertExpectations(t)
}

func TestPriceService_SyncBulkPrices_EmptyData(t *testing.T) {
	logger := zap.NewNop().Sugar()
	mockOSRS := new(MockOSRSClient)
	mockRepo := new(MockPriceRepository)

	mr := miniredis.RunT(t)
	rdb := redis.NewClient(&redis.Options{Addr: mr.Addr()})
	cache := services.NewCacheService(rdb, logger)

	svc := services.NewPriceService(mockRepo, nil, cache, mockOSRS, logger)

	// Mock empty bulk dump
	mockOSRS.On("FetchBulkDump").Return(map[int]models.BulkDumpItem{}, nil)

	// Mock repository (should receive empty slice)
	mockRepo.On("BulkUpsertCurrentPrices", mock.Anything, mock.MatchedBy(func(updates []models.BulkPriceUpdate) bool {
		return len(updates) == 0
	})).Return(nil)

	// Execute
	ctx := context.Background()
	err := svc.SyncBulkPrices(ctx)

	// Assert (should not error, just skip)
	require.NoError(t, err)
	mockOSRS.AssertExpectations(t)
	mockRepo.AssertExpectations(t)
}

func TestPriceService_SyncBulkPrices_CacheInvalidation(t *testing.T) {
	logger := zap.NewNop().Sugar()
	mockOSRS := new(MockOSRSClient)
	mockRepo := new(MockPriceRepository)

	mr := miniredis.RunT(t)
	rdb := redis.NewClient(&redis.Options{Addr: mr.Addr()})
	cache := services.NewCacheService(rdb, logger)

	// Pre-populate cache
	ctx := context.Background()
	_ = cache.Set(ctx, "price:current:all", "cached_data", time.Minute)
	_ = cache.Set(ctx, "price:current:2", "cached_price", time.Minute)

	svc := services.NewPriceService(mockRepo, nil, cache, mockOSRS, logger)

	// Mock successful sync
	bulkData := map[int]models.BulkDumpItem{
		2: {High: 1000, Low: 900, HighTime: time.Now().Unix(), LowTime: time.Now().Unix()},
	}
	mockOSRS.On("FetchBulkDump").Return(bulkData, nil)
	mockRepo.On("BulkUpsertCurrentPrices", mock.Anything, mock.Anything).Return(nil)

	// Execute
	err := svc.SyncBulkPrices(ctx)
	require.NoError(t, err)

	// Verify cache was cleared (keys should not exist after DeletePattern)
	exists, _ := cache.Exists(ctx, "price:current:all")
	assert.False(t, exists, "Cache should be invalidated after sync")
}

func TestPriceService_SyncCurrentPrices_AliasForSyncBulkPrices(t *testing.T) {
	logger := zap.NewNop().Sugar()
	mockOSRS := new(MockOSRSClient)
	mockRepo := new(MockPriceRepository)

	mr := miniredis.RunT(t)
	rdb := redis.NewClient(&redis.Options{Addr: mr.Addr()})
	cache := services.NewCacheService(rdb, logger)

	svc := services.NewPriceService(mockRepo, nil, cache, mockOSRS, logger)

	// Mock successful bulk dump
	bulkData := map[int]models.BulkDumpItem{
		2: {High: 1000, Low: 900, HighTime: time.Now().Unix(), LowTime: time.Now().Unix()},
	}
	mockOSRS.On("FetchBulkDump").Return(bulkData, nil)
	mockRepo.On("BulkUpsertCurrentPrices", mock.Anything, mock.Anything).Return(nil)

	// Execute SyncCurrentPrices (alias)
	ctx := context.Background()
	err := svc.SyncCurrentPrices(ctx)

	// Assert - should behave exactly like SyncBulkPrices
	require.NoError(t, err)
	mockOSRS.AssertExpectations(t)
	mockRepo.AssertExpectations(t)
}

func TestPriceService_SyncHistoricalPrices_SampleData_Success(t *testing.T) {
	logger := zap.NewNop().Sugar()
	mockOSRS := new(MockOSRSClient)
	mockRepo := new(MockPriceRepository)

	mr := miniredis.RunT(t)
	rdb := redis.NewClient(&redis.Options{Addr: mr.Addr()})
	cache := services.NewCacheService(rdb, logger)

	svc := services.NewPriceService(mockRepo, nil, cache, mockOSRS, logger)

	// Mock sample data response
	sampleData := []models.HistoricalDataPoint{
		{Timestamp: time.Now().Unix(), AvgPrice: 1000, Volume: 100},
		{Timestamp: time.Now().Add(-time.Hour).Unix(), AvgPrice: 950, Volume: 150},
	}
	mockOSRS.On("FetchSampleData", 2).Return(sampleData, nil)

	// Mock repository bulk insert
	mockRepo.On("BulkInsertHistory", mock.Anything, mock.MatchedBy(func(inserts []models.BulkHistoryInsert) bool {
		return len(inserts) == 2 && inserts[0].ItemID == 2
	})).Return(nil)

	// Execute with fullHistory=false (sample data)
	ctx := context.Background()
	err := svc.SyncHistoricalPrices(ctx, 2, false)

	// Assert
	require.NoError(t, err)
	mockOSRS.AssertExpectations(t)
	mockRepo.AssertExpectations(t)
}

func TestPriceService_SyncHistoricalPrices_FullHistory_Success(t *testing.T) {
	logger := zap.NewNop().Sugar()
	mockOSRS := new(MockOSRSClient)
	mockRepo := new(MockPriceRepository)

	mr := miniredis.RunT(t)
	rdb := redis.NewClient(&redis.Options{Addr: mr.Addr()})
	cache := services.NewCacheService(rdb, logger)

	svc := services.NewPriceService(mockRepo, nil, cache, mockOSRS, logger)

	// Mock full history response
	fullData := []models.HistoricalDataPoint{
		{Timestamp: time.Now().Unix(), AvgPrice: 1000, Volume: 100},
		{Timestamp: time.Now().Add(-24 * time.Hour).Unix(), AvgPrice: 900, Volume: 200},
		{Timestamp: time.Now().Add(-48 * time.Hour).Unix(), AvgPrice: 850, Volume: 250},
	}
	mockOSRS.On("FetchAllHistoricalData", 4).Return(fullData, nil)

	// Mock repository bulk insert
	mockRepo.On("BulkInsertHistory", mock.Anything, mock.MatchedBy(func(inserts []models.BulkHistoryInsert) bool {
		return len(inserts) == 3 && inserts[0].ItemID == 4
	})).Return(nil)

	// Execute with fullHistory=true
	ctx := context.Background()
	err := svc.SyncHistoricalPrices(ctx, 4, true)

	// Assert
	require.NoError(t, err)
	mockOSRS.AssertExpectations(t)
	mockRepo.AssertExpectations(t)
}

func TestPriceService_SyncHistoricalPrices_FetchError(t *testing.T) {
	logger := zap.NewNop().Sugar()
	mockOSRS := new(MockOSRSClient)
	mockRepo := new(MockPriceRepository)

	mr := miniredis.RunT(t)
	rdb := redis.NewClient(&redis.Options{Addr: mr.Addr()})
	cache := services.NewCacheService(rdb, logger)

	svc := services.NewPriceService(mockRepo, nil, cache, mockOSRS, logger)

	// Mock fetch failure
	mockOSRS.On("FetchSampleData", 2).Return(nil, errors.New("API timeout"))

	// Execute
	ctx := context.Background()
	err := svc.SyncHistoricalPrices(ctx, 2, false)

	// Assert
	require.Error(t, err)
	assert.Contains(t, err.Error(), "failed to fetch historical data")
	mockOSRS.AssertExpectations(t)
	mockRepo.AssertNotCalled(t, "BulkInsertHistory", mock.Anything, mock.Anything)
}

func TestPriceService_SyncHistoricalPrices_EmptyData(t *testing.T) {
	logger := zap.NewNop().Sugar()
	mockOSRS := new(MockOSRSClient)
	mockRepo := new(MockPriceRepository)

	mr := miniredis.RunT(t)
	rdb := redis.NewClient(&redis.Options{Addr: mr.Addr()})
	cache := services.NewCacheService(rdb, logger)

	svc := services.NewPriceService(mockRepo, nil, cache, mockOSRS, logger)

	// Mock empty response
	mockOSRS.On("FetchSampleData", 999).Return([]models.HistoricalDataPoint{}, nil)

	// Execute
	ctx := context.Background()
	err := svc.SyncHistoricalPrices(ctx, 999, false)

	// Assert - should not error, just log warning
	require.NoError(t, err)
	mockOSRS.AssertExpectations(t)
	mockRepo.AssertNotCalled(t, "BulkInsertHistory", mock.Anything, mock.Anything)
}

func TestPriceService_SyncHistoricalPrices_RepositoryError(t *testing.T) {
	logger := zap.NewNop().Sugar()
	mockOSRS := new(MockOSRSClient)
	mockRepo := new(MockPriceRepository)

	mr := miniredis.RunT(t)
	rdb := redis.NewClient(&redis.Options{Addr: mr.Addr()})
	cache := services.NewCacheService(rdb, logger)

	svc := services.NewPriceService(mockRepo, nil, cache, mockOSRS, logger)

	// Mock successful fetch
	sampleData := []models.HistoricalDataPoint{
		{Timestamp: time.Now().Unix(), AvgPrice: 1000, Volume: 100},
	}
	mockOSRS.On("FetchSampleData", 2).Return(sampleData, nil)

	// Mock repository failure
	mockRepo.On("BulkInsertHistory", mock.Anything, mock.Anything).Return(errors.New("DB constraint violation"))

	// Execute
	ctx := context.Background()
	err := svc.SyncHistoricalPrices(ctx, 2, false)

	// Assert
	require.Error(t, err)
	assert.Contains(t, err.Error(), "failed to bulk insert history")
	mockOSRS.AssertExpectations(t)
	mockRepo.AssertExpectations(t)
}

func TestPriceService_SyncHistoricalPrices_CacheInvalidation(t *testing.T) {
	logger := zap.NewNop().Sugar()
	mockOSRS := new(MockOSRSClient)
	mockRepo := new(MockPriceRepository)

	mr := miniredis.RunT(t)
	rdb := redis.NewClient(&redis.Options{Addr: mr.Addr()})
	cache := services.NewCacheService(rdb, logger)

	// Pre-populate cache with history for item 2
	ctx := context.Background()
	_ = cache.Set(ctx, "price:history:2:24h", "cached_history", time.Minute)
	_ = cache.Set(ctx, "price:history:2:7d", "cached_history", time.Minute)

	svc := services.NewPriceService(mockRepo, nil, cache, mockOSRS, logger)

	// Mock successful sync
	sampleData := []models.HistoricalDataPoint{
		{Timestamp: time.Now().Unix(), AvgPrice: 1000, Volume: 100},
	}
	mockOSRS.On("FetchSampleData", 2).Return(sampleData, nil)
	mockRepo.On("BulkInsertHistory", mock.Anything, mock.Anything).Return(nil)

	// Execute
	err := svc.SyncHistoricalPrices(ctx, 2, false)
	require.NoError(t, err)

	// Verify cache was cleared
	exists, _ := cache.Exists(ctx, "price:history:2:24h")
	assert.False(t, exists, "History cache should be invalidated after sync")
}

// ========== ItemService Sync Tests ==========

func TestItemService_SyncItemFromAPI_Success(t *testing.T) {
	logger := zap.NewNop().Sugar()
	mockItemRepo := new(MockItemRepository)

	mr := miniredis.RunT(t)
	rdb := redis.NewClient(&redis.Options{Addr: mr.Addr()})
	cache := services.NewCacheService(rdb, logger)

	// Create item service (it creates its own OSRS client internally)
	_ = services.NewItemService(mockItemRepo, cache, logger)

	// We can't easily mock the internal OSRS client, so we'll test the error path
	// In a real scenario, this would require dependency injection of OSRS client

	// For now, test the repository interaction assuming API call succeeds
	// This test demonstrates the pattern but would need API mocking in production

	// Skip this test as it requires actual API call or refactoring for DI
	t.Skip("Requires OSRS client dependency injection for proper mocking")
}

func TestItemService_UpsertItem_Success(t *testing.T) {
	logger := zap.NewNop().Sugar()
	mockItemRepo := new(MockItemRepository)

	mr := miniredis.RunT(t)
	rdb := redis.NewClient(&redis.Options{Addr: mr.Addr()})
	cache := services.NewCacheService(rdb, logger)

	svc := services.NewItemService(mockItemRepo, cache, logger)

	// Create test item
	item := &models.Item{
		ItemID:  2,
		Name:    "Cannonball",
		IconURL: "http://example.com/icon.png",
		Members: false,
	}

	// Mock repository upsert
	mockItemRepo.On("Upsert", mock.Anything, item).Return(nil)

	// Execute
	ctx := context.Background()
	err := svc.UpsertItem(ctx, item)

	// Assert
	require.NoError(t, err)
	mockItemRepo.AssertExpectations(t)
}

func TestItemService_UpsertItem_CacheInvalidation(t *testing.T) {
	logger := zap.NewNop().Sugar()
	mockItemRepo := new(MockItemRepository)

	mr := miniredis.RunT(t)
	rdb := redis.NewClient(&redis.Options{Addr: mr.Addr()})
	cache := services.NewCacheService(rdb, logger)

	// Pre-populate cache
	ctx := context.Background()
	_ = cache.Set(ctx, "item:2", "cached_item_data", time.Minute)

	svc := services.NewItemService(mockItemRepo, cache, logger)

	item := &models.Item{
		ItemID:  2,
		Name:    "Cannonball",
		IconURL: "http://example.com/icon.png",
		Members: false,
	}

	mockItemRepo.On("Upsert", mock.Anything, item).Return(nil)

	// Execute
	err := svc.UpsertItem(ctx, item)
	require.NoError(t, err)

	// Verify cache was cleared
	exists, _ := cache.Exists(ctx, "item:2")
	assert.False(t, exists, "Item cache should be invalidated after upsert")
}

func TestItemService_UpsertItem_RepositoryError(t *testing.T) {
	logger := zap.NewNop().Sugar()
	mockItemRepo := new(MockItemRepository)

	mr := miniredis.RunT(t)
	rdb := redis.NewClient(&redis.Options{Addr: mr.Addr()})
	cache := services.NewCacheService(rdb, logger)

	svc := services.NewItemService(mockItemRepo, cache, logger)

	item := &models.Item{
		ItemID:  2,
		Name:    "Cannonball",
		IconURL: "http://example.com/icon.png",
		Members: false,
	}

	// Mock repository failure
	mockItemRepo.On("Upsert", mock.Anything, item).Return(errors.New("DB connection lost"))

	// Execute
	ctx := context.Background()
	err := svc.UpsertItem(ctx, item)

	// Assert
	require.Error(t, err)
	assert.Contains(t, err.Error(), "DB connection lost")
	mockItemRepo.AssertExpectations(t)
}

func TestItemService_BulkUpsertItems_Success(t *testing.T) {
	logger := zap.NewNop().Sugar()
	mockItemRepo := new(MockItemRepository)

	mr := miniredis.RunT(t)
	rdb := redis.NewClient(&redis.Options{Addr: mr.Addr()})
	cache := services.NewCacheService(rdb, logger)

	svc := services.NewItemService(mockItemRepo, cache, logger)

	// Create test items
	items := []models.Item{
		{ItemID: 2, Name: "Cannonball", IconURL: "http://example.com/icon1.png", Members: false},
		{ItemID: 4, Name: "Bronze arrow", IconURL: "http://example.com/icon2.png", Members: false},
		{ItemID: 6, Name: "Iron ore", IconURL: "http://example.com/icon3.png", Members: false},
	}

	// Mock repository bulk upsert
	mockItemRepo.On("BulkUpsert", mock.Anything, items).Return(nil)

	// Execute
	ctx := context.Background()
	err := svc.BulkUpsertItems(ctx, items)

	// Assert
	require.NoError(t, err)
	mockItemRepo.AssertExpectations(t)
}

func TestItemService_BulkUpsertItems_CacheInvalidation(t *testing.T) {
	logger := zap.NewNop().Sugar()
	mockItemRepo := new(MockItemRepository)

	mr := miniredis.RunT(t)
	rdb := redis.NewClient(&redis.Options{Addr: mr.Addr()})
	cache := services.NewCacheService(rdb, logger)

	// Pre-populate cache with multiple items
	ctx := context.Background()
	_ = cache.Set(ctx, "item:2", "cached_item_2", time.Minute)
	_ = cache.Set(ctx, "item:4", "cached_item_4", time.Minute)
	_ = cache.Set(ctx, "item:6", "cached_item_6", time.Minute)

	svc := services.NewItemService(mockItemRepo, cache, logger)

	items := []models.Item{
		{ItemID: 2, Name: "Cannonball", IconURL: "http://example.com/icon.png", Members: false},
	}

	mockItemRepo.On("BulkUpsert", mock.Anything, items).Return(nil)

	// Execute
	err := svc.BulkUpsertItems(ctx, items)
	require.NoError(t, err)

	// Verify all item cache keys were cleared (pattern matching "item:*")
	exists2, _ := cache.Exists(ctx, "item:2")
	exists4, _ := cache.Exists(ctx, "item:4")
	exists6, _ := cache.Exists(ctx, "item:6")

	assert.False(t, exists2, "Item cache should be cleared")
	assert.False(t, exists4, "Item cache should be cleared")
	assert.False(t, exists6, "Item cache should be cleared")
}

func TestItemService_BulkUpsertItems_RepositoryError(t *testing.T) {
	logger := zap.NewNop().Sugar()
	mockItemRepo := new(MockItemRepository)

	mr := miniredis.RunT(t)
	rdb := redis.NewClient(&redis.Options{Addr: mr.Addr()})
	cache := services.NewCacheService(rdb, logger)

	svc := services.NewItemService(mockItemRepo, cache, logger)

	items := []models.Item{
		{ItemID: 2, Name: "Cannonball", IconURL: "http://example.com/icon.png", Members: false},
	}

	// Mock repository failure
	mockItemRepo.On("BulkUpsert", mock.Anything, items).Return(errors.New("Bulk insert failed"))

	// Execute
	ctx := context.Background()
	err := svc.BulkUpsertItems(ctx, items)

	// Assert
	require.Error(t, err)
	assert.Contains(t, err.Error(), "Bulk insert failed")
	mockItemRepo.AssertExpectations(t)
}

func TestItemService_BulkUpsertItems_EmptySlice(t *testing.T) {
	logger := zap.NewNop().Sugar()
	mockItemRepo := new(MockItemRepository)

	mr := miniredis.RunT(t)
	rdb := redis.NewClient(&redis.Options{Addr: mr.Addr()})
	cache := services.NewCacheService(rdb, logger)

	svc := services.NewItemService(mockItemRepo, cache, logger)

	// Mock repository to accept empty slice
	mockItemRepo.On("BulkUpsert", mock.Anything, []models.Item{}).Return(nil)

	// Execute with empty items
	ctx := context.Background()
	err := svc.BulkUpsertItems(ctx, []models.Item{})

	// Assert - should not error
	require.NoError(t, err)
	mockItemRepo.AssertExpectations(t)
}
