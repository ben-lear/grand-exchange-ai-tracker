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

// ========== ItemRepository CRUD Tests ==========

func TestItemRepository_Update_Success(t *testing.T) {
	db := setupTestDB(t)
	logger, _ := zap.NewDevelopment()
	repo := repository.NewItemRepository(db, logger.Sugar())

	ctx := context.Background()

	// Create initial item
	item := &models.Item{
		ItemID:  100,
		Name:    "Original Name",
		Members: false,
		IconURL: "http://example.com/icon1.png",
	}
	err := repo.Create(ctx, item)
	require.NoError(t, err)
	require.NotZero(t, item.ID)

	// Update the item
	item.Name = "Updated Name"
	item.Members = true
	item.IconURL = "http://example.com/icon2.png"
	err = repo.Update(ctx, item)
	require.NoError(t, err)

	// Verify update
	retrieved, err := repo.GetByItemID(ctx, 100)
	require.NoError(t, err)
	assert.Equal(t, "Updated Name", retrieved.Name)
	assert.True(t, retrieved.Members)
	assert.Equal(t, "http://example.com/icon2.png", retrieved.IconURL)
}

func TestItemRepository_Update_NonExistent(t *testing.T) {
	db := setupTestDB(t)
	logger, _ := zap.NewDevelopment()
	repo := repository.NewItemRepository(db, logger.Sugar())

	ctx := context.Background()

	// Try to update non-existent item (GORM will not error, just no rows affected)
	item := &models.Item{
		ID:      99999,
		ItemID:  99999,
		Name:    "Ghost Item",
		Members: false,
	}
	err := repo.Update(ctx, item)

	// GORM Save doesn't error for non-existent records, it just doesn't affect any rows
	// This is expected behavior
	assert.NoError(t, err)
}

func TestItemRepository_Delete_Success(t *testing.T) {
	db := setupTestDB(t)
	logger, _ := zap.NewDevelopment()
	repo := repository.NewItemRepository(db, logger.Sugar())

	ctx := context.Background()

	// Create item
	item := &models.Item{
		ItemID:  200,
		Name:    "To Be Deleted",
		Members: false,
	}
	err := repo.Create(ctx, item)
	require.NoError(t, err)

	// Delete the item
	err = repo.Delete(ctx, item.ID)
	require.NoError(t, err)

	// Verify deletion
	retrieved, err := repo.GetByItemID(ctx, 200)
	require.NoError(t, err)
	assert.Nil(t, retrieved)
}

func TestItemRepository_Delete_NonExistent(t *testing.T) {
	db := setupTestDB(t)
	logger, _ := zap.NewDevelopment()
	repo := repository.NewItemRepository(db, logger.Sugar())

	ctx := context.Background()

	// Delete non-existent item (should not error)
	err := repo.Delete(ctx, 99999)
	assert.NoError(t, err)
}

func TestItemRepository_Count_Success(t *testing.T) {
	db := setupTestDB(t)
	logger, _ := zap.NewDevelopment()
	repo := repository.NewItemRepository(db, logger.Sugar())

	ctx := context.Background()

	// Create multiple items
	items := []models.Item{
		{ItemID: 301, Name: "Item 1", Members: false},
		{ItemID: 302, Name: "Item 2", Members: true},
		{ItemID: 303, Name: "Item 3", Members: false},
	}

	for _, item := range items {
		err := repo.Create(ctx, &item)
		require.NoError(t, err)
	}

	// Count all items
	count, err := repo.Count(ctx)
	require.NoError(t, err)
	assert.GreaterOrEqual(t, count, int64(3))
}

func TestItemRepository_Count_EmptyDatabase(t *testing.T) {
	db := setupTestDB(t)
	logger, _ := zap.NewDevelopment()
	repo := repository.NewItemRepository(db, logger.Sugar())

	ctx := context.Background()

	// Count should work even with empty database
	count, err := repo.Count(ctx)
	require.NoError(t, err)
	assert.GreaterOrEqual(t, count, int64(0))
}

