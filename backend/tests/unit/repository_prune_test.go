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

// ========== PrunePriceLatestBefore Tests ==========

func TestPriceRepository_PrunePriceLatestBefore(t *testing.T) {
	db := setupTestDB(t)
	logger, _ := zap.NewDevelopment()
	priceRepo := repository.NewPriceRepository(db, logger.Sugar())
	itemRepo := repository.NewItemRepository(db, logger.Sugar())

	ctx := context.Background()

	item := &models.Item{ItemID: 200, Name: "Prune Latest Test", Members: false}
	require.NoError(t, itemRepo.Create(ctx, item))

	high := int64(1000)
	low := int64(900)
	now := time.Now().UTC()

	// Insert snapshot (observed_at will be current time)
	price := &models.CurrentPrice{
		ItemID:        200,
		HighPrice:     &high,
		LowPrice:      &low,
		HighPriceTime: &now,
		LowPriceTime:  &now,
	}
	require.NoError(t, priceRepo.UpsertCurrentPrice(ctx, price))

	// Wait a moment
	time.Sleep(100 * time.Millisecond)

	// Try to prune data from far in the past (should delete nothing)
	cutoffOld := now.Add(-30 * 24 * time.Hour)
	rowsDeleted, err := priceRepo.PrunePriceLatestBefore(ctx, cutoffOld)
	require.NoError(t, err)
	assert.Equal(t, int64(0), rowsDeleted, "Should not delete recent snapshot")

	// Verify current price still retrievable
	retrieved, err := priceRepo.GetCurrentPrice(ctx, 200)
	require.NoError(t, err)
	assert.NotNil(t, retrieved)
	assert.Equal(t, int64(1000), *retrieved.HighPrice)
}

func TestPriceRepository_PrunePriceLatestBefore_NoData(t *testing.T) {
	db := setupTestDB(t)
	logger, _ := zap.NewDevelopment()
	priceRepo := repository.NewPriceRepository(db, logger.Sugar())

	ctx := context.Background()

	// Prune with no data should not error
	cutoff := time.Now().UTC().Add(-7 * 24 * time.Hour)
	rowsDeleted, err := priceRepo.PrunePriceLatestBefore(ctx, cutoff)
	require.NoError(t, err)
	assert.Equal(t, int64(0), rowsDeleted)
}

func TestPriceRepository_PrunePriceLatestBefore_PreservesRecent(t *testing.T) {
	db := setupTestDB(t)
	logger, _ := zap.NewDevelopment()
	priceRepo := repository.NewPriceRepository(db, logger.Sugar())
	itemRepo := repository.NewItemRepository(db, logger.Sugar())

	ctx := context.Background()

	item := &models.Item{ItemID: 201, Name: "Preserve Recent Test", Members: false}
	require.NoError(t, itemRepo.Create(ctx, item))

	high := int64(2000)
	low := int64(1900)
	now := time.Now().UTC()

	// Insert recent snapshot
	recentPrice := &models.CurrentPrice{
		ItemID:        201,
		HighPrice:     &high,
		LowPrice:      &low,
		HighPriceTime: &now,
		LowPriceTime:  &now,
	}
	require.NoError(t, priceRepo.UpsertCurrentPrice(ctx, recentPrice))

	// Prune old data (cutoff is before the snapshot)
	cutoff := now.Add(-1 * time.Hour)
	_, err := priceRepo.PrunePriceLatestBefore(ctx, cutoff)
	require.NoError(t, err)

	// Verify recent snapshot still exists
	retrieved, err := priceRepo.GetCurrentPrice(ctx, 201)
	require.NoError(t, err)
	assert.NotNil(t, retrieved)
	assert.Equal(t, int64(2000), *retrieved.HighPrice)
}

// ========== PruneTimeseriesBefore Tests ==========

