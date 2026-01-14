package scheduler

import (
	"context"
	"fmt"
	"runtime"
	"sync"
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

// SyncItemCatalog fetches all items from OSRS API and syncs to database
func (j *Jobs) SyncItemCatalog(ctx context.Context) error {
	logger.Info("starting item catalog sync")

	totalItems := 0
	letters := "abcdefghijklmnopqrstuvwxyz"

	for _, letter := range letters {
		if ctx.Err() != nil {
			return ctx.Err()
		}

		letterStr := string(letter)
		page := 1

		for {
			// Fetch items for this letter and page
			itemsList, err := j.osrsClient.FetchItemsList(ctx, 1, letterStr, page)
			if err != nil {
				logger.Error("failed to fetch items list",
					"letter", letterStr,
					"page", page,
					"error", err)
				break // Move to next letter
			}

			// If no items, we're done with this letter
			if len(itemsList.Items) == 0 {
				break
			}

			// Save items to database
			for _, apiItem := range itemsList.Items {
				item := &models.Item{
					ItemID:       apiItem.ID,
					Name:         apiItem.Name,
					Description:  apiItem.Description,
					IconURL:      apiItem.Icon,
					IconLargeURL: apiItem.IconLarge,
					Type:         apiItem.Type,
					Members:      apiItem.Members == "true",
				}

				// Check if item already exists
				existing, err := j.itemRepo.GetByItemID(ctx, item.ItemID)
				if err == nil && existing != nil {
					// Update existing item
					item.ID = existing.ID
					if err := j.itemRepo.Update(ctx, item); err != nil {
						logger.Error("failed to update item",
							"item_id", item.ItemID,
							"name", item.Name,
							"error", err)
					}
				} else {
					// Create new item
					if err := j.itemRepo.Create(ctx, item); err != nil {
						logger.Error("failed to create item",
							"item_id", item.ItemID,
							"name", item.Name,
							"error", err)
					}
				}

				totalItems++
			}

			logger.Info("synced items page",
				"letter", letterStr,
				"page", page,
				"items", len(itemsList.Items),
				"total_so_far", totalItems)

			// Check if there are more pages
			if page >= itemsList.Total {
				break
			}

			page++

			// Rate limiting - small delay between pages
			time.Sleep(100 * time.Millisecond)
		}

		// Delay between letters
		time.Sleep(200 * time.Millisecond)
	}

	logger.Info("item catalog sync completed", "total_items", totalItems)
	return nil
}

// UpdateItemDetails fetches detailed information for items
func (j *Jobs) UpdateItemDetails(ctx context.Context) error {
	logger.Info("starting item details update")

	// Get all items from database in pages to avoid loading everything at once
	var allItems []models.Item
	limit := 1000
	offset := 0
	for {
		if ctx.Err() != nil {
			return ctx.Err()
		}
		items, err := j.itemRepo.List(ctx, limit, offset, "", nil, "id", "asc")
		if err != nil {
			return fmt.Errorf("failed to list items: %w", err)
		}
		if len(items) == 0 {
			break
		}
		allItems = append(allItems, items...)
		offset += len(items)
		if len(items) < limit {
			break
		}
	}

	if len(allItems) == 0 {
		logger.Info("no items to update")
		return nil
	}

	// worker pool
	numWorkers := runtime.NumCPU() * 2
	if numWorkers < 4 {
		numWorkers = 4
	}

	jobsCh := make(chan models.Item)
	var wg sync.WaitGroup
	var mu sync.Mutex
	updated := 0

	worker := func() {
		defer wg.Done()
		for item := range jobsCh {
			if ctx.Err() != nil {
				return
			}

			detail, err := j.osrsClient.FetchItemDetail(ctx, item.ItemID)
			if err != nil {
				logger.Warn("failed to fetch item detail",
					"item_id", item.ItemID,
					"name", item.Name,
					"error", err)
				continue
			}

			item.Description = detail.Description
			item.Type = detail.Type
			item.Members = detail.Members == "true"

			if err := j.itemRepo.Update(ctx, &item); err != nil {
				logger.Error("failed to update item details",
					"item_id", item.ItemID,
					"error", err)
				continue
			}

			currentPrice := services.ParsePrice(detail.Current.Price)
			trend := &models.PriceTrend{
				ItemID:       item.ID,
				CurrentPrice: currentPrice,
				CurrentTrend: detail.Current.Trend,
				UpdatedAt:    time.Now(),
			}

			if detail.Day30 != nil {
				trend.Day30Change = detail.Day30.Change
				trend.Day30Trend = detail.Day30.Trend
			}
			if detail.Day90 != nil {
				trend.Day90Change = detail.Day90.Change
				trend.Day90Trend = detail.Day90.Trend
			}
			if detail.Day180 != nil {
				trend.Day180Change = detail.Day180.Change
				trend.Day180Trend = detail.Day180.Trend
			}

			if err := j.priceTrendRepo.Upsert(ctx, trend); err != nil {
				logger.Error("failed to upsert price trend",
					"item_id", item.ItemID,
					"error", err)
			}

			mu.Lock()
			updated++
			if updated%50 == 0 {
				logger.Info("item details update progress",
					"updated", updated,
					"total", len(allItems))
			}
			mu.Unlock()

			// small sleep to be gentle with API
			time.Sleep(50 * time.Millisecond)
		}
	}

	// start workers
	wg.Add(numWorkers)
	for i := 0; i < numWorkers; i++ {
		go worker()
	}

	// feed jobs
	for _, it := range allItems {
		select {
		case <-ctx.Done():
			break
		case jobsCh <- it:
		}
	}
	close(jobsCh)
	wg.Wait()

	logger.Info("item details update completed",
		"updated", updated,
		"total", len(allItems))
	return nil
}

// CollectPriceData fetches price history for items
func (j *Jobs) CollectPriceData(ctx context.Context) error {
	logger.Info("starting price data collection")

	// Load all items in pages
	var allItems []models.Item
	limit := 1000
	offset := 0
	for {
		if ctx.Err() != nil {
			return ctx.Err()
		}
		items, err := j.itemRepo.List(ctx, limit, offset, "", nil, "id", "asc")
		if err != nil {
			return fmt.Errorf("failed to list items: %w", err)
		}
		if len(items) == 0 {
			break
		}
		allItems = append(allItems, items...)
		offset += len(items)
		if len(items) < limit {
			break
		}
	}

	if len(allItems) == 0 {
		logger.Info("no items to collect prices for")
		return nil
	}

	numWorkers := runtime.NumCPU() * 2
	if numWorkers < 4 {
		numWorkers = 4
	}

	jobsCh := make(chan models.Item)
	var wg sync.WaitGroup
	var mu sync.Mutex
	collected := 0

	worker := func() {
		defer wg.Done()
		for item := range jobsCh {
			if ctx.Err() != nil {
				return
			}

			priceGraph, err := j.osrsClient.FetchPriceGraph(ctx, item.ItemID)
			if err != nil {
				logger.Warn("failed to fetch price graph",
					"item_id", item.ItemID,
					"name", item.Name,
					"error", err)
				continue
			}

			var priceHistories []*models.PriceHistory
			for timestampStr, price := range priceGraph.Daily {
				timestamp, err := parseTimestamp(timestampStr)
				if err != nil {
					logger.Warn("failed to parse timestamp",
						"timestamp", timestampStr,
						"error", err)
					continue
				}

				priceHistories = append(priceHistories, &models.PriceHistory{
					ItemID:    item.ID,
					Timestamp: timestamp,
					Price:     price,
					Volume:    0,
				})
			}

			if len(priceHistories) > 0 {
				if err := j.priceHistoryRepo.BatchCreate(ctx, priceHistories); err != nil {
					logger.Error("failed to save price history",
						"item_id", item.ItemID,
						"count", len(priceHistories),
						"error", err)
				} else {
					mu.Lock()
					collected++
					if collected%50 == 0 {
						logger.Info("price data collection progress",
							"collected", collected,
							"total", len(allItems))
					}
					mu.Unlock()
				}
			}

			// gentle throttle
			time.Sleep(50 * time.Millisecond)
		}
	}

	wg.Add(numWorkers)
	for i := 0; i < numWorkers; i++ {
		go worker()
	}

	for _, it := range allItems {
		select {
		case <-ctx.Done():
			break
		case jobsCh <- it:
		}
	}
	close(jobsCh)
	wg.Wait()

	logger.Info("price data collection completed",
		"collected", collected,
		"total", len(allItems))
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
