package repository

import (
	"context"

	"github.com/guavi/grand-exchange-ai-tracker/internal/models"
	"gorm.io/gorm"
)

type itemRepository struct {
	db *gorm.DB
}

// NewItemRepository creates a new item repository
func NewItemRepository(db *gorm.DB) ItemRepository {
	return &itemRepository{db: db}
}

func (r *itemRepository) Create(ctx context.Context, item *models.Item) error {
	return r.db.WithContext(ctx).Create(item).Error
}

func (r *itemRepository) GetByID(ctx context.Context, id uint) (*models.Item, error) {
	var item models.Item
	err := r.db.WithContext(ctx).First(&item, id).Error
	if err != nil {
		return nil, err
	}
	return &item, nil
}

func (r *itemRepository) GetByItemID(ctx context.Context, itemID int) (*models.Item, error) {
	var item models.Item
	err := r.db.WithContext(ctx).Where("item_id = ?", itemID).First(&item).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			// Not finding an item is expected during initial sync; return nil without error
			return nil, nil
		}
		return nil, err
	}
	return &item, nil
}

func (r *itemRepository) List(ctx context.Context, limit, offset int, search string, members *bool, sort, order string) ([]models.Item, error) {
	var items []models.Item
	query := r.db.WithContext(ctx)

	// Apply search filter
	if search != "" {
		query = query.Where("name ILIKE ?", "%"+search+"%")
	}

	// Apply members filter
	if members != nil {
		query = query.Where("members = ?", *members)
	}

	// Apply sorting
	if sort == "" {
		sort = "name"
	}
	if order != "desc" {
		order = "asc"
	}
	query = query.Order(sort + " " + order)

	err := query.Offset(offset).Limit(limit).Find(&items).Error
	return items, err
}

func (r *itemRepository) Search(ctx context.Context, query string, offset, limit int) ([]*models.Item, error) {
	var items []*models.Item
	err := r.db.WithContext(ctx).
		Where("name ILIKE ?", "%"+query+"%").
		Offset(offset).
		Limit(limit).
		Order("name ASC").
		Find(&items).Error
	return items, err
}

func (r *itemRepository) Update(ctx context.Context, item *models.Item) error {
	return r.db.WithContext(ctx).Save(item).Error
}

func (r *itemRepository) Delete(ctx context.Context, id uint) error {
	return r.db.WithContext(ctx).Delete(&models.Item{}, id).Error
}

func (r *itemRepository) Count(ctx context.Context, search string, members *bool) (int, error) {
	var count int64
	query := r.db.WithContext(ctx).Model(&models.Item{})

	// Apply search filter
	if search != "" {
		query = query.Where("name ILIKE ?", "%"+search+"%")
	}

	// Apply members filter
	if members != nil {
		query = query.Where("members = ?", *members)
	}

	err := query.Count(&count).Error
	return int(count), err
}
