package scheduler

import (
	"context"
	"fmt"
	"time"

	"github.com/guavi/grand-exchange-ai-tracker/internal/models"
	"github.com/guavi/grand-exchange-ai-tracker/internal/repository"
	"github.com/guavi/grand-exchange-ai-tracker/internal/services"
	"github.com/guavi/grand-exchange-ai-tracker/pkg/logger"
)

// Jobs contains all scheduled job implementations
type Jobs struct {
	osrsClient       *services.OSRSAPIClient
	itemRepo         repository.ItemRepository
	priceHistoryRepo repository.PriceHistoryRepository
	priceTrendRepo   repository.PriceTrendRepository
}

// NewJobs creates a new Jobs instance
func NewJobs(
	osrsClient *services.OSRSAPIClient,
	itemRepo repository.ItemRepository,
	priceHistoryRepo repository.PriceHistoryRepository,
	priceTrendRepo repository.PriceTrendRepository,
) *Jobs {
	return &Jobs{
		osrsClient:       osrsClient,
		itemRepo:         itemRepo,
		priceHistoryRepo: priceHistoryRepo,
		priceTrendRepo:   priceTrendRepo,
	}
}

// SyncItemCatalog fetches all items from WeirdGloop bulk dump and syncs to database
// This is much more efficient than the previous letter-by-letter approach
func (j *Jobs) SyncItemCatalog(ctx context.Context) error {
	logger.Info("starting item catalog sync using WeirdGloop bulk dump")

	// Fetch the complete bulk dump
	dumpItems, jagexTimestamp, err := j.osrsClient.FetchBulkDump(ctx)
	if err != nil {
		logger.Error("failed to fetch bulk dump", "error", err)
		return fmt.Errorf("failed to fetch bulk dump: %w", err)
	}

	if len(dumpItems) == 0 {
		logger.Warn("bulk dump returned no items")
		return nil
	}

	logger.Info("bulk dump fetched", "item_count", len(dumpItems), "jagex_timestamp", jagexTimestamp)

	// Convert dump items to model items for bulk upsert
	var itemsToCreate []models.Item
	for _, dumpItem := range dumpItems {
		item := models.Item{
			ItemID:       dumpItem.ID,
			Name:         dumpItem.Name,
			Description:  "",    // Bulk dump doesn't include description
			IconURL:      "",    // Will be fetched separately if needed
			IconLargeURL: "",    // Will be fetched separately if needed
			Type:         "",    // Will be updated separately if needed
			Members:      false, // Will be updated separately if needed
		}

		itemsToCreate = append(itemsToCreate, item)

		if len(itemsToCreate)%1000 == 0 {
			logger.Debug("processed items from dump", "count", len(itemsToCreate))
		}
	}

	logger.Info("prepared items for bulk insert", "count", len(itemsToCreate))

	// Bulk create or update all items
	if err := j.itemRepo.BulkCreateOrUpdate(ctx, itemsToCreate); err != nil {
		logger.Error("failed to bulk create/update items", "error", err)
		return fmt.Errorf("failed to bulk create/update items: %w", err)
	}

	logger.Info("item catalog sync completed using bulk dump", "total_items", len(itemsToCreate))
	return nil
}

