package api

import (
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/fiber/v2/middleware/logger"
	"github.com/gofiber/fiber/v2/middleware/recover"
	"github.com/gofiber/fiber/v2/middleware/requestid"
	applogger "github.com/guavi/grand-exchange-ai-tracker/pkg/logger"
)

// SetupMiddleware configures all middleware for the Fiber app
func SetupMiddleware(app *fiber.App) {
	// Request ID middleware
	app.Use(requestid.New())

	// Recover from panics
	app.Use(recover.New(recover.Config{
		EnableStackTrace: true,
	}))

	// CORS middleware
	app.Use(cors.New(cors.Config{
		AllowOrigins:     "http://localhost:5173,http://localhost:3000",
		AllowMethods:     "GET,POST,PUT,DELETE,OPTIONS",
		AllowHeaders:     "Origin,Content-Type,Accept,Authorization",
		AllowCredentials: true,
		MaxAge:           300,
	}))

	// Logger middleware
	app.Use(logger.New(logger.Config{
		Format:     "${time} | ${status} | ${latency} | ${method} ${path}\n",
		TimeFormat: "2006-01-02 15:04:05",
		TimeZone:   "Local",
	}))

	// Custom logging middleware
	app.Use(func(c *fiber.Ctx) error {
		start := time.Now()

		err := c.Next()

		latency := time.Since(start)
		status := c.Response().StatusCode()

		applogger.Info("request processed",
			"method", c.Method(),
			"path", c.Path(),
			"status", status,
			"latency_ms", latency.Milliseconds(),
			"ip", c.IP(),
		)

		return err
	})
}
