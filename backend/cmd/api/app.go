package main

import (
	"context"
	"errors"
	"fmt"
	"os"
	"os/signal"
	"strings"
	"syscall"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/guavi/grand-exchange-ai-tracker/internal/api"
	"github.com/guavi/grand-exchange-ai-tracker/internal/api/handlers"
	"github.com/guavi/grand-exchange-ai-tracker/internal/config"
	"github.com/guavi/grand-exchange-ai-tracker/internal/repository"
	"github.com/guavi/grand-exchange-ai-tracker/internal/scheduler"
	"github.com/guavi/grand-exchange-ai-tracker/internal/services"
	"github.com/guavi/grand-exchange-ai-tracker/pkg/logger"
	"github.com/redis/go-redis/v9"
	"gorm.io/gorm"
)

type appDeps struct {
	cfg              *config.Config
	db               *gorm.DB
	redis            *redis.Client
	osrsClient       *services.OSRSAPIClient
	itemRepo         repository.ItemRepository
	priceHistoryRepo repository.PriceHistoryRepository
	priceTrendRepo   repository.PriceTrendRepository
}

func run() error {
	cfg, err := loadConfig()
	if err != nil {
		return err
	}

	cleanupLogger := initLogging(cfg)
	defer cleanupLogger()

	db, redisClient, cleanupStorage, err := initStorage(cfg)
	if err != nil {
		return err
	}
	defer cleanupStorage()

	deps := buildDependencies(cfg, db, redisClient)

	fiberApp := newFiberApp()
	setupHTTP(fiberApp, deps)

	sched, err := setupScheduler(deps.osrsClient, deps.itemRepo, deps.priceHistoryRepo, deps.priceTrendRepo)
	if err != nil {
		return err
	}

	ctx, stop := signal.NotifyContext(context.Background(), syscall.SIGINT, syscall.SIGTERM)
	defer stop()

	startInitialSyncThenScheduler(ctx, sched, deps)

	serverErrCh := startHTTPServer(fiberApp, cfg.Server.Port)

	select {
	case <-ctx.Done():
		logger.Info("shutdown signal received")
	case err := <-serverErrCh:
		if err != nil {
			return err
		}
	}

	return shutdown(fiberApp, sched)
}

func loadConfig() (*config.Config, error) {
	cfg, err := config.Load()
	if err != nil {
		return nil, fmt.Errorf("load config: %w", err)
	}
	return cfg, nil
}

func initLogging(cfg *config.Config) func() {
	logger.Init(cfg.Log.Level, cfg.Log.Format)
	logger.Info("Starting OSRS Grand Exchange Tracker API")
	logger.Info("Configuration loaded", "env", cfg.Server.Env)

	return func() {
		logger.Sync()
	}
}

func initStorage(cfg *config.Config) (*gorm.DB, *redis.Client, func(), error) {
	db, err := repository.InitDatabase(&cfg.Database)
	if err != nil {
		return nil, nil, nil, fmt.Errorf("init database: %w", err)
	}

	redisClient, err := repository.InitRedis(&cfg.Redis)
	if err != nil {
		_ = repository.CloseDatabase(db)
		return nil, nil, nil, fmt.Errorf("init redis: %w", err)
	}

	cleanup := func() {
		if err := repository.CloseRedis(redisClient); err != nil {
			logger.Error("Error closing Redis connection", "error", err)
		}
		if err := repository.CloseDatabase(db); err != nil {
			logger.Error("Error closing database connection", "error", err)
		}
	}

	return db, redisClient, cleanup, nil
}

func buildDependencies(cfg *config.Config, db *gorm.DB, redisClient *redis.Client) appDeps {
	osrsClient := services.NewOSRSAPIClient(&cfg.OSRSAPI, redisClient)

	itemRepo := repository.NewItemRepository(db)
	priceHistoryRepo := repository.NewPriceHistoryRepository(db)
	priceTrendRepo := repository.NewPriceTrendRepository(db)

	return appDeps{
		cfg:              cfg,
		db:               db,
		redis:            redisClient,
		osrsClient:       osrsClient,
		itemRepo:         itemRepo,
		priceHistoryRepo: priceHistoryRepo,
		priceTrendRepo:   priceTrendRepo,
	}
}

func newFiberApp() *fiber.App {
	return fiber.New(fiber.Config{
		AppName:      "OSRS Grand Exchange Tracker API",
		ServerHeader: "Fiber",
		ErrorHandler: fiberErrorHandler,
	})
}

func fiberErrorHandler(c *fiber.Ctx, err error) error {
	code := fiber.StatusInternalServerError
	if e, ok := err.(*fiber.Error); ok {
		code = e.Code
	}

	logger.Error("request error",
		"error", err,
		"path", c.Path(),
		"method", c.Method(),
		"status", code,
	)

	return c.Status(code).JSON(fiber.Map{
		"status":  "error",
		"message": err.Error(),
		"code":    code,
	})
}