func TestItemRepository_BulkUpsert_Success(t *testing.T) {
	db := setupTestDB(t)
	logger, _ := zap.NewDevelopment()
	repo := repository.NewItemRepository(db, logger.Sugar())

	ctx := context.Background()

	// Create initial items
	initialItems := []models.Item{
		{ItemID: 401, Name: "Item 401", Members: false},
		{ItemID: 402, Name: "Item 402", Members: false},
	}
	err := repo.BulkUpsert(ctx, initialItems)
	require.NoError(t, err)

	// Update existing and add new items
	updatedItems := []models.Item{
		{ItemID: 401, Name: "Item 401 Updated", Members: true}, // Update
		{ItemID: 402, Name: "Item 402 Updated", Members: true}, // Update
		{ItemID: 403, Name: "Item 403", Members: false},        // Insert
	}
	err = repo.BulkUpsert(ctx, updatedItems)
	require.NoError(t, err)

	// Verify updates
	item401, err := repo.GetByItemID(ctx, 401)
	require.NoError(t, err)
	assert.Equal(t, "Item 401 Updated", item401.Name)
	assert.True(t, item401.Members)

	item403, err := repo.GetByItemID(ctx, 403)
	require.NoError(t, err)
	assert.Equal(t, "Item 403", item403.Name)
}

func TestItemRepository_BulkUpsert_EmptySlice(t *testing.T) {
	db := setupTestDB(t)
	logger, _ := zap.NewDevelopment()
	repo := repository.NewItemRepository(db, logger.Sugar())

	ctx := context.Background()

	// Empty slice should not error
	err := repo.BulkUpsert(ctx, []models.Item{})
	assert.NoError(t, err)
}

func TestItemRepository_BulkUpsert_LargeDataset(t *testing.T) {
	db := setupTestDB(t)
	logger, _ := zap.NewDevelopment()
	repo := repository.NewItemRepository(db, logger.Sugar())

	ctx := context.Background()

	// Create 100 items to test bulk performance
	items := make([]models.Item, 100)
	for i := 0; i < 100; i++ {
		items[i] = models.Item{
			ItemID:  500 + i,
			Name:    "Bulk Item " + string(rune(500+i)),
			Members: i%2 == 0,
		}
	}

	err := repo.BulkUpsert(ctx, items)
	require.NoError(t, err)

	// Verify a few items
	item500, err := repo.GetByItemID(ctx, 500)
	require.NoError(t, err)
	assert.NotNil(t, item500)

	item599, err := repo.GetByItemID(ctx, 599)
	require.NoError(t, err)
	assert.NotNil(t, item599)
}

func TestItemRepository_GetByID_Success(t *testing.T) {
	db := setupTestDB(t)
	logger, _ := zap.NewDevelopment()
	repo := repository.NewItemRepository(db, logger.Sugar())

	ctx := context.Background()

	// Create item
	item := &models.Item{
		ItemID:  600,
		Name:    "Test Item",
		Members: false,
	}
	err := repo.Create(ctx, item)
	require.NoError(t, err)

	// Retrieve by internal ID
	retrieved, err := repo.GetByID(ctx, item.ID)
	require.NoError(t, err)
	assert.NotNil(t, retrieved)
	assert.Equal(t, "Test Item", retrieved.Name)
	assert.Equal(t, 600, retrieved.ItemID)
}

func TestItemRepository_GetByID_NotFound(t *testing.T) {
	db := setupTestDB(t)
	logger, _ := zap.NewDevelopment()
	repo := repository.NewItemRepository(db, logger.Sugar())

	ctx := context.Background()

	// Try to get non-existent item
	retrieved, err := repo.GetByID(ctx, 99999)
	require.NoError(t, err)
	assert.Nil(t, retrieved)
}

// ========== PriceRepository CRUD Tests ==========

