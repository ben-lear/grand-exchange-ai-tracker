package repository

import (
	"context"

	"github.com/guavi/grand-exchange-ai-tracker/internal/models"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

type priceHistoryRepository struct {
	db *gorm.DB
}

// NewPriceHistoryRepository creates a new price history repository
func NewPriceHistoryRepository(db *gorm.DB) PriceHistoryRepository {
	return &priceHistoryRepository{db: db}
}

func (r *priceHistoryRepository) Create(ctx context.Context, history *models.PriceHistory) error {
	return r.db.WithContext(ctx).Create(history).Error
}

func (r *priceHistoryRepository) BatchCreate(ctx context.Context, histories []*models.PriceHistory) error {
	if len(histories) == 0 {
		return nil
	}
	
	// Use Clauses to handle conflicts - update price if timestamp already exists
	return r.db.WithContext(ctx).
		Clauses(clause.OnConflict{
			Columns:   []clause.Column{{Name: "item_id"}, {Name: "timestamp"}},
			DoUpdates: clause.AssignmentColumns([]string{"price", "volume"}),
		}).
		Create(&histories).Error
}

func (r *priceHistoryRepository) GetByItemID(ctx context.Context, itemID uint, startTime, endTime int64, limit int) ([]*models.PriceHistory, error) {
	var histories []*models.PriceHistory
	query := r.db.WithContext(ctx).Where("item_id = ?", itemID)
	
	if startTime > 0 {
		query = query.Where("timestamp >= ?", startTime)
	}
	if endTime > 0 {
		query = query.Where("timestamp <= ?", endTime)
	}
	
	query = query.Order("timestamp DESC")
	if limit > 0 {
		query = query.Limit(limit)
	}
	
	err := query.Find(&histories).Error
	return histories, err
}

// GetByItemIDAndTimeRange returns price history for an item in a time range (for handlers)
func (r *priceHistoryRepository) GetByItemIDAndTimeRange(ctx context.Context, itemID uint, startTime, endTime int64) ([]models.PriceHistory, error) {
	var histories []models.PriceHistory
	err := r.db.WithContext(ctx).
		Where("item_id = ? AND timestamp >= ? AND timestamp <= ?", itemID, startTime, endTime).
		Order("timestamp ASC").
		Find(&histories).Error
	return histories, err
}

func (r *priceHistoryRepository) GetLatest(ctx context.Context, itemID uint) (*models.PriceHistory, error) {
	var history models.PriceHistory
	err := r.db.WithContext(ctx).
		Where("item_id = ?", itemID).
		Order("timestamp DESC").
		First(&history).Error
	if err != nil {
		return nil, err
	}
	return &history, nil
}

func (r *priceHistoryRepository) DeleteOlderThan(ctx context.Context, timestamp int64) error {
	return r.db.WithContext(ctx).
		Where("timestamp < ?", timestamp).
		Delete(&models.PriceHistory{}).Error
}
