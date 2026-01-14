package unit

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
	"github.com/stretchr/testify/require"
	"go.uber.org/zap"

	"github.com/guavi/osrs-ge-tracker/internal/handlers"
	"github.com/guavi/osrs-ge-tracker/internal/models"
)

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

func (m *MockPriceService) SyncCurrentPrices(ctx context.Context) error {
	args := m.Called(ctx)
	return args.Error(0)
}

func (m *MockPriceService) SyncBulkPrices(ctx context.Context) error {
	args := m.Called(ctx)
	return args.Error(0)
}

func (m *MockPriceService) SyncHistoricalPrices(ctx context.Context, itemID int, fullHistory bool) error {
	args := m.Called(ctx, itemID, fullHistory)
	return args.Error(0)
}

func TestPriceHandler_GetAllCurrentPrices_OK(t *testing.T) {
	logger := zap.NewNop().Sugar()
	mockSvc := new(MockPriceService)
	h := handlers.NewPriceHandler(mockSvc, logger)

	high := int64(1000)
	low := int64(900)
	now := time.Now().UTC()

	mockSvc.On("GetAllCurrentPrices", mock.Anything).
		Return([]models.CurrentPrice{
			{ItemID: 1, HighPrice: &high, LowPrice: &low, HighPriceTime: &now, LowPriceTime: &now},
			{ItemID: 2, HighPrice: &high, LowPrice: &low, HighPriceTime: &now, LowPriceTime: &now},
		}, nil)

	app := fiber.New()
	app.Get("/prices/current", h.GetAllCurrentPrices)

	resp, err := app.Test(httptest.NewRequest("GET", "/prices/current", nil))
	require.NoError(t, err)
	require.Equal(t, 200, resp.StatusCode)

	var payload map[string]any
	require.NoError(t, json.NewDecoder(resp.Body).Decode(&payload))

	data, ok := payload["data"].([]any)
	require.True(t, ok)
	require.Len(t, data, 2)

	meta, ok := payload["meta"].(map[string]any)
	require.True(t, ok)
	require.Equal(t, float64(2), meta["count"])

	mockSvc.AssertExpectations(t)
}

func TestPriceHandler_GetAllCurrentPrices_ServiceError(t *testing.T) {
	logger := zap.NewNop().Sugar()
	mockSvc := new(MockPriceService)
	h := handlers.NewPriceHandler(mockSvc, logger)

	mockSvc.On("GetAllCurrentPrices", mock.Anything).
		Return([]models.CurrentPrice{}, errors.New("boom"))

	app := fiber.New()
	app.Get("/prices/current", h.GetAllCurrentPrices)

	resp, err := app.Test(httptest.NewRequest("GET", "/prices/current", nil))
	require.NoError(t, err)
	require.Equal(t, 500, resp.StatusCode)

	mockSvc.AssertExpectations(t)
}

func TestPriceHandler_GetCurrentPrice_InvalidID(t *testing.T) {
	logger := zap.NewNop().Sugar()
	mockSvc := new(MockPriceService)
	h := handlers.NewPriceHandler(mockSvc, logger)

	app := fiber.New()
	app.Get("/prices/current/:id", h.GetCurrentPrice)

	resp, err := app.Test(httptest.NewRequest("GET", "/prices/current/abc", nil))
	require.NoError(t, err)
	require.Equal(t, 400, resp.StatusCode)

	mockSvc.AssertNotCalled(t, "GetCurrentPrice", mock.Anything, mock.Anything)
}

func TestPriceHandler_GetCurrentPrice_NotFound_NilPrice(t *testing.T) {
	logger := zap.NewNop().Sugar()
	mockSvc := new(MockPriceService)
	h := handlers.NewPriceHandler(mockSvc, logger)

	mockSvc.On("GetCurrentPrice", mock.Anything, 123).Return((*models.CurrentPrice)(nil), nil)

	app := fiber.New()
	app.Get("/prices/current/:id", h.GetCurrentPrice)

	resp, err := app.Test(httptest.NewRequest("GET", "/prices/current/123", nil))
	require.NoError(t, err)
	require.Equal(t, 404, resp.StatusCode)

	mockSvc.AssertExpectations(t)
}

