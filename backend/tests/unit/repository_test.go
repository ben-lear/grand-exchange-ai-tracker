package unit

import (
	"context"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"go.uber.org/zap"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"

	"github.com/guavi/osrs-ge-tracker/internal/models"
	"github.com/guavi/osrs-ge-tracker/internal/repository"
)

func setupTestDB(t *testing.T) *gorm.DB {
	db, err := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{})
	require.NoError(t, err)

	// Auto migrate models
	err = db.AutoMigrate(&models.Item{}, &models.CurrentPrice{})
	require.NoError(t, err)

	return db
}

func TestItemRepository_Create(t *testing.T) {
	db := setupTestDB(t)
	logger, _ := zap.NewDevelopment()
	repo := repository.NewItemRepository(db, logger.Sugar())

	ctx := context.Background()
	item := &models.Item{
		ItemID:  2,
		Name:    "Cannonball",
		Members: false,
	}

	err := repo.Create(ctx, item)
	require.NoError(t, err)
	assert.NotZero(t, item.ID)
}

func TestItemRepository_GetByItemID(t *testing.T) {
	db := setupTestDB(t)
	logger, _ := zap.NewDevelopment()
	repo := repository.NewItemRepository(db, logger.Sugar())

	ctx := context.Background()
	item := &models.Item{
		ItemID:  2,
		Name:    "Cannonball",
		Members: false,
	}

	err := repo.Create(ctx, item)
	require.NoError(t, err)

	retrieved, err := repo.GetByItemID(ctx, 2)
	require.NoError(t, err)
	assert.NotNil(t, retrieved)
	assert.Equal(t, "Cannonball", retrieved.Name)
}

func TestItemRepository_Upsert(t *testing.T) {
	db := setupTestDB(t)
	logger, _ := zap.NewDevelopment()
	repo := repository.NewItemRepository(db, logger.Sugar())

	ctx := context.Background()
	item := &models.Item{
		ItemID:  2,
		Name:    "Cannonball",
		Members: false,
	}

	// First upsert (insert)
	err := repo.Upsert(ctx, item)
	require.NoError(t, err)

	// Second upsert (update)
	item.Name = "Cannonball Updated"
	err = repo.Upsert(ctx, item)
	require.NoError(t, err)

	// Verify update
	retrieved, err := repo.GetByItemID(ctx, 2)
	require.NoError(t, err)
	assert.Equal(t, "Cannonball Updated", retrieved.Name)
}

func TestItemRepository_Search(t *testing.T) {
	db := setupTestDB(t)
	logger, _ := zap.NewDevelopment()
	repo := repository.NewItemRepository(db, logger.Sugar())

	ctx := context.Background()

	// Create test items
	items := []models.Item{
		{ItemID: 1, Name: "Abyssal whip", Members: true},
		{ItemID: 2, Name: "Cannonball", Members: false},
		{ItemID: 3, Name: "Dragon scimitar", Members: true},
	}

	for _, item := range items {
		err := repo.Create(ctx, &item)
		require.NoError(t, err)
	}

	// Search for "whip"
	params := models.ItemSearchParams{
		Query:  "whip",
		Limit:  10,
		Offset: 0,
	}

	results, total, err := repo.Search(ctx, params)
	require.NoError(t, err)
	assert.Equal(t, int64(1), total)
	assert.Len(t, results, 1)
	assert.Equal(t, "Abyssal whip", results[0].Name)
}

func TestItemRepository_GetAll(t *testing.T) {
	db := setupTestDB(t)
	logger, _ := zap.NewDevelopment()
	repo := repository.NewItemRepository(db, logger.Sugar())

	ctx := context.Background()

	// Create test items
	items := []models.Item{
		{ItemID: 1, Name: "Abyssal whip", Members: true},
		{ItemID: 2, Name: "Cannonball", Members: false},
		{ItemID: 3, Name: "Dragon scimitar", Members: true},
	}

	for _, item := range items {
		err := repo.Create(ctx, &item)
		require.NoError(t, err)
	}

	// Get all items
	params := models.DefaultItemListParams()
	results, total, err := repo.GetAll(ctx, params)
	require.NoError(t, err)
	assert.Equal(t, int64(3), total)
	assert.Len(t, results, 3)

	// Test with members filter
	members := true
	params.Members = &members
	results, total, err = repo.GetAll(ctx, params)
	require.NoError(t, err)
	assert.Equal(t, int64(2), total)
	assert.Len(t, results, 2)
}

func TestPriceRepository_UpsertCurrentPrice(t *testing.T) {
	db := setupTestDB(t)
	logger, _ := zap.NewDevelopment()
	repo := repository.NewPriceRepository(db, logger.Sugar())

	ctx := context.Background()
	highPrice := int64(1000)
	lowPrice := int64(900)
	now := time.Now()

	price := &models.CurrentPrice{
		ItemID:        2,
		HighPrice:     &highPrice,
		HighPriceTime: &now,
		LowPrice:      &lowPrice,
		LowPriceTime:  &now,
	}

	err := repo.UpsertCurrentPrice(ctx, price)
	require.NoError(t, err)

	// Retrieve and verify
	retrieved, err := repo.GetCurrentPrice(ctx, 2)
	require.NoError(t, err)
	assert.NotNil(t, retrieved)
	assert.Equal(t, int64(1000), *retrieved.HighPrice)
	assert.Equal(t, int64(900), *retrieved.LowPrice)
}

func TestPriceRepository_GetAllCurrentPrices(t *testing.T) {
	db := setupTestDB(t)
	logger, _ := zap.NewDevelopment()
	repo := repository.NewPriceRepository(db, logger.Sugar())

	ctx := context.Background()

	// Create test prices
	highPrice := int64(1000)
	lowPrice := int64(900)
	now := time.Now()

	prices := []models.CurrentPrice{
		{ItemID: 1, HighPrice: &highPrice, LowPrice: &lowPrice, HighPriceTime: &now, LowPriceTime: &now},
		{ItemID: 2, HighPrice: &highPrice, LowPrice: &lowPrice, HighPriceTime: &now, LowPriceTime: &now},
	}

	for _, price := range prices {
		err := repo.UpsertCurrentPrice(ctx, &price)
		require.NoError(t, err)
	}

	// Get all prices
	results, err := repo.GetAllCurrentPrices(ctx)
	require.NoError(t, err)
	assert.Len(t, results, 2)
}
