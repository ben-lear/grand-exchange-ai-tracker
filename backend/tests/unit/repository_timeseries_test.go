//go:build slow
// +build slow

package unit

import (
	"context"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"go.uber.org/zap"

	"github.com/guavi/osrs-ge-tracker/internal/models"
	"github.com/guavi/osrs-ge-tracker/internal/repository"
)

// ========== InsertTimeseriesPoints Tests ==========

func TestPriceRepository_InsertTimeseriesPoints_5m(t *testing.T) {
	dbClient := setupTestDB(t)
	logger, _ := zap.NewDevelopment()
	priceRepo := repository.NewPriceRepository(dbClient, logger.Sugar())
	itemRepo := repository.NewItemRepository(dbClient, logger.Sugar())

	ctx := context.Background()

	// Create item
	item := &models.Item{ItemID: 100, Name: "Test Item", Members: false}
	require.NoError(t, itemRepo.Create(ctx, item))

	// Insert 5m timeseries points
	high := int64(1000)
	low := int64(900)
	now := time.Now().UTC().Truncate(5 * time.Minute)

	points := []models.PriceTimeseriesPoint{
		{
			ItemID:          100,
			Timestamp:       now,
			AvgHighPrice:    &high,
			AvgLowPrice:     &low,
			HighPriceVolume: 100,
			LowPriceVolume:  90,
		},
		{
			ItemID:          100,
			Timestamp:       now.Add(-5 * time.Minute),
			AvgHighPrice:    &high,
			AvgLowPrice:     &low,
			HighPriceVolume: 110,
			LowPriceVolume:  95,
		},
	}

	err := priceRepo.InsertTimeseriesPoints(ctx, "5m", points)
	require.NoError(t, err)

	// Verify insertion
	params := models.PriceHistoryParams{
		ItemID: 100,
		Period: models.PeriodAll,
	}
	retrieved, err := priceRepo.GetTimeseriesPoints(ctx, 100, "5m", params)
	require.NoError(t, err)
	assert.Len(t, retrieved, 2)
	assert.Equal(t, int64(1000), *retrieved[0].AvgHighPrice)
}

func TestPriceRepository_InsertTimeseriesPoints_1h(t *testing.T) {
	dbClient := setupTestDB(t)
	logger, _ := zap.NewDevelopment()
	priceRepo := repository.NewPriceRepository(dbClient, logger.Sugar())
	itemRepo := repository.NewItemRepository(dbClient, logger.Sugar())

	ctx := context.Background()

	// Create item
	item := &models.Item{ItemID: 101, Name: "Test Item 1h", Members: false}
	require.NoError(t, itemRepo.Create(ctx, item))

	// Insert 1h timeseries points
	high := int64(2000)
	low := int64(1900)
	now := time.Now().UTC().Truncate(time.Hour)

	points := []models.PriceTimeseriesPoint{
		{
			ItemID:          101,
			Timestamp:       now,
			AvgHighPrice:    &high,
			AvgLowPrice:     &low,
			HighPriceVolume: 200,
			LowPriceVolume:  180,
		},
	}

	err := priceRepo.InsertTimeseriesPoints(ctx, "1h", points)
	require.NoError(t, err)

	// Verify
	params := models.PriceHistoryParams{ItemID: 101, Period: models.PeriodAll}
	retrieved, err := priceRepo.GetTimeseriesPoints(ctx, 101, "1h", params)
	require.NoError(t, err)
	assert.Len(t, retrieved, 1)
	assert.Equal(t, int64(2000), *retrieved[0].AvgHighPrice)
}

