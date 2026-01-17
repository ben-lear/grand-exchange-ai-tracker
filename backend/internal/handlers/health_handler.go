package handlers

import (
	"context"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/redis/go-redis/v9"
	"go.uber.org/zap"
	"gorm.io/gorm"
)

// Health status constants.
const (
	healthStatusOK       = "ok"
	healthStatusDegraded = "degraded"
	healthStatusDown     = "down"
)

// HealthHandler handles health check endpoints.
type HealthHandler struct {
	dbClient    *gorm.DB
	redisClient *redis.Client
	logger      *zap.SugaredLogger
}

// redisClient: Redis client for cache health checks.
func NewHealthHandler(dbClient *gorm.DB, redisClient *redis.Client, logger *zap.SugaredLogger) *HealthHandler {
	return &HealthHandler{
		dbClient:    dbClient,
		redisClient: redisClient,
		logger:      logger,
	}
}

// HealthResponse represents the health check response.
type HealthResponse struct {
	Time     time.Time              `json:"time"`
	Database map[string]interface{} `json:"database"`
	Cache    map[string]interface{} `json:"cache"`
	Status   string                 `json:"status"`
	Service  string                 `json:"service"`
	Version  string                 `json:"version"`
}

// Health handles GET /health.
func (h *HealthHandler) Health(c *fiber.Ctx) error {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	response := HealthResponse{
		Status:  healthStatusOK,
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
	sqlDB, err := h.dbClient.DB()
	if err != nil {
		h.logger.Errorf("Failed to get database instance: %v", err)
		response.Database["status"] = "error"
		response.Database["error"] = err.Error()
		response.Status = healthStatusDegraded
	} else {
		err = sqlDB.PingContext(ctx)
		if err != nil {
			h.logger.Errorf("Database ping failed: %v", err)
			response.Database["status"] = "down"
			response.Database["error"] = err.Error()
			response.Status = healthStatusDegraded
		} else {
			stats := sqlDB.Stats()
			response.Database["status"] = "up"
			response.Database["open_connections"] = stats.OpenConnections
			response.Database["in_use"] = stats.InUse
			response.Database["idle"] = stats.Idle
		}
	}

	// Check Redis connection
	err = h.redisClient.Ping(ctx).Err()
	if err != nil {
		h.logger.Errorf("Redis ping failed: %v", err)
		response.Cache["status"] = "down"
		response.Cache["error"] = err.Error()
		response.Status = healthStatusDegraded
	} else {
		response.Cache["status"] = "up"

		// Get Redis info
		info, err := h.redisClient.DBSize(ctx).Result()
		if err == nil {
			response.Cache["keys"] = info
		}
	}

	// Return appropriate status code
	statusCode := fiber.StatusOK
	if response.Status == healthStatusDegraded {
		statusCode = fiber.StatusServiceUnavailable
	}

	return c.Status(statusCode).JSON(response)
}

// Liveness handles GET /health/live - simple liveness probe.
func (h *HealthHandler) Liveness(c *fiber.Ctx) error {
	return c.JSON(fiber.Map{
		"status": "alive",
	})
}

// Readiness handles GET /health/ready - readiness probe with dependency checks.
func (h *HealthHandler) Readiness(c *fiber.Ctx) error {
	ctx, cancel := context.WithTimeout(context.Background(), 3*time.Second)
	defer cancel()

	ready := true
	checks := make(map[string]bool)

	// Check database
	sqlDB, err := h.dbClient.DB()
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
	err = h.redisClient.Ping(ctx).Err()
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
