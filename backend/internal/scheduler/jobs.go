package scheduler

import (
	"context"
	"time"

	"github.com/robfig/cron/v3"
	"go.uber.org/zap"

	"github.com/guavi/osrs-ge-tracker/internal/models"
	"github.com/guavi/osrs-ge-tracker/internal/services"
)

// Scheduler manages scheduled jobs
type Scheduler struct {
	cron         *cron.Cron
	priceService services.PriceService
	itemService  services.ItemService
	logger       *zap.SugaredLogger
}

// NewScheduler creates a new scheduler
func NewScheduler(
	priceService services.PriceService,
	itemService services.ItemService,
	logger *zap.SugaredLogger,
) *Scheduler {
	// Create cron with second precision
	c := cron.New(cron.WithSeconds())

	return &Scheduler{
		cron:         c,
		priceService: priceService,
		itemService:  itemService,
		logger:       logger,
	}
}

// Start starts all scheduled jobs
func (s *Scheduler) Start() error {
	s.logger.Info("Starting scheduler...")

	// Run initial item sync to ensure we have all items before syncing prices
	go s.syncItemsJob()

	// Job 0: Sync items from bulk dump every 6 hours
	_, err := s.cron.AddFunc("0 0 */6 * * *", s.syncItemsJob)
	if err != nil {
		return err
	}
	s.logger.Info("Scheduled: Sync items from bulk dump (every 6 hours)")

	// Job 1: Sync current prices every 1 minute
	_, err = s.cron.AddFunc("0 * * * * *", s.syncCurrentPricesJob)
	if err != nil {
		return err
	}
	s.logger.Info("Scheduled: Sync current prices (every 1 minute)")

	// Job 2: Sync historical data for top items every 1 hour
	_, err = s.cron.AddFunc("0 0 * * * *", s.syncTopItemsHistoryJob)
	if err != nil {
		return err
	}
	s.logger.Info("Scheduled: Sync top items history (every 1 hour)")

	// Job 3: Full historical sync every 24 hours at 2 AM
	_, err = s.cron.AddFunc("0 0 2 * * *", s.syncAllItemsHistoryJob)
	if err != nil {
		return err
	}
	s.logger.Info("Scheduled: Sync all items history (daily at 2 AM)")

	// Start the cron scheduler
	s.cron.Start()
	s.logger.Info("Scheduler started successfully")

	return nil
}

// Stop stops all scheduled jobs
func (s *Scheduler) Stop() {
	s.logger.Info("Stopping scheduler...")
	ctx := s.cron.Stop()
	<-ctx.Done()
	s.logger.Info("Scheduler stopped")
}

// syncItemsJob syncs all items from the OSRS bulk dump
func (s *Scheduler) syncItemsJob() {
	s.logger.Info("Starting items sync job")
	start := time.Now()

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Minute)
	defer cancel()

	err := s.itemService.SyncItemsFromBulkDump(ctx)
	if err != nil {
		s.logger.Errorf("Items sync failed: %v", err)
		return
	}

	duration := time.Since(start)
	s.logger.Infow("Items sync completed",
		"duration_ms", duration.Milliseconds(),
	)
}

// syncCurrentPricesJob syncs current prices from OSRS bulk dump
func (s *Scheduler) syncCurrentPricesJob() {
	s.logger.Info("Starting current prices sync job")
	start := time.Now()

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Minute)
	defer cancel()

	err := s.priceService.SyncCurrentPrices(ctx)
	if err != nil {
		s.logger.Errorf("Current prices sync failed: %v", err)
		return
	}

	duration := time.Since(start)
	s.logger.Infow("Current prices sync completed",
		"duration_ms", duration.Milliseconds(),
	)
}

// syncTopItemsHistoryJob syncs historical data for top traded items
func (s *Scheduler) syncTopItemsHistoryJob() {
	s.logger.Info("Starting top items history sync job")
	start := time.Now()

	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Minute)
	defer cancel()

	// Get top 100 items by volume (or most popular items)
	// For now, we'll sync a predefined list of popular items
	topItemIDs := getTopItemIDs()

	successCount := 0
	failCount := 0

	for _, itemID := range topItemIDs {
		err := s.priceService.SyncHistoricalPrices(ctx, itemID, false)
		if err != nil {
			s.logger.Errorf("Failed to sync history for item %d: %v", itemID, err)
			failCount++
			continue
		}
		successCount++

		// Small delay to avoid rate limiting
		time.Sleep(100 * time.Millisecond)
	}

	duration := time.Since(start)
	s.logger.Infow("Top items history sync completed",
		"success", successCount,
		"failed", failCount,
		"total", len(topItemIDs),
		"duration_ms", duration.Milliseconds(),
	)
}

// syncAllItemsHistoryJob performs a full historical sync for all items
func (s *Scheduler) syncAllItemsHistoryJob() {
	s.logger.Info("Starting full historical sync job")
	start := time.Now()

	ctx, cancel := context.WithTimeout(context.Background(), 6*time.Hour)
	defer cancel()

	// Get all items
	items, _, err := s.itemService.ListItems(ctx, models.ItemListParams{
		Page:  1,
		Limit: 10000, // Get all items
	})
	if err != nil {
		s.logger.Errorf("Failed to get items for full sync: %v", err)
		return
	}

	s.logger.Infof("Starting full sync for %d items", len(items))

	successCount := 0
	failCount := 0

	for i, item := range items {
		// Log progress every 100 items
		if i > 0 && i%100 == 0 {
			s.logger.Infof("Progress: %d/%d items synced", i, len(items))
		}

		err := s.priceService.SyncHistoricalPrices(ctx, item.ItemID, true)
		if err != nil {
			s.logger.Errorf("Failed to sync history for item %d: %v", item.ItemID, err)
			failCount++
			continue
		}
		successCount++

		// Staggered delay to avoid rate limiting (200ms between requests)
		time.Sleep(200 * time.Millisecond)
	}

	duration := time.Since(start)
	s.logger.Infow("Full historical sync completed",
		"success", successCount,
		"failed", failCount,
		"total", len(items),
		"duration_minutes", duration.Minutes(),
	)
}

// getTopItemIDs returns a list of the most popular/traded item IDs
func getTopItemIDs() []int {
	// These are some of the most traded items in OSRS
	// In a real implementation, you'd query these based on volume or other metrics
	return []int{
		// Currency items
		995,   // Coins
		13190, // Platinum token

		// Popular consumables
		385,  // Shark
		3144, // Karambwan
		6685, // Saradomin brew(4)
		2434, // Super restore(4)

		// Combat gear
		4151,  // Abyssal whip
		11802, // Armadyl godsword
		13576, // Dragon warhammer
		19553, // Avernic defender hilt

		// Skilling supplies
		1513, // Magic logs
		561,  // Nature rune
		554,  // Fire rune
		555,  // Water rune
		556,  // Air rune
		557,  // Earth rune

		// Popular herbs/potions
		257,  // Ranarr weed
		3040, // Ranarr potion (unf)
		2448, // Super attack(4)
		2440, // Super strength(4)
		2436, // Super defence(4)

		// Ores/bars
		440,  // Iron ore
		453,  // Coal
		2357, // Gold bar
		2359, // Silver bar

		// Dragon items
		1215,  // Dragon dagger
		1249,  // Dragon scimitar
		11920, // Dragon pickaxe

		// Jewelry
		1712,  // Amulet of glory(4)
		11978, // Amulet of torture

		// Runes and teleport items
		563,  // Law rune
		564,  // Cosmic rune
		8007, // Teleport to house (tablet)
	}
}