func TestPriceRepository_InsertTimeseriesPoints_6h(t *testing.T) {
	dbClient := setupTestDB(t)
	logger, _ := zap.NewDevelopment()
	priceRepo := repository.NewPriceRepository(dbClient, logger.Sugar())
	itemRepo := repository.NewItemRepository(dbClient, logger.Sugar())

	ctx := context.Background()

	item := &models.Item{ItemID: 102, Name: "Test Item 6h", Members: false}
	require.NoError(t, itemRepo.Create(ctx, item))

	high := int64(3000)
	low := int64(2900)
	now := time.Now().UTC().Truncate(6 * time.Hour)

	points := []models.PriceTimeseriesPoint{
		{ItemID: 102, Timestamp: now, AvgHighPrice: &high, AvgLowPrice: &low, HighPriceVolume: 300, LowPriceVolume: 270},
	}

	err := priceRepo.InsertTimeseriesPoints(ctx, "6h", points)
	require.NoError(t, err)

	params := models.PriceHistoryParams{ItemID: 102, Period: models.PeriodAll}
	retrieved, err := priceRepo.GetTimeseriesPoints(ctx, 102, "6h", params)
	require.NoError(t, err)
	assert.Len(t, retrieved, 1)
}

func TestPriceRepository_InsertTimeseriesPoints_24h(t *testing.T) {
	dbClient := setupTestDB(t)
	logger, _ := zap.NewDevelopment()
	priceRepo := repository.NewPriceRepository(dbClient, logger.Sugar())
	itemRepo := repository.NewItemRepository(dbClient, logger.Sugar())

	ctx := context.Background()

	item := &models.Item{ItemID: 103, Name: "Test Item 24h", Members: false}
	require.NoError(t, itemRepo.Create(ctx, item))

	high := int64(4000)
	low := int64(3900)
	now := time.Now().UTC().Truncate(24 * time.Hour)

	points := []models.PriceTimeseriesPoint{
		{ItemID: 103, Timestamp: now, AvgHighPrice: &high, AvgLowPrice: &low, HighPriceVolume: 400, LowPriceVolume: 360},
	}

	err := priceRepo.InsertTimeseriesPoints(ctx, "24h", points)
	require.NoError(t, err)

	params := models.PriceHistoryParams{ItemID: 103, Period: models.PeriodAll}
	retrieved, err := priceRepo.GetTimeseriesPoints(ctx, 103, "24h", params)
	require.NoError(t, err)
	assert.Len(t, retrieved, 1)
}

func TestPriceRepository_InsertTimeseriesPoints_InvalidTimestep(t *testing.T) {
	dbClient := setupTestDB(t)
	logger, _ := zap.NewDevelopment()
	priceRepo := repository.NewPriceRepository(dbClient, logger.Sugar())

	ctx := context.Background()

	high := int64(1000)
	low := int64(900)
	now := time.Now().UTC()

	points := []models.PriceTimeseriesPoint{
		{ItemID: 1, Timestamp: now, AvgHighPrice: &high, AvgLowPrice: &low},
	}

	// Should error with invalid timestep
	err := priceRepo.InsertTimeseriesPoints(ctx, "invalid", points)
	require.Error(t, err)
	assert.Contains(t, err.Error(), "invalid timestep")
}

func TestPriceRepository_InsertTimeseriesPoints_EmptySlice(t *testing.T) {
	dbClient := setupTestDB(t)
	logger, _ := zap.NewDevelopment()
	priceRepo := repository.NewPriceRepository(dbClient, logger.Sugar())

	ctx := context.Background()

	// Empty slice should not error
	err := priceRepo.InsertTimeseriesPoints(ctx, "5m", []models.PriceTimeseriesPoint{})
	assert.NoError(t, err)
}