func TestPriceHandler_GetCurrentPrice_NotFound_Error(t *testing.T) {
	logger := zap.NewNop().Sugar()
	mockSvc := new(MockPriceService)
	h := handlers.NewPriceHandler(mockSvc, logger)

	mockSvc.On("GetCurrentPrice", mock.Anything, 123).Return((*models.CurrentPrice)(nil), errors.New("not found"))

	app := fiber.New()
	app.Get("/prices/current/:id", h.GetCurrentPrice)

	resp, err := app.Test(httptest.NewRequest("GET", "/prices/current/123", nil))
	require.NoError(t, err)
	require.Equal(t, 404, resp.StatusCode)

	mockSvc.AssertExpectations(t)
}

func TestPriceHandler_GetCurrentPrice_OK(t *testing.T) {
	logger := zap.NewNop().Sugar()
	mockSvc := new(MockPriceService)
	h := handlers.NewPriceHandler(mockSvc, logger)

	high := int64(1000)
	low := int64(900)
	now := time.Now().UTC()

	price := &models.CurrentPrice{ItemID: 5, HighPrice: &high, LowPrice: &low, HighPriceTime: &now, LowPriceTime: &now}
	mockSvc.On("GetCurrentPrice", mock.Anything, 5).Return(price, nil)

	app := fiber.New()
	app.Get("/prices/current/:id", h.GetCurrentPrice)

	resp, err := app.Test(httptest.NewRequest("GET", "/prices/current/5", nil))
	require.NoError(t, err)
	require.Equal(t, 200, resp.StatusCode)

	var payload map[string]any
	require.NoError(t, json.NewDecoder(resp.Body).Decode(&payload))
	require.NotNil(t, payload["data"])

	mockSvc.AssertExpectations(t)
}

func TestPriceHandler_GetBatchCurrentPrices_MissingIDs(t *testing.T) {
	logger := zap.NewNop().Sugar()
	mockSvc := new(MockPriceService)
	h := handlers.NewPriceHandler(mockSvc, logger)

	app := fiber.New()
	app.Get("/prices/current/batch", h.GetBatchCurrentPrices)

	resp, err := app.Test(httptest.NewRequest("GET", "/prices/current/batch", nil))
	require.NoError(t, err)
	require.Equal(t, 400, resp.StatusCode)

	mockSvc.AssertNotCalled(t, "GetBatchCurrentPrices", mock.Anything, mock.Anything)
}

func TestPriceHandler_GetBatchCurrentPrices_TooManyIDs(t *testing.T) {
	logger := zap.NewNop().Sugar()
	mockSvc := new(MockPriceService)
	h := handlers.NewPriceHandler(mockSvc, logger)

	ids := make([]string, 101)
	for i := 0; i < len(ids); i++ {
		ids[i] = fmt.Sprintf("%d", i+1)
	}

	app := fiber.New()
	app.Get("/prices/current/batch", h.GetBatchCurrentPrices)

	resp, err := app.Test(httptest.NewRequest("GET", "/prices/current/batch?ids="+strings.Join(ids, ","), nil))
	require.NoError(t, err)
	require.Equal(t, 400, resp.StatusCode)

	mockSvc.AssertNotCalled(t, "GetBatchCurrentPrices", mock.Anything, mock.Anything)
}

func TestPriceHandler_GetBatchCurrentPrices_InvalidID(t *testing.T) {
	logger := zap.NewNop().Sugar()
	mockSvc := new(MockPriceService)
	h := handlers.NewPriceHandler(mockSvc, logger)

	app := fiber.New()
	app.Get("/prices/current/batch", h.GetBatchCurrentPrices)

	resp, err := app.Test(httptest.NewRequest("GET", "/prices/current/batch?ids=1,abc", nil))
	require.NoError(t, err)
	require.Equal(t, 400, resp.StatusCode)

	mockSvc.AssertNotCalled(t, "GetBatchCurrentPrices", mock.Anything, mock.Anything)
}

func TestPriceHandler_GetBatchCurrentPrices_OK(t *testing.T) {
	logger := zap.NewNop().Sugar()
	mockSvc := new(MockPriceService)
	h := handlers.NewPriceHandler(mockSvc, logger)

	high := int64(1000)
	low := int64(900)
	now := time.Now().UTC()

	mockSvc.On("GetBatchCurrentPrices", mock.Anything, []int{10, 20}).
		Return([]models.CurrentPrice{{ItemID: 10, HighPrice: &high, LowPrice: &low, HighPriceTime: &now, LowPriceTime: &now}}, nil)

	app := fiber.New()
	app.Get("/prices/current/batch", h.GetBatchCurrentPrices)

	resp, err := app.Test(httptest.NewRequest("GET", "/prices/current/batch?ids=10,20", nil))
	require.NoError(t, err)
	require.Equal(t, 200, resp.StatusCode)

	var payload map[string]any
	require.NoError(t, json.NewDecoder(resp.Body).Decode(&payload))

	meta := payload["meta"].(map[string]any)
	assert.Equal(t, float64(2), meta["requested"])
	assert.Equal(t, float64(1), meta["found"])

	mockSvc.AssertExpectations(t)
}

