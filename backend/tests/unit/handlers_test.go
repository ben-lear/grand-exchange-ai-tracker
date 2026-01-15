package unit

import (
	"encoding/json"
	"errors"
	"net/http/httptest"
	"testing"

	"github.com/gofiber/fiber/v2"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
	"go.uber.org/zap"

	"github.com/guavi/osrs-ge-tracker/internal/handlers"
	"github.com/guavi/osrs-ge-tracker/internal/models"
)

func TestItemHandler_ListItems(t *testing.T) {
	logger := zap.NewNop().Sugar()
	mockItemService := new(MockItemService)
	mockPriceService := new(MockPriceService)
	handler := handlers.NewItemHandler(mockItemService, mockPriceService, logger)

	// Setup mock response
	items := []models.Item{
		{ItemID: 1, Name: "Test Item 1"},
		{ItemID: 2, Name: "Test Item 2"},
	}
	mockItemService.On("ListItems", mock.Anything, mock.AnythingOfType("models.ItemListParams")).
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

	mockItemService.AssertExpectations(t)
}

func TestItemHandler_ListItems_InvalidPagination(t *testing.T) {
	logger := zap.NewNop().Sugar()
	mockItemService := new(MockItemService)
	mockPriceService := new(MockPriceService)
	handler := handlers.NewItemHandler(mockItemService, mockPriceService, logger)

	app := fiber.New()
	app.Get("/items", handler.ListItems)

	resp, err := app.Test(httptest.NewRequest("GET", "/items?page=0&limit=50", nil))
	assert.NoError(t, err)
	assert.Equal(t, 400, resp.StatusCode)

	var result map[string]any
	_ = json.NewDecoder(resp.Body).Decode(&result)
	assert.Equal(t, "page must be greater than 0", result["error"])

	mockItemService.AssertNotCalled(t, "ListItems", mock.Anything, mock.Anything)
}

func TestItemHandler_ListItems_InvalidSort(t *testing.T) {
	logger := zap.NewNop().Sugar()
	mockItemService := new(MockItemService)
	mockPriceService := new(MockPriceService)
	handler := handlers.NewItemHandler(mockItemService, mockPriceService, logger)

	app := fiber.New()
	app.Get("/items", handler.ListItems)

	resp, err := app.Test(httptest.NewRequest("GET", "/items?sort_by=bad_field", nil))
	assert.NoError(t, err)
	assert.Equal(t, 400, resp.StatusCode)

	var result map[string]any
	_ = json.NewDecoder(resp.Body).Decode(&result)
	assert.Equal(t, "invalid sort_by field", result["error"])

	mockItemService.AssertNotCalled(t, "ListItems", mock.Anything, mock.Anything)
}

func TestItemHandler_ListItems_ServiceError(t *testing.T) {
	logger := zap.NewNop().Sugar()
	mockItemService := new(MockItemService)
	mockPriceService := new(MockPriceService)
	handler := handlers.NewItemHandler(mockItemService, mockPriceService, logger)

	mockItemService.On("ListItems", mock.Anything, mock.AnythingOfType("models.ItemListParams")).
		Return([]models.Item{}, int64(0), errors.New("boom"))

	app := fiber.New()
	app.Get("/items", handler.ListItems)

	resp, err := app.Test(httptest.NewRequest("GET", "/items", nil))
	assert.NoError(t, err)
	assert.Equal(t, 500, resp.StatusCode)

	var result map[string]any
	_ = json.NewDecoder(resp.Body).Decode(&result)
	assert.Equal(t, "failed to fetch items", result["error"])

	mockItemService.AssertExpectations(t)
}

func TestItemHandler_GetItemByID(t *testing.T) {
	logger := zap.NewNop().Sugar()
	mockItemService := new(MockItemService)
	mockPriceService := new(MockPriceService)
	handler := handlers.NewItemHandler(mockItemService, mockPriceService, logger)

	// Setup mock response
	item := &models.Item{ItemID: 1, Name: "Test Item"}
	highPrice := int64(100)
	lowPrice := int64(90)
	price := &models.CurrentPrice{ItemID: 1, HighPrice: &highPrice, LowPrice: &lowPrice}
	mockItemService.On("GetItemByItemID", mock.Anything, 1).Return(item, nil)
	mockPriceService.On("GetCurrentPrice", mock.Anything, 1).Return(price, nil)

	// Setup Fiber app
	app := fiber.New()
	app.Get("/items/:id", handler.GetItemByID)

	// Create request
	req := httptest.NewRequest("GET", "/items/1", nil)
	resp, err := app.Test(req)

	// Assertions
	assert.NoError(t, err)
	assert.Equal(t, 200, resp.StatusCode)

	mockItemService.AssertExpectations(t)
	mockPriceService.AssertExpectations(t)
}

func TestItemHandler_GetItemByID_InvalidID(t *testing.T) {
	logger := zap.NewNop().Sugar()
	mockItemService := new(MockItemService)
	mockPriceService := new(MockPriceService)
	handler := handlers.NewItemHandler(mockItemService, mockPriceService, logger)

	app := fiber.New()
	app.Get("/items/:id", handler.GetItemByID)

	resp, err := app.Test(httptest.NewRequest("GET", "/items/abc", nil))
	assert.NoError(t, err)
	assert.Equal(t, 400, resp.StatusCode)

	var result map[string]any
	_ = json.NewDecoder(resp.Body).Decode(&result)
	assert.Equal(t, "invalid item ID", result["error"])

	mockItemService.AssertNotCalled(t, "GetItemByItemID", mock.Anything, mock.Anything)
}