func TestPriceRepository_GetCurrentPrices_MultipleItems(t *testing.T) {
	db := setupTestDB(t)
	logger, _ := zap.NewDevelopment()
	priceRepo := repository.NewPriceRepository(db, logger.Sugar())
	itemRepo := repository.NewItemRepository(db, logger.Sugar())

	ctx := context.Background()

	// Create items
	items := []models.Item{
		{ItemID: 700, Name: "Test Item 700", Members: false},
		{ItemID: 701, Name: "Test Item 701", Members: false},
		{ItemID: 702, Name: "Test Item 702", Members: false},
	}
	for _, item := range items {
		err := itemRepo.Create(ctx, &item)
		require.NoError(t, err)
	}

	// Create prices
	highPrice := int64(1000)
	lowPrice := int64(900)
	now := time.Now()

	for _, item := range items {
		price := &models.CurrentPrice{
			ItemID:        item.ItemID,
			HighPrice:     &highPrice,
			LowPrice:      &lowPrice,
			HighPriceTime: &now,
			LowPriceTime:  &now,
		}
		err := priceRepo.UpsertCurrentPrice(ctx, price)
		require.NoError(t, err)
	}

	// Get prices for specific items
	prices, err := priceRepo.GetCurrentPrices(ctx, []int{700, 702})
	require.NoError(t, err)
	assert.Len(t, prices, 2)

	// Verify item IDs
	itemIDs := make(map[int]bool)
	for _, p := range prices {
		itemIDs[p.ItemID] = true
	}
	assert.True(t, itemIDs[700])
	assert.True(t, itemIDs[702])
	assert.False(t, itemIDs[701])
}

func TestPriceRepository_GetCurrentPrices_EmptyInput(t *testing.T) {
	db := setupTestDB(t)
	logger, _ := zap.NewDevelopment()
	priceRepo := repository.NewPriceRepository(db, logger.Sugar())

	ctx := context.Background()

	// Empty input should return empty slice
	prices, err := priceRepo.GetCurrentPrices(ctx, []int{})
	require.NoError(t, err)
	assert.Empty(t, prices)
}

func TestPriceRepository_GetCurrentPrice_NotFound(t *testing.T) {
	db := setupTestDB(t)
	logger, _ := zap.NewDevelopment()
	priceRepo := repository.NewPriceRepository(db, logger.Sugar())

	ctx := context.Background()

	// Try to get non-existent price
	price, err := priceRepo.GetCurrentPrice(ctx, 99999)
	require.NoError(t, err)
	assert.Nil(t, price)
}

func TestPriceRepository_BulkUpsertCurrentPrices_Success(t *testing.T) {
	db := setupTestDB(t)
	logger, _ := zap.NewDevelopment()
	priceRepo := repository.NewPriceRepository(db, logger.Sugar())
	itemRepo := repository.NewItemRepository(db, logger.Sugar())

	ctx := context.Background()

	// Create items
	items := []models.Item{
		{ItemID: 800, Name: "Test Item 800", Members: false},
		{ItemID: 801, Name: "Test Item 801", Members: false},
	}
	for _, item := range items {
		err := itemRepo.Create(ctx, &item)
		require.NoError(t, err)
	}

	// Bulk upsert prices
	highPrice := int64(1500)
	lowPrice := int64(1400)
	now := time.Now()

	updates := []models.BulkPriceUpdate{
		{ItemID: 800, HighPrice: &highPrice, LowPrice: &lowPrice, HighPriceTime: &now, LowPriceTime: &now},
		{ItemID: 801, HighPrice: &highPrice, LowPrice: &lowPrice, HighPriceTime: &now, LowPriceTime: &now},
	}

	err := priceRepo.BulkUpsertCurrentPrices(ctx, updates)
	require.NoError(t, err)

	// Verify prices were inserted
	price800, err := priceRepo.GetCurrentPrice(ctx, 800)
	require.NoError(t, err)
	assert.NotNil(t, price800)
	assert.Equal(t, int64(1500), *price800.HighPrice)

	price801, err := priceRepo.GetCurrentPrice(ctx, 801)
	require.NoError(t, err)
	assert.NotNil(t, price801)
	assert.Equal(t, int64(1400), *price801.LowPrice)
}

func TestPriceRepository_BulkUpsertCurrentPrices_EmptySlice(t *testing.T) {
	db := setupTestDB(t)
	logger, _ := zap.NewDevelopment()
	priceRepo := repository.NewPriceRepository(db, logger.Sugar())

	ctx := context.Background()

	// Empty slice should not error
	err := priceRepo.BulkUpsertCurrentPrices(ctx, []models.BulkPriceUpdate{})
	assert.NoError(t, err)
}

