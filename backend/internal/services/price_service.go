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
	itemRepo repository.ItemRepository,
	cache CacheService,
	osrsClient OSRSClient,
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

// GetBatchCurrentPrices returns current prices for a batch of items (alias for GetCurrentPrices)
func (s *priceService) GetBatchCurrentPrices(ctx context.Context, itemIDs []int) ([]models.CurrentPrice, error) {
	return s.GetCurrentPrices(ctx, itemIDs)
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

	// If no rows exist for this period, immediately seed from WeirdGloop/OSRS history API
	// so the frontend chart doesn't stay empty.
	if len(history) == 0 {
		seedErr := s.seedHistoryOnDemand(ctx, params.ItemID, params.Period)
		if seedErr != nil {
			s.logger.Warnw("Failed to seed history on demand", "itemID", params.ItemID, "period", params.Period, "error", seedErr)
		} else {
			// Re-query once after seeding.
			history, err = s.priceRepo.GetHistory(ctx, params)
			if err != nil {
				return nil, err
			}
		}
	}

	// Convert to PricePoint format
	dataPoints := make([]models.PricePoint, len(history))
	var firstDate, lastDate *time.Time

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

		// Track earliest and latest timestamps (repo returns DESC order)
		if firstDate == nil || h.Timestamp.Before(*firstDate) {
			t := h.Timestamp
			firstDate = &t
		}
		if lastDate == nil || h.Timestamp.After(*lastDate) {
			t := h.Timestamp
			lastDate = &t
		}
	}

	response := &models.PriceHistoryResponse{
		ItemID:    params.ItemID,
		Period:    string(params.Period),
		Data:      dataPoints,
		Count:     len(dataPoints),
		FirstDate: firstDate,
		LastDate:  lastDate,
	}

	// Cache the result
	if cacheKey != "" && len(dataPoints) > 0 {
		_ = s.cache.SetJSON(ctx, cacheKey, response, cachePriceHistoryTTL)
	}

	return response, nil
}

func (s *priceService) seedHistoryOnDemand(ctx context.Context, itemID int, period models.TimePeriod) error {
	// Cooldown so repeated requests for an empty item don't hammer the external API.
	// This is best-effort (no strict locking) since CacheService doesn't expose SETNX.
	cooldownKey := fmt.Sprintf("price:history:seed:cooldown:%d", itemID)
	exists, err := s.cache.Exists(ctx, cooldownKey)
	if err == nil && exists {
		return nil
	}
	_ = s.cache.Set(ctx, cooldownKey, "1", 2*time.Minute)

	// For any short-range chart (and as a general baseline), seed with last90d.
	// This ensures 24h/7d/30d/90d queries have recent data.
	dataPoints, err := s.osrsClient.FetchHistoricalData(itemID, "90d")
	if err != nil {
		return fmt.Errorf("fetch last90d history: %w", err)
	}

	// If last90d returns nothing, fall back to the sampled endpoint.
	if len(dataPoints) == 0 {
		dataPoints, err = s.osrsClient.FetchSampleData(itemID)
		if err != nil {
			return fmt.Errorf("fetch sample history: %w", err)
		}
	}

	// For long-range views, also add sampled points (cheap) to widen coverage.
	if (period == models.Period1Year || period == models.PeriodAll) && len(dataPoints) > 0 {
		more, moreErr := s.osrsClient.FetchSampleData(itemID)
		if moreErr == nil && len(more) > 0 {
			dataPoints = append(dataPoints, more...)
		}
	}

	if len(dataPoints) == 0 {
		s.logger.Warnw("No history data points returned during on-demand seed", "itemID", itemID, "period", period)
		return nil
	}

	inserts := make([]models.BulkHistoryInsert, 0, len(dataPoints))
	for _, point := range dataPoints {
		timestamp := point.Timestamp

		if timestamp.Year() < 1970 || timestamp.Year() > 2100 {
			s.logger.Warnw("Skipping invalid timestamp during on-demand seed",
				"itemID", itemID,
				"timestamp", timestamp,
				"raw", point.Timestamp)
			continue
		}

		high := point.Price
		low := point.Price
		inserts = append(inserts, models.BulkHistoryInsert{
			ItemID:    itemID,
			HighPrice: &high,
			LowPrice:  &low,
			Timestamp: timestamp,
		})
	}

	if len(inserts) == 0 {
		return nil
	}

	if err := s.priceRepo.BulkInsertHistory(ctx, inserts); err != nil {
		return fmt.Errorf("bulk insert seeded history: %w", err)
	}

	// Invalidate history cache for this item so the next read can return seeded data.
	_ = s.cache.DeletePattern(ctx, fmt.Sprintf("price:history:%d:*", itemID))

	s.logger.Infow("Seeded price history on-demand", "itemID", itemID, "inserted", len(inserts), "period", period)
	return nil
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

// SyncCurrentPrices fetches and updates all current prices from the bulk dump (alias for SyncBulkPrices)
func (s *priceService) SyncCurrentPrices(ctx context.Context) error {
	return s.SyncBulkPrices(ctx)
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
	now := time.Now()

	for itemID, item := range bulkData {
		// Skip items without price data
		if item.Price == nil && item.Last == nil {
			continue
		}

		// Use the current price as both high and low
		// The API returns 'price' and 'last' but not separate high/low values
		var highPrice, lowPrice int64
		if item.Price != nil {
			highPrice = *item.Price
		}
		if item.Last != nil {
			lowPrice = *item.Last
		}

		updates = append(updates, models.BulkPriceUpdate{
			ItemID:        itemID,
			HighPrice:     &highPrice,
			HighPriceTime: &now,
			LowPrice:      &lowPrice,
			LowPriceTime:  &now,
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
func (s *priceService) SyncHistoricalPrices(ctx context.Context, itemID int, fullHistory bool) error {
	s.logger.Infow("Syncing historical prices", "itemID", itemID, "fullHistory", fullHistory)

	var dataPoints []models.HistoricalDataPoint
	var err error

	// Fetch based on fullHistory flag
	if fullHistory {
		dataPoints, err = s.osrsClient.FetchAllHistoricalData(itemID)
	} else {
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
	inserts := make([]models.BulkHistoryInsert, 0, len(dataPoints))
	for _, point := range dataPoints {
		timestamp := point.Timestamp

		// Validate timestamp is within PostgreSQL's valid range (1970-2100 for safety)
		if timestamp.Year() < 1970 || timestamp.Year() > 2100 {
			s.logger.Warnw("Skipping invalid timestamp",
				"itemID", itemID,
				"timestamp", timestamp,
				"raw", point.Timestamp)
			continue
		}

		price := point.Price
		inserts = append(inserts, models.BulkHistoryInsert{
			ItemID:    itemID,
			HighPrice: &price,
			LowPrice:  &price,
			Timestamp: timestamp,
		})
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
