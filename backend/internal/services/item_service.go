package services

import (
	"context"
	"fmt"

	"go.uber.org/zap"

	"github.com/guavi/osrs-ge-tracker/internal/models"
	"github.com/guavi/osrs-ge-tracker/internal/repository"
)

// itemService implements ItemService
type itemService struct {
	itemRepo   repository.ItemRepository
	osrsClient OSRSClient
	cache      CacheService
	logger     *zap.SugaredLogger
}

// NewItemService creates a new item service
func NewItemService(
	itemRepo repository.ItemRepository,
	cache CacheService,
	logger *zap.SugaredLogger,
) ItemService {
	return &itemService{
		itemRepo:   itemRepo,
		osrsClient: NewOSRSClient(logger),
		cache:      cache,
		logger:     logger,
	}
}

// ListItems returns all items with pagination (alias for GetAllItems)
func (s *itemService) ListItems(ctx context.Context, params models.ItemListParams) ([]models.Item, int64, error) {
	return s.GetAllItems(ctx, params)
}

// GetAllItems returns all items with pagination
func (s *itemService) GetAllItems(ctx context.Context, params models.ItemListParams) ([]models.Item, int64, error) {
	return s.itemRepo.GetAll(ctx, params)
}

// GetItemByID returns an item by its internal ID
func (s *itemService) GetItemByID(ctx context.Context, id uint) (*models.Item, error) {
	return s.itemRepo.GetByID(ctx, id)
}

// GetItemByItemID returns an item by its OSRS item ID
func (s *itemService) GetItemByItemID(ctx context.Context, itemID int) (*models.Item, error) {
	// Try cache first
	cacheKey := fmt.Sprintf("item:%d", itemID)
	var item models.Item
	err := s.cache.GetJSON(ctx, cacheKey, &item)
	if err == nil {
		return &item, nil
	}

	// Fetch from database
	dbItem, err := s.itemRepo.GetByItemID(ctx, itemID)
	if err != nil {
		return nil, err
	}

	// Cache the result
	if dbItem != nil {
		_ = s.cache.SetJSON(ctx, cacheKey, dbItem, cacheItemTTL)
	}

	return dbItem, nil
}

// GetItemWithPrice returns an item with its current price
func (s *itemService) GetItemWithPrice(ctx context.Context, itemID int) (*models.ItemWithCurrentPrice, error) {
	// Get item
	item, err := s.GetItemByItemID(ctx, itemID)
	if err != nil {
		return nil, err
	}
	if item == nil {
		return nil, fmt.Errorf("item not found")
	}

	result := &models.ItemWithCurrentPrice{
		Item: *item,
	}

	return result, nil
}

// GetItemCount returns the count of items
func (s *itemService) GetItemCount(ctx context.Context, members *bool) (int64, error) {
	params := models.ItemListParams{
		Members: members,
		Limit:   1,
		Offset:  0,
	}
	_, count, err := s.itemRepo.GetAll(ctx, params)
	return count, err
}

// SearchItems searches for items by name
func (s *itemService) SearchItems(ctx context.Context, params models.ItemSearchParams) ([]models.Item, error) {
	items, _, err := s.itemRepo.Search(ctx, params)
	return items, err
}

// UpsertItem creates or updates an item
func (s *itemService) UpsertItem(ctx context.Context, item *models.Item) error {
	if err := s.itemRepo.Upsert(ctx, item); err != nil {
		return err
	}

	// Invalidate cache
	cacheKey := fmt.Sprintf("item:%d", item.ItemID)
	_ = s.cache.Delete(ctx, cacheKey)

	return nil
}

// BulkUpsertItems creates or updates multiple items
func (s *itemService) BulkUpsertItems(ctx context.Context, items []models.Item) error {
	if err := s.itemRepo.BulkUpsert(ctx, items); err != nil {
		return err
	}

	// Invalidate cache for all items
	_ = s.cache.DeletePattern(ctx, "item:*")

	return nil
}

// SyncItemFromAPI fetches item details from OSRS API and updates the database
func (s *itemService) SyncItemFromAPI(ctx context.Context, itemID int) (*models.Item, error) {
	s.logger.Infow("Syncing item from OSRS API", "itemID", itemID)

	// Fetch item detail from API
	detail, err := s.osrsClient.FetchItemDetail(itemID)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch item detail: %w", err)
	}

	// Convert to Item model
	members := detail.Members == "true"
	item := &models.Item{
		ItemID:  detail.ID,
		Name:    detail.Name,
		IconURL: detail.Icon,
		Members: members,
	}

	// Upsert to database
	if err := s.UpsertItem(ctx, item); err != nil {
		return nil, fmt.Errorf("failed to upsert item: %w", err)
	}

	s.logger.Infow("Successfully synced item from API", "itemID", itemID, "name", item.Name)
	return item, nil
}
