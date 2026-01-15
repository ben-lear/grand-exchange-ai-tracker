package testutil

import (
	"context"

	"github.com/guavi/osrs-ge-tracker/internal/models"
)

// NoopPriceService is a no-op implementation of PriceService for testing
type NoopPriceService struct{}

func NewNoopPriceService() *NoopPriceService {
	return &NoopPriceService{}
}

func (n *NoopPriceService) GetCurrentPrice(ctx context.Context, itemID int) (*models.CurrentPrice, error) {
	return nil, nil
}

func (n *NoopPriceService) GetCurrentPrices(ctx context.Context, itemIDs []int) ([]models.CurrentPrice, error) {
	return []models.CurrentPrice{}, nil
}

func (n *NoopPriceService) GetBatchCurrentPrices(ctx context.Context, itemIDs []int) ([]models.CurrentPrice, error) {
	return []models.CurrentPrice{}, nil
}

func (n *NoopPriceService) GetAllCurrentPrices(ctx context.Context) ([]models.CurrentPrice, error) {
	return []models.CurrentPrice{}, nil
}

func (n *NoopPriceService) GetPriceHistory(ctx context.Context, params models.PriceHistoryParams) (*models.PriceHistoryResponse, error) {
	return &models.PriceHistoryResponse{
		ItemID: params.ItemID,
		Period: string(params.Period),
		Data:   []models.PricePoint{},
		Count:  0,
	}, nil
}

func (n *NoopPriceService) UpdateCurrentPrice(ctx context.Context, price *models.CurrentPrice) error {
	return nil
}

func (n *NoopPriceService) SyncCurrentPrices(ctx context.Context) error {
	return nil
}

func (n *NoopPriceService) RunMaintenance(ctx context.Context) error {
	return nil
}
