package services

import (
	"context"
	"fmt"
	"time"

	"go.uber.org/zap"

	"github.com/guavi/osrs-ge-tracker/internal/models"
	"github.com/guavi/osrs-ge-tracker/internal/repository"
)

const (
	cacheCurrentPriceAllTTL = 1 * time.Minute
	cacheCurrentPriceTTL    = 1 * time.Minute
	cachePriceHistoryTTL    = 10 * time.Minute
	cacheItemTTL            = 1 * time.Hour
)

// priceService implements PriceService
type priceService struct {
	priceRepo  repository.PriceRepository
	osrsClient OSRSClient
	cache      CacheService
	logger     *zap.SugaredLogger
}

// NewPriceService creates a new price service
func NewPriceService(
	priceRepo repository.PriceRepository,
	osrsClient OSRSClient,
	cache CacheService,
	logger *zap.SugaredLogger,
) PriceService {
	return &priceService{
		priceRepo:  priceRepo,
		osrsClient: osrsClient,
		cache:      cache,
		logger:     logger,
	}
}

// GetCurrentPrice returns the current price for an item
func (s *priceService) GetCurrentPrice(ctx context.Context, itemID int) (*models.CurrentPrice, error) {
	// Try cache first
	cacheKey := fmt.Sprintf("price:current:%d", itemID)
	var price models.CurrentPrice
	err := s.cache.GetJSON(ctx, cacheKey, &price)
	if err == nil {
		return &price, nil
	}

	// Fetch from database
	dbPrice, err := s.priceRepo.GetCurrentPrice(ctx, itemID)
	if err != nil {
		return nil, err
	}

	// Cache the result
	if dbPrice != nil {
		_ = s.cache.SetJSON(ctx, cacheKey, dbPrice, cacheCurrentPriceTTL)
	}

	return dbPrice, nil
}

// GetCurrentPrices returns current prices for multiple items
func (s *priceService) GetCurrentPrices(ctx context.Context, itemIDs []int) ([]models.CurrentPrice, error) {
	return s.priceRepo.GetCurrentPrices(ctx, itemIDs)
}

// GetAllCurrentPrices returns all current prices
func (s *priceService) GetAllCurrentPrices(ctx context.Context) ([]models.CurrentPrice, error) {
	// Try cache first
	cacheKey := "price:current:all"
	var prices []models.CurrentPrice
	err := s.cache.GetJSON(ctx, cacheKey, &prices)
	if err == nil && len(prices) > 0 {
		s.logger.Debug("Returning all current prices from cache")
		return prices, nil
	}

	// Fetch from database
	dbPrices, err := s.priceRepo.GetAllCurrentPrices(ctx)
	if err != nil {
		return nil, err
	}

	// Cache the result
	if len(dbPrices) > 0 {
		_ = s.cache.SetJSON(ctx, cacheKey, dbPrices, cacheCurrentPriceAllTTL)
	}

	return dbPrices, nil
}

// GetPriceHistory returns historical price data for an item
func (s *priceService) GetPriceHistory(ctx context.Context, params models.PriceHistoryParams) (*models.PriceHistoryResponse, error) {
	// Try cache first (only if period-based query)
	var cacheKey string
	if params.Period != "" {
		cacheKey = fmt.Sprintf("price:history:%d:%s", params.ItemID, params.Period)
		var response models.PriceHistoryResponse
		err := s.cache.GetJSON(ctx, cacheKey, &response)
		if err == nil {
			s.logger.Debugw("Returning price history from cache", "itemID", params.ItemID, "period", params.Period)
			return &response, nil
		}
	}

	// Fetch from database
	history, err := s.priceRepo.GetHistory(ctx, params)
	if err != nil {
		return nil, err
	}

	// Convert to PricePoint format
	dataPoints := make([]models.PricePoint, len(history))
	for i, h := range history {
		highPrice := int64(0)
		lowPrice := int64(0)
		if h.HighPrice != nil {
			highPrice = *h.HighPrice
		}
		if h.LowPrice != nil {
			lowPrice = *h.LowPrice
		}
		dataPoints[i] = models.PricePoint{
			Timestamp: h.Timestamp,
			HighPrice: highPrice,
			LowPrice:  lowPrice,
		}
	}

	response := &models.PriceHistoryResponse{
		ItemID:     params.ItemID,
		Period:     string(params.Period),
		DataPoints: dataPoints,
		Count:      len(dataPoints),
	}

	// Cache the result
	if cacheKey != "" && len(dataPoints) > 0 {
		_ = s.cache.SetJSON(ctx, cacheKey, response, cachePriceHistoryTTL)
	}

	return response, nil
}

