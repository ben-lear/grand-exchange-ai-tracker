package unit

import (
	"context"
	"encoding/json"
	"net/http/httptest"
	"testing"

	"github.com/gofiber/fiber/v2"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
	"go.uber.org/zap"

	"github.com/guavi/osrs-ge-tracker/internal/handlers"
	"github.com/guavi/osrs-ge-tracker/internal/models"
)

// MockItemService is a mock implementation of ItemService
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

func TestItemHandler_ListItems(t *testing.T) {
	logger := zap.NewNop().Sugar()
	mockService := new(MockItemService)
	handler := handlers.NewItemHandler(mockService, logger)

	// Setup mock response
	items := []models.Item{
		{ItemID: 1, Name: "Test Item 1"},
		{ItemID: 2, Name: "Test Item 2"},
	}
	mockService.On("ListItems", mock.Anything, mock.AnythingOfType("models.ItemListParams")).
		Return(items, int64(2), nil)

	// Setup Fiber app
	app := fiber.New()
	app.Get("/items", handler.ListItems)

	// Create request
	req := httptest.NewRequest("GET", "/items?page=1&limit=50", nil)
	resp, err := app.Test(req)

	// Assertions
	assert.NoError(t, err)
	assert.Equal(t, 200, resp.StatusCode)

	// Parse response
	var result map[string]interface{}
	json.NewDecoder(resp.Body).Decode(&result)
	
	data := result["data"].([]interface{})
	assert.Len(t, data, 2)
	
	mockService.AssertExpectations(t)
}

func TestItemHandler_GetItemByID(t *testing.T) {
	logger := zap.NewNop().Sugar()
	mockService := new(MockItemService)
	handler := handlers.NewItemHandler(mockService, logger)

	// Setup mock response
	item := &models.ItemWithCurrentPrice{
		Item: models.Item{ItemID: 1, Name: "Test Item"},
	}
	mockService.On("GetItemWithPrice", mock.Anything, 1).Return(item, nil)

	// Setup Fiber app
	app := fiber.New()
	app.Get("/items/:id", handler.GetItemByID)

	// Create request
	req := httptest.NewRequest("GET", "/items/1", nil)
	resp, err := app.Test(req)

	// Assertions
	assert.NoError(t, err)
	assert.Equal(t, 200, resp.StatusCode)

	mockService.AssertExpectations(t)
}

func TestItemHandler_SearchItems(t *testing.T) {
	logger := zap.NewNop().Sugar()
	mockService := new(MockItemService)
	handler := handlers.NewItemHandler(mockService, logger)

	// Setup mock response
	items := []models.Item{
		{ItemID: 1, Name: "Dragon Sword"},
	}
	mockService.On("SearchItems", mock.Anything, mock.AnythingOfType("models.ItemSearchParams")).
		Return(items, nil)

	// Setup Fiber app
	app := fiber.New()
	app.Get("/items/search", handler.SearchItems)

	// Create request
	req := httptest.NewRequest("GET", "/items/search?q=dragon", nil)
	resp, err := app.Test(req)

	// Assertions
	assert.NoError(t, err)
	assert.Equal(t, 200, resp.StatusCode)

	mockService.AssertExpectations(t)
}

func TestItemHandler_SearchItems_MissingQuery(t *testing.T) {
	logger := zap.NewNop().Sugar()
	mockService := new(MockItemService)
	handler := handlers.NewItemHandler(mockService, logger)

	// Setup Fiber app
	app := fiber.New()
	app.Get("/items/search", handler.SearchItems)

	// Create request without query parameter
	req := httptest.NewRequest("GET", "/items/search", nil)
	resp, err := app.Test(req)

	// Assertions
	assert.NoError(t, err)
	assert.Equal(t, 400, resp.StatusCode)
}