func TestPriceRepository_PruneTimeseriesBefore_5m(t *testing.T) {
	db := setupTestDB(t)
	logger, _ := zap.NewDevelopment()
	priceRepo := repository.NewPriceRepository(db, logger.Sugar())
	itemRepo := repository.NewItemRepository(db, logger.Sugar())

	ctx := context.Background()

	item := &models.Item{ItemID: 202, Name: "Prune 5m Test", Members: false}
	require.NoError(t, itemRepo.Create(ctx, item))

	high := int64(3000)
	low := int64(2900)
	now := time.Now().UTC()
	cutoff := now.Add(-2 * time.Hour)

	// Insert old and new 5m points
	points := []models.PriceTimeseriesPoint{
		{ItemID: 202, Timestamp: cutoff.Add(-1 * time.Hour), AvgHighPrice: &high, AvgLowPrice: &low, HighPriceVolume: 300, LowPriceVolume: 270},
		{ItemID: 202, Timestamp: now.Add(-30 * time.Minute), AvgHighPrice: &high, AvgLowPrice: &low, HighPriceVolume: 310, LowPriceVolume: 275},
	}
	require.NoError(t, priceRepo.InsertTimeseriesPoints(ctx, "5m", points))

	// Prune old data
	rowsDeleted, err := priceRepo.PruneTimeseriesBefore(ctx, "5m", cutoff)
	require.NoError(t, err)
	assert.GreaterOrEqual(t, rowsDeleted, int64(1), "Should have deleted old 5m point")

	// Verify recent data remains
	params := models.PriceHistoryParams{ItemID: 202, Period: models.PeriodAll}
	remaining, err := priceRepo.GetTimeseriesPoints(ctx, 202, "5m", params)
	require.NoError(t, err)
	assert.Len(t, remaining, 1, "Recent point should remain")
}

func TestPriceRepository_PruneTimeseriesBefore_1h(t *testing.T) {
	db := setupTestDB(t)
	logger, _ := zap.NewDevelopment()
	priceRepo := repository.NewPriceRepository(db, logger.Sugar())
	itemRepo := repository.NewItemRepository(db, logger.Sugar())

	ctx := context.Background()

	item := &models.Item{ItemID: 203, Name: "Prune 1h Test", Members: false}
	require.NoError(t, itemRepo.Create(ctx, item))

	high := int64(4000)
	low := int64(3900)
	now := time.Now().UTC()
	cutoff := now.Add(-48 * time.Hour)

	// Insert old point
	oldPoints := []models.PriceTimeseriesPoint{
		{ItemID: 203, Timestamp: cutoff.Add(-24 * time.Hour), AvgHighPrice: &high, AvgLowPrice: &low, HighPriceVolume: 400, LowPriceVolume: 360},
	}
	require.NoError(t, priceRepo.InsertTimeseriesPoints(ctx, "1h", oldPoints))

	// Prune
	rowsDeleted, err := priceRepo.PruneTimeseriesBefore(ctx, "1h", cutoff)
	require.NoError(t, err)
	assert.GreaterOrEqual(t, rowsDeleted, int64(1))

	// Verify deletion
	params := models.PriceHistoryParams{ItemID: 203, Period: models.PeriodAll}
	remaining, err := priceRepo.GetTimeseriesPoints(ctx, 203, "1h", params)
	require.NoError(t, err)
	assert.Empty(t, remaining)
}

func TestPriceRepository_PruneTimeseriesBefore_6h(t *testing.T) {
	db := setupTestDB(t)
	logger, _ := zap.NewDevelopment()
	priceRepo := repository.NewPriceRepository(db, logger.Sugar())
	itemRepo := repository.NewItemRepository(db, logger.Sugar())

	ctx := context.Background()

	item := &models.Item{ItemID: 204, Name: "Prune 6h Test", Members: false}
	require.NoError(t, itemRepo.Create(ctx, item))

	high := int64(5000)
	low := int64(4900)
	cutoff := time.Now().UTC().Add(-7 * 24 * time.Hour)

	points := []models.PriceTimeseriesPoint{
		{ItemID: 204, Timestamp: cutoff.Add(-24 * time.Hour), AvgHighPrice: &high, AvgLowPrice: &low, HighPriceVolume: 500, LowPriceVolume: 450},
	}
	require.NoError(t, priceRepo.InsertTimeseriesPoints(ctx, "6h", points))

	rowsDeleted, err := priceRepo.PruneTimeseriesBefore(ctx, "6h", cutoff)
	require.NoError(t, err)
	assert.GreaterOrEqual(t, rowsDeleted, int64(1))
}

