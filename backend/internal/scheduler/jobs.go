package scheduler

import (
	"context"
	"sync/atomic"
	"time"

	"github.com/robfig/cron/v3"
	"go.uber.org/zap"

	"github.com/guavi/osrs-ge-tracker/internal/models"
	"github.com/guavi/osrs-ge-tracker/internal/services"
)

// Scheduler manages scheduled jobs.
type Scheduler struct {
	cron             *cron.Cron
	priceService     services.PriceService
	itemService      services.ItemService
	watchlistService services.WatchlistService
	sseHub           *services.SSEHub
	logger           *zap.SugaredLogger
	itemsSynced      atomic.Bool
}

// NewScheduler creates a new scheduler.
func NewScheduler(
	priceService services.PriceService,
	itemService services.ItemService,
	watchlistService services.WatchlistService,
	sseHub *services.SSEHub,
	logger *zap.SugaredLogger,
) *Scheduler {
	// Create cron with second precision
	c := cron.New(cron.WithSeconds())

	return &Scheduler{
		cron:             c,
		priceService:     priceService,
		itemService:      itemService,
		watchlistService: watchlistService,
		sseHub:           sseHub,
		logger:           logger,
	}
}

// Start starts all scheduled jobs.
func (s *Scheduler) Start() error {
	s.logger.Info("Starting scheduler...")
	s.itemsSynced.Store(false)

	// Run initial item sync to ensure we have all items before syncing prices.
	// This runs async, but price sync is gated on first successful item sync.
	go s.syncItemsJob()

	// Job 0: Sync items from OSRS Wiki mapping every 6 hours
	_, err := s.cron.AddFunc("0 0 */6 * * *", s.syncItemsJob)
	if err != nil {
		return err
	}
	s.logger.Info("Scheduled: Sync items from wiki mapping (every 6 hours)")

	// Job 1: Sync current prices every 1 minute
	_, err = s.cron.AddFunc("0 * * * * *", s.syncCurrentPricesJob)
	if err != nil {
		return err
	}
	s.logger.Info("Scheduled: Sync current prices (every 1 minute)")

	// Job 2: Ensure future partitions exist (daily at 00:02)
	_, err = s.cron.AddFunc("0 2 0 * * *", s.ensurePartitionsJob)
	if err != nil {
		return err
	}
	s.logger.Info("Scheduled: Partition maintenance (daily at 00:02)")

	// Job 3: Run maintenance (rollups + pruning) daily
	_, err = s.cron.AddFunc("0 5 0 * * *", s.maintenanceJob)
	if err != nil {
		return err
	}
	s.logger.Info("Scheduled: Price maintenance (daily at 00:05)")

	// Job 4: Cleanup expired watchlist shares daily at 02:00
	_, err = s.cron.AddFunc("0 0 2 * * *", s.cleanupWatchlistSharesJob)
	if err != nil {
		return err
	}
	s.logger.Info("Scheduled: Watchlist shares cleanup (daily at 02:00)")

	// Start the cron scheduler
	s.cron.Start()
	s.logger.Info("Scheduler started successfully")

	return nil
}

// Stop stops all scheduled jobs.
func (s *Scheduler) Stop() {
	s.logger.Info("Stopping scheduler...")
	ctx := s.cron.Stop()
	<-ctx.Done()
	s.logger.Info("Scheduler stopped")
}

// syncItemsJob syncs all items from the OSRS Wiki mapping endpoint.
func (s *Scheduler) syncItemsJob() {
	s.logger.Info("Starting items sync job")
	start := time.Now()

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Minute)
	defer cancel()

	err := s.itemService.SyncItemsFromMapping(ctx)
	if err != nil {
		s.logger.Errorf("Items sync failed: %v", err)
		return
	}

	// Mark items as ready for price syncing; on the first successful sync, trigger an immediate
	// price sync so the API has data without waiting for the next cron tick.
	if s.itemsSynced.CompareAndSwap(false, true) {
		s.logger.Info("Initial items sync completed; triggering initial current prices sync")
		go s.ensurePartitionsJob()
		go s.syncCurrentPricesJob()
	}

	duration := time.Since(start)
	s.logger.Infow("Items sync completed",
		"duration_ms", duration.Milliseconds(),
	)
}

