package services

import (
	"context"
	"fmt"
	"time"

	"go.uber.org/zap"

	"github.com/guavi/osrs-ge-tracker/internal/models"
	"github.com/guavi/osrs-ge-tracker/internal/repository"
)

// priceService implements PriceService.
type priceService struct {
	priceRepo  repository.PriceRepository
	itemRepo   repository.ItemRepository
	wikiClient WikiPricesClient
	cache      CacheService
	logger     *zap.SugaredLogger
}

// NewPriceService creates a new price service.
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

// GetCurrentPrice returns the current price for an item.
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
	// Note: Intentionally not caching individual prices to reduce cache complexity

	return dbPrice, nil
}

// GetCurrentPrices returns current prices for multiple items.
func (s *priceService) GetCurrentPrices(ctx context.Context, itemIDs []int) ([]models.CurrentPrice, error) {
	return s.priceRepo.GetCurrentPrices(ctx, itemIDs)
}

// GetBatchCurrentPrices returns current prices for a batch of items (alias for GetCurrentPrices).
func (s *priceService) GetBatchCurrentPrices(ctx context.Context, itemIDs []int) ([]models.CurrentPrice, error) {
	return s.GetCurrentPrices(ctx, itemIDs)
}

// GetAllCurrentPrices returns all current prices.
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
	// Note: Intentionally not caching here to avoid stale data issues

	return dbPrices, nil
}

// transformDailyPoints converts daily aggregate points to response format,
// filtering out entries where both prices are NULL and defaulting NULLs to 0.
func (s *priceService) transformDailyPoints(points []models.PriceTimeseriesDaily) []models.PricePoint {
	result := make([]models.PricePoint, 0, len(points))

	for _, p := range points {
		// Skip if both prices are NULL (no trading data)
		if p.AvgHighPrice == nil && p.AvgLowPrice == nil {
			continue
		}

		high := int64(0)
		if p.AvgHighPrice != nil {
			high = *p.AvgHighPrice
		}

		low := int64(0)
		if p.AvgLowPrice != nil {
			low = *p.AvgLowPrice
		}

		// Convert day (date) to timestamp at midnight UTC
		ts := time.Date(p.Day.Year(), p.Day.Month(), p.Day.Day(), 0, 0, 0, 0, time.UTC)

		result = append(result, models.PricePoint{
			Timestamp: ts,
			HighPrice: high,
			LowPrice:  low,
		})
	}

	return result
}

// transformTimeseriesPoints converts timeseries points to response format,
// filtering out entries where both prices are NULL and defaulting NULLs to 0.
func (s *priceService) transformTimeseriesPoints(points []models.PriceTimeseriesPoint) []models.PricePoint {
	result := make([]models.PricePoint, 0, len(points))

	for _, p := range points {
		// Skip if both prices are NULL (no trading data)
		if p.AvgHighPrice == nil && p.AvgLowPrice == nil {
			continue
		}

		high := int64(0)
		if p.AvgHighPrice != nil {
			high = *p.AvgHighPrice
		}

		low := int64(0)
		if p.AvgLowPrice != nil {
			low = *p.AvgLowPrice
		}

		result = append(result, models.PricePoint{
			Timestamp: p.Timestamp.UTC(),
			HighPrice: high,
			LowPrice:  low,
		})
	}

	return result
}

// calculateDateRange determines the first and last dates in a dataset.
// Returns nil pointers if data is empty.
func (s *priceService) calculateDateRange(data []models.PricePoint) (*time.Time, *time.Time) {
	if len(data) == 0 {
		return nil, nil
	}

	var firstDate, lastDate *time.Time

	for i := range data {
		ts := data[i].Timestamp

		if firstDate == nil || ts.Before(*firstDate) {
			t := ts
			firstDate = &t
		}

		if lastDate == nil || ts.After(*lastDate) {
			t := ts
			lastDate = &t
		}
	}

	return firstDate, lastDate
}

// fetchDailyPoints retrieves daily aggregates from repository, attempting to seed
// data from Wiki API if the repository returns empty results.
func (s *priceService) fetchDailyPoints(
	ctx context.Context,
	itemID int,
	params models.PriceHistoryParams,
) ([]models.PriceTimeseriesDaily, error) {
	// Fetch from repository
	points, err := s.priceRepo.GetDailyPoints(ctx, itemID, params)
	if err != nil {
		return nil, fmt.Errorf("fetch daily aggregates: %w", err)
	}

	// If empty, try seeding from Wiki API
	if len(points) == 0 {
		s.logger.Infow("no daily data found, attempting to seed from Wiki API",
			"itemId", itemID,
		)

		if err := s.seedDailyFromWikiTimeseries(ctx, itemID); err != nil {
			s.logger.Warnw("failed to seed daily data",
				"itemId", itemID,
				"error", err,
			)
			// Don't return error - proceed with empty data
			return points, nil
		}

		// Retry fetch after seeding
		points, err = s.priceRepo.GetDailyPoints(ctx, itemID, params)
		if err != nil {
			return nil, fmt.Errorf("fetch after seed: %w", err)
		}
	}

	return points, nil
}

