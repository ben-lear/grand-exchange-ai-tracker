package testutil

import (
	"context"

	"github.com/guavi/osrs-ge-tracker/internal/models"
)

// NoopPriceService is a no-op implementation of PriceService for testing.
type NoopPriceService struct{}

func NewNoopPriceService() *NoopPriceService {
	return &NoopPriceService{}
}

func (n *NoopPriceService) GetCurrentPrice(_ context.Context, itemID int) (*models.CurrentPrice, error) {
	return nil, nil
}

func (n *NoopPriceService) GetCurrentPrices(_ context.Context, itemIDs []int) ([]models.CurrentPrice, error) {
	return []models.CurrentPrice{}, nil
}

func (n *NoopPriceService) GetBatchCurrentPrices(_ context.Context, itemIDs []int) ([]models.CurrentPrice, error) {
	return []models.CurrentPrice{}, nil
}

func (n *NoopPriceService) GetAllCurrentPrices(_ context.Context) ([]models.CurrentPrice, error) {
	return []models.CurrentPrice{}, nil
}

func (n *NoopPriceService) GetPriceHistory(_ context.Context, params models.PriceHistoryParams) (*models.PriceHistoryResponse, error) {
	return &models.PriceHistoryResponse{
		ItemID: params.ItemID,
		Period: string(params.Period),
		Data:   []models.PricePoint{},
		Count:  0,
	}, nil
}

func (n *NoopPriceService) UpdateCurrentPrice(_ context.Context, price *models.CurrentPrice) error {
	return nil
}

func (n *NoopPriceService) SyncCurrentPrices(_ context.Context) error {
	return nil
}

func (n *NoopPriceService) RunMaintenance(_ context.Context) error {
	return nil
}
