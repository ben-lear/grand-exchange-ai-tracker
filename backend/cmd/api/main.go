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

	// Graceful shutdown with 10 second timeout
	if err := app.ShutdownWithTimeout(10 * time.Second); err != nil {
		logger.Error("Server forced to shutdown", "error", err)
	}
	
	
	logger.Info("Shutting down server...")
	// Cleanup resources
	if err := repository.CloseRedis(); err != nil {
		logger.Error("Error closing Redis connection", "error", err)
	}
	if err := repository.CloseDatabase(); err != nil {
		logger.Error("Error closing database connection", "error", err)
	}
}