func TestPriceRepository_InsertTimeseriesPoints_Conflict(t *testing.T) {
	dbClient := setupTestDB(t)
	logger, _ := zap.NewDevelopment()
	priceRepo := repository.NewPriceRepository(dbClient, logger.Sugar())
	itemRepo := repository.NewItemRepository(dbClient, logger.Sugar())

	ctx := context.Background()

	item := &models.Item{ItemID: 104, Name: "Conflict Test", Members: false}
	require.NoError(t, itemRepo.Create(ctx, item))

	high := int64(1000)
	low := int64(900)
	now := time.Now().UTC().Truncate(5 * time.Minute)

	points := []models.PriceTimeseriesPoint{
		{ItemID: 104, Timestamp: now, AvgHighPrice: &high, AvgLowPrice: &low, HighPriceVolume: 100, LowPriceVolume: 90},
	}

	// Insert first time
	err := priceRepo.InsertTimeseriesPoints(ctx, "5m", points)
	require.NoError(t, err)

	// Insert again with different values - should be ignored (ON CONFLICT DO NOTHING)
	highNew := int64(2000)
	lowNew := int64(1900)
	pointsNew := []models.PriceTimeseriesPoint{
		{ItemID: 104, Timestamp: now, AvgHighPrice: &highNew, AvgLowPrice: &lowNew, HighPriceVolume: 200, LowPriceVolume: 180},
	}

	err = priceRepo.InsertTimeseriesPoints(ctx, "5m", pointsNew)
	require.NoError(t, err)

	// Verify original values remain (conflict was ignored)
	params := models.PriceHistoryParams{ItemID: 104, Period: models.PeriodAll}
	retrieved, err := priceRepo.GetTimeseriesPoints(ctx, 104, "5m", params)
	require.NoError(t, err)
	require.Len(t, retrieved, 1)
	assert.Equal(t, int64(1000), *retrieved[0].AvgHighPrice, "ON CONFLICT DO NOTHING should preserve original value")
}

// ========== GetTimeseriesPoints Tests ==========

func TestPriceRepository_GetTimeseriesPoints_WithPeriodFilter(t *testing.T) {
	dbClient := setupTestDB(t)
	logger, _ := zap.NewDevelopment()
	priceRepo := repository.NewPriceRepository(dbClient, logger.Sugar())
	itemRepo := repository.NewItemRepository(dbClient, logger.Sugar())

	ctx := context.Background()

	item := &models.Item{ItemID: 105, Name: "Period Filter Test", Members: false}
	require.NoError(t, itemRepo.Create(ctx, item))

	high := int64(1000)
	low := int64(900)
	now := time.Now().UTC()

	// Insert points at different times
	points := []models.PriceTimeseriesPoint{
		{ItemID: 105, Timestamp: now.Add(-48 * time.Hour), AvgHighPrice: &high, AvgLowPrice: &low, HighPriceVolume: 100, LowPriceVolume: 90},
		{ItemID: 105, Timestamp: now.Add(-12 * time.Hour), AvgHighPrice: &high, AvgLowPrice: &low, HighPriceVolume: 110, LowPriceVolume: 95},
		{ItemID: 105, Timestamp: now.Add(-1 * time.Hour), AvgHighPrice: &high, AvgLowPrice: &low, HighPriceVolume: 120, LowPriceVolume: 100},
	}
	require.NoError(t, priceRepo.InsertTimeseriesPoints(ctx, "1h", points))

	// Test 24h filter (should get 2 points)
	params24h := models.PriceHistoryParams{ItemID: 105, Period: models.Period24Hours}
	results24h, err := priceRepo.GetTimeseriesPoints(ctx, 105, "1h", params24h)
	require.NoError(t, err)
	assert.Len(t, results24h, 2, "Should only return points within 24h")

	// Test all filter (should get 3 points)
	paramsAll := models.PriceHistoryParams{ItemID: 105, Period: models.PeriodAll}
	resultsAll, err := priceRepo.GetTimeseriesPoints(ctx, 105, "1h", paramsAll)
	require.NoError(t, err)
	assert.Len(t, resultsAll, 3, "Should return all points")
}

func TestPriceRepository_GetTimeseriesPoints_WithTimeRange(t *testing.T) {
	dbClient := setupTestDB(t)
	logger, _ := zap.NewDevelopment()
	priceRepo := repository.NewPriceRepository(dbClient, logger.Sugar())
	itemRepo := repository.NewItemRepository(dbClient, logger.Sugar())

	ctx := context.Background()

	item := &models.Item{ItemID: 106, Name: "Time Range Test", Members: false}
	require.NoError(t, itemRepo.Create(ctx, item))

	high := int64(1000)
	low := int64(900)
	baseTime := time.Now().UTC().Add(-10 * time.Hour)

	// Insert 5 points over 10 hours
	points := make([]models.PriceTimeseriesPoint, 5)
	for i := 0; i < 5; i++ {
		points[i] = models.PriceTimeseriesPoint{
			ItemID:          106,
			Timestamp:       baseTime.Add(time.Duration(i*2) * time.Hour),
			AvgHighPrice:    &high,
			AvgLowPrice:     &low,
			HighPriceVolume: int64(100 + i*10),
			LowPriceVolume:  int64(90 + i*10),
		}
	}
	require.NoError(t, priceRepo.InsertTimeseriesPoints(ctx, "1h", points))

	// Query with specific time range (middle 3 points)
	startTime := baseTime.Add(2 * time.Hour)
	endTime := baseTime.Add(6 * time.Hour)
	params := models.PriceHistoryParams{
		ItemID:    106,
		StartTime: &startTime,
		EndTime:   &endTime,
	}

	results, err := priceRepo.GetTimeseriesPoints(ctx, 106, "1h", params)
	require.NoError(t, err)
	assert.Len(t, results, 3, "Should return points within time range")
}