// syncCurrentPricesJob syncs current prices from OSRS Wiki /latest.
func (s *Scheduler) syncCurrentPricesJob() {
	if !s.itemsSynced.Load() {
		s.logger.Info("Skipping current prices sync; items have not been synced yet")
		return
	}

	s.logger.Info("Starting current prices sync job")
	start := time.Now()

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Minute)
	defer cancel()

	updates, err := s.priceService.SyncCurrentPrices(ctx)
	if err != nil {
		s.logger.Errorf("Current prices sync failed: %v", err)
		return
	}

	duration := time.Since(start)
	s.logger.Infow("Current prices sync completed",
		"duration_ms", duration.Milliseconds(),
		"price_updates", len(updates),
	)

	// Broadcast SSE events if hub is available and clients are connected
	if s.sseHub != nil && s.sseHub.ClientCount() > 0 {
		s.logger.Debugw("Broadcasting price updates to SSE clients",
			"client_count", s.sseHub.ClientCount(),
			"update_count", len(updates))

		// Send sync-complete event
		s.sseHub.Broadcast(services.SSEMessage{
			Event:     "sync-complete",
			Data:      map[string]interface{}{"timestamp": time.Now(), "count": len(updates)},
			Timestamp: time.Now(),
		})

		// Broadcast price updates
		s.broadcastPriceUpdates(updates)
	}
}

// broadcastPriceUpdates broadcasts price updates through SSE in batches.
func (s *Scheduler) broadcastPriceUpdates(updates []models.BulkPriceUpdate) {
	if s.sseHub == nil || len(updates) == 0 {
		return
	}

	// Batch size for SSE broadcasts to avoid overwhelming the hub queue
	const batchSize = 100

	for i := 0; i < len(updates); i += batchSize {
		end := i + batchSize
		if end > len(updates) {
			end = len(updates)
		}

		batch := updates[i:end]
		payloads := make([]services.PriceUpdatePayload, 0, len(batch))

		for _, update := range batch {
			payloads = append(payloads, services.BulkPriceUpdateToPayload(update))
		}

		// Broadcast batch as a single message
		for _, payload := range payloads {
			itemID := payload.ItemID
			s.sseHub.Broadcast(services.SSEMessage{
				Event:     "price-update",
				Data:      payload,
				Timestamp: time.Now(),
				ItemID:    &itemID,
			})
		}
	}

	s.logger.Infow("Price updates broadcast completed",
		"total_updates", len(updates),
		"batches", (len(updates)+batchSize-1)/batchSize,
	)
}

func (s *Scheduler) ensurePartitionsJob() {
	s.logger.Info("Starting partition maintenance job")
	start := time.Now()

	ctx, cancel := context.WithTimeout(context.Background(), 2*time.Minute)
	defer cancel()

	// Create partitions for the next 7 days
	err := s.priceService.EnsureFuturePartitions(ctx, 7)
	if err != nil {
		s.logger.Errorf("Partition maintenance failed: %v", err)
		return
	}

	duration := time.Since(start)
	s.logger.Infow("Partition maintenance completed",
		"duration_ms", duration.Milliseconds(),
	)
}

func (s *Scheduler) maintenanceJob() {
	s.logger.Info("Starting price maintenance job")
	start := time.Now()

	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Minute)
	defer cancel()

	err := s.priceService.RunMaintenance(ctx)
	if err != nil {
		s.logger.Errorf("Price maintenance failed: %v", err)
		return
	}

	duration := time.Since(start)
	s.logger.Infow("Price maintenance completed",
		"duration_ms", duration.Milliseconds(),
	)
}

// cleanupWatchlistSharesJob removes expired watchlist shares from the database.
func (s *Scheduler) cleanupWatchlistSharesJob() {
	if s.watchlistService == nil {
		s.logger.Debug("Watchlist service not available, skipping cleanup")
		return
	}

	s.logger.Info("Starting watchlist shares cleanup job")
	start := time.Now()

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Minute)
	defer cancel()

	count, err := s.watchlistService.CleanupExpiredShares(ctx)
	if err != nil {
		s.logger.Errorf("Watchlist shares cleanup failed: %v", err)
		return
	}

	duration := time.Since(start)
	s.logger.Infow("Watchlist shares cleanup completed",
		"duration_ms", duration.Milliseconds(),
		"deleted_count", count,
	)
}
