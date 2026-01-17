package middleware

import (
	"errors"

	"github.com/gofiber/fiber/v2"
	"go.uber.org/zap"
	"gorm.io/gorm"
)

// ErrorHandlerConfig holds error handler configuration.
type ErrorHandlerConfig struct {
	Logger *zap.SugaredLogger
}

// NewErrorHandler creates a custom error handler for Fiber.
func NewErrorHandler(config ErrorHandlerConfig) fiber.ErrorHandler {
	return func(c *fiber.Ctx, err error) error {
		// Default to 500 Internal Server Error
		code := fiber.StatusInternalServerError
		message := "internal server error"

		// Check if it's a Fiber error
		var e *fiber.Error
		if errors.As(err, &e) {
			code = e.Code
			message = e.Message
		}

		// Check for specific error types
		if errors.Is(err, gorm.ErrRecordNotFound) {
			code = fiber.StatusNotFound
			message = "resource not found"
		}

		// Log errors (don't log 4xx as errors)
		requestID := c.Get("X-Request-ID", "unknown")
		if code >= 500 {
			config.Logger.Errorw("Request error",
				"request_id", requestID,
				"status", code,
				"path", c.Path(),
				"method", c.Method(),
				"error", err.Error(),
			)
		} else if code >= 400 {
			config.Logger.Warnw("Client error",
				"request_id", requestID,
				"status", code,
				"path", c.Path(),
				"method", c.Method(),
				"error", err.Error(),
			)
		}

		// Return error response
		return c.Status(code).JSON(fiber.Map{
			"error":      message,
			"request_id": requestID,
		})
	}
}

// RecoverMiddleware creates a panic recovery middleware.
func RecoverMiddleware(logger *zap.SugaredLogger) fiber.Handler {
	return func(c *fiber.Ctx) error {
		defer func() {
			if r := recover(); r != nil {
				requestID := c.Get("X-Request-ID", "unknown")
				logger.Errorw("Panic recovered",
					"request_id", requestID,
					"panic", r,
					"path", c.Path(),
					"method", c.Method(),
				)

				c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
					"error":      "internal server error",
					"request_id": requestID,
				})
			}
		}()

		return c.Next()
	}
}