func TestItemHandler_GetItemByID_NotFound(t *testing.T) {
	logger := zap.NewNop().Sugar()
	mockItemService := new(MockItemService)
	mockPriceService := new(MockPriceService)
	handler := handlers.NewItemHandler(mockItemService, mockPriceService, logger)

	mockItemService.On("GetItemByItemID", mock.Anything, 123).Return((*models.Item)(nil), errors.New("not found"))

	app := fiber.New()
	app.Get("/items/:id", handler.GetItemByID)

	resp, err := app.Test(httptest.NewRequest("GET", "/items/123", nil))
	assert.NoError(t, err)
	assert.Equal(t, 404, resp.StatusCode)

	var result map[string]any
	_ = json.NewDecoder(resp.Body).Decode(&result)
	assert.Equal(t, "item not found", result["error"])

	mockItemService.AssertExpectations(t)
}

func TestItemHandler_SearchItems(t *testing.T) {
	logger := zap.NewNop().Sugar()
	mockItemService := new(MockItemService)
	mockPriceService := new(MockPriceService)
	handler := handlers.NewItemHandler(mockItemService, mockPriceService, logger)

	// Setup mock response
	items := []models.Item{
		{ItemID: 1, Name: "Dragon Sword"},
	}
	mockItemService.On("SearchItems", mock.Anything, mock.AnythingOfType("models.ItemSearchParams")).
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

	mockItemService.AssertExpectations(t)
}

func TestItemHandler_SearchItems_MissingQuery(t *testing.T) {
	logger := zap.NewNop().Sugar()
	mockItemService := new(MockItemService)
	mockPriceService := new(MockPriceService)
	handler := handlers.NewItemHandler(mockItemService, mockPriceService, logger)

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

func TestItemHandler_SearchItems_InvalidLimit(t *testing.T) {
	logger := zap.NewNop().Sugar()
	mockItemService := new(MockItemService)
	mockPriceService := new(MockPriceService)
	handler := handlers.NewItemHandler(mockItemService, mockPriceService, logger)

	app := fiber.New()
	app.Get("/items/search", handler.SearchItems)

	resp, err := app.Test(httptest.NewRequest("GET", "/items/search?q=dragon&limit=999", nil))
	assert.NoError(t, err)
	assert.Equal(t, 400, resp.StatusCode)

	var result map[string]any
	_ = json.NewDecoder(resp.Body).Decode(&result)
	assert.Equal(t, "limit must be between 1 and 200", result["error"])

	mockItemService.AssertNotCalled(t, "SearchItems", mock.Anything, mock.Anything)
}

func TestItemHandler_SearchItems_ServiceError(t *testing.T) {
	logger := zap.NewNop().Sugar()
	mockItemService := new(MockItemService)
	mockPriceService := new(MockPriceService)
	handler := handlers.NewItemHandler(mockItemService, mockPriceService, logger)

	mockItemService.On("SearchItems", mock.Anything, mock.AnythingOfType("models.ItemSearchParams")).
		Return([]models.Item{}, errors.New("boom"))

	app := fiber.New()
	app.Get("/items/search", handler.SearchItems)

	resp, err := app.Test(httptest.NewRequest("GET", "/items/search?q=dragon", nil))
	assert.NoError(t, err)
	assert.Equal(t, 500, resp.StatusCode)

	var result map[string]any
	_ = json.NewDecoder(resp.Body).Decode(&result)
	assert.Equal(t, "failed to search items", result["error"])

	mockItemService.AssertExpectations(t)
}

func TestItemHandler_GetItemCount_OK(t *testing.T) {
	logger := zap.NewNop().Sugar()
	mockItemService := new(MockItemService)
	mockPriceService := new(MockPriceService)
	handler := handlers.NewItemHandler(mockItemService, mockPriceService, logger)

	mockItemService.On("GetItemCount", mock.Anything, (*bool)(nil)).Return(int64(123), nil)

	app := fiber.New()
	app.Get("/items/count", handler.GetItemCount)

	resp, err := app.Test(httptest.NewRequest("GET", "/items/count", nil))
	assert.NoError(t, err)
	assert.Equal(t, 200, resp.StatusCode)

	var result map[string]any
	_ = json.NewDecoder(resp.Body).Decode(&result)
	assert.Equal(t, float64(123), result["count"])

	mockItemService.AssertExpectations(t)
}

func TestItemHandler_GetItemCount_ServiceError(t *testing.T) {
	logger := zap.NewNop().Sugar()
	mockItemService := new(MockItemService)
	mockPriceService := new(MockPriceService)
	handler := handlers.NewItemHandler(mockItemService, mockPriceService, logger)

	mockItemService.On("GetItemCount", mock.Anything, (*bool)(nil)).Return(int64(0), errors.New("boom"))

	app := fiber.New()
	app.Get("/items/count", handler.GetItemCount)

	resp, err := app.Test(httptest.NewRequest("GET", "/items/count", nil))
	assert.NoError(t, err)
	assert.Equal(t, 500, resp.StatusCode)

	var result map[string]any
	_ = json.NewDecoder(resp.Body).Decode(&result)
	assert.Equal(t, "failed to get item count", result["error"])

	mockItemService.AssertExpectations(t)
}
