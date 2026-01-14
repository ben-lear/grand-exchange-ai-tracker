package api

import (
	"github.com/gofiber/fiber/v2"
	"github.com/guavi/grand-exchange-ai-tracker/internal/api/handlers"
)

// SetupRoutes configures all API routes
func SetupRoutes(
	app *fiber.App,
	itemHandler *handlers.ItemHandler,
	priceHandler *handlers.PriceHandler,
	healthHandler *handlers.HealthHandler,
) {
	// API v1 routes
	api := app.Group("/api")
	v1 := api.Group("/v1")

	// Health check
	api.Get("/health", healthHandler.HealthCheck)
	api.Get("/ready", healthHandler.ReadinessCheck)

	// Items routes
	items := v1.Group("/items")
	items.Get("/", itemHandler.ListItems)            // GET /api/v1/items?page=1&limit=20&search=abyssal&members=true
	items.Get("/:id", itemHandler.GetItem)           // GET /api/v1/items/4151
	items.Get("/:id/prices", priceHandler.GetPrices) // GET /api/v1/items/4151/prices?range=30d
	items.Get("/:id/graph", priceHandler.GetGraph)   // GET /api/v1/items/4151/graph?range=90d
	items.Get("/:id/trend", priceHandler.GetTrend)   // GET /api/v1/items/4151/trend

	// Stats routes
	stats := v1.Group("/stats")
	stats.Get("/trending", itemHandler.GetTrending)             // GET /api/v1/stats/trending?limit=10
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