// UpdateCurrentPrice updates the current price for an item
func (s *priceService) UpdateCurrentPrice(ctx context.Context, price *models.CurrentPrice) error {
	if err := s.priceRepo.UpsertCurrentPrice(ctx, price); err != nil {
		return err
	}

	// Invalidate cache
	cacheKey := fmt.Sprintf("price:current:%d", price.ItemID)
	_ = s.cache.Delete(ctx, cacheKey)
	_ = s.cache.Delete(ctx, "price:current:all")

	return nil
}

// SyncBulkPrices fetches and updates all prices from the bulk dump
func (s *priceService) SyncBulkPrices(ctx context.Context) error {
	s.logger.Info("Starting bulk price sync from OSRS API")

	// Fetch bulk dump
	bulkData, err := s.osrsClient.FetchBulkDump()
	if err != nil {
		return fmt.Errorf("failed to fetch bulk dump: %w", err)
	}

	// Convert to bulk update format
	updates := make([]models.BulkPriceUpdate, 0, len(bulkData))
	for itemID, item := range bulkData {
		highTime := time.Unix(item.HighTime, 0)
		lowTime := time.Unix(item.LowTime, 0)

		updates = append(updates, models.BulkPriceUpdate{
			ItemID:        itemID,
			HighPrice:     &item.High,
			HighPriceTime: &highTime,
			LowPrice:      &item.Low,
			LowPriceTime:  &lowTime,
		})
	}

	// Bulk upsert to database
	if err := s.priceRepo.BulkUpsertCurrentPrices(ctx, updates); err != nil {
		return fmt.Errorf("failed to bulk upsert prices: %w", err)
	}

	// Invalidate all price caches
	_ = s.cache.DeletePattern(ctx, "price:current:*")

	s.logger.Infow("Successfully synced bulk prices", "count", len(updates))
	return nil
}

// SyncHistoricalPrices fetches and stores historical price data for an item
func (s *priceService) SyncHistoricalPrices(ctx context.Context, itemID int, period string) error {
	s.logger.Infow("Syncing historical prices", "itemID", itemID, "period", period)

	var dataPoints []models.HistoricalDataPoint
	var err error

	// Fetch based on period
	switch period {
	case "sample":
		dataPoints, err = s.osrsClient.FetchSampleData(itemID)
	case "90d", "last90d":
		dataPoints, err = s.osrsClient.FetchHistoricalData(itemID, period)
	case "all":
		dataPoints, err = s.osrsClient.FetchAllHistoricalData(itemID)
	default:
		dataPoints, err = s.osrsClient.FetchSampleData(itemID)
	}

	if err != nil {
		return fmt.Errorf("failed to fetch historical data: %w", err)
	}

	if len(dataPoints) == 0 {
		s.logger.Warnw("No historical data points returned", "itemID", itemID)
		return nil
	}

	// Convert to bulk insert format
	inserts := make([]models.BulkHistoryInsert, len(dataPoints))
	for i, point := range dataPoints {
		timestamp := time.Unix(point.Timestamp, 0)
		inserts[i] = models.BulkHistoryInsert{
			ItemID:    itemID,
			HighPrice: &point.AvgPrice,
			LowPrice:  &point.Volume,
			Timestamp: timestamp,
		}
	}

	// Bulk insert to database
	if err := s.priceRepo.BulkInsertHistory(ctx, inserts); err != nil {
		return fmt.Errorf("failed to bulk insert history: %w", err)
	}

	// Invalidate history cache for this item
	_ = s.cache.DeletePattern(ctx, fmt.Sprintf("price:history:%d:*", itemID))

	s.logger.Infow("Successfully synced historical prices", "itemID", itemID, "count", len(inserts))
	return nil
}
