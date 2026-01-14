package handlers

import (
	"context"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/redis/go-redis/v9"
	"gorm.io/gorm"
)

// HealthHandler handles health check endpoints
type HealthHandler struct {
	db    *gorm.DB
	redis *redis.Client
}

// NewHealthHandler creates a new health handler
func NewHealthHandler(db *gorm.DB, redis *redis.Client) *HealthHandler {
	return &HealthHandler{
		db:    db,
		redis: redis,
	}
}

// HealthCheck returns basic health status
func (h *HealthHandler) HealthCheck(c *fiber.Ctx) error {
	return c.JSON(fiber.Map{
		"status":    "ok",
		"timestamp": time.Now().Format(time.RFC3339),
		"service":   "OSRS Grand Exchange Tracker API",
	})
}

// ReadinessCheck checks if all dependencies are ready
func (h *HealthHandler) ReadinessCheck(c *fiber.Ctx) error {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	checks := fiber.Map{
		"status": "ok",
	}

	// Check database
	sqlDB, err := h.db.DB()
	if err != nil {
		checks["status"] = "unhealthy"
		checks["database"] = "error"
	} else if err := sqlDB.PingContext(ctx); err != nil {
		checks["status"] = "unhealthy"
		checks["database"] = "down"
	} else {
		checks["database"] = "ok"
	}

	// Check Redis
	if err := h.redis.Ping(ctx).Err(); err != nil {
		checks["status"] = "unhealthy"
		checks["redis"] = "down"
	} else {
		checks["redis"] = "ok"
	}

	checks["timestamp"] = time.Now().Format(time.RFC3339)

	if checks["status"] == "unhealthy" {
		return c.Status(fiber.StatusServiceUnavailable).JSON(checks)
	}

	return c.JSON(checks)
}
