package main

import (
	"fmt"
	"log"
	"os"
	"os/signal"
	"syscall"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	fiberLogger "github.com/gofiber/fiber/v2/middleware/logger"
	"github.com/gofiber/fiber/v2/middleware/recover"
	"go.uber.org/zap"

	"github.com/guavi/osrs-ge-tracker/internal/config"
	"github.com/guavi/osrs-ge-tracker/internal/database"
)

func main() {
	// Initialize logger
	zapLogger, err := zap.NewProduction()
	if err != nil {
		log.Fatalf("Failed to initialize logger: %v", err)
	}
	defer zapLogger.Sync()

	logger := zapLogger.Sugar()

	// Load configuration
	cfg, err := config.LoadConfig()
	if err != nil {
		logger.Fatalf("Failed to load configuration: %v", err)
	}

	// Initialize database
	db, err := database.NewPostgresDB(cfg)
	if err != nil {
		logger.Fatalf("Failed to connect to database: %v", err)
	}

	// Initialize Redis
	redis, err := database.NewRedisClient(cfg)
	if err != nil {
		logger.Fatalf("Failed to connect to Redis: %v", err)
	}
	defer redis.Close()

	// Create Fiber app
	app := fiber.New(fiber.Config{
		AppName:      "OSRS GE Tracker API",
		ServerHeader: "OSRS-GE-Tracker",
		ErrorHandler: customErrorHandler,
	})

	// Middleware
	app.Use(recover.New())
	app.Use(fiberLogger.New())
	app.Use(cors.New(cors.Config{
		AllowOrigins: cfg.CorsOrigins,
		AllowMethods: "GET,POST,PUT,DELETE,OPTIONS",
		AllowHeaders: "Origin,Content-Type,Accept,Authorization",
	}))

	// Health check endpoint
	app.Get("/health", func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{
			"status": "ok",
			"service": "osrs-ge-tracker",
		})
	})

	// API routes
	api := app.Group("/api/v1")
	
	// TODO: Register route handlers here
	api.Get("/", func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{
			"message": "OSRS Grand Exchange Tracker API v1",
		})
	})

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
	if err := app.Shutdown(); err != nil {
		logger.Errorf("Server shutdown error: %v", err)
	}

	// Close database connection
	sqlDB, err := db.DB()
	if err == nil {
		sqlDB.Close()
	}

	logger.Info("Server stopped")
}

func customErrorHandler(c *fiber.Ctx, err error) error {
	code := fiber.StatusInternalServerError
	message := "Internal Server Error"

	if e, ok := err.(*fiber.Error); ok {
		code = e.Code
		message = e.Message
	}

	return c.Status(code).JSON(fiber.Map{
		"error": message,
	})
}
