package main

import (
	"log"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/guavi/grand-exchange-ai-tracker/internal/api"
	"github.com/guavi/grand-exchange-ai-tracker/internal/config"
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

	logger.Info("Starting OSRS Grand Exchange Tracker API")
	logger.Info("Configuration loaded", "env", cfg.Server.Env)

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

	logger.Info("Initializing Fiber app...")

	// Initialize Fiber app
	app := fiber.New(fiber.Config{
		AppName:      "OSRS Grand Exchange Tracker API",
		ServerHeader: "Fiber",
		ErrorHandler: func(c *fiber.Ctx, err error) error {
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
		},
	})

	// Setup middleware
	api.SetupMiddleware(app)

	// Setup routes
	api.SetupRoutes(app, osrsClient)

	// Initialize scheduler
	logger.Info("Initializing scheduler...")
	sched := scheduler.New()

	// Initialize repositories for jobs
	itemRepo := repository.NewItemRepository(repository.DB)
	priceHistoryRepo := repository.NewPriceHistoryRepository(repository.DB)
	priceTrendRepo := repository.NewPriceTrendRepository(repository.DB)

	// Create jobs instance
	jobs := scheduler.NewJobs(osrsClient, itemRepo, priceHistoryRepo, priceTrendRepo)

	// Schedule jobs
	// Item catalog sync - Daily at 3:00 AM
	if err := sched.AddJob("item_catalog_sync", "0 0 3 * * *", jobs.SyncItemCatalog); err != nil {
		logger.Error("failed to add item catalog sync job", "error", err)
	}

	// Item details update - Every 6 hours
	if err := sched.AddJob("item_details_update", "0 0 */6 * * *", jobs.UpdateItemDetails); err != nil {
		logger.Error("failed to add item details update job", "error", err)
	}

	// Price data collection - Every hour
	if err := sched.AddJob("price_data_collection", "0 0 * * * *", jobs.CollectPriceData); err != nil {
		logger.Error("failed to add price data collection job", "error", err)
	}

	// Trend calculation - Every 15 minutes
	if err := sched.AddJob("trend_calculation", "0 */15 * * * *", jobs.CalculateTrends); err != nil {
		logger.Error("failed to add trend calculation job", "error", err)
	}

	// Old data cleanup - Daily at 2:00 AM
	if err := sched.AddJob("old_data_cleanup", "0 0 2 * * *", jobs.CleanupOldData); err != nil {
		logger.Error("failed to add old data cleanup job", "error", err)
	}

	// Start scheduler
	sched.Start()
	logger.Info("Scheduler started", "jobs_count", sched.GetJobCount())

	logger.Info("Starting HTTP server", "port", cfg.Server.Port)

	// Start server in a goroutine
	go func() {
		if err := app.Listen(":" + cfg.Server.Port); err != nil {
			logger.Fatal("Failed to start server", "error", err)
		}
	}()

	// Wait for interrupt signal to gracefully shutdown
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	logger.Info("Shutting down server...")

	// Stop scheduler
	sched.Stop()

	// Graceful shutdown with 10 second timeout
	if err := app.ShutdownWithTimeout(10 * time.Second); err != nil {
		logger.Error("Server forced to shutdown", "error", err)
	}

	// Cleanup resources
	if err := repository.CloseRedis(); err != nil {
		logger.Error("Error closing Redis connection", "error", err)
	}
	if err := repository.CloseDatabase(); err != nil {
		logger.Error("Error closing database connection", "error", err)
	}
}
