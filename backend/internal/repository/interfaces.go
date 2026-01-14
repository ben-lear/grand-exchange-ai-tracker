package repository

import (
	"context"

	"github.com/guavi/grand-exchange-ai-tracker/internal/models"
)

// ItemRepository defines the interface for item data operations
type ItemRepository interface {
	Create(ctx context.Context, item *models.Item) error
	GetByID(ctx context.Context, id uint) (*models.Item, error)
	GetByItemID(ctx context.Context, itemID int) (*models.Item, error)
	List(ctx context.Context, limit, offset int, search string, members *bool, sort, order string) ([]models.Item, error)
	Search(ctx context.Context, query string, offset, limit int) ([]*models.Item, error)
	Update(ctx context.Context, item *models.Item) error
	Delete(ctx context.Context, id uint) error
	Count(ctx context.Context, search string, members *bool) (int, error)
}

// PriceHistoryRepository defines the interface for price history operations
type PriceHistoryRepository interface {
	Create(ctx context.Context, history *models.PriceHistory) error
	BatchCreate(ctx context.Context, histories []*models.PriceHistory) error
	GetByItemIDAndTimeRange(ctx context.Context, itemID uint, startTime, endTime int64) ([]models.PriceHistory, error)
	GetByItemID(ctx context.Context, itemID uint, startTime, endTime int64, limit int) ([]*models.PriceHistory, error)
	GetLatest(ctx context.Context, itemID uint) (*models.PriceHistory, error)
	DeleteOlderThan(ctx context.Context, timestamp int64) error
}

// PriceTrendRepository defines the interface for price trend operations
type PriceTrendRepository interface {
	Upsert(ctx context.Context, trend *models.PriceTrend) error
	GetByItemID(ctx context.Context, itemID uint) (*models.PriceTrend, error)
	List(ctx context.Context, offset, limit int) ([]*models.PriceTrend, error)
	GetTopTrending(ctx context.Context, limit, hours int) ([]models.PriceTrend, error)
	GetBiggestMovers(ctx context.Context, limit, hours int, ascending bool) ([]models.PriceTrend, error)
	Delete(ctx context.Context, itemID uint) error
}