func setupHTTP(app *fiber.App, deps appDeps) {
	api.SetupMiddleware(app)

	itemHandler := handlers.NewItemHandler(deps.itemRepo, deps.priceHistoryRepo, deps.priceTrendRepo, deps.osrsClient)
	priceHandler := handlers.NewPriceHandler(deps.priceHistoryRepo, deps.priceTrendRepo, deps.itemRepo)
	healthHandler := handlers.NewHealthHandler(deps.db, deps.redis)

	api.SetupRoutes(app, itemHandler, priceHandler, healthHandler)
}

func setupScheduler(
	osrsClient *services.OSRSAPIClient,
	itemRepo repository.ItemRepository,
	priceHistoryRepo repository.PriceHistoryRepository,
	priceTrendRepo repository.PriceTrendRepository,
) (*scheduler.Scheduler, error) {
	logger.Info("Initializing scheduler with WeirdGloop-based jobs...")
	sched := scheduler.New()
	jobs := scheduler.NewJobs(osrsClient, itemRepo, priceHistoryRepo, priceTrendRepo)

	// New schedule optimized for WeirdGloop bulk API
	// Item catalog sync: Daily at 2:00 AM (fetches complete dump once per day)
	if err := sched.AddJob("item_catalog_sync", "0 0 2 * * *", jobs.SyncItemCatalog); err != nil {
		logger.Error("failed to add item catalog sync job", "error", err)
	}

	// Price updates: Every 5 minutes (efficient with bulk dump API)
	if err := sched.AddJob("price_update", "0 */5 * * * *", jobs.UpdateItemPrices); err != nil {
		logger.Error("failed to add price update job", "error", err)
	}

	// Historical price data collection: Every hour (for trending items only)
	if err := sched.AddJob("historical_price_collection", "0 0 * * * *", jobs.CollectPriceData); err != nil {
		logger.Error("failed to add historical price collection job", "error", err)
	}

	// Trend calculation: Every 15 minutes
	if err := sched.AddJob("trend_calculation", "0 */15 * * * *", jobs.CalculateTrends); err != nil {
		logger.Error("failed to add trend calculation job", "error", err)
	}

	// Old data cleanup: Daily at 2:30 AM (keep last 180 days)
	if err := sched.AddJob("old_data_cleanup", "0 30 2 * * *", jobs.CleanupOldData); err != nil {
		logger.Error("failed to add old data cleanup job", "error", err)
	}

	return sched, nil
}

func startInitialSyncThenScheduler(ctx context.Context, sched *scheduler.Scheduler, deps appDeps) {
	jobs := scheduler.NewJobs(deps.osrsClient, deps.itemRepo, deps.priceHistoryRepo, deps.priceTrendRepo)

	go func() {
		runStep := func(name string, timeout time.Duration, fn func(context.Context) error) bool {
			select {
			case <-ctx.Done():
				logger.Info("initial sync: cancelled", "step", name)
				return false
			default:
			}

			stepCtx, cancel := context.WithTimeout(ctx, timeout)
			defer cancel()

			logger.Info("initial sync: starting", "step", name)
			if err := fn(stepCtx); err != nil {
				logger.Error("initial sync failed", "step", name, "error", err)
				return true
			}
			logger.Info("initial sync: completed", "step", name)
			return true
		}

		_ = runStep("catalog_sync", 30*time.Minute, jobs.SyncItemCatalog)
		_ = runStep("item_details_update", 30*time.Minute, jobs.UpdateItemDetails)
		// TODO: Fix FetchHistoricalData JSON parsing before enabling
		// _ = runStep("price_data_collection", 30*time.Minute, jobs.CollectPriceData)
		_ = runStep("initial_historical_data", 5*time.Minute, jobs.CollectInitialHistoricalData)

		select {
		case <-ctx.Done():
			logger.Info("scheduler start skipped: shutting down")
			return
		default:
		}

		sched.Start()
		logger.Info("Scheduler started", "jobs_count", sched.GetJobCount())
	}()
}

func startHTTPServer(app *fiber.App, port string) <-chan error {
	errCh := make(chan error, 1)

	logger.Info("Starting HTTP server", "port", port)
	go func() {
		err := app.Listen(":" + port)
		if err == nil {
			errCh <- nil
			return
		}

		// Fiber returns an error on shutdown on some platforms/configurations.
		if isExpectedServerClose(err) {
			errCh <- nil
			return
		}

		errCh <- fmt.Errorf("listen: %w", err)
	}()

	return errCh
}

func isExpectedServerClose(err error) bool {
	if err == nil {
		return false
	}
	if errors.Is(err, os.ErrClosed) {
		return true
	}

	msg := strings.ToLower(err.Error())
	return strings.Contains(msg, "server closed") || strings.Contains(msg, "use of closed network connection")
}

func shutdown(app *fiber.App, sched *scheduler.Scheduler) error {
	logger.Info("Shutting down server...")
	sched.Stop()

	if err := app.ShutdownWithTimeout(10 * time.Second); err != nil {
		logger.Error("Server forced to shutdown", "error", err)
		return fmt.Errorf("shutdown: %w", err)
	}
	return nil
}
