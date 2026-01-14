package middleware

import (
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/limiter"
)

// RateLimiterConfig holds rate limiter configuration
type RateLimiterConfig struct {
	Max                   int           // Maximum number of requests
	Expiration            time.Duration // Time window
	SkipFailedRequest     bool          // Don't count failed requests
	SkipSuccessfulRequest bool          // Don't count successful requests
}

// NewRateLimiter creates a new rate limiting middleware
func NewRateLimiter(config RateLimiterConfig) fiber.Handler {
	// Use defaults if not set
	if config.Max == 0 {
		config.Max = 100 // 100 requests per window
	}
	if config.Expiration == 0 {
		config.Expiration = 1 * time.Minute
	}

	return limiter.New(limiter.Config{
		Max:        config.Max,
		Expiration: config.Expiration,
		KeyGenerator: func(c *fiber.Ctx) string {
			// Use IP address as the key
			return c.IP()
		},
		LimitReached: func(c *fiber.Ctx) error {
			return c.Status(fiber.StatusTooManyRequests).JSON(fiber.Map{
				"error":       "rate limit exceeded",
				"retry_after": config.Expiration.Seconds(),
			})
		},
		SkipFailedRequests:     config.SkipFailedRequest,
		SkipSuccessfulRequests: config.SkipSuccessfulRequest,
	})
}

// NewAPIRateLimiter creates a rate limiter specifically for API endpoints
func NewAPIRateLimiter() fiber.Handler {
	return NewRateLimiter(RateLimiterConfig{
		Max:                   100,
		Expiration:            1 * time.Minute,
		SkipFailedRequest:     false,
		SkipSuccessfulRequest: false,
	})
}

// NewSyncRateLimiter creates a more restrictive rate limiter for sync endpoints
func NewSyncRateLimiter() fiber.Handler {
	return NewRateLimiter(RateLimiterConfig{
		Max:                   10,
		Expiration:            1 * time.Minute,
		SkipFailedRequest:     true,
		SkipSuccessfulRequest: false,
	})
}