// fetchTimeseriesPoints retrieves timeseries data from repository, attempting to seed
// data from Wiki API if the repository returns empty results.
func (s *priceService) fetchTimeseriesPoints(
	ctx context.Context,
	itemID int,
	timestep string,
	params models.PriceHistoryParams,
) ([]models.PriceTimeseriesPoint, error) {
	// Fetch from repository
	points, err := s.priceRepo.GetTimeseriesPoints(ctx, itemID, timestep, params)
	if err != nil {
		return nil, fmt.Errorf("fetch timeseries: %w", err)
	}

	// If empty, try seeding from Wiki API
	if len(points) == 0 {
		s.logger.Infow("no timeseries data found, attempting to seed from Wiki API",
			"itemId", itemID,
			"timestep", timestep,
		)

		if err := s.seedTimeseriesFromWiki(ctx, itemID, timestep); err != nil {
			s.logger.Warnw("failed to seed timeseries data",
				"itemId", itemID,
				"timestep", timestep,
				"error", err,
			)
			// Don't return error - proceed with empty data
			return points, nil
		}

		// Retry fetch after seeding
		points, err = s.priceRepo.GetTimeseriesPoints(ctx, itemID, timestep, params)
		if err != nil {
			return nil, fmt.Errorf("fetch after seed: %w", err)
		}
	}

	return points, nil
}

// GetPriceHistory retrieves historical price data for an item based on the given parameters.
// It attempts to serve from cache first, falls back to database, and can seed data from
// Wiki API if the database is empty.
func (s *priceService) GetPriceHistory(ctx context.Context, params models.PriceHistoryParams) (*models.PriceHistoryResponse, error) {
	// Apply default MaxPoints if not specified
	if params.MaxPoints == nil {
		defaultMaxPoints := getDefaultMaxPoints(params.Period)
		params.MaxPoints = &defaultMaxPoints
	}

	// 1. Try cache if period-based and not forcing refresh
	if params.Period != "" && !params.Refresh {
		cacheKey := fmt.Sprintf("price:history:%d:%s", params.ItemID, params.Period)
		var cached models.PriceHistoryResponse
		err := s.cache.GetJSON(ctx, cacheKey, &cached)
		if err == nil {
			s.logger.Debugw("Returning price history from cache",
				"itemID", params.ItemID,
				"period", params.Period)
			return &cached, nil
		}
	}

	// 2. Determine data source (daily vs timeseries)
	source := periodToTimeseriesSource(params.Period)

	// 3. Fetch data points (with automatic seeding if empty)
	var dataPoints []models.PricePoint
	
	if source.useDaily {
		points, err := s.fetchDailyPoints(ctx, params.ItemID, params)
		if err != nil {
			return nil, err
		}
		dataPoints = s.transformDailyPoints(points)
	} else {
		points, err := s.fetchTimeseriesPoints(ctx, params.ItemID, source.timestep, params)
		if err != nil {
			return nil, err
		}
		dataPoints = s.transformTimeseriesPoints(points)
	}

	// 4. Calculate date range
	firstDate, lastDate := s.calculateDateRange(dataPoints)

	// 5. Build response
	response := &models.PriceHistoryResponse{
		ItemID:    params.ItemID,
		Period:    string(params.Period),
		Data:      dataPoints,
		Count:     len(dataPoints),
		FirstDate: firstDate,
		LastDate:  lastDate,
	}

	// Note: Intentionally not caching to ensure fresh data
	return response, nil
}

type timeseriesSource struct {
	timestep string
	useDaily bool
}

// getDefaultMaxPoints returns the target number of points for each time period.
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

	//nolint:errcheck // Cache invalidation failures are non-critical
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

	//nolint:errcheck // Cache invalidation failures are non-critical
	_ = s.cache.DeletePattern(ctx, fmt.Sprintf("price:history:%d:*", itemID))
	return nil
}

// UpdateCurrentPrice updates the current price for an item.
func (s *priceService) UpdateCurrentPrice(ctx context.Context, price *models.CurrentPrice) error {
	if err := s.priceRepo.UpsertCurrentPrice(ctx, price); err != nil {
		return err
	}

	// Invalidate cache
	cacheKey := fmt.Sprintf("price:current:%d", price.ItemID)
	//nolint:errcheck // Cache invalidation failures are non-critical
	_ = s.cache.Delete(ctx, cacheKey)
	//nolint:errcheck // Cache invalidation failures are non-critical
	_ = s.cache.Delete(ctx, "price:current:all")

	return nil
}

// SyncCurrentPrices fetches and updates all current prices from OSRS Wiki /latest.
// Returns the list of price updates that were synced for SSE broadcasting.
func (s *priceService) SyncCurrentPrices(ctx context.Context) ([]models.BulkPriceUpdate, error) {
	s.logger.Info("Starting price_latest sync from OSRS Wiki /latest")

	latest, err := s.wikiClient.FetchLatestAll(ctx)
	if err != nil {
		return nil, fmt.Errorf("fetch wiki latest: %w", err)
	}

	// Fetch all existing item IDs to filter out prices for non-existent items
	allItems, _, err := s.itemRepo.GetAll(ctx, models.ItemListParams{
		Page:  1,
		Limit: 10000, // Get all items
	})
	if err != nil {
		return nil, fmt.Errorf("fetch existing items: %w", err)
	}

	s.logger.Infow("Fetched items for price sync validation", "item_count", len(allItems))

	// Build a set of valid item IDs
	validItemIDs := make(map[int]struct{}, len(allItems))
	for _, item := range allItems {
		validItemIDs[item.ItemID] = struct{}{}
	}

	updates := make([]models.BulkPriceUpdate, 0, len(latest))
	skipped := 0
	for itemID := range latest {
		item := latest[itemID]
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
		return nil, fmt.Errorf("insert price_latest snapshots: %w", err)
	}

	//nolint:errcheck // Cache invalidation failures are non-critical
	_ = s.cache.DeletePattern(ctx, "price:current:*")

	s.logger.Infow("Successfully synced price_latest from /latest", "count", len(updates))
	return updates, nil
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

// EnsureFuturePartitions creates partitions for price_latest for the next N days.
func (s *priceService) EnsureFuturePartitions(ctx context.Context, daysAhead int) error {
	return s.priceRepo.EnsureFuturePartitions(ctx, daysAhead)
}