func TestPriceRepository_PruneTimeseriesBefore_24h(t *testing.T) {
	db := setupTestDB(t)
	logger, _ := zap.NewDevelopment()
	priceRepo := repository.NewPriceRepository(db, logger.Sugar())
	itemRepo := repository.NewItemRepository(db, logger.Sugar())

	ctx := context.Background()

	item := &models.Item{ItemID: 205, Name: "Prune 24h Test", Members: false}
	require.NoError(t, itemRepo.Create(ctx, item))

	high := int64(6000)
	low := int64(5900)
	cutoff := time.Now().UTC().Add(-30 * 24 * time.Hour)

	points := []models.PriceTimeseriesPoint{
		{ItemID: 205, Timestamp: cutoff.Add(-48 * time.Hour), AvgHighPrice: &high, AvgLowPrice: &low, HighPriceVolume: 600, LowPriceVolume: 540},
	}
	require.NoError(t, priceRepo.InsertTimeseriesPoints(ctx, "24h", points))

	rowsDeleted, err := priceRepo.PruneTimeseriesBefore(ctx, "24h", cutoff)
	require.NoError(t, err)
	assert.GreaterOrEqual(t, rowsDeleted, int64(1))
}

func TestPriceRepository_PruneTimeseriesBefore_InvalidTimestep(t *testing.T) {
	db := setupTestDB(t)
	logger, _ := zap.NewDevelopment()
	priceRepo := repository.NewPriceRepository(db, logger.Sugar())

	ctx := context.Background()
	cutoff := time.Now().UTC().Add(-7 * 24 * time.Hour)

	// Should error with invalid timestep
	_, err := priceRepo.PruneTimeseriesBefore(ctx, "invalid", cutoff)
	require.Error(t, err)
	assert.Contains(t, err.Error(), "invalid timestep")
}

func TestPriceRepository_PruneTimeseriesBefore_NoData(t *testing.T) {
	db := setupTestDB(t)
	logger, _ := zap.NewDevelopment()
	priceRepo := repository.NewPriceRepository(db, logger.Sugar())

	ctx := context.Background()
	cutoff := time.Now().UTC().Add(-7 * 24 * time.Hour)

	// Prune with no data should not error
	rowsDeleted, err := priceRepo.PruneTimeseriesBefore(ctx, "5m", cutoff)
	require.NoError(t, err)
	assert.Equal(t, int64(0), rowsDeleted)
}

func TestPriceRepository_PruneTimeseriesBefore_MultipleItems(t *testing.T) {
	db := setupTestDB(t)
	logger, _ := zap.NewDevelopment()
	priceRepo := repository.NewPriceRepository(db, logger.Sugar())
	itemRepo := repository.NewItemRepository(db, logger.Sugar())

	ctx := context.Background()

	// Create multiple items
	items := []models.Item{
		{ItemID: 206, Name: "Multi Item 1", Members: false},
		{ItemID: 207, Name: "Multi Item 2", Members: false},
	}
	for i := range items {
		require.NoError(t, itemRepo.Create(ctx, &items[i]))
	}

	high := int64(7000)
	low := int64(6900)
	now := time.Now().UTC()
	cutoff := now.Add(-48 * time.Hour)

	// Insert old points for both items
	points := []models.PriceTimeseriesPoint{
		{ItemID: 206, Timestamp: cutoff.Add(-24 * time.Hour), AvgHighPrice: &high, AvgLowPrice: &low, HighPriceVolume: 700, LowPriceVolume: 630},
		{ItemID: 207, Timestamp: cutoff.Add(-24 * time.Hour), AvgHighPrice: &high, AvgLowPrice: &low, HighPriceVolume: 710, LowPriceVolume: 635},
	}
	require.NoError(t, priceRepo.InsertTimeseriesPoints(ctx, "1h", points))

	// Prune should affect both items
	rowsDeleted, err := priceRepo.PruneTimeseriesBefore(ctx, "1h", cutoff)
	require.NoError(t, err)
	assert.Equal(t, int64(2), rowsDeleted, "Should delete points for both items")

	// Verify both items have no data
	params206 := models.PriceHistoryParams{ItemID: 206, Period: models.PeriodAll}
	remaining206, err := priceRepo.GetTimeseriesPoints(ctx, 206, "1h", params206)
	require.NoError(t, err)
	assert.Empty(t, remaining206)

	params207 := models.PriceHistoryParams{ItemID: 207, Period: models.PeriodAll}
	remaining207, err := priceRepo.GetTimeseriesPoints(ctx, 207, "1h", params207)
	require.NoError(t, err)
	assert.Empty(t, remaining207)
}

// ========== Comprehensive Prune Workflow Test ==========