func TestPriceHandler_GetBatchCurrentPrices_ServiceError(t *testing.T) {
	logger := zap.NewNop().Sugar()
	mockSvc := new(MockPriceService)
	h := handlers.NewPriceHandler(mockSvc, logger)

	mockSvc.On("GetBatchCurrentPrices", mock.Anything, []int{10, 20}).
		Return([]models.CurrentPrice{}, errors.New("boom"))

	app := fiber.New()
	app.Get("/prices/current/batch", h.GetBatchCurrentPrices)

	resp, err := app.Test(httptest.NewRequest("GET", "/prices/current/batch?ids=10,20", nil))
	require.NoError(t, err)
	require.Equal(t, 500, resp.StatusCode)

	mockSvc.AssertExpectations(t)
}

func TestPriceHandler_GetPriceHistory_InvalidID(t *testing.T) {
	logger := zap.NewNop().Sugar()
	mockSvc := new(MockPriceService)
	h := handlers.NewPriceHandler(mockSvc, logger)

	app := fiber.New()
	app.Get("/prices/history/:id", h.GetPriceHistory)

	resp, err := app.Test(httptest.NewRequest("GET", "/prices/history/abc", nil))
	require.NoError(t, err)
	require.Equal(t, 400, resp.StatusCode)

	mockSvc.AssertNotCalled(t, "GetPriceHistory", mock.Anything, mock.Anything)
}

func TestPriceHandler_GetPriceHistory_InvalidPeriod(t *testing.T) {
	logger := zap.NewNop().Sugar()
	mockSvc := new(MockPriceService)
	h := handlers.NewPriceHandler(mockSvc, logger)

	app := fiber.New()
	app.Get("/prices/history/:id", h.GetPriceHistory)

	resp, err := app.Test(httptest.NewRequest("GET", "/prices/history/1?period=2w", nil))
	require.NoError(t, err)
	require.Equal(t, 400, resp.StatusCode)

	mockSvc.AssertNotCalled(t, "GetPriceHistory", mock.Anything, mock.Anything)
}

func TestPriceHandler_GetPriceHistory_InvalidSample(t *testing.T) {
	logger := zap.NewNop().Sugar()
	mockSvc := new(MockPriceService)
	h := handlers.NewPriceHandler(mockSvc, logger)

	app := fiber.New()
	app.Get("/prices/history/:id", h.GetPriceHistory)

	resp, err := app.Test(httptest.NewRequest("GET", "/prices/history/1?period=7d&sample=5", nil))
	require.NoError(t, err)
	require.Equal(t, 400, resp.StatusCode)

	mockSvc.AssertNotCalled(t, "GetPriceHistory", mock.Anything, mock.Anything)
}

func TestPriceHandler_GetPriceHistory_OK_WithSampledMeta(t *testing.T) {
	logger := zap.NewNop().Sugar()
	mockSvc := new(MockPriceService)
	h := handlers.NewPriceHandler(mockSvc, logger)

	maxPoints := 10
	first := time.Now().Add(-24 * time.Hour).UTC()
	last := time.Now().UTC()
	respObj := &models.PriceHistoryResponse{
		ItemID:    77,
		Period:    "7d",
		Data:      make([]models.PricePoint, maxPoints),
		Count:     100, // indicates it was sampled
		FirstDate: &first,
		LastDate:  &last,
	}

	mockSvc.On("GetPriceHistory", mock.Anything, mock.MatchedBy(func(p models.PriceHistoryParams) bool {
		return p.ItemID == 77 && p.Period == models.Period7Days && p.MaxPoints != nil && *p.MaxPoints == maxPoints
	})).Return(respObj, nil)

	app := fiber.New()
	app.Get("/prices/history/:id", h.GetPriceHistory)

	resp, err := app.Test(httptest.NewRequest("GET", "/prices/history/77?period=7d&sample=10", nil))
	require.NoError(t, err)
	require.Equal(t, 200, resp.StatusCode)

	var payload map[string]any
	require.NoError(t, json.NewDecoder(resp.Body).Decode(&payload))

	meta := payload["meta"].(map[string]any)
	assert.Equal(t, float64(77), meta["item_id"])
	assert.Equal(t, "7d", meta["period"])
	assert.Equal(t, true, meta["sampled"])

	mockSvc.AssertExpectations(t)
}

