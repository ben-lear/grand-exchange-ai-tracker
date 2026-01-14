package middleware

import (
	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
)

// CORSConfig holds CORS middleware configuration
type CORSConfig struct {
	AllowedOrigins []string
}

// NewCORSMiddleware creates a new CORS middleware
func NewCORSMiddleware(config CORSConfig) fiber.Handler {
	return cors.New(cors.Config{
		AllowOrigins:     joinOrigins(config.AllowedOrigins),
		AllowMethods:     "GET,POST,PUT,DELETE,OPTIONS,PATCH",
		AllowHeaders:     "Origin,Content-Type,Accept,Authorization,X-Requested-With,X-Request-Id,X-Request-ID,X-Request-Time",
		AllowCredentials: false,
		ExposeHeaders:    "Content-Length,Content-Range",
		MaxAge:           3600, // 1 hour
	})
}

// joinOrigins joins allowed origins into a comma-separated string
func joinOrigins(origins []string) string {
	if len(origins) == 0 {
		return "*"
	}

	result := ""
	for i, origin := range origins {
		if i > 0 {
			result += ","
		}
		result += origin
	}
	return result
}