func TestPriceRepository_PruneWorkflow_Complete(t *testing.T) {
	db := setupTestDB(t)
	logger, _ := zap.NewDevelopment()
	priceRepo := repository.NewPriceRepository(db, logger.Sugar())
	itemRepo := repository.NewItemRepository(db, logger.Sugar())

	ctx := context.Background()

	item := &models.Item{ItemID: 208, Name: "Workflow Test", Members: false}
	require.NoError(t, itemRepo.Create(ctx, item))

	high := int64(8000)
	low := int64(7900)
	now := time.Now().UTC()

	// Simulate data lifecycle:
	// 1. Insert minute-level snapshots (price_latest)
	// 2. Insert bucketed timeseries (5m, 1h)
	// 3. Rollup 24h to daily
	// 4. Prune old data

	// Step 1: Insert price_latest snapshots
	for i := 0; i < 5; i++ {
		snapshot := &models.CurrentPrice{
			ItemID:        208,
			HighPrice:     &high,
			LowPrice:      &low,
			HighPriceTime: &now,
			LowPriceTime:  &now,
		}
		require.NoError(t, priceRepo.UpsertCurrentPrice(ctx, snapshot))
		time.Sleep(10 * time.Millisecond) // Ensure different observed_at
	}

	// Step 2: Insert timeseries data
	old5m := now.Add(-8 * 24 * time.Hour)
	recent5m := now.Add(-1 * time.Hour)
	points5m := []models.PriceTimeseriesPoint{
		{ItemID: 208, Timestamp: old5m, AvgHighPrice: &high, AvgLowPrice: &low, HighPriceVolume: 800, LowPriceVolume: 720},
		{ItemID: 208, Timestamp: recent5m, AvgHighPrice: &high, AvgLowPrice: &low, HighPriceVolume: 810, LowPriceVolume: 725},
	}
	require.NoError(t, priceRepo.InsertTimeseriesPoints(ctx, "5m", points5m))

	old24h := now.Add(-60 * 24 * time.Hour).Truncate(24 * time.Hour)
	points24h := []models.PriceTimeseriesPoint{
		{ItemID: 208, Timestamp: old24h, AvgHighPrice: &high, AvgLowPrice: &low, HighPriceVolume: 800, LowPriceVolume: 720},
	}
	require.NoError(t, priceRepo.InsertTimeseriesPoints(ctx, "24h", points24h))

	// Step 3: Rollup to daily
	rollupCutoff := now.Add(-30 * 24 * time.Hour)
	rowsRolledUp, err := priceRepo.Rollup24hToDailyBefore(ctx, rollupCutoff)
	require.NoError(t, err)
	assert.GreaterOrEqual(t, rowsRolledUp, int64(1))

	// Step 4: Prune old data
	pruneCutoff := now.Add(-7 * 24 * time.Hour)

	// Prune old price_latest
	deletedLatest, err := priceRepo.PrunePriceLatestBefore(ctx, pruneCutoff.Add(-1*24*time.Hour))
	require.NoError(t, err)
	assert.GreaterOrEqual(t, deletedLatest, int64(0))

	// Prune old 5m data
	deleted5m, err := priceRepo.PruneTimeseriesBefore(ctx, "5m", pruneCutoff)
	require.NoError(t, err)
	assert.GreaterOrEqual(t, deleted5m, int64(1), "Should have pruned old 5m data")

	// Prune old 24h data (after rollup)
	deleted24h, err := priceRepo.PruneTimeseriesBefore(ctx, "24h", rollupCutoff)
	require.NoError(t, err)
	assert.GreaterOrEqual(t, deleted24h, int64(0))

	// Verify current price still works
	currentPrice, err := priceRepo.GetCurrentPrice(ctx, 208)
	require.NoError(t, err)
	assert.NotNil(t, currentPrice)

	// Verify recent timeseries data remains
	params := models.PriceHistoryParams{ItemID: 208, Period: models.PeriodAll}
	remaining5m, err := priceRepo.GetTimeseriesPoints(ctx, 208, "5m", params)
	require.NoError(t, err)
	assert.Len(t, remaining5m, 1, "Recent 5m data should remain")

	// Verify daily rollup exists
	dailyPoints, err := priceRepo.GetDailyPoints(ctx, 208, params)
	require.NoError(t, err)
	assert.GreaterOrEqual(t, len(dailyPoints), 1, "Daily rollup should exist")
}
