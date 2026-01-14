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
	wikiClient WikiPricesClient
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
	wikiPricesBaseURL string,
	logger *zap.SugaredLogger,
) ItemService {
	return &itemService{
		itemRepo:   itemRepo,
		wikiClient: NewWikiPricesClient(logger, wikiPricesBaseURL),
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

// SyncItemsFromMapping fetches the OSRS Wiki /mapping list and syncs all items to the database.
func (s *itemService) SyncItemsFromMapping(ctx context.Context) error {
	s.logger.Info("Starting items sync from OSRS Wiki mapping")

	mappingItems, err := s.wikiClient.FetchMapping(ctx)
	if err != nil {
		return fmt.Errorf("fetch wiki mapping: %w", err)
	}

	s.logger.Infow("Fetched wiki mapping", "itemCount", len(mappingItems))

	items := make([]models.Item, 0, len(mappingItems))
	for _, m := range mappingItems {
		if m.ID <= 0 {
			continue
		}
		name := strings.TrimSpace(m.Name)
		if name == "" {
			continue
		}

		var buyLimit *int
		if m.Limit > 0 {
			limit := m.Limit
			buyLimit = &limit
		}

		var lowAlch *int
		if m.LowAlch > 0 {
			v := int(m.LowAlch)
			lowAlch = &v
		}

		var highAlch *int
		if m.HighAlch > 0 {
			v := int(m.HighAlch)
			highAlch = &v
		}

		var examine *string
		if ex := strings.TrimSpace(m.Examine); ex != "" {
			examine = &ex
		}

		var value *int
		if m.Value > 0 {
			v := int(m.Value)
			value = &v
		}

		var iconName *string
		if icon := strings.TrimSpace(m.Icon); icon != "" {
			iconName = &icon
		}

		items = append(items, models.Item{
			ItemID:   m.ID,
			Name:     name,
			IconURL:  normalizeItemIconURL(m.ID, m.Icon),
			Members:  m.Members,
			BuyLimit: buyLimit,
			LowAlch:  lowAlch,
			HighAlch: highAlch,
			Examine:  examine,
			Value:    value,
			IconName: iconName,
		})
	}

	if err := s.BulkUpsertItems(ctx, items); err != nil {
		return fmt.Errorf("bulk upsert wiki mapping items: %w", err)
	}

	s.logger.Infow("Successfully synced items from wiki mapping", "itemCount", len(items))
	return nil
}