func TestPriceHandler_GetPriceHistory_ServiceError(t *testing.T) {
	logger := zap.NewNop().Sugar()
	mockSvc := new(MockPriceService)
	h := handlers.NewPriceHandler(mockSvc, logger)

	mockSvc.On("GetPriceHistory", mock.Anything, mock.MatchedBy(func(p models.PriceHistoryParams) bool {
		return p.ItemID == 77 && p.Period == models.Period7Days
	})).Return((*models.PriceHistoryResponse)(nil), errors.New("boom"))

	app := fiber.New()
	app.Get("/prices/history/:id", h.GetPriceHistory)

	resp, err := app.Test(httptest.NewRequest("GET", "/prices/history/77?period=7d", nil))
	require.NoError(t, err)
	require.Equal(t, 500, resp.StatusCode)

	mockSvc.AssertExpectations(t)
}

func TestPriceHandler_SyncCurrentPrices_OK(t *testing.T) {
	logger := zap.NewNop().Sugar()
	mockSvc := new(MockPriceService)
	h := handlers.NewPriceHandler(mockSvc, logger)

	mockSvc.On("SyncCurrentPrices", mock.Anything).Return(nil)

	app := fiber.New()
	app.Post("/prices/sync", h.SyncCurrentPrices)

	resp, err := app.Test(httptest.NewRequest("POST", "/prices/sync", nil))
	require.NoError(t, err)
	require.Equal(t, 200, resp.StatusCode)

	mockSvc.AssertExpectations(t)
}

func TestPriceHandler_SyncCurrentPrices_ServiceError(t *testing.T) {
	logger := zap.NewNop().Sugar()
	mockSvc := new(MockPriceService)
	h := handlers.NewPriceHandler(mockSvc, logger)

	mockSvc.On("SyncCurrentPrices", mock.Anything).Return(errors.New("boom"))

	app := fiber.New()
	app.Post("/prices/sync", h.SyncCurrentPrices)

	resp, err := app.Test(httptest.NewRequest("POST", "/prices/sync", nil))
	require.NoError(t, err)
	require.Equal(t, 500, resp.StatusCode)

	mockSvc.AssertExpectations(t)
}

func TestPriceHandler_SyncHistoricalPrices_InvalidID(t *testing.T) {
	logger := zap.NewNop().Sugar()
	mockSvc := new(MockPriceService)
	h := handlers.NewPriceHandler(mockSvc, logger)

	app := fiber.New()
	app.Post("/prices/sync/history/:id", h.SyncHistoricalPrices)

	resp, err := app.Test(httptest.NewRequest("POST", "/prices/sync/history/abc", nil))
	require.NoError(t, err)
	require.Equal(t, 400, resp.StatusCode)

	mockSvc.AssertNotCalled(t, "SyncHistoricalPrices", mock.Anything, mock.Anything, mock.Anything)
}

func TestPriceHandler_SyncHistoricalPrices_OK_WithFull(t *testing.T) {
	logger := zap.NewNop().Sugar()
	mockSvc := new(MockPriceService)
	h := handlers.NewPriceHandler(mockSvc, logger)

	mockSvc.On("SyncHistoricalPrices", mock.Anything, 50, true).Return(nil)

	app := fiber.New()
	app.Post("/prices/sync/history/:id", h.SyncHistoricalPrices)

	resp, err := app.Test(httptest.NewRequest("POST", "/prices/sync/history/50?full=true", nil))
	require.NoError(t, err)
	require.Equal(t, 200, resp.StatusCode)

	bodyBytes, _ := io.ReadAll(resp.Body)
	assert.Contains(t, string(bodyBytes), "historical prices synced successfully")

	mockSvc.AssertExpectations(t)
}

func TestPriceHandler_SyncHistoricalPrices_ServiceError(t *testing.T) {
	logger := zap.NewNop().Sugar()
	mockSvc := new(MockPriceService)
	h := handlers.NewPriceHandler(mockSvc, logger)

	mockSvc.On("SyncHistoricalPrices", mock.Anything, 50, false).Return(errors.New("boom"))

	app := fiber.New()
	app.Post("/prices/sync/history/:id", h.SyncHistoricalPrices)

	resp, err := app.Test(httptest.NewRequest("POST", "/prices/sync/history/50", nil))
	require.NoError(t, err)
	require.Equal(t, 500, resp.StatusCode)

	mockSvc.AssertExpectations(t)
}