// UpdateItemPrices updates current prices for all items from the WeirdGloop bulk dump
// This is called frequently (every 5-10 minutes) and is very efficient
func (j *Jobs) UpdateItemPrices(ctx context.Context) error {
	logger.Info("starting item price update from bulk dump")

	// Fetch the complete bulk dump for current prices
	dumpItems, jagexTimestamp, err := j.osrsClient.FetchBulkDump(ctx)
	if err != nil {
		logger.Error("failed to fetch bulk dump for price update", "error", err)
		return fmt.Errorf("failed to fetch bulk dump: %w", err)
	}

	if len(dumpItems) == 0 {
		logger.Warn("bulk dump returned no items for price update")
		return nil
	}

	logger.Info("bulk dump fetched for price update", "item_count", len(dumpItems))

	// Get all items to map ItemID to database ID
	var allItems []models.Item
	const pageSize = 5000
	offset := 0
	itemIDToDBID := make(map[int]uint)

	for {
		if ctx.Err() != nil {
			return ctx.Err()
		}

		items, err := j.itemRepo.List(ctx, pageSize, offset, "", nil, "item_id", "asc")
		if err != nil {
			logger.Error("failed to list items", "error", err)
			return fmt.Errorf("failed to list items: %w", err)
		}

		if len(items) == 0 {
			break
		}

		for _, item := range items {
			itemIDToDBID[item.ItemID] = item.ID
		}

		allItems = append(allItems, items...)

		if len(items) < pageSize {
			break
		}

		offset += pageSize
	}

	logger.Info("loaded items from database", "count", len(allItems))

	// Create price trends from dump data
	var pricesToUpsert []*models.PriceTrend
	processed := 0

	for _, dumpItem := range dumpItems {
		if ctx.Err() != nil {
			return ctx.Err()
		}

		// Find the database ID for this item
		dbID, exists := itemIDToDBID[dumpItem.ID]
		if !exists {
			logger.Debug("item from dump not found in database", "item_id", dumpItem.ID, "name", dumpItem.Name)
			continue
		}

		// Create price trend update
		trend := &models.PriceTrend{
			ItemID:           dbID,
			CurrentPrice:     dumpItem.Price,
			CurrentTrend:     "", // Will need to calculate from historical data
			TodayPriceChange: 0,  // Will need to calculate
			TodayTrend:       "", // Will need to calculate
			UpdatedAt:        time.Now(),
		}

		pricesToUpsert = append(pricesToUpsert, trend)
		processed++

		if processed%1000 == 0 {
			logger.Debug("price update progress", "processed", processed, "total", len(dumpItems))
		}
	}

	logger.Info("prepared price updates", "count", len(pricesToUpsert))

	// Batch upsert all price trends
	for _, trend := range pricesToUpsert {
		if ctx.Err() != nil {
			return ctx.Err()
		}

		if err := j.priceTrendRepo.Upsert(ctx, trend); err != nil {
			logger.Error("failed to upsert price trend", "item_id", trend.ItemID, "error", err)
			// Continue processing other items
		}
	}

	logger.Info("item price update completed", "updated_count", len(pricesToUpsert), "jagex_timestamp", jagexTimestamp)
	return nil
}

// UpdateItemDetails no longer needed with bulk dump approach
// Kept as a placeholder in case detailed item info is needed from separate source
func (j *Jobs) UpdateItemDetails(ctx context.Context) error {
	logger.Info("item details update is now integrated with catalog sync")
	return nil
}

