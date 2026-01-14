package api

import (
	"github.com/gofiber/fiber/v2"
	"github.com/guavi/grand-exchange-ai-tracker/internal/api/handlers"
	"github.com/guavi/grand-exchange-ai-tracker/internal/repository"
	"github.com/guavi/grand-exchange-ai-tracker/internal/services"
)

// SetupRoutes configures all API routes
func SetupRoutes(app *fiber.App, osrsClient *services.OSRSAPIClient) {
	// Initialize repositories
	itemRepo := repository.NewItemRepository(repository.DB)
	priceHistoryRepo := repository.NewPriceHistoryRepository(repository.DB)
	priceTrendRepo := repository.NewPriceTrendRepository(repository.DB)

	// Initialize handlers
	itemHandler := handlers.NewItemHandler(itemRepo, priceHistoryRepo, priceTrendRepo, osrsClient)
	priceHandler := handlers.NewPriceHandler(priceHistoryRepo, priceTrendRepo, itemRepo)
	healthHandler := handlers.NewHealthHandler(repository.DB, repository.RedisClient)

	// API v1 routes
	api := app.Group("/api")
	v1 := api.Group("/v1")

	// Health check
	api.Get("/health", healthHandler.HealthCheck)
	api.Get("/ready", healthHandler.ReadinessCheck)

	// Items routes
	items := v1.Group("/items")
	items.Get("/", itemHandler.ListItems)              // GET /api/v1/items?page=1&limit=20&search=abyssal&members=true
	items.Get("/:id", itemHandler.GetItem)             // GET /api/v1/items/4151
	items.Get("/:id/prices", priceHandler.GetPrices)   // GET /api/v1/items/4151/prices?range=30d
	items.Get("/:id/graph", priceHandler.GetGraph)     // GET /api/v1/items/4151/graph?range=90d
	items.Get("/:id/trend", priceHandler.GetTrend)     // GET /api/v1/items/4151/trend

	// Stats routes
	stats := v1.Group("/stats")
	stats.Get("/trending", itemHandler.GetTrending)           // GET /api/v1/stats/trending?limit=10
	stats.Get("/biggest-movers", priceHandler.GetBiggestMovers) // GET /api/v1/stats/biggest-movers?direction=gainers&limit=10

	// 404 handler
	app.Use(func(c *fiber.Ctx) error {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"status":  "error",
			"message": "Route not found",
			"path":    c.Path(),
		})
	})
}
