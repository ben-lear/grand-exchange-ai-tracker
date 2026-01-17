package unit

import (
	"context"
	"testing"

	"github.com/stretchr/testify/mock"

	"github.com/guavi/osrs-ge-tracker/internal/models"
)

// MockItemService is a mock implementation of ItemService.
type MockItemService struct {
	mock.Mock
}

func (m *MockItemService) ListItems(ctx context.Context, params models.ItemListParams) ([]models.Item, int64, error) {
	args := m.Called(ctx, params)
	return args.Get(0).([]models.Item), args.Get(1).(int64), args.Error(2)
}

func (m *MockItemService) GetAllItems(ctx context.Context, params models.ItemListParams) ([]models.Item, int64, error) {
	args := m.Called(ctx, params)
	return args.Get(0).([]models.Item), args.Get(1).(int64), args.Error(2)
}

func (m *MockItemService) GetItemByID(ctx context.Context, id uint) (*models.Item, error) {
	args := m.Called(ctx, id)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.Item), args.Error(1)
}

func (m *MockItemService) GetItemByItemID(ctx context.Context, itemID int) (*models.Item, error) {
	args := m.Called(ctx, itemID)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.Item), args.Error(1)
}

func (m *MockItemService) GetItemWithPrice(ctx context.Context, itemID int) (*models.ItemWithCurrentPrice, error) {
	args := m.Called(ctx, itemID)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.ItemWithCurrentPrice), args.Error(1)
}

func (m *MockItemService) SearchItems(ctx context.Context, params models.ItemSearchParams) ([]models.Item, error) {
	args := m.Called(ctx, params)
	return args.Get(0).([]models.Item), args.Error(1)
}

func (m *MockItemService) GetItemCount(ctx context.Context, members *bool) (int64, error) {
	args := m.Called(ctx, members)
	return args.Get(0).(int64), args.Error(1)
}

func (m *MockItemService) UpsertItem(ctx context.Context, item *models.Item) error {
	args := m.Called(ctx, item)
	return args.Error(0)
}

func (m *MockItemService) BulkUpsertItems(ctx context.Context, items []models.Item) error {
	args := m.Called(ctx, items)
	return args.Error(0)
}

func (m *MockItemService) SyncItemFromAPI(ctx context.Context, itemID int) (*models.Item, error) {
	args := m.Called(ctx, itemID)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.Item), args.Error(1)
}

func (m *MockItemService) SyncItemsFromBulkDump(ctx context.Context) error {
	args := m.Called(ctx)
	return args.Error(0)
}

func (m *MockItemService) SyncItemsFromMapping(ctx context.Context) error {
	args := m.Called(ctx)
	return args.Error(0)
}

// MockPriceService is a mock implementation of PriceService.
type MockPriceService struct {
	mock.Mock
}

func (m *MockPriceService) GetCurrentPrice(ctx context.Context, itemID int) (*models.CurrentPrice, error) {
	args := m.Called(ctx, itemID)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.CurrentPrice), args.Error(1)
}

func (m *MockPriceService) GetCurrentPrices(ctx context.Context, itemIDs []int) ([]models.CurrentPrice, error) {
	args := m.Called(ctx, itemIDs)
	return args.Get(0).([]models.CurrentPrice), args.Error(1)
}

func (m *MockPriceService) GetBatchCurrentPrices(ctx context.Context, itemIDs []int) ([]models.CurrentPrice, error) {
	args := m.Called(ctx, itemIDs)
	return args.Get(0).([]models.CurrentPrice), args.Error(1)
}

func (m *MockPriceService) GetAllCurrentPrices(ctx context.Context) ([]models.CurrentPrice, error) {
	args := m.Called(ctx)
	return args.Get(0).([]models.CurrentPrice), args.Error(1)
}

func (m *MockPriceService) GetPriceHistory(ctx context.Context, params models.PriceHistoryParams) (*models.PriceHistoryResponse, error) {
	args := m.Called(ctx, params)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.PriceHistoryResponse), args.Error(1)
}

func (m *MockPriceService) UpdateCurrentPrice(ctx context.Context, price *models.CurrentPrice) error {
	args := m.Called(ctx, price)
	return args.Error(0)
}

func (m *MockPriceService) SyncCurrentPrices(ctx context.Context) ([]models.BulkPriceUpdate, error) {
	args := m.Called(ctx)
	// Handle error case first
	if args.Error(1) != nil {
		return nil, args.Error(1)
	}
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).([]models.BulkPriceUpdate), args.Error(1)
}

func (m *MockPriceService) RunMaintenance(ctx context.Context) error {
	args := m.Called(ctx)
	return args.Error(0)
}

func (m *MockPriceService) EnsureFuturePartitions(ctx context.Context, daysAhead int) error {
	args := m.Called(ctx, daysAhead)
	return args.Error(0)
}

func TestMain(m *testing.M) {
	// This function is intentionally left empty.
	// Its purpose is to provide a central place for package-level test setup
	// and to hold the mock definitions that are shared across multiple test files.
	m.Run()
}
