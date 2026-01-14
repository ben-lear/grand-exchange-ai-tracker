package main

import (
	"context"
	"fmt"
	"log"
	"time"

	"github.com/guavi/grand-exchange-ai-tracker/internal/config"
	"github.com/guavi/grand-exchange-ai-tracker/internal/models"
	"github.com/guavi/grand-exchange-ai-tracker/internal/repository"
	"github.com/guavi/grand-exchange-ai-tracker/internal/scheduler"
	"github.com/guavi/grand-exchange-ai-tracker/internal/services"
	"github.com/guavi/grand-exchange-ai-tracker/pkg/logger"
)

func main() {
	// Load configuration
	cfg, err := config.Load()
	if err != nil {
		log.Fatalf("Failed to load configuration: %v", err)
	}

	// Initialize logger
	logger.Init(cfg.Log.Level, cfg.Log.Format)
	defer logger.Sync()

	logger.Info("Starting OSRS Data Sync Test")

	// Initialize database connection
	if err := repository.InitDatabase(&cfg.Database); err != nil {
		logger.Fatal("Failed to initialize database", "error", err)
	}
	defer repository.CloseDatabase()

	// Initialize Redis connection
	if err := repository.InitRedis(&cfg.Redis); err != nil {
		logger.Fatal("Failed to initialize Redis", "error", err)
	}
	defer repository.CloseRedis()

	// Initialize OSRS API client
	osrsClient := services.NewOSRSAPIClient(&cfg.OSRSAPI, repository.RedisClient)

	// Initialize repositories
	itemRepo := repository.NewItemRepository(repository.DB)
	priceHistoryRepo := repository.NewPriceHistoryRepository(repository.DB)
	priceTrendRepo := repository.NewPriceTrendRepository(repository.DB)

	// Create jobs instance
	jobs := scheduler.NewJobs(osrsClient, itemRepo, priceHistoryRepo, priceTrendRepo)

	// Run item catalog sync (limited to first 2 letters for testing)
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Minute)
	defer cancel()

	logger.Info("Starting limited item catalog sync (letters a-b only)...")

	// Temporarily modify the job to only sync 2 letters for testing
	if err := syncLimitedCatalog(ctx, osrsClient, itemRepo); err != nil {
		logger.Error("catalog sync failed", "error", err)
		return
	}

	logger.Info("Test sync completed successfully!")

	// Get count of items
	count, _ := itemRepo.Count(ctx, "", nil)
	logger.Info("Total items in database", "count", count)

	// Run update item details for first 10 items
	logger.Info("Updating details for first 10 items...")
	if err := updateLimitedDetails(ctx, osrsClient, itemRepo, priceTrendRepo); err != nil {
		logger.Error("details update failed", "error", err)
		return
	}

	// Collect price data for first 5 items
	logger.Info("Collecting price data for first 5 items...")
	if err := collectLimitedPriceData(ctx, osrsClient, itemRepo, priceHistoryRepo); err != nil {
		logger.Error("price collection failed", "error", err)
		return
	}

	// Calculate trends
	logger.Info("Calculating trends...")
	if err := jobs.CalculateTrends(ctx); err != nil {
		logger.Error("trend calculation failed", "error", err)
		return
	}

	logger.Info("✅ All test operations completed successfully!")
}

// syncLimitedCatalog syncs only first 2 letters for testing
func syncLimitedCatalog(ctx context.Context, client *services.OSRSAPIClient, repo repository.ItemRepository) error {
	letters := "ab" // Only sync a and b for testing
	totalItems := 0

	for _, letter := range letters {
		letterStr := string(letter)
		page := 1

		for page <= 2 { // Only first 2 pages per letter
			itemsList, err := client.FetchItemsList(ctx, 1, letterStr, page)
			if err != nil {
				logger.Error("failed to fetch items list", "error", err, "letter", letterStr, "page", page)
				break
			}
			if len(itemsList.Items) == 0 {
				logger.Info("no more items", "letter", letterStr, "page", page)
				break
			}

			logger.Info("synced page", "letter", letterStr, "page", page, "items", len(itemsList.Items))

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

				existing, err := repo.GetByItemID(ctx, item.ItemID)
				if err == nil && existing != nil {
					item.ID = existing.ID
					repo.Update(ctx, item)
				} else {
					repo.Create(ctx, item)
				}
				totalItems++
			}

			page++
			time.Sleep(100 * time.Millisecond)
		}
	}

	logger.Info("limited catalog sync completed", "total_items", totalItems)
	return nil
}

// updateLimitedDetails updates first 10 items
func updateLimitedDetails(ctx context.Context, client *services.OSRSAPIClient, itemRepo repository.ItemRepository, trendRepo repository.PriceTrendRepository) error {
	items, err := itemRepo.List(ctx, 10, 0, "", nil, "id", "asc")
	if err != nil || len(items) == 0 {
		return err
	}

	for _, item := range items {
		detail, err := client.FetchItemDetail(ctx, item.ItemID)
		if err != nil {
			continue
		}

		trend := &models.PriceTrend{
			ItemID:       item.ID,
			CurrentPrice: services.ParsePrice(detail.Current.Price),
			CurrentTrend: detail.Current.Trend,
			UpdatedAt:    time.Now(),
		}

		// Set trend data if available
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

		trendRepo.Upsert(ctx, trend)
		logger.Info("updated item", "name", item.Name, "price", trend.CurrentPrice)
		time.Sleep(200 * time.Millisecond)
	}

	return nil
}

// collectLimitedPriceData collects price data for first 5 items
func collectLimitedPriceData(ctx context.Context, client *services.OSRSAPIClient, itemRepo repository.ItemRepository, priceRepo repository.PriceHistoryRepository) error {
	items, err := itemRepo.List(ctx, 5, 0, "", nil, "id", "asc")
	if err != nil || len(items) == 0 {
		return err
	}

	for _, item := range items {
		priceGraph, err := client.FetchPriceGraph(ctx, item.ItemID)
		if err != nil {
			continue
		}

		var priceHistories []*models.PriceHistory
		for timestampStr, price := range priceGraph.Daily {
			timestamp, _ := parseTimestamp(timestampStr)
			priceHistories = append(priceHistories, &models.PriceHistory{
				ItemID:    item.ID,
				Timestamp: timestamp,
				Price:     price,
				Volume:    0,
			})
		}

		if len(priceHistories) > 0 {
			priceRepo.BatchCreate(ctx, priceHistories)
			logger.Info("collected prices", "item", item.Name, "count", len(priceHistories))
		}

		time.Sleep(300 * time.Millisecond)
	}

	return nil
}

func parseTimestamp(ts string) (int64, error) {
	var timestamp int64
	_, err := fmt.Sscanf(ts, "%d", &timestamp)
	if err != nil {
		return 0, err
	}
	return timestamp / 1000, nil
}
