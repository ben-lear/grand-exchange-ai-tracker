//go:build slow
// +build slow

package integration

import (
	"context"
	"encoding/json"
	"io"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/stretchr/testify/require"
	"go.uber.org/zap"

	"github.com/guavi/osrs-ge-tracker/internal/handlers"
	"github.com/guavi/osrs-ge-tracker/internal/models"
	"github.com/guavi/osrs-ge-tracker/internal/repository"
	"github.com/guavi/osrs-ge-tracker/internal/services"
	"github.com/guavi/osrs-ge-tracker/tests/testutil"
)

type stubOSRSClient struct{}

func (s stubOSRSClient) FetchBulkDump() (map[int]models.BulkDumpItem, error) {
	return map[int]models.BulkDumpItem{}, nil
}
func (s stubOSRSClient) FetchLatestPrices(itemIDs []int) (map[int]models.HistoricalDataPoint, error) {
	return map[int]models.HistoricalDataPoint{}, nil
}
func (s stubOSRSClient) FetchHistoricalData(itemID int, period string) ([]models.HistoricalDataPoint, error) {
	return []models.HistoricalDataPoint{}, nil
}
func (s stubOSRSClient) FetchSampleData(itemID int) ([]models.HistoricalDataPoint, error) {
	return []models.HistoricalDataPoint{}, nil
}
func (s stubOSRSClient) FetchAllHistoricalData(itemID int) ([]models.HistoricalDataPoint, error) {
	return []models.HistoricalDataPoint{}, nil
}
func (s stubOSRSClient) FetchItemDetail(itemID int) (*models.ItemDetail, error) { return nil, nil }

func TestPriceHandler_ReadEndpoints_PostgresBacked(t *testing.T) {
	db, release := testutil.SharedPostgres(t)
	t.Cleanup(release)

	logger := zap.NewNop().Sugar()
	ctx := context.Background()

	itemRepo := repository.NewItemRepository(db, logger)
	priceRepo := repository.NewPriceRepository(db, logger)

	// Seed items + prices
	items := []models.Item{{ItemID: 100, Name: "Item 100"}, {ItemID: 200, Name: "Item 200"}}
	for i := range items {
		require.NoError(t, itemRepo.Create(ctx, &items[i]))
	}

	high := int64(1000)
	low := int64(900)
	now := time.Now().UTC()
	require.NoError(t, priceRepo.UpsertCurrentPrice(ctx, &models.CurrentPrice{ItemID: 100, HighPrice: &high, LowPrice: &low, HighPriceTime: &now, LowPriceTime: &now}))
	require.NoError(t, priceRepo.UpsertCurrentPrice(ctx, &models.CurrentPrice{ItemID: 200, HighPrice: &high, LowPrice: &low, HighPriceTime: &now, LowPriceTime: &now}))

	// Seed some history for item 100
	older := time.Now().Add(-48 * time.Hour).UTC()
	newer := time.Now().Add(-2 * time.Hour).UTC()
	require.NoError(t, priceRepo.InsertHistory(ctx, &models.PriceHistory{ItemID: 100, HighPrice: &high, LowPrice: &low, Timestamp: older}))
	require.NoError(t, priceRepo.InsertHistory(ctx, &models.PriceHistory{ItemID: 100, HighPrice: &high, LowPrice: &low, Timestamp: newer}))

	cache := testutil.NewNoopCache()
	priceSvc := services.NewPriceService(priceRepo, itemRepo, cache, stubOSRSClient{}, logger)
	priceHandler := handlers.NewPriceHandler(priceSvc, logger)

	app := fiber.New()
	app.Get("/api/v1/prices/current", priceHandler.GetAllCurrentPrices)
	app.Get("/api/v1/prices/current/batch", priceHandler.GetBatchCurrentPrices)
	app.Get("/api/v1/prices/current/:id", priceHandler.GetCurrentPrice)
	app.Get("/api/v1/prices/history/:id", priceHandler.GetPriceHistory)

	// GET all current prices
	resp, err := app.Test(httptest.NewRequest("GET", "/api/v1/prices/current", nil))
	require.NoError(t, err)
	require.Equal(t, 200, resp.StatusCode)

	var allResp struct {
		Data []models.CurrentPrice `json:"data"`
		Meta struct {
			Count int `json:"count"`
		} `json:"meta"`
	}
	require.NoError(t, json.NewDecoder(resp.Body).Decode(&allResp))
	require.Equal(t, 2, allResp.Meta.Count)
	require.Len(t, allResp.Data, 2)

	// GET current price: invalid id
	resp, err = app.Test(httptest.NewRequest("GET", "/api/v1/prices/current/abc", nil))
	require.NoError(t, err)
	require.Equal(t, 400, resp.StatusCode)

	// GET current price: missing returns 404
	resp, err = app.Test(httptest.NewRequest("GET", "/api/v1/prices/current/999", nil))
	require.NoError(t, err)
	require.Equal(t, 404, resp.StatusCode)

	// GET current price: found
	resp, err = app.Test(httptest.NewRequest("GET", "/api/v1/prices/current/100", nil))
	require.NoError(t, err)
	require.Equal(t, 200, resp.StatusCode)

	// GET batch current prices
	resp, err = app.Test(httptest.NewRequest("GET", "/api/v1/prices/current/batch?ids=100,200", nil))
	require.NoError(t, err)
	require.Equal(t, 200, resp.StatusCode)

	var batchResp struct {
		Data []models.CurrentPrice `json:"data"`
		Meta map[string]int        `json:"meta"`
	}
	require.NoError(t, json.NewDecoder(resp.Body).Decode(&batchResp))
	require.Len(t, batchResp.Data, 2)
	require.Equal(t, 2, batchResp.Meta["requested"])
	require.Equal(t, 2, batchResp.Meta["found"])

	// GET history (24h should include only the recent point)
	resp, err = app.Test(httptest.NewRequest("GET", "/api/v1/prices/history/100?period=24h", nil))
	require.NoError(t, err)
	if resp.StatusCode != 200 {
		b, _ := io.ReadAll(resp.Body)
		require.Failf(t, "unexpected status", "status=%d body=%s", resp.StatusCode, string(b))
	}

	var histResp struct {
		Data []models.PricePoint `json:"data"`
		Meta map[string]any      `json:"meta"`
	}
	require.NoError(t, json.NewDecoder(resp.Body).Decode(&histResp))
	require.Len(t, histResp.Data, 1)
}
