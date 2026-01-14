package repository

import (
	"context"

	"github.com/guavi/grand-exchange-ai-tracker/internal/models"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

type priceTrendRepository struct {
	db *gorm.DB
}

// NewPriceTrendRepository creates a new price trend repository
func NewPriceTrendRepository(db *gorm.DB) PriceTrendRepository {
	return &priceTrendRepository{db: db}
}

func (r *priceTrendRepository) Upsert(ctx context.Context, trend *models.PriceTrend) error {
	return r.db.WithContext(ctx).
		Clauses(clause.OnConflict{
			Columns: []clause.Column{{Name: "item_id"}},
			DoUpdates: clause.AssignmentColumns([]string{
				"current_price", "current_trend", "today_price_change", "today_trend",
				"day30_change", "day30_trend", "day90_change", "day90_trend",
				"day180_change", "day180_trend", "updated_at",
			}),
		}).
		Create(trend).Error
}

func (r *priceTrendRepository) GetByItemID(ctx context.Context, itemID uint) (*models.PriceTrend, error) {
	var trend models.PriceTrend
	err := r.db.WithContext(ctx).Where("item_id = ?", itemID).First(&trend).Error
	if err != nil {
		return nil, err
	}
	return &trend, nil
}

func (r *priceTrendRepository) List(ctx context.Context, offset, limit int) ([]*models.PriceTrend, error) {
	var trends []*models.PriceTrend
	err := r.db.WithContext(ctx).
		Offset(offset).
		Limit(limit).
		Order("updated_at DESC").
		Find(&trends).Error
	return trends, err
}

func (r *priceTrendRepository) Delete(ctx context.Context, itemID uint) error {
	return r.db.WithContext(ctx).Where("item_id = ?", itemID).Delete(&models.PriceTrend{}).Error
}

// GetTopTrending returns items with the biggest price changes
func (r *priceTrendRepository) GetTopTrending(ctx context.Context, limit, hours int) ([]models.PriceTrend, error) {
	var trends []models.PriceTrend

	// For now, return based on current_price (DESC) as a proxy for trending
	// In a real implementation, you'd calculate based on time window
	err := r.db.WithContext(ctx).
		Where("current_price > 0").
		Order("current_price DESC").
		Limit(limit).
		Find(&trends).Error

	return trends, err
}

// GetBiggestMovers returns items with biggest price changes
func (r *priceTrendRepository) GetBiggestMovers(ctx context.Context, limit, hours int, ascending bool) ([]models.PriceTrend, error) {
	var trends []models.PriceTrend

	order := "today_price_change DESC"
	if ascending {
		order = "today_price_change ASC"
	}

	err := r.db.WithContext(ctx).
		Where("today_price_change != 0").
		Order(order).
		Limit(limit).
		Find(&trends).Error

	return trends, err
}
