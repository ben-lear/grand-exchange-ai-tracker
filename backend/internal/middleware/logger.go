package middleware

import (
	"time"

	"github.com/gofiber/fiber/v2"
	"go.uber.org/zap"

	"github.com/guavi/osrs-ge-tracker/internal/utils"
)

// RequestLoggerConfig holds logger middleware configuration
type RequestLoggerConfig struct {
	Logger *zap.SugaredLogger
}

// NewRequestLogger creates a new request logging middleware
func NewRequestLogger(config RequestLoggerConfig) fiber.Handler {
	return func(c *fiber.Ctx) error {
		start := time.Now()

		// Generate request ID if not present
		requestID := c.Get("X-Request-ID")
		if requestID == "" {
			requestID = utils.GenerateRequestID()
			c.Set("X-Request-ID", requestID)
		}

		// Continue with request
		err := c.Next()

		// Log after request
		duration := time.Since(start)
		statusCode := c.Response().StatusCode()
		
		fields := []interface{}{
			"request_id", requestID,
			"method", c.Method(),
			"path", c.Path(),
			"status", statusCode,
			"duration_ms", duration.Milliseconds(),
			"ip", c.IP(),
			"user_agent", c.Get("User-Agent"),
		}

		if err != nil {
			fields = append(fields, "error", err.Error())
		}

		// Log with appropriate level
		if statusCode >= 500 {
			config.Logger.Errorw("Request failed", fields...)
		} else if statusCode >= 400 {
			config.Logger.Warnw("Request error", fields...)
		} else {
			config.Logger.Infow("Request completed", fields...)
		}

		return err
	}
}