// CollectInitialHistoricalData fetches sample historical data for ALL items on startup
// This ensures charts have data immediately without waiting for scheduled jobs
// Uses /sample endpoint which returns 150 data points spread across entire history
func (j *Jobs) CollectInitialHistoricalData(ctx context.Context) error {
	logger.Info("starting initial historical data collection for all items")

	// Get all items from database
	var allItems []models.Item
	const pageSize = 500
	offset := 0
	itemIDToDBID := make(map[int]uint)

	for {
		if ctx.Err() != nil {
			return ctx.Err()
		}

		items, err := j.itemRepo.List(ctx, pageSize, offset, "", nil, "item_id", "asc")
		if err != nil {
			logger.Error("failed to list items for initial data collection", "error", err)
			return fmt.Errorf("failed to list items: %w", err)
		}

		if len(items) == 0 {
			break
		}

		for _, item := range items {
			itemIDToDBID[item.ItemID] = item.ID
			allItems = append(allItems, item)
		}

		if len(items) < pageSize {
			break
		}

		offset += pageSize
	}

	logger.Info("loaded items for initial data collection", "count", len(allItems))

	if len(allItems) == 0 {
		logger.Warn("no items found in database for initial historical data collection")
		return nil
	}

	// Collect sample historical data for each item
	totalProcessed := 0
	totalSkipped := 0
	var allHistories []*models.PriceHistory

	for _, item := range allItems {
		if ctx.Err() != nil {
			logger.Info("initial data collection interrupted", "processed", totalProcessed, "skipped", totalSkipped)
			return ctx.Err()
		}

		// Fetch sample historical data (150 points spread across history)
		priceData, err := j.osrsClient.FetchSampleHistoricalData(ctx, item.ItemID)
		if err != nil {
			logger.Debug("failed to fetch sample historical data", "item_id", item.ItemID, "error", err)
			totalSkipped++
			// Continue with next item
			time.Sleep(50 * time.Millisecond)
			continue
		}

		if len(priceData) == 0 {
			logger.Debug("no sample data available for item", "item_id", item.ItemID)
			totalSkipped++
			time.Sleep(50 * time.Millisecond)
			continue
		}

		// Convert to price history models
		for _, point := range priceData {
			if len(point) >= 2 {
				// point format: [timestamp, price] or [timestamp, price, volume]
				var timestamp int64
				var price int
				var volume int

				// Parse timestamp (Unix seconds)
				if ts, ok := point[0].(float64); ok {
					timestamp = int64(ts)
				}

				// Parse price
				if p, ok := point[1].(float64); ok {
					price = int(p)
				}

				// Parse volume if available
				if len(point) >= 3 {
					if v, ok := point[2].(float64); ok {
						volume = int(v)
					}
				}

				if timestamp > 0 && price > 0 {
					allHistories = append(allHistories, &models.PriceHistory{
						ItemID:    item.ID,
						Timestamp: timestamp,
						Price:     price,
						Volume:    volume,
					})
				}
			}
		}

		totalProcessed++
		if totalProcessed%500 == 0 {
			logger.Info("initial data collection progress", "processed", totalProcessed, "total", len(allItems), "data_points", len(allHistories))
		}

		// Respectful delay between API requests
		time.Sleep(50 * time.Millisecond)
	}

	logger.Info("sample historical data collection completed", "items_processed", totalProcessed, "items_skipped", totalSkipped, "total_data_points", len(allHistories))

	if len(allHistories) == 0 {
		logger.Warn("no historical data collected")
		return nil
	}

	// Batch create all price history records
	// Use BatchCreate to handle large dataset efficiently
	batchSize := 5000
	for i := 0; i < len(allHistories); i += batchSize {
		if ctx.Err() != nil {
			return ctx.Err()
		}

		end := i + batchSize
		if end > len(allHistories) {
			end = len(allHistories)
		}

		batch := allHistories[i:end]

		if err := j.priceHistoryRepo.BatchCreate(ctx, batch); err != nil {
			logger.Error("failed to create price history batch", "error", err, "batch_start", i, "batch_end", end)
			// Continue with next batch
		} else {
			logger.Debug("price history batch created", "batch_start", i, "batch_end", end, "count", len(batch))
		}
	}

	logger.Info("initial historical data collection and save completed", "total_data_points_saved", len(allHistories))
	return nil
}

// CollectPriceData fetches historical price data for popular/hot items
// This uses WeirdGloop Exchange API for historical data instead of fetching for all items
func (j *Jobs) CollectPriceData(ctx context.Context) error {
	logger.Info("starting historical price data collection (popular items only)")

	// Get trending items or top X items by volume
	// For now, we'll get a sample of items to fetch historical data for
	trendingItems, err := j.priceTrendRepo.GetTopTrending(ctx, 100, 24)
	if err != nil {
		logger.Warn("failed to get trending items", "error", err)
		// Continue with available items or skip
		return nil
	}

	if len(trendingItems) == 0 {
		logger.Info("no trending items to collect prices for")
		return nil
	}

	// Extract item IDs
	var itemIDs []int
	itemIDToDBID := make(map[int]uint)
	for _, trend := range trendingItems {
		// We need to get the actual ItemID from the Item
		item, err := j.itemRepo.GetByID(ctx, trend.ItemID)
		if err == nil && item != nil {
			itemIDs = append(itemIDs, item.ItemID)
			itemIDToDBID[item.ItemID] = item.ID
		}
	}

	logger.Info("collected item IDs for price history", "count", len(itemIDs))

	if len(itemIDs) == 0 {
		return nil
	}

	// Fetch historical data for last 90 days
	historicalData, err := j.osrsClient.FetchHistoricalData(ctx, itemIDs, "90d")
	if err != nil {
		logger.Warn("failed to fetch historical data", "error", err)
		return nil
	}

	logger.Info("fetched historical data", "items_with_data", len(historicalData))

	// Process and save historical data
	totalSaved := 0
	for itemIDStr, priceData := range historicalData {
		if ctx.Err() != nil {
			return ctx.Err()
		}

		// Parse item ID from string
		var itemID int
		fmt.Sscanf(itemIDStr, "%d", &itemID)

		dbID, exists := itemIDToDBID[itemID]
		if !exists {
			logger.Debug("item from historical data not found in database", "item_id", itemIDStr)
			continue
		}

		// Convert to price history models
		var histories []*models.PriceHistory
		for _, point := range priceData {
			if len(point) >= 2 {
				// point format: [timestamp, price] or [timestamp, price, volume]
				var timestamp int64
				var price int
				var volume int

				// Parse timestamp (milliseconds)
				if ts, ok := point[0].(float64); ok {
					timestamp = int64(ts) / 1000 // Convert to seconds
				}

				// Parse price
				if p, ok := point[1].(float64); ok {
					price = int(p)
				}

				// Parse volume if available
				if len(point) >= 3 {
					if v, ok := point[2].(float64); ok {
						volume = int(v)
					}
				}

				if timestamp > 0 && price > 0 {
					histories = append(histories, &models.PriceHistory{
						ItemID:    dbID,
						Timestamp: timestamp,
						Price:     price,
						Volume:    volume,
					})
				}
			}
		}

		if len(histories) > 0 {
			if err := j.priceHistoryRepo.BatchCreate(ctx, histories); err != nil {
				logger.Error("failed to save price history", "item_id", itemID, "count", len(histories), "error", err)
			} else {
				totalSaved += len(histories)
			}
		}
	}

	logger.Info("historical price data collection completed", "total_points_saved", totalSaved)
	return nil
}

