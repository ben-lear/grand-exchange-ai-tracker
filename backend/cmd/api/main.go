package main

import (
	"fmt"
	"log"
	"os"
	"os/signal"
	"syscall"

	"github.com/gofiber/fiber/v2"
	"go.uber.org/zap"

	"github.com/guavi/osrs-ge-tracker/internal/config"
	"github.com/guavi/osrs-ge-tracker/internal/database"
	"github.com/guavi/osrs-ge-tracker/internal/handlers"
	"github.com/guavi/osrs-ge-tracker/internal/middleware"
	"github.com/guavi/osrs-ge-tracker/internal/repository"
	"github.com/guavi/osrs-ge-tracker/internal/scheduler"
	"github.com/guavi/osrs-ge-tracker/internal/services"
)

func main() {
	// Initialize logger
	zapLogger, err := zap.NewProduction()
	if err != nil {
		log.Fatalf("Failed to initialize logger: %v", err)
	}

	logger := zapLogger.Sugar()

	// Load configuration
	cfg, err := config.LoadConfig()
	if err != nil {
		logger.Fatalf("Failed to load configuration: %v", err)
	}

	// Initialize database
	// Note: Variables for external resource clients use 'Client' suffix for clarity
	// (dbClient, redisClient) to distinguish from generic names and indicate connection nature
	dbClient, err := database.NewPostgresDB(cfg.Database)
	if err != nil {
		logger.Fatalf("Failed to connect to database: %v", err)
	}

	// Initialize Redis
	redisClient, err := database.NewRedisClient(cfg.Cache)
	if err != nil {
		logger.Fatalf("Failed to connect to Redis: %v", err)
	}
	defer redisClient.Close()

	// Initialize repositories
	// Note: Passing specific config structs (cfg.Database, cfg.Cache) instead of full cfg
	// reduces chaining and makes dependencies explicit
	itemRepo := repository.NewItemRepository(dbClient, logger)
	priceRepo := repository.NewPriceRepository(dbClient, logger)

	// Initialize services
	cacheService := services.NewCacheService(redisClient, logger)
	itemService := services.NewItemService(itemRepo, cacheService, cfg.WikiPricesBaseURL, logger)
	priceService := services.NewPriceService(priceRepo, itemRepo, cacheService, cfg.WikiPricesBaseURL, logger)

	// Initialize SSE Hub if enabled
	var sseHub *services.SSEHub
	if cfg.SSE.Enabled {
		sseHub = services.NewSSEHub(logger, cfg.SSE.MaxClients)
		go sseHub.Run()
		logger.Info("SSE Hub started")
	}

	// Initialize handlers
	healthHandler := handlers.NewHealthHandler(dbClient, redisClient, logger)
	itemHandler := handlers.NewItemHandler(itemService, priceService, logger)
	priceHandler := handlers.NewPriceHandler(priceService, logger)

	// Initialize SSE handler if enabled
	var sseHandler *handlers.SSEHandler
	if cfg.SSE.Enabled && sseHub != nil {
		sseHandler = handlers.NewSSEHandler(
			sseHub,
			logger,
			handlers.SSEConfig{
				ConnectionTimeout: cfg.SSE.ConnectionTimeout,
				HeartbeatInterval: cfg.SSE.HeartbeatInterval,
				MaxClients:        cfg.SSE.MaxClients,
			},
		)
	}

	// Create Fiber app
	app := fiber.New(fiber.Config{
		AppName:      "OSRS GE Tracker API",
		ServerHeader: "OSRS-GE-Tracker",
		ErrorHandler: middleware.NewErrorHandler(middleware.ErrorHandlerConfig{
			Logger: logger,
		}),
	})

	// Global middleware
	app.Use(middleware.RecoverMiddleware(logger))
	app.Use(middleware.NewRequestLogger(middleware.RequestLoggerConfig{
		Logger: logger,
	}))
	app.Use(middleware.NewCORSMiddleware(middleware.CORSConfig{
		AllowedOrigins: []string{cfg.CorsOrigins},
	}))

	// Health check endpoints (no rate limiting)
	app.Get("/health", healthHandler.Health)
	app.Get("/health/live", healthHandler.Liveness)
	app.Get("/health/ready", healthHandler.Readiness)

	// API routes with rate limiting
	api := app.Group("/api/v1", middleware.NewAPIRateLimiter())
	// API routes without rate limiting (e.g., long-lived SSE connections)
	apiNoLimit := app.Group("/api/v1")

	// Root API endpoint
	api.Get("/", func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{
			"message": "OSRS Grand Exchange Tracker API v1",
			"version": "1.0.0",
			"docs":    "/api/v1/docs",
		})
	})

	// Item routes
	items := api.Group("/items")
	items.Get("/", itemHandler.ListItems)         // GET /api/v1/items
	items.Get("/search", itemHandler.SearchItems) // GET /api/v1/items/search?q=...
	items.Get("/count", itemHandler.GetItemCount) // GET /api/v1/items/count
	items.Get("/:id", itemHandler.GetItemByID)    // GET /api/v1/items/:id

	// Price routes
	prices := api.Group("/prices")
	prices.Get("/current", priceHandler.GetAllCurrentPrices)         // GET /api/v1/prices/current
	prices.Get("/current/batch", priceHandler.GetBatchCurrentPrices) // GET /api/v1/prices/current/batch?ids=1,2,3
	prices.Get("/current/:id", priceHandler.GetCurrentPrice)         // GET /api/v1/prices/current/:id
	prices.Get("/history/:id", priceHandler.GetPriceHistory)         // GET /api/v1/prices/history/:id?period=7d&sample=150

	// SSE route (if enabled) - avoid rate limiting to prevent disconnect loops
	if cfg.SSE.Enabled && sseHandler != nil {
		pricesNoLimit := apiNoLimit.Group("/prices")
		pricesNoLimit.Get("/stream", sseHandler.Stream) // GET /api/v1/prices/stream?items=1,2,3
	}

	// Admin/sync routes (with stricter rate limiting)
	sync := api.Group("/sync", middleware.NewSyncRateLimiter())
	sync.Post("/prices", priceHandler.SyncCurrentPrices) // POST /api/v1/sync/prices

	// Initialize and start scheduler (pass SSE hub if enabled)
	sched := scheduler.NewScheduler(priceService, itemService, sseHub, logger)
	if err := sched.Start(); err != nil {
		logger.Fatalf("Failed to start scheduler: %v", err)
	}
	defer sched.Stop()

	// Start server in a goroutine
	go func() {
		addr := fmt.Sprintf(":%s", cfg.Port)
		logger.Infof("Starting server on %s", addr)
		if err := app.Listen(addr); err != nil {
			logger.Fatalf("Failed to start server: %v", err)
		}
	}()

	// Graceful shutdown
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	logger.Info("Shutting down server...")

	// Stop SSE hub first
	if sseHub != nil {
		logger.Info("Stopping SSE Hub...")
		sseHub.Stop()
	}

	if err := app.Shutdown(); err != nil {
		logger.Errorf("Server shutdown error: %v", err)
	}

	// Close database connection
	sqlDB, err := dbClient.DB()
	if err == nil {
		sqlDB.Close()
	}

	logger.Info("Server stopped")
}
