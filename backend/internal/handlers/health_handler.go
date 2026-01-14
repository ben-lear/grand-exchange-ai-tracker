package handlers

import (
	"context"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/redis/go-redis/v9"
	"go.uber.org/zap"
	"gorm.io/gorm"
)

// HealthHandler handles health check endpoints
type HealthHandler struct {
	db     *gorm.DB
	redis  *redis.Client
	logger *zap.SugaredLogger
}

// NewHealthHandler creates a new health handler
func NewHealthHandler(db *gorm.DB, redis *redis.Client, logger *zap.SugaredLogger) *HealthHandler {
	return &HealthHandler{
		db:     db,
		redis:  redis,
		logger: logger,
	}
}

// HealthResponse represents the health check response
type HealthResponse struct {
	Status   string                 `json:"status"`
	Service  string                 `json:"service"`
	Version  string                 `json:"version"`
	Time     time.Time              `json:"time"`
	Database map[string]interface{} `json:"database"`
	Cache    map[string]interface{} `json:"cache"`
}

// Health handles GET /health
func (h *HealthHandler) Health(c *fiber.Ctx) error {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	response := HealthResponse{
		Status:  "ok",
		Service: "osrs-ge-tracker",
		Version: "1.0.0",
		Time:    time.Now(),
		Database: map[string]interface{}{
			"status": "unknown",
		},
		Cache: map[string]interface{}{
			"status": "unknown",
		},
	}

	// Check database connection
	sqlDB, err := h.db.DB()
	if err != nil {
		h.logger.Errorf("Failed to get database instance: %v", err)
		response.Database["status"] = "error"
		response.Database["error"] = err.Error()
		response.Status = "degraded"
	} else {
		err = sqlDB.PingContext(ctx)
		if err != nil {
			h.logger.Errorf("Database ping failed: %v", err)
			response.Database["status"] = "down"
			response.Database["error"] = err.Error()
			response.Status = "degraded"
		} else {
			stats := sqlDB.Stats()
			response.Database["status"] = "up"
			response.Database["open_connections"] = stats.OpenConnections
			response.Database["in_use"] = stats.InUse
			response.Database["idle"] = stats.Idle
		}
	}

	// Check Redis connection
	err = h.redis.Ping(ctx).Err()
	if err != nil {
		h.logger.Errorf("Redis ping failed: %v", err)
		response.Cache["status"] = "down"
		response.Cache["error"] = err.Error()
		response.Status = "degraded"
	} else {
		response.Cache["status"] = "up"

		// Get Redis info
		info, err := h.redis.DBSize(ctx).Result()
		if err == nil {
			response.Cache["keys"] = info
		}
	}

	// Return appropriate status code
	statusCode := fiber.StatusOK
	if response.Status == "degraded" {
		statusCode = fiber.StatusServiceUnavailable
	}

	return c.Status(statusCode).JSON(response)
}

// Liveness handles GET /health/live - simple liveness probe
func (h *HealthHandler) Liveness(c *fiber.Ctx) error {
	return c.JSON(fiber.Map{
		"status": "alive",
	})
}

// Readiness handles GET /health/ready - readiness probe with dependency checks
func (h *HealthHandler) Readiness(c *fiber.Ctx) error {
	ctx, cancel := context.WithTimeout(context.Background(), 3*time.Second)
	defer cancel()

	ready := true
	checks := make(map[string]bool)

	// Check database
	sqlDB, err := h.db.DB()
	if err != nil {
		checks["database"] = false
		ready = false
	} else {
		err = sqlDB.PingContext(ctx)
		checks["database"] = err == nil
		if err != nil {
			ready = false
		}
	}

	// Check Redis
	err = h.redis.Ping(ctx).Err()
	checks["cache"] = err == nil
	if err != nil {
		ready = false
	}

	response := fiber.Map{
		"ready":  ready,
		"checks": checks,
	}

	statusCode := fiber.StatusOK
	if !ready {
		statusCode = fiber.StatusServiceUnavailable
	}

	return c.Status(statusCode).JSON(response)
}