// CalculateTrends calculates price trends based on historical data
func (j *Jobs) CalculateTrends(ctx context.Context) error {
	logger.Info("starting trend calculation")

	// Get all items
	items, err := j.itemRepo.List(ctx, 1000, 0, "", nil, "id", "asc")
	if err != nil {
		return fmt.Errorf("failed to list items: %w", err)
	}

	if len(items) == 0 {
		logger.Info("no items to calculate trends for")
		return nil
	}

	calculated := 0
	now := time.Now().Unix()

	for _, item := range items {
		if ctx.Err() != nil {
			return ctx.Err()
		}

		// Get latest price
		latest, err := j.priceHistoryRepo.GetLatest(ctx, item.ID)
		if err != nil {
			continue
		}

		// Get price from 1 day ago
		oneDayAgo := now - (24 * 60 * 60)
		dayAgoHistory, _ := j.priceHistoryRepo.GetByItemID(ctx, item.ID, oneDayAgo, now, 1)

		var todayChange int
		var todayTrend string
		if len(dayAgoHistory) > 0 && dayAgoHistory[0].Price > 0 {
			todayChange = latest.Price - dayAgoHistory[0].Price
			if todayChange > 0 {
				todayTrend = "positive"
			} else if todayChange < 0 {
				todayTrend = "negative"
			} else {
				todayTrend = "neutral"
			}
		}

		// Update or create trend
		trend := &models.PriceTrend{
			ItemID:           item.ID,
			CurrentPrice:     latest.Price,
			CurrentTrend:     todayTrend,
			TodayPriceChange: todayChange,
			TodayTrend:       todayTrend,
			UpdatedAt:        time.Now(),
		}

		if err := j.priceTrendRepo.Upsert(ctx, trend); err != nil {
			logger.Error("failed to upsert trend",
				"item_id", item.ItemID,
				"error", err)
		} else {
			calculated++
		}
	}

	logger.Info("trend calculation completed",
		"calculated", calculated,
		"total", len(items))
	return nil
}

// CleanupOldData removes price history older than 180 days
func (j *Jobs) CleanupOldData(ctx context.Context) error {
	logger.Info("starting old data cleanup")

	// Calculate timestamp for 180 days ago
	cutoffTime := time.Now().AddDate(0, 0, -180).Unix()

	if err := j.priceHistoryRepo.DeleteOlderThan(ctx, cutoffTime); err != nil {
		return fmt.Errorf("failed to cleanup old data: %w", err)
	}

	logger.Info("old data cleanup completed", "cutoff_days", 180)
	return nil
}

// parseTimestamp converts a timestamp string (Unix milliseconds) to Unix seconds
func parseTimestamp(ts string) (int64, error) {
	var timestamp int64
	_, err := fmt.Sscanf(ts, "%d", &timestamp)
	if err != nil {
		return 0, err
	}
	// OSRS API returns milliseconds, convert to seconds
	return timestamp / 1000, nil
}
