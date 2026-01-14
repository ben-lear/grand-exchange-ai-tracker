package repository

import (
	"context"

	"github.com/guavi/osrs-ge-tracker/internal/models"
)

// ItemRepository defines the interface for item data operations
type ItemRepository interface {
	// GetAll returns all items with pagination
	GetAll(ctx context.Context, params models.ItemListParams) ([]models.Item, int64, error)
	
	// GetByID returns an item by its internal ID
	GetByID(ctx context.Context, id uint) (*models.Item, error)
	
	// GetByItemID returns an item by its OSRS item ID
	GetByItemID(ctx context.Context, itemID int) (*models.Item, error)
	
	// Search searches for items by name
	Search(ctx context.Context, params models.ItemSearchParams) ([]models.Item, int64, error)
	
	// Create creates a new item
	Create(ctx context.Context, item *models.Item) error
	
	// Update updates an existing item
	Update(ctx context.Context, item *models.Item) error
	
	// Upsert creates or updates an item
	Upsert(ctx context.Context, item *models.Item) error
	
	// BulkUpsert creates or updates multiple items
	BulkUpsert(ctx context.Context, items []models.Item) error
	
	// Delete deletes an item
	Delete(ctx context.Context, id uint) error
	
	// Count returns the total number of items
	Count(ctx context.Context) (int64, error)
}

// PriceRepository defines the interface for price data operations
type PriceRepository interface {
	// GetCurrentPrice returns the current price for an item
	GetCurrentPrice(ctx context.Context, itemID int) (*models.CurrentPrice, error)
	
	// GetCurrentPrices returns current prices for all items
	GetCurrentPrices(ctx context.Context, itemIDs []int) ([]models.CurrentPrice, error)
	
	// GetAllCurrentPrices returns all current prices
	GetAllCurrentPrices(ctx context.Context) ([]models.CurrentPrice, error)
	
	// UpsertCurrentPrice creates or updates a current price
	UpsertCurrentPrice(ctx context.Context, price *models.CurrentPrice) error
	
	// BulkUpsertCurrentPrices creates or updates multiple current prices
	BulkUpsertCurrentPrices(ctx context.Context, prices []models.BulkPriceUpdate) error
	
	// GetHistory returns price history for an item
	GetHistory(ctx context.Context, params models.PriceHistoryParams) ([]models.PriceHistory, error)
	
	// InsertHistory inserts a price history record
	InsertHistory(ctx context.Context, history *models.PriceHistory) error
	
	// BulkInsertHistory inserts multiple price history records
	BulkInsertHistory(ctx context.Context, history []models.BulkHistoryInsert) error
	
	// GetLatestHistoryTimestamp returns the most recent timestamp for an item's history
	GetLatestHistoryTimestamp(ctx context.Context, itemID int) (*models.PriceHistory, error)
	
	// DeleteOldHistory deletes price history older than the specified time
	DeleteOldHistory(ctx context.Context, itemID int, beforeTime int64) error
}
