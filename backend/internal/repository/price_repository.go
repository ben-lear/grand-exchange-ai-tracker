package repository

import (
	"context"
	"fmt"
	"time"

	"go.uber.org/zap"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"

	"github.com/guavi/osrs-ge-tracker/internal/models"
)

// priceRepository implements PriceRepository
type priceRepository struct {
	db     *gorm.DB
	logger *zap.SugaredLogger
}

// NewPriceRepository creates a new price repository
func NewPriceRepository(db *gorm.DB, logger *zap.SugaredLogger) PriceRepository {
	return &priceRepository{
		db:     db,
		logger: logger,
	}
}

// GetCurrentPrice returns the current price for an item
func (r *priceRepository) GetCurrentPrice(ctx context.Context, itemID int) (*models.CurrentPrice, error) {
	var price models.CurrentPrice
	if err := r.db.WithContext(ctx).Where("item_id = ?", itemID).First(&price).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil
		}
		r.logger.Errorw("Failed to get current price", "itemID", itemID, "error", err)
		return nil, fmt.Errorf("failed to get current price: %w", err)
	}
	return &price, nil
}

// GetCurrentPrices returns current prices for specified items
func (r *priceRepository) GetCurrentPrices(ctx context.Context, itemIDs []int) ([]models.CurrentPrice, error) {
	if len(itemIDs) == 0 {
		return []models.CurrentPrice{}, nil
	}

	var prices []models.CurrentPrice
	if err := r.db.WithContext(ctx).Where("item_id IN ?", itemIDs).Find(&prices).Error; err != nil {
		r.logger.Errorw("Failed to get current prices", "itemIDs", itemIDs, "error", err)
		return nil, fmt.Errorf("failed to get current prices: %w", err)
	}
	return prices, nil
}

// GetAllCurrentPrices returns all current prices
func (r *priceRepository) GetAllCurrentPrices(ctx context.Context) ([]models.CurrentPrice, error) {
	var prices []models.CurrentPrice
	if err := r.db.WithContext(ctx).Find(&prices).Error; err != nil {
		r.logger.Errorw("Failed to get all current prices", "error", err)
		return nil, fmt.Errorf("failed to get all current prices: %w", err)
	}
	return prices, nil
}

// UpsertCurrentPrice creates or updates a current price
func (r *priceRepository) UpsertCurrentPrice(ctx context.Context, price *models.CurrentPrice) error {
	if err := r.db.WithContext(ctx).Clauses(clause.OnConflict{
		Columns:   []clause.Column{{Name: "item_id"}},
		DoUpdates: clause.AssignmentColumns([]string{"high_price", "high_price_time", "low_price", "low_price_time", "updated_at"}),
	}).Create(price).Error; err != nil {
		r.logger.Errorw("Failed to upsert current price", "itemID", price.ItemID, "error", err)
		return fmt.Errorf("failed to upsert current price: %w", err)
	}
	return nil
}

// BulkUpsertCurrentPrices creates or updates multiple current prices
func (r *priceRepository) BulkUpsertCurrentPrices(ctx context.Context, updates []models.BulkPriceUpdate) error {
	if len(updates) == 0 {
		return nil
	}

	// Convert to CurrentPrice models
	prices := make([]models.CurrentPrice, len(updates))
	for i, update := range updates {
		prices[i] = models.CurrentPrice{
			ItemID:        update.ItemID,
			HighPrice:     update.HighPrice,
			HighPriceTime: update.HighPriceTime,
			LowPrice:      update.LowPrice,
			LowPriceTime:  update.LowPriceTime,
			UpdatedAt:     time.Now(),
		}
	}

	// Batch size for bulk inserts
	batchSize := 1000
	for i := 0; i < len(prices); i += batchSize {
		end := i + batchSize
		if end > len(prices) {
			end = len(prices)
		}

		batch := prices[i:end]
		if err := r.db.WithContext(ctx).Clauses(clause.OnConflict{
			Columns:   []clause.Column{{Name: "item_id"}},
			DoUpdates: clause.AssignmentColumns([]string{"high_price", "high_price_time", "low_price", "low_price_time", "updated_at"}),
		}).Create(&batch).Error; err != nil {
			r.logger.Errorw("Failed to bulk upsert current prices", "batch", i/batchSize, "error", err)
			return fmt.Errorf("failed to bulk upsert current prices: %w", err)
		}
	}

	r.logger.Infow("Successfully bulk upserted current prices", "count", len(prices))
	return nil
}