func TestPriceRepository_GetTimeseriesPoints_WithLimit(t *testing.T) {
	dbClient := setupTestDB(t)
	logger, _ := zap.NewDevelopment()
	priceRepo := repository.NewPriceRepository(dbClient, logger.Sugar())
	itemRepo := repository.NewItemRepository(dbClient, logger.Sugar())

	ctx := context.Background()

	item := &models.Item{ItemID: 107, Name: "Limit Test", Members: false}
	require.NoError(t, itemRepo.Create(ctx, item))

	high := int64(1000)
	low := int64(900)
	now := time.Now().UTC()

	// Insert 10 points
	points := make([]models.PriceTimeseriesPoint, 10)
	for i := 0; i < 10; i++ {
		points[i] = models.PriceTimeseriesPoint{
			ItemID:          107,
			Timestamp:       now.Add(time.Duration(-i) * time.Hour),
			AvgHighPrice:    &high,
			AvgLowPrice:     &low,
			HighPriceVolume: int64(100 + i),
			LowPriceVolume:  int64(90 + i),
		}
	}
	require.NoError(t, priceRepo.InsertTimeseriesPoints(ctx, "1h", points))

	// Query with limit
	params := models.PriceHistoryParams{
		ItemID: 107,
		Period: models.PeriodAll,
		Limit:  3,
	}

	results, err := priceRepo.GetTimeseriesPoints(ctx, 107, "1h", params)
	require.NoError(t, err)
	assert.Len(t, results, 3, "Should respect limit parameter")
}

func TestPriceRepository_GetTimeseriesPoints_WithSampling(t *testing.T) {
	dbClient := setupTestDB(t)
	logger, _ := zap.NewDevelopment()
	priceRepo := repository.NewPriceRepository(dbClient, logger.Sugar())
	itemRepo := repository.NewItemRepository(dbClient, logger.Sugar())

	ctx := context.Background()

	item := &models.Item{ItemID: 108, Name: "Sampling Test", Members: false}
	require.NoError(t, itemRepo.Create(ctx, item))

	high := int64(1000)
	low := int64(900)
	now := time.Now().UTC()

	// Insert 100 points
	points := make([]models.PriceTimeseriesPoint, 100)
	for i := 0; i < 100; i++ {
		points[i] = models.PriceTimeseriesPoint{
			ItemID:          108,
			Timestamp:       now.Add(time.Duration(-i) * 5 * time.Minute),
			AvgHighPrice:    &high,
			AvgLowPrice:     &low,
			HighPriceVolume: int64(100),
			LowPriceVolume:  int64(90),
		}
	}
	require.NoError(t, priceRepo.InsertTimeseriesPoints(ctx, "5m", points))

	// Query with maxPoints sampling
	maxPoints := 10
	params := models.PriceHistoryParams{
		ItemID:    108,
		Period:    models.PeriodAll,
		MaxPoints: &maxPoints,
	}

	results, err := priceRepo.GetTimeseriesPoints(ctx, 108, "5m", params)
	require.NoError(t, err)
	assert.Len(t, results, 10, "Should sample down to maxPoints")
}