func TestPriceRepository_BulkUpsertCurrentPrices_LargeDataset(t *testing.T) {
	db := setupTestDB(t)
	logger, _ := zap.NewDevelopment()
	priceRepo := repository.NewPriceRepository(db, logger.Sugar())
	itemRepo := repository.NewItemRepository(db, logger.Sugar())

	ctx := context.Background()

	// Create 500 items (to test batch processing)
	items := make([]models.Item, 500)
	for i := 0; i < 500; i++ {
		items[i] = models.Item{
			ItemID:  900 + i,
			Name:    "Bulk Price Item " + string(rune(900+i)),
			Members: false,
		}
	}
	err := itemRepo.BulkUpsert(ctx, items)
	require.NoError(t, err)

	// Bulk upsert 500 prices
	highPrice := int64(2000)
	lowPrice := int64(1900)
	now := time.Now()

	updates := make([]models.BulkPriceUpdate, 500)
	for i := 0; i < 500; i++ {
		updates[i] = models.BulkPriceUpdate{
			ItemID:        900 + i,
			HighPrice:     &highPrice,
			LowPrice:      &lowPrice,
			HighPriceTime: &now,
			LowPriceTime:  &now,
		}
	}

	err = priceRepo.BulkUpsertCurrentPrices(ctx, updates)
	require.NoError(t, err)

	// Verify a few prices
	price900, err := priceRepo.GetCurrentPrice(ctx, 900)
	require.NoError(t, err)
	assert.NotNil(t, price900)

	price1399, err := priceRepo.GetCurrentPrice(ctx, 1399)
	require.NoError(t, err)
	assert.NotNil(t, price1399)
}

func TestPriceRepository_InsertHistory_Success(t *testing.T) {
	db := setupTestDB(t)
	logger, _ := zap.NewDevelopment()
	priceRepo := repository.NewPriceRepository(db, logger.Sugar())
	itemRepo := repository.NewItemRepository(db, logger.Sugar())

	ctx := context.Background()

	// Create item
	item := &models.Item{ItemID: 1500, Name: "History Test Item", Members: false}
	err := itemRepo.Create(ctx, item)
	require.NoError(t, err)

	// Insert history
	highPrice := int64(3000)
	lowPrice := int64(2900)
	timestamp := time.Now().UTC()

	history := &models.PriceHistory{
		ItemID:    1500,
		HighPrice: &highPrice,
		LowPrice:  &lowPrice,
		Timestamp: timestamp,
	}

	err = priceRepo.InsertHistory(ctx, history)
	require.NoError(t, err)

	// Verify insertion
	params := models.PriceHistoryParams{
		ItemID: 1500,
		Period: models.PeriodAll,
	}
	retrieved, err := priceRepo.GetHistory(ctx, params)
	require.NoError(t, err)
	assert.Len(t, retrieved, 1)
	assert.Equal(t, int64(3000), *retrieved[0].HighPrice)
}

func TestPriceRepository_BulkInsertHistory_Success(t *testing.T) {
	db := setupTestDB(t)
	logger, _ := zap.NewDevelopment()
	priceRepo := repository.NewPriceRepository(db, logger.Sugar())
	itemRepo := repository.NewItemRepository(db, logger.Sugar())

	ctx := context.Background()

	// Create item
	item := &models.Item{ItemID: 1600, Name: "Bulk History Item", Members: false}
	err := itemRepo.Create(ctx, item)
	require.NoError(t, err)

	// Bulk insert history
	highPrice := int64(4000)
	lowPrice := int64(3900)

	inserts := []models.BulkHistoryInsert{
		{ItemID: 1600, HighPrice: &highPrice, LowPrice: &lowPrice, Timestamp: time.Now().Add(-48 * time.Hour).UTC()},
		{ItemID: 1600, HighPrice: &highPrice, LowPrice: &lowPrice, Timestamp: time.Now().Add(-24 * time.Hour).UTC()},
		{ItemID: 1600, HighPrice: &highPrice, LowPrice: &lowPrice, Timestamp: time.Now().UTC()},
	}

	err = priceRepo.BulkInsertHistory(ctx, inserts)
	require.NoError(t, err)

	// Verify insertion
	params := models.PriceHistoryParams{
		ItemID: 1600,
		Period: models.PeriodAll,
	}
	retrieved, err := priceRepo.GetHistory(ctx, params)
	require.NoError(t, err)
	assert.Len(t, retrieved, 3)
}