// GetHistory returns price history for an item
func (r *priceRepository) GetHistory(ctx context.Context, params models.PriceHistoryParams) ([]models.PriceHistory, error) {
	query := r.db.WithContext(ctx).Where("item_id = ?", params.ItemID)

	// Apply time filters
	if params.StartTime != nil {
		query = query.Where("timestamp >= ?", *params.StartTime)
	}
	if params.EndTime != nil {
		query = query.Where("timestamp <= ?", *params.EndTime)
	} else if params.Period != "" && params.Period != models.PeriodAll {
		duration := params.Period.Duration()
		if duration > 0 {
			startTime := time.Now().Add(-duration)
			query = query.Where("timestamp >= ?", startTime)
		}
	}

	// Apply ordering
	query = query.Order("timestamp DESC")

	// Apply limit
	if params.Limit > 0 {
		query = query.Limit(params.Limit)
	}

	var history []models.PriceHistory
	if err := query.Find(&history).Error; err != nil {
		r.logger.Errorw("Failed to get price history", "itemID", params.ItemID, "error", err)
		return nil, fmt.Errorf("failed to get price history: %w", err)
	}

	// If maxPoints is set and we have too many points, sample them
	if params.MaxPoints != nil && len(history) > *params.MaxPoints {
		history = samplePriceHistory(history, *params.MaxPoints)
	}

	return history, nil
}

// samplePriceHistory samples price history to a target number of points
func samplePriceHistory(history []models.PriceHistory, targetPoints int) []models.PriceHistory {
	if len(history) <= targetPoints {
		return history
	}

	step := float64(len(history)) / float64(targetPoints)
	sampled := make([]models.PriceHistory, targetPoints)

	for i := 0; i < targetPoints; i++ {
		idx := int(float64(i) * step)
		if idx >= len(history) {
			idx = len(history) - 1
		}
		sampled[i] = history[idx]
	}

	return sampled
}

// InsertHistory inserts a price history record
func (r *priceRepository) InsertHistory(ctx context.Context, history *models.PriceHistory) error {
	if err := r.db.WithContext(ctx).Create(history).Error; err != nil {
		r.logger.Errorw("Failed to insert price history", "itemID", history.ItemID, "error", err)
		return fmt.Errorf("failed to insert price history: %w", err)
	}
	return nil
}

// BulkInsertHistory inserts multiple price history records
func (r *priceRepository) BulkInsertHistory(ctx context.Context, inserts []models.BulkHistoryInsert) error {
	if len(inserts) == 0 {
		return nil
	}

	// Convert to PriceHistory models
	history := make([]models.PriceHistory, len(inserts))
	for i, insert := range inserts {
		history[i] = models.PriceHistory{
			ItemID:    insert.ItemID,
			HighPrice: insert.HighPrice,
			LowPrice:  insert.LowPrice,
			Timestamp: insert.Timestamp,
		}
	}

	// Batch size for bulk inserts
	batchSize := 1000
	for i := 0; i < len(history); i += batchSize {
		end := i + batchSize
		if end > len(history) {
			end = len(history)
		}

		batch := history[i:end]
		if err := r.db.WithContext(ctx).Create(&batch).Error; err != nil {
			r.logger.Errorw("Failed to bulk insert price history", "batch", i/batchSize, "error", err)
			return fmt.Errorf("failed to bulk insert price history: %w", err)
		}
	}

	r.logger.Infow("Successfully bulk inserted price history", "count", len(history))
	return nil
}

// GetLatestHistoryTimestamp returns the most recent timestamp for an item's history
func (r *priceRepository) GetLatestHistoryTimestamp(ctx context.Context, itemID int) (*models.PriceHistory, error) {
	var history models.PriceHistory
	if err := r.db.WithContext(ctx).
		Where("item_id = ?", itemID).
		Order("timestamp DESC").
		First(&history).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil
		}
		r.logger.Errorw("Failed to get latest history timestamp", "itemID", itemID, "error", err)
		return nil, fmt.Errorf("failed to get latest history timestamp: %w", err)
	}
	return &history, nil
}

// DeleteOldHistory deletes price history older than the specified timestamp
func (r *priceRepository) DeleteOldHistory(ctx context.Context, itemID int, beforeTime int64) error {
	timestamp := time.Unix(beforeTime, 0)
	result := r.db.WithContext(ctx).
		Where("item_id = ? AND timestamp < ?", itemID, timestamp).
		Delete(&models.PriceHistory{})

	if result.Error != nil {
		r.logger.Errorw("Failed to delete old history", "itemID", itemID, "error", result.Error)
		return fmt.Errorf("failed to delete old history: %w", result.Error)
	}

	if result.RowsAffected > 0 {
		r.logger.Infow("Deleted old price history", "itemID", itemID, "rowsDeleted", result.RowsAffected)
	}

	return nil
}
