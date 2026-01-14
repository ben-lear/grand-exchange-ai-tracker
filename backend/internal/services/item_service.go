package services

import (
	"context"
	"fmt"
	"strings"

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

const osrsSpriteIconURLTemplate = "https://secure.runescape.com/m=itemdb_oldschool/obj_sprite.gif?id=%d"

func normalizeItemIconURL(itemID int, iconURL string) string {
	trimmed := strings.TrimSpace(iconURL)
	if itemID <= 0 {
		// Can't build a fallback URL without an ID.
		if strings.HasPrefix(trimmed, "http://") {
			return "https://" + strings.TrimPrefix(trimmed, "http://")
		}
		return trimmed
	}

	if trimmed == "" {
		return fmt.Sprintf(osrsSpriteIconURLTemplate, itemID)
	}

	// Avoid mixed-content blocks.
	if strings.HasPrefix(trimmed, "http://") {
		return "https://" + strings.TrimPrefix(trimmed, "http://")
	}
	if strings.HasPrefix(trimmed, "https://") {
		return trimmed
	}

	// Handle protocol-relative URLs.
	if strings.HasPrefix(trimmed, "//") {
		return "https:" + trimmed
	}

	// Handle path-only URLs from the RuneScape domain.
	if strings.HasPrefix(trimmed, "/") {
		return "https://secure.runescape.com" + trimmed
	}

	// Unknown/relative icon formats (e.g. a filename from a dump): fall back to a stable sprite URL.
	return fmt.Sprintf(osrsSpriteIconURLTemplate, itemID)
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
	items, total, err := s.itemRepo.GetAll(ctx, params)
	if err != nil {
		return nil, 0, err
	}
	for i := range items {
		items[i].IconURL = normalizeItemIconURL(items[i].ItemID, items[i].IconURL)
	}
	return items, total, nil
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
		item.IconURL = normalizeItemIconURL(item.ItemID, item.IconURL)
		return &item, nil
	}

	// Fetch from database
	dbItem, err := s.itemRepo.GetByItemID(ctx, itemID)
	if err != nil {
		return nil, err
	}
	if dbItem != nil {
		dbItem.IconURL = normalizeItemIconURL(dbItem.ItemID, dbItem.IconURL)
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
	if err != nil {
		return nil, err
	}
	for i := range items {
		items[i].IconURL = normalizeItemIconURL(items[i].ItemID, items[i].IconURL)
	}
	return items, nil
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
		IconURL: normalizeItemIconURL(detail.ID, detail.Icon),
		Members: members,
	}

	// Upsert to database
	if err := s.UpsertItem(ctx, item); err != nil {
		return nil, fmt.Errorf("failed to upsert item: %w", err)
	}

	s.logger.Infow("Successfully synced item from API", "itemID", itemID, "name", item.Name)
	return item, nil
}

// SyncItemsFromBulkDump fetches the bulk dump and syncs all items to the database
func (s *itemService) SyncItemsFromBulkDump(ctx context.Context) error {
	s.logger.Info("Starting bulk sync of items from OSRS API")

	// Fetch bulk dump
	bulkData, err := s.osrsClient.FetchBulkDump()
	if err != nil {
		return fmt.Errorf("failed to fetch bulk dump: %w", err)
	}

	s.logger.Infow("Fetched bulk dump", "itemCount", len(bulkData))

	// Convert to Item models
	items := make([]models.Item, 0, len(bulkData))
	for _, bulkItem := range bulkData {
		members := false
		if bulkItem.Members != nil {
			members = *bulkItem.Members
		}

		// Convert int64 pointers to int pointers
		var buyLimit, lowAlch, highAlch *int
		if bulkItem.Limit != nil {
			limit := int(*bulkItem.Limit)
			buyLimit = &limit
		}
		if bulkItem.LowAlch != nil {
			low := int(*bulkItem.LowAlch)
			lowAlch = &low
		}
		if bulkItem.HighAlch != nil {
			high := int(*bulkItem.HighAlch)
			highAlch = &high
		}

		item := models.Item{
			ItemID:   bulkItem.ItemID,
			Name:     bulkItem.Name,
			IconURL:  normalizeItemIconURL(bulkItem.ItemID, bulkItem.Icon),
			Members:  members,
			BuyLimit: buyLimit,
			LowAlch:  lowAlch,
			HighAlch: highAlch,
		}
		items = append(items, item)
	}

	// Bulk upsert to database
	if err := s.BulkUpsertItems(ctx, items); err != nil {
		return fmt.Errorf("failed to bulk upsert items: %w", err)
	}

	s.logger.Infow("Successfully synced items from bulk dump", "itemCount", len(items))
	return nil
}
