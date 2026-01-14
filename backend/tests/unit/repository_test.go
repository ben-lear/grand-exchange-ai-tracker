package unit

import (
	"context"
	"fmt"
	"os"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"go.uber.org/zap"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"

	"github.com/guavi/osrs-ge-tracker/internal/models"
	"github.com/guavi/osrs-ge-tracker/internal/repository"
)

func setupTestDB(t *testing.T) *gorm.DB {
	// Get database connection details from environment or use defaults
	host := getEnv("POSTGRES_HOST", "localhost")
	port := getEnv("POSTGRES_PORT", "5432")
	user := getEnv("POSTGRES_USER", "osrs_tracker")
	password := getEnv("POSTGRES_PASSWORD", "changeme")
	dbname := getEnv("POSTGRES_DB", "osrs_ge_tracker")

	dsn := fmt.Sprintf("host=%s user=%s password=%s dbname=%s port=%s sslmode=disable TimeZone=UTC",
		host, user, password, dbname, port)

	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
	require.NoError(t, err, "Failed to connect to test database")

	// Auto migrate models
	err = db.AutoMigrate(&models.Item{}, &models.CurrentPrice{})
	require.NoError(t, err)

	// Clean up any existing test data
	db.Exec("TRUNCATE TABLE items, current_prices CASCADE")

	return db
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
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
	priceRepo := repository.NewPriceRepository(db, logger.Sugar())
	itemRepo := repository.NewItemRepository(db, logger.Sugar())

	ctx := context.Background()

	// Create item first (foreign key requirement)
	item := &models.Item{
		ItemID:  2,
		Name:    "Cannonball",
		Members: false,
	}
	err := itemRepo.Create(ctx, item)
	require.NoError(t, err)

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

	err = priceRepo.UpsertCurrentPrice(ctx, price)
	require.NoError(t, err)

	// Retrieve and verify
	retrieved, err := priceRepo.GetCurrentPrice(ctx, 2)
	require.NoError(t, err)
	assert.NotNil(t, retrieved)
	assert.Equal(t, int64(1000), *retrieved.HighPrice)
	assert.Equal(t, int64(900), *retrieved.LowPrice)
}

func TestPriceRepository_GetAllCurrentPrices(t *testing.T) {
	db := setupTestDB(t)
	logger, _ := zap.NewDevelopment()
	priceRepo := repository.NewPriceRepository(db, logger.Sugar())
	itemRepo := repository.NewItemRepository(db, logger.Sugar())

	ctx := context.Background()

	// Create items first (foreign key requirement)
	items := []models.Item{
		{ItemID: 1, Name: "Test Item 1", Members: false},
		{ItemID: 2, Name: "Test Item 2", Members: false},
	}
	for _, item := range items {
		err := itemRepo.Create(ctx, &item)
		require.NoError(t, err)
	}

	// Create test prices
	highPrice := int64(1000)
	lowPrice := int64(900)
	now := time.Now()

	prices := []models.CurrentPrice{
		{ItemID: 1, HighPrice: &highPrice, LowPrice: &lowPrice, HighPriceTime: &now, LowPriceTime: &now},
		{ItemID: 2, HighPrice: &highPrice, LowPrice: &lowPrice, HighPriceTime: &now, LowPriceTime: &now},
	}

	for _, price := range prices {
		err := priceRepo.UpsertCurrentPrice(ctx, &price)
		require.NoError(t, err)
	}

	// Get all prices
	results, err := priceRepo.GetAllCurrentPrices(ctx)
	require.NoError(t, err)
	assert.Len(t, results, 2)
}
