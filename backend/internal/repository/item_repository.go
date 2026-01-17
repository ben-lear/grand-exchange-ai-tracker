package repository

import (
	"context"
	"errors"
	"fmt"

	"go.uber.org/zap"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"

	"github.com/guavi/osrs-ge-tracker/internal/models"
)

// itemRepository implements ItemRepository.
type itemRepository struct {
	dbClient *gorm.DB
	logger   *zap.SugaredLogger
}

// dbClient: Database client for executing GORM operations.
func NewItemRepository(dbClient *gorm.DB, logger *zap.SugaredLogger) ItemRepository {
	return &itemRepository{
		dbClient: dbClient,
		logger:   logger,
	}
}

// GetAll returns all items with pagination.
func (r *itemRepository) GetAll(ctx context.Context, params models.ItemListParams) ([]models.Item, int64, error) {
	var items []models.Item
	var total int64

	query := r.dbClient.WithContext(ctx).Model(&models.Item{})

	// Apply filters
	if params.Members != nil {
		query = query.Where("members = ?", *params.Members)
	}

	// Get total count
	if err := query.Count(&total).Error; err != nil {
		r.logger.Errorw("Failed to count items", "error", err)
		return nil, 0, fmt.Errorf("failed to count items: %w", err)
	}

	// Apply sorting
	sortBy := params.SortBy
	if sortBy == "" {
		sortBy = "name"
	}
	sortOrder := params.Order
	if sortOrder == "" {
		sortOrder = "asc"
	}
	query = query.Order(fmt.Sprintf("%s %s", sortBy, sortOrder))

	// Apply pagination
	if params.Limit > 0 {
		query = query.Limit(params.Limit)
	}
	if params.Offset > 0 {
		query = query.Offset(params.Offset)
	}

	// Execute query
	if err := query.Find(&items).Error; err != nil {
		r.logger.Errorw("Failed to get items", "error", err)
		return nil, 0, fmt.Errorf("failed to get items: %w", err)
	}

	return items, total, nil
}

// GetByID returns an item by its internal ID.
func (r *itemRepository) GetByID(ctx context.Context, id uint) (*models.Item, error) {
	var item models.Item
	if err := r.dbClient.WithContext(ctx).First(&item, id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		r.logger.Errorw("Failed to get item by ID", "id", id, "error", err)
		return nil, fmt.Errorf("failed to get item by ID: %w", err)
	}
	return &item, nil
}

// GetByItemID returns an item by its OSRS item ID.
func (r *itemRepository) GetByItemID(ctx context.Context, itemID int) (*models.Item, error) {
	var item models.Item
	if err := r.dbClient.WithContext(ctx).Where("item_id = ?", itemID).First(&item).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		r.logger.Errorw("Failed to get item by item_id", "itemID", itemID, "error", err)
		return nil, fmt.Errorf("failed to get item by item_id: %w", err)
	}
	return &item, nil
}

// Search searches for items by name.
func (r *itemRepository) Search(ctx context.Context, params models.ItemSearchParams) ([]models.Item, int64, error) {
	var items []models.Item
	var total int64

	query := r.dbClient.WithContext(ctx).Model(&models.Item{})

	// Apply search filter
	if params.Query != "" {
		searchPattern := "%" + params.Query + "%"
		query = query.Where("name ILIKE ?", searchPattern)
	}

	// Apply members filter
	if params.Members != nil {
		query = query.Where("members = ?", *params.Members)
	}

	// Get total count
	if err := query.Count(&total).Error; err != nil {
		r.logger.Errorw("Failed to count search results", "error", err)
		return nil, 0, fmt.Errorf("failed to count search results: %w", err)
	}

	// Apply sorting
	sortBy := params.SortBy
	if sortBy == "" {
		sortBy = "name"
	}
	sortOrder := params.SortOrder
	if sortOrder == "" {
		sortOrder = "asc"
	}
	query = query.Order(fmt.Sprintf("%s %s", sortBy, sortOrder))

	// Apply pagination
	if params.Limit > 0 {
		query = query.Limit(params.Limit)
	}
	if params.Offset > 0 {
		query = query.Offset(params.Offset)
	}

	// Execute query
	if err := query.Find(&items).Error; err != nil {
		r.logger.Errorw("Failed to search items", "error", err)
		return nil, 0, fmt.Errorf("failed to search items: %w", err)
	}

	return items, total, nil
}

// Create creates a new item.
func (r *itemRepository) Create(ctx context.Context, item *models.Item) error {
	if err := r.dbClient.WithContext(ctx).Create(item).Error; err != nil {
		r.logger.Errorw("Failed to create item", "itemID", item.ItemID, "error", err)
		return fmt.Errorf("failed to create item: %w", err)
	}
	return nil
}

// Update updates an existing item.
func (r *itemRepository) Update(ctx context.Context, item *models.Item) error {
	if err := r.dbClient.WithContext(ctx).Save(item).Error; err != nil {
		r.logger.Errorw("Failed to update item", "itemID", item.ItemID, "error", err)
		return fmt.Errorf("failed to update item: %w", err)
	}
	return nil
}

// Upsert creates or updates an item.
func (r *itemRepository) Upsert(ctx context.Context, item *models.Item) error {
	if err := r.dbClient.WithContext(ctx).Clauses(clause.OnConflict{
		Columns:   []clause.Column{{Name: "item_id"}},
		DoUpdates: clause.AssignmentColumns([]string{"name", "icon_url", "members", "buy_limit", "high_alch", "low_alch", "updated_at"}),
	}).Create(item).Error; err != nil {
		r.logger.Errorw("Failed to upsert item", "itemID", item.ItemID, "error", err)
		return fmt.Errorf("failed to upsert item: %w", err)
	}
	return nil
}

// BulkUpsert creates or updates multiple items.
func (r *itemRepository) BulkUpsert(ctx context.Context, items []models.Item) error {
	if len(items) == 0 {
		return nil
	}

	if err := r.dbClient.WithContext(ctx).Clauses(clause.OnConflict{
		Columns:   []clause.Column{{Name: "item_id"}},
		DoUpdates: clause.AssignmentColumns([]string{"name", "icon_url", "members", "buy_limit", "high_alch", "low_alch", "updated_at"}),
	}).Create(&items).Error; err != nil {
		r.logger.Errorw("Failed to bulk upsert items", "count", len(items), "error", err)
		return fmt.Errorf("failed to bulk upsert items: %w", err)
	}

	r.logger.Infow("Successfully bulk upserted items", "count", len(items))
	return nil
}

// Delete deletes an item.
func (r *itemRepository) Delete(ctx context.Context, id uint) error {
	if err := r.dbClient.WithContext(ctx).Delete(&models.Item{}, id).Error; err != nil {
		r.logger.Errorw("Failed to delete item", "id", id, "error", err)
		return fmt.Errorf("failed to delete item: %w", err)
	}
	return nil
}

// Count returns the total number of items.
func (r *itemRepository) Count(ctx context.Context) (int64, error) {
	var count int64
	if err := r.dbClient.WithContext(ctx).Model(&models.Item{}).Count(&count).Error; err != nil {
		r.logger.Errorw("Failed to count items", "error", err)
		return 0, fmt.Errorf("failed to count items: %w", err)
	}
	return count, nil
}
