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
	// UpsertCurrentPrice creates PriceLatest snapshots in price_latest table (partitioned by day)
	require.NoError(t, priceRepo.UpsertCurrentPrice(ctx, &models.CurrentPrice{ItemID: 100, HighPrice: &high, LowPrice: &low, HighPriceTime: &now, LowPriceTime: &now}))
	require.NoError(t, priceRepo.UpsertCurrentPrice(ctx, &models.CurrentPrice{ItemID: 200, HighPrice: &high, LowPrice: &low, HighPriceTime: &now, LowPriceTime: &now}))

	// Seed timeseries data for item 100 to test GetPriceHistory endpoint
	// Insert daily bucketed data for last 3 days
	dailyPoints := []models.PriceTimeseriesDaily{
		{ItemID: 100, Day: now.Add(-48 * time.Hour).Truncate(24 * time.Hour), AvgHighPrice: &high, AvgLowPrice: &low, HighPriceVolume: 100, LowPriceVolume: 90},
		{ItemID: 100, Day: now.Add(-24 * time.Hour).Truncate(24 * time.Hour), AvgHighPrice: &high, AvgLowPrice: &low, HighPriceVolume: 110, LowPriceVolume: 95},
		{ItemID: 100, Day: now.Truncate(24 * time.Hour), AvgHighPrice: &high, AvgLowPrice: &low, HighPriceVolume: 120, LowPriceVolume: 100},
	}
	require.NoError(t, priceRepo.InsertDailyPoints(ctx, dailyPoints))

	cache := testutil.NewNoopCache()
	priceSvc := services.NewPriceService(priceRepo, itemRepo, cache, "", logger)
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

	// GET history (7d should include the 3 daily points we seeded)
	resp, err = app.Test(httptest.NewRequest("GET", "/api/v1/prices/history/100?period=7d", nil))
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
	require.GreaterOrEqual(t, len(histResp.Data), 3, "Should have at least 3 daily points")
}
