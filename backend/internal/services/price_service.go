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
	itemRepo   repository.ItemRepository
	wikiClient WikiPricesClient
	cache      CacheService
	logger     *zap.SugaredLogger
}

// NewPriceService creates a new price service
func NewPriceService(
	priceRepo repository.PriceRepository,
	itemRepo repository.ItemRepository,
	cache CacheService,
	wikiPricesBaseURL string,
	logger *zap.SugaredLogger,
) PriceService {
	return &priceService{
		priceRepo:  priceRepo,
		itemRepo:   itemRepo,
		wikiClient: NewWikiPricesClient(logger, wikiPricesBaseURL),
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
	// Apply default MaxPoints if not specified
	if params.MaxPoints == nil {
		defaultMaxPoints := getDefaultMaxPoints(params.Period)
		params.MaxPoints = &defaultMaxPoints
	}

	// Try cache first (only if period-based query and not forcing refresh)
	var cacheKey string
	if params.Period != "" && !params.Refresh {
		cacheKey = fmt.Sprintf("price:history:%d:%s", params.ItemID, params.Period)
		var response models.PriceHistoryResponse
		err := s.cache.GetJSON(ctx, cacheKey, &response)
		if err == nil {
			s.logger.Debugw("Returning price history from cache", "itemID", params.ItemID, "period", params.Period)
			return &response, nil
		}
	} else if params.Period != "" && params.Refresh {
		// Force cache refresh by setting the cache key for later update
		cacheKey = fmt.Sprintf("price:history:%d:%s", params.ItemID, params.Period)
		s.logger.Debugw("Bypassing cache due to refresh=true", "itemID", params.ItemID, "period", params.Period)
	}

	source := periodToTimeseriesSource(params.Period)

	var dataPoints []models.PricePoint
	var firstDate, lastDate *time.Time

	if source.useDaily {
		points, err := s.priceRepo.GetDailyPoints(ctx, params.ItemID, params)
		if err != nil {
			return nil, err
		}

		if len(points) == 0 {
			if err := s.seedDailyFromWikiTimeseries(ctx, params.ItemID); err != nil {
				s.logger.Warnw("Failed to seed daily timeseries", "itemID", params.ItemID, "error", err)
			}
			points, err = s.priceRepo.GetDailyPoints(ctx, params.ItemID, params)
			if err != nil {
				return nil, err
			}
		}

		dataPoints = make([]models.PricePoint, 0, len(points))
		for _, p := range points {
			// Skip points where both prices are NULL (no trading data)
			if p.AvgHighPrice == nil && p.AvgLowPrice == nil {
				continue
			}

			high := int64(0)
			low := int64(0)
			if p.AvgHighPrice != nil {
				high = *p.AvgHighPrice
			}
			if p.AvgLowPrice != nil {
				low = *p.AvgLowPrice
			}

			ts := time.Date(p.Day.Year(), p.Day.Month(), p.Day.Day(), 0, 0, 0, 0, time.UTC)
			dataPoints = append(dataPoints, models.PricePoint{Timestamp: ts, HighPrice: high, LowPrice: low})

			if firstDate == nil || ts.Before(*firstDate) {
				t := ts
				firstDate = &t
			}
			if lastDate == nil || ts.After(*lastDate) {
				t := ts
				lastDate = &t
			}
		}
	} else {
		points, err := s.priceRepo.GetTimeseriesPoints(ctx, params.ItemID, source.timestep, params)
		if err != nil {
			return nil, err
		}

		if len(points) == 0 {
			if err := s.seedTimeseriesFromWiki(ctx, params.ItemID, source.timestep); err != nil {
				s.logger.Warnw("Failed to seed timeseries", "itemID", params.ItemID, "timestep", source.timestep, "error", err)
			}
			points, err = s.priceRepo.GetTimeseriesPoints(ctx, params.ItemID, source.timestep, params)
			if err != nil {
				return nil, err
			}
		}

		dataPoints = make([]models.PricePoint, 0, len(points))
		for _, p := range points {
			// Skip points where both prices are NULL (no trading data)
			if p.AvgHighPrice == nil && p.AvgLowPrice == nil {
				continue
			}

			high := int64(0)
			low := int64(0)
			if p.AvgHighPrice != nil {
				high = *p.AvgHighPrice
			}
			if p.AvgLowPrice != nil {
				low = *p.AvgLowPrice
			}

			ts := p.Timestamp.UTC()
			dataPoints = append(dataPoints, models.PricePoint{Timestamp: ts, HighPrice: high, LowPrice: low})

			if firstDate == nil || ts.Before(*firstDate) {
				t := ts
				firstDate = &t
			}
			if lastDate == nil || ts.After(*lastDate) {
				t := ts
				lastDate = &t
			}
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

type timeseriesSource struct {
	timestep string
	useDaily bool
	seedStep string
}

// getDefaultMaxPoints returns the target number of points for each time period
func getDefaultMaxPoints(period models.TimePeriod) int {
	switch period {
	case models.Period1Hour:
		return 60 // API can return up to 365 points, sample to 60
	default:
		return 120 // Target for all other periods
	}
}

func periodToTimeseriesSource(period models.TimePeriod) timeseriesSource {
	// Choose finest timestep that covers the period.
	// Wiki API returns up to 365 points per query.
	// Timestep coverage: 5m→1.3d, 1h→15.2d, 6h→91.2d, 24h→365d
	switch period {
	case models.Period1Hour:
		return timeseriesSource{timestep: "5m"} // Up to 365 pts, sample to 60
	case models.Period12Hours:
		return timeseriesSource{timestep: "5m"} // Up to 365 pts, sample to 120
	case models.Period24Hours:
		return timeseriesSource{timestep: "5m"} // Up to 365 pts, sample to 120
	case models.Period3Days:
		return timeseriesSource{timestep: "1h"} // Up to 365 pts, sample to 120
	case models.Period7Days:
		return timeseriesSource{timestep: "1h"} // Up to 365 pts, sample to 120
	case models.Period30Days:
		return timeseriesSource{timestep: "6h"} // Up to 365 pts, sample to 120
	case models.Period90Days:
		return timeseriesSource{timestep: "6h"} // Up to 365 pts, sample to 120
	case models.Period1Year:
		return timeseriesSource{timestep: "24h"} // 365 pts available
	case models.PeriodAll:
		return timeseriesSource{timestep: "24h"} // 365 pts (covers 1y)
	default:
		return timeseriesSource{timestep: "24h"}
	}
}

func (s *priceService) seedTimeseriesFromWiki(ctx context.Context, itemID int, timestep string) error {
	points, err := s.wikiClient.FetchTimeseries(ctx, itemID, timestep)
	if err != nil {
		return err
	}

	now := time.Now().UTC()
	inserts := make([]models.PriceTimeseriesPoint, 0, len(points))
	for _, p := range points {
		ts := UnixSecondsToTime(p.Timestamp)
		inserts = append(inserts, models.PriceTimeseriesPoint{
			ItemID:          itemID,
			Timestamp:       ts,
			AvgHighPrice:    p.AvgHighPrice,
			AvgLowPrice:     p.AvgLowPrice,
			HighPriceVolume: p.HighPriceVolume,
			LowPriceVolume:  p.LowPriceVolume,
			InsertedAt:      now,
		})
	}

	if err := s.priceRepo.InsertTimeseriesPoints(ctx, timestep, inserts); err != nil {
		return err
	}

	_ = s.cache.DeletePattern(ctx, fmt.Sprintf("price:history:%d:*", itemID))
	return nil
}

func (s *priceService) seedDailyFromWikiTimeseries(ctx context.Context, itemID int) error {
	step := "24h"
	points, err := s.wikiClient.FetchTimeseries(ctx, itemID, step)
	if err != nil {
		return err
	}

	now := time.Now().UTC()
	byDay := make(map[string]models.PriceTimeseriesDaily, len(points))
	for _, p := range points {
		ts := UnixSecondsToTime(p.Timestamp)
		day := time.Date(ts.Year(), ts.Month(), ts.Day(), 0, 0, 0, 0, time.UTC)
		key := day.Format("2006-01-02")
		byDay[key] = models.PriceTimeseriesDaily{
			ItemID:          itemID,
			Day:             day,
			AvgHighPrice:    p.AvgHighPrice,
			AvgLowPrice:     p.AvgLowPrice,
			HighPriceVolume: p.HighPriceVolume,
			LowPriceVolume:  p.LowPriceVolume,
			InsertedAt:      now,
		}
	}

	if len(byDay) == 0 {
		return nil
	}

	inserts := make([]models.PriceTimeseriesDaily, 0, len(byDay))
	for _, v := range byDay {
		inserts = append(inserts, v)
	}

	if err := s.priceRepo.InsertDailyPoints(ctx, inserts); err != nil {
		return err
	}

	_ = s.cache.DeletePattern(ctx, fmt.Sprintf("price:history:%d:*", itemID))
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

// SyncCurrentPrices fetches and updates all current prices from OSRS Wiki /latest.
func (s *priceService) SyncCurrentPrices(ctx context.Context) error {
	s.logger.Info("Starting price_latest sync from OSRS Wiki /latest")

	latest, err := s.wikiClient.FetchLatestAll(ctx)
	if err != nil {
		return fmt.Errorf("fetch wiki latest: %w", err)
	}

	// Fetch all existing item IDs to filter out prices for non-existent items
	allItems, _, err := s.itemRepo.GetAll(ctx, models.ItemListParams{
		Page:  1,
		Limit: 10000, // Get all items
	})
	if err != nil {
		return fmt.Errorf("fetch existing items: %w", err)
	}

	s.logger.Infow("Fetched items for price sync validation", "item_count", len(allItems))

	// Build a set of valid item IDs
	validItemIDs := make(map[int]struct{}, len(allItems))
	for _, item := range allItems {
		validItemIDs[item.ItemID] = struct{}{}
	}

	updates := make([]models.BulkPriceUpdate, 0, len(latest))
	skipped := 0
	for itemID, item := range latest {
		// Skip if item doesn't exist in our database
		if _, exists := validItemIDs[itemID]; !exists {
			skipped++
			continue
		}

		if item.High == nil && item.Low == nil {
			continue
		}

		var highTime *time.Time
		if item.HighTime != nil {
			t := UnixSecondsToTime(*item.HighTime)
			highTime = &t
		}
		var lowTime *time.Time
		if item.LowTime != nil {
			t := UnixSecondsToTime(*item.LowTime)
			lowTime = &t
		}

		updates = append(updates, models.BulkPriceUpdate{
			ItemID:        itemID,
			HighPrice:     item.High,
			HighPriceTime: highTime,
			LowPrice:      item.Low,
			LowPriceTime:  lowTime,
		})
	}

	if skipped > 0 {
		s.logger.Infow("Skipped prices for items not in database", "skipped_count", skipped)
	}

	if err := s.priceRepo.BulkUpsertCurrentPrices(ctx, updates); err != nil {
		return fmt.Errorf("insert price_latest snapshots: %w", err)
	}

	_ = s.cache.DeletePattern(ctx, "price:current:*")

	s.logger.Infow("Successfully synced price_latest from /latest", "count", len(updates))
	return nil
}

func (s *priceService) RunMaintenance(ctx context.Context) error {
	// Retention policy (can be moved to config later):
	// - price_latest: keep 36h
	// - timeseries 5m: keep 7d
	// - timeseries 1h: keep 90d
	// - timeseries 6h: keep 30d
	// - timeseries 24h: keep 30d (supports up to 7d charts with buffer)
	// - daily: currently kept indefinitely
	now := time.Now().UTC()

	rollupCutoff := now.Add(-30 * 24 * time.Hour)
	rolledUp, err := s.priceRepo.Rollup24hToDailyBefore(ctx, rollupCutoff)
	if err != nil {
		return err
	}

	prunedLatest, err := s.priceRepo.PrunePriceLatestBefore(ctx, now.Add(-36*time.Hour))
	if err != nil {
		return err
	}

	pruned5m, err := s.priceRepo.PruneTimeseriesBefore(ctx, "5m", now.Add(-7*24*time.Hour))
	if err != nil {
		return err
	}
	pruned1h, err := s.priceRepo.PruneTimeseriesBefore(ctx, "1h", now.Add(-90*24*time.Hour))
	if err != nil {
		return err
	}
	pruned6h, err := s.priceRepo.PruneTimeseriesBefore(ctx, "6h", now.Add(-30*24*time.Hour))
	if err != nil {
		return err
	}
	pruned24h, err := s.priceRepo.PruneTimeseriesBefore(ctx, "24h", now.Add(-30*24*time.Hour))
	if err != nil {
		return err
	}

	s.logger.Infow(
		"Price maintenance completed",
		"rolledUp24hToDaily", rolledUp,
		"prunedPriceLatest", prunedLatest,
		"pruned5m", pruned5m,
		"pruned1h", pruned1h,
		"pruned6h", pruned6h,
		"pruned24h", pruned24h,
	)

	return nil
}

// EnsureFuturePartitions creates partitions for price_latest for the next N days
func (s *priceService) EnsureFuturePartitions(ctx context.Context, daysAhead int) error {
	return s.priceRepo.EnsureFuturePartitions(ctx, daysAhead)
}