func TestPriceRepository_GetTimeseriesPoints_EmptyResult(t *testing.T) {
	dbClient := setupTestDB(t)
	logger, _ := zap.NewDevelopment()
	priceRepo := repository.NewPriceRepository(dbClient, logger.Sugar())
	itemRepo := repository.NewItemRepository(dbClient, logger.Sugar())

	ctx := context.Background()

	item := &models.Item{ItemID: 109, Name: "Empty Test", Members: false}
	require.NoError(t, itemRepo.Create(ctx, item))

	// Query for item with no data
	params := models.PriceHistoryParams{ItemID: 109, Period: models.PeriodAll}
	results, err := priceRepo.GetTimeseriesPoints(ctx, 109, "1h", params)
	require.NoError(t, err)
	assert.Empty(t, results, "Should return empty slice for item with no data")
}

// ========== Daily Points Tests ==========

func TestPriceRepository_InsertDailyPoints(t *testing.T) {
	dbClient := setupTestDB(t)
	logger, _ := zap.NewDevelopment()
	priceRepo := repository.NewPriceRepository(dbClient, logger.Sugar())
	itemRepo := repository.NewItemRepository(dbClient, logger.Sugar())

	ctx := context.Background()

	item := &models.Item{ItemID: 110, Name: "Daily Test", Members: false}
	require.NoError(t, itemRepo.Create(ctx, item))

	high := int64(5000)
	low := int64(4900)
	today := time.Now().UTC().Truncate(24 * time.Hour)

	dailyPoints := []models.PriceTimeseriesDaily{
		{
			ItemID:          110,
			Day:             today,
			AvgHighPrice:    &high,
			AvgLowPrice:     &low,
			HighPriceVolume: 500,
			LowPriceVolume:  450,
		},
	}

	err := priceRepo.InsertDailyPoints(ctx, dailyPoints)
	require.NoError(t, err)

	// Verify
	params := models.PriceHistoryParams{ItemID: 110, Period: models.PeriodAll}
	retrieved, err := priceRepo.GetDailyPoints(ctx, 110, params)
	require.NoError(t, err)
	assert.Len(t, retrieved, 1)
	assert.Equal(t, int64(5000), *retrieved[0].AvgHighPrice)
}

func TestPriceRepository_GetDailyPoints_WithPeriodFilter(t *testing.T) {
	dbClient := setupTestDB(t)
	logger, _ := zap.NewDevelopment()
	priceRepo := repository.NewPriceRepository(dbClient, logger.Sugar())
	itemRepo := repository.NewItemRepository(dbClient, logger.Sugar())

	ctx := context.Background()

	item := &models.Item{ItemID: 111, Name: "Daily Period Test", Members: false}
	require.NoError(t, itemRepo.Create(ctx, item))

	high := int64(5000)
	low := int64(4900)
	today := time.Now().UTC()

	// Insert daily points for past 10 days
	dailyPoints := make([]models.PriceTimeseriesDaily, 10)
	for i := 0; i < 10; i++ {
		day := today.Add(time.Duration(-i) * 24 * time.Hour)
		dailyPoints[i] = models.PriceTimeseriesDaily{
			ItemID:          111,
			Day:             day.Truncate(24 * time.Hour),
			AvgHighPrice:    &high,
			AvgLowPrice:     &low,
			HighPriceVolume: 500,
			LowPriceVolume:  450,
		}
	}
	require.NoError(t, priceRepo.InsertDailyPoints(ctx, dailyPoints))

	// Query with 7d filter
	params7d := models.PriceHistoryParams{ItemID: 111, Period: models.Period7Days}
	results7d, err := priceRepo.GetDailyPoints(ctx, 111, params7d)
	require.NoError(t, err)
	assert.LessOrEqual(t, len(results7d), 8, "Should return ~7 days of data")

	// Query all
	paramsAll := models.PriceHistoryParams{ItemID: 111, Period: models.PeriodAll}
	resultsAll, err := priceRepo.GetDailyPoints(ctx, 111, paramsAll)
	require.NoError(t, err)
	assert.Len(t, resultsAll, 10)
}