func TestPriceRepository_BulkInsertHistory_EmptySlice(t *testing.T) {
	db := setupTestDB(t)
	logger, _ := zap.NewDevelopment()
	priceRepo := repository.NewPriceRepository(db, logger.Sugar())

	ctx := context.Background()

	// Empty slice should not error
	err := priceRepo.BulkInsertHistory(ctx, []models.BulkHistoryInsert{})
	assert.NoError(t, err)
}

func TestPriceRepository_GetLatestHistoryTimestamp_Success(t *testing.T) {
	db := setupTestDB(t)
	logger, _ := zap.NewDevelopment()
	priceRepo := repository.NewPriceRepository(db, logger.Sugar())
	itemRepo := repository.NewItemRepository(db, logger.Sugar())

	ctx := context.Background()

	// Create item
	item := &models.Item{ItemID: 1700, Name: "Latest Timestamp Item", Members: false}
	err := itemRepo.Create(ctx, item)
	require.NoError(t, err)

	// Insert history with different timestamps
	highPrice := int64(5000)
	lowPrice := int64(4900)

	older := time.Now().Add(-72 * time.Hour).UTC()
	newer := time.Now().Add(-1 * time.Hour).UTC()

	err = priceRepo.InsertHistory(ctx, &models.PriceHistory{
		ItemID:    1700,
		HighPrice: &highPrice,
		LowPrice:  &lowPrice,
		Timestamp: older,
	})
	require.NoError(t, err)

	err = priceRepo.InsertHistory(ctx, &models.PriceHistory{
		ItemID:    1700,
		HighPrice: &highPrice,
		LowPrice:  &lowPrice,
		Timestamp: newer,
	})
	require.NoError(t, err)

	// Get latest timestamp
	latest, err := priceRepo.GetLatestHistoryTimestamp(ctx, 1700)
	require.NoError(t, err)
	assert.NotNil(t, latest)
	assert.True(t, latest.Timestamp.After(older) || latest.Timestamp.Equal(newer))
}

func TestPriceRepository_GetLatestHistoryTimestamp_NoHistory(t *testing.T) {
	db := setupTestDB(t)
	logger, _ := zap.NewDevelopment()
	priceRepo := repository.NewPriceRepository(db, logger.Sugar())
	itemRepo := repository.NewItemRepository(db, logger.Sugar())

	ctx := context.Background()

	// Create item with no history
	item := &models.Item{ItemID: 1800, Name: "No History Item", Members: false}
	err := itemRepo.Create(ctx, item)
	require.NoError(t, err)

	// Get latest timestamp should return nil
	latest, err := priceRepo.GetLatestHistoryTimestamp(ctx, 1800)
	require.NoError(t, err)
	assert.Nil(t, latest)
}

func TestPriceRepository_DeleteOldHistory_Success(t *testing.T) {
	db := setupTestDB(t)
	logger, _ := zap.NewDevelopment()
	priceRepo := repository.NewPriceRepository(db, logger.Sugar())
	itemRepo := repository.NewItemRepository(db, logger.Sugar())

	ctx := context.Background()

	// Create item
	item := &models.Item{ItemID: 1900, Name: "Delete Old History Item", Members: false}
	err := itemRepo.Create(ctx, item)
	require.NoError(t, err)

	// Insert history with different timestamps
	highPrice := int64(6000)
	lowPrice := int64(5900)

	veryOld := time.Now().Add(-72 * time.Hour).UTC()
	recent := time.Now().Add(-1 * time.Hour).UTC()

	err = priceRepo.InsertHistory(ctx, &models.PriceHistory{
		ItemID:    1900,
		HighPrice: &highPrice,
		LowPrice:  &lowPrice,
		Timestamp: veryOld,
	})
	require.NoError(t, err)

	err = priceRepo.InsertHistory(ctx, &models.PriceHistory{
		ItemID:    1900,
		HighPrice: &highPrice,
		LowPrice:  &lowPrice,
		Timestamp: recent,
	})
	require.NoError(t, err)

	// Delete history older than 24 hours
	cutoff := time.Now().Add(-24 * time.Hour).Unix()
	err = priceRepo.DeleteOldHistory(ctx, 1900, cutoff)
	require.NoError(t, err)

	// Verify only recent history remains
	params := models.PriceHistoryParams{
		ItemID: 1900,
		Period: models.PeriodAll,
	}
	remaining, err := priceRepo.GetHistory(ctx, params)
	require.NoError(t, err)
	assert.Len(t, remaining, 1)
	assert.True(t, remaining[0].Timestamp.After(time.Now().Add(-24*time.Hour)))
}

