package scheduler

import (
	"context"
	"sync/atomic"
	"time"

	"github.com/guavi/osrs-ge-tracker/internal/services"
	"github.com/robfig/cron/v3"
	"go.uber.org/zap"
)

// Scheduler manages scheduled jobs
type Scheduler struct {
	cron         *cron.Cron
	priceService services.PriceService
	itemService  services.ItemService
	logger       *zap.SugaredLogger
	itemsSynced  atomic.Bool
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

	// Job 2: Run maintenance (rollups + pruning) daily
	_, err = s.cron.AddFunc("0 5 0 * * *", s.maintenanceJob)
	if err != nil {
		return err
	}
	s.logger.Info("Scheduled: Price maintenance (daily at 00:05)")

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

// syncItemsJob syncs all items from the OSRS Wiki mapping endpoint
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
		go s.syncCurrentPricesJob()
	}

	duration := time.Since(start)
	s.logger.Infow("Items sync completed",
		"duration_ms", duration.Milliseconds(),
	)
}

// syncCurrentPricesJob syncs current prices from OSRS Wiki /latest
func (s *Scheduler) syncCurrentPricesJob() {
	if !s.itemsSynced.Load() {
		s.logger.Info("Skipping current prices sync; items have not been synced yet")
		return
	}

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