func TestPriceRepository_Rollup24hToDailyBefore(t *testing.T) {
	dbClient := setupTestDB(t)
	logger, _ := zap.NewDevelopment()
	priceRepo := repository.NewPriceRepository(dbClient, logger.Sugar())
	itemRepo := repository.NewItemRepository(dbClient, logger.Sugar())

	ctx := context.Background()

	item := &models.Item{ItemID: 112, Name: "Rollup Test", Members: false}
	require.NoError(t, itemRepo.Create(ctx, item))

	high := int64(6000)
	low := int64(5900)
	cutoffTime := time.Now().UTC().Add(-48 * time.Hour)
	oldTime := cutoffTime.Add(-24 * time.Hour).Truncate(24 * time.Hour)

	// Insert old 24h point (before cutoff)
	old24hPoints := []models.PriceTimeseriesPoint{
		{
			ItemID:          112,
			Timestamp:       oldTime,
			AvgHighPrice:    &high,
			AvgLowPrice:     &low,
			HighPriceVolume: 600,
			LowPriceVolume:  540,
		},
	}
	require.NoError(t, priceRepo.InsertTimeseriesPoints(ctx, "24h", old24hPoints))

	// Perform rollup
	rowsAffected, err := priceRepo.Rollup24hToDailyBefore(ctx, cutoffTime)
	require.NoError(t, err)
	assert.Greater(t, rowsAffected, int64(0), "Should have rolled up at least one point")

	// Verify daily point was created
	params := models.PriceHistoryParams{ItemID: 112, Period: models.PeriodAll}
	dailyPoints, err := priceRepo.GetDailyPoints(ctx, 112, params)
	require.NoError(t, err)
	assert.Len(t, dailyPoints, 1, "Should have created daily rollup")
}

func TestPriceRepository_Rollup24hToDailyBefore_NoData(t *testing.T) {
	dbClient := setupTestDB(t)
	logger, _ := zap.NewDevelopment()
	priceRepo := repository.NewPriceRepository(dbClient, logger.Sugar())

	ctx := context.Background()
	cutoffTime := time.Now().UTC().Add(-48 * time.Hour)

	// Rollup with no data should not error
	rowsAffected, err := priceRepo.Rollup24hToDailyBefore(ctx, cutoffTime)
	require.NoError(t, err)
	assert.Equal(t, int64(0), rowsAffected)
}

func TestPriceRepository_Rollup24hToDailyBefore_Idempotent(t *testing.T) {
	dbClient := setupTestDB(t)
	logger, _ := zap.NewDevelopment()
	priceRepo := repository.NewPriceRepository(dbClient, logger.Sugar())
	itemRepo := repository.NewItemRepository(dbClient, logger.Sugar())

	ctx := context.Background()

	item := &models.Item{ItemID: 113, Name: "Idempotent Rollup Test", Members: false}
	require.NoError(t, itemRepo.Create(ctx, item))

	high := int64(7000)
	low := int64(6900)
	cutoffTime := time.Now().UTC().Add(-48 * time.Hour)
	oldTime := cutoffTime.Add(-24 * time.Hour).Truncate(24 * time.Hour)

	// Insert 24h point
	points := []models.PriceTimeseriesPoint{
		{ItemID: 113, Timestamp: oldTime, AvgHighPrice: &high, AvgLowPrice: &low, HighPriceVolume: 700, LowPriceVolume: 630},
	}
	require.NoError(t, priceRepo.InsertTimeseriesPoints(ctx, "24h", points))

	// First rollup
	rowsAffected1, err := priceRepo.Rollup24hToDailyBefore(ctx, cutoffTime)
	require.NoError(t, err)
	assert.Greater(t, rowsAffected1, int64(0))

	// Second rollup (should be idempotent due to ON CONFLICT DO NOTHING)
	rowsAffected2, err := priceRepo.Rollup24hToDailyBefore(ctx, cutoffTime)
	require.NoError(t, err)
	assert.Equal(t, int64(0), rowsAffected2, "Second rollup should be no-op due to conflict")

	// Verify only one daily point exists
	params := models.PriceHistoryParams{ItemID: 113, Period: models.PeriodAll}
	dailyPoints, err := priceRepo.GetDailyPoints(ctx, 113, params)
	require.NoError(t, err)
	assert.Len(t, dailyPoints, 1)
}