func TestPriceRepository_GetHistory_WithPeriodFilter(t *testing.T) {
	db := setupTestDB(t)
	logger, _ := zap.NewDevelopment()
	priceRepo := repository.NewPriceRepository(db, logger.Sugar())
	itemRepo := repository.NewItemRepository(db, logger.Sugar())

	ctx := context.Background()

	// Create item
	item := &models.Item{ItemID: 2000, Name: "Period Filter Item", Members: false}
	err := itemRepo.Create(ctx, item)
	require.NoError(t, err)

	// Insert history across different time periods
	highPrice := int64(7000)
	lowPrice := int64(6900)

	timestamps := []time.Time{
		time.Now().Add(-8 * 24 * time.Hour).UTC(), // 8 days ago
		time.Now().Add(-3 * 24 * time.Hour).UTC(), // 3 days ago
		time.Now().Add(-12 * time.Hour).UTC(),     // 12 hours ago
		time.Now().Add(-1 * time.Hour).UTC(),      // 1 hour ago
	}

	for _, ts := range timestamps {
		err = priceRepo.InsertHistory(ctx, &models.PriceHistory{
			ItemID:    2000,
			HighPrice: &highPrice,
			LowPrice:  &lowPrice,
			Timestamp: ts,
		})
		require.NoError(t, err)
	}

	// Test 24h filter (should get 2 records)
	params24h := models.PriceHistoryParams{
		ItemID: 2000,
		Period: models.Period24Hours,
	}
	history24h, err := priceRepo.GetHistory(ctx, params24h)
	require.NoError(t, err)
	assert.Len(t, history24h, 2)

	// Test 7d filter (should get 3 records)
	params7d := models.PriceHistoryParams{
		ItemID: 2000,
		Period: models.Period7Days,
	}
	history7d, err := priceRepo.GetHistory(ctx, params7d)
	require.NoError(t, err)
	assert.Len(t, history7d, 3)

	// Test all filter (should get 4 records)
	paramsAll := models.PriceHistoryParams{
		ItemID: 2000,
		Period: models.PeriodAll,
	}
	historyAll, err := priceRepo.GetHistory(ctx, paramsAll)
	require.NoError(t, err)
	assert.Len(t, historyAll, 4)
}

func TestPriceRepository_GetHistory_WithLimit(t *testing.T) {
	db := setupTestDB(t)
	logger, _ := zap.NewDevelopment()
	priceRepo := repository.NewPriceRepository(db, logger.Sugar())
	itemRepo := repository.NewItemRepository(db, logger.Sugar())

	ctx := context.Background()

	// Create item
	item := &models.Item{ItemID: 2100, Name: "Limit Test Item", Members: false}
	err := itemRepo.Create(ctx, item)
	require.NoError(t, err)

	// Insert multiple history records
	highPrice := int64(8000)
	lowPrice := int64(7900)

	for i := 0; i < 10; i++ {
		err = priceRepo.InsertHistory(ctx, &models.PriceHistory{
			ItemID:    2100,
			HighPrice: &highPrice,
			LowPrice:  &lowPrice,
			Timestamp: time.Now().Add(-time.Duration(i) * time.Hour).UTC(),
		})
		require.NoError(t, err)
	}

	// Get history with limit
	params := models.PriceHistoryParams{
		ItemID: 2100,
		Period: models.PeriodAll,
		Limit:  5,
	}
	history, err := priceRepo.GetHistory(ctx, params)
	require.NoError(t, err)
	assert.Len(t, history, 5)
}
