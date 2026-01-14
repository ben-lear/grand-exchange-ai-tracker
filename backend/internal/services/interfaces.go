package services

import (
	"context"
	"time"

	"github.com/guavi/osrs-ge-tracker/internal/models"
)

// ItemService defines the interface for item business logic
type ItemService interface {
	// ListItems returns all items with pagination
	ListItems(ctx context.Context, params models.ItemListParams) ([]models.Item, int64, error)

	// GetAllItems returns all items with pagination
	GetAllItems(ctx context.Context, params models.ItemListParams) ([]models.Item, int64, error)

	// GetItemByID returns an item by its internal ID
	GetItemByID(ctx context.Context, id uint) (*models.Item, error)

	// GetItemByItemID returns an item by its OSRS item ID
	GetItemByItemID(ctx context.Context, itemID int) (*models.Item, error)

	// GetItemWithPrice returns an item with its current price
	GetItemWithPrice(ctx context.Context, itemID int) (*models.ItemWithCurrentPrice, error)

	// SearchItems searches for items by name
	SearchItems(ctx context.Context, params models.ItemSearchParams) ([]models.Item, error)

	// GetItemCount returns the count of items
	GetItemCount(ctx context.Context, members *bool) (int64, error)

	// UpsertItem creates or updates an item
	UpsertItem(ctx context.Context, item *models.Item) error

	// BulkUpsertItems creates or updates multiple items
	BulkUpsertItems(ctx context.Context, items []models.Item) error

	// SyncItemsFromMapping fetches the OSRS Wiki /mapping list and syncs all items to the database.
	SyncItemsFromMapping(ctx context.Context) error
}

// PriceService defines the interface for price business logic
type PriceService interface {
	// GetCurrentPrice returns the current price for an item
	GetCurrentPrice(ctx context.Context, itemID int) (*models.CurrentPrice, error)

	// GetCurrentPrices returns current prices for multiple items
	GetCurrentPrices(ctx context.Context, itemIDs []int) ([]models.CurrentPrice, error)

	// GetBatchCurrentPrices returns current prices for a batch of items
	GetBatchCurrentPrices(ctx context.Context, itemIDs []int) ([]models.CurrentPrice, error)

	// GetAllCurrentPrices returns all current prices
	GetAllCurrentPrices(ctx context.Context) ([]models.CurrentPrice, error)

	// GetPriceHistory returns historical price data for an item
	GetPriceHistory(ctx context.Context, params models.PriceHistoryParams) (*models.PriceHistoryResponse, error)

	// UpdateCurrentPrice updates the current price for an item
	UpdateCurrentPrice(ctx context.Context, price *models.CurrentPrice) error

	// SyncCurrentPrices fetches and updates all current prices from the OSRS Wiki /latest endpoint
	SyncCurrentPrices(ctx context.Context) error

	// RunMaintenance performs retention pruning and rollups for realtime price tables.
	RunMaintenance(ctx context.Context) error
}

// CacheService defines the interface for caching operations
type CacheService interface {
	// Get retrieves a value from cache
	Get(ctx context.Context, key string) (string, error)

	// Set stores a value in cache with expiration
	Set(ctx context.Context, key string, value string, expiration time.Duration) error

	// Delete removes a value from cache
	Delete(ctx context.Context, key string) error

	// DeletePattern removes all keys matching a pattern
	DeletePattern(ctx context.Context, pattern string) error

	// GetJSON retrieves and unmarshals a JSON value from cache
	GetJSON(ctx context.Context, key string, dest interface{}) error

	// SetJSON marshals and stores a JSON value in cache
	SetJSON(ctx context.Context, key string, value interface{}, expiration time.Duration) error

	// Exists checks if a key exists in cache
	Exists(ctx context.Context, key string) (bool, error)
}
