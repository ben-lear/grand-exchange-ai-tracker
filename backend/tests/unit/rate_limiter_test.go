package unit

import (
	"encoding/json"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"

	"github.com/guavi/osrs-ge-tracker/internal/middleware"
)

// TestNewRateLimiter_DefaultValues tests rate limiter with default configuration
func TestNewRateLimiter_DefaultValues(t *testing.T) {
	app := fiber.New()

	// Create rate limiter with zero values - should use defaults (100 requests per minute)
	app.Use(middleware.NewRateLimiter(middleware.RateLimiterConfig{}))
	app.Get("/test", func(c *fiber.Ctx) error {
		return c.SendStatus(fiber.StatusOK)
	})

	// Test a few requests to verify defaults are applied
	for i := 0; i < 10; i++ {
		req := httptest.NewRequest("GET", "/test", nil)
		resp, err := app.Test(req, -1) // -1 = no timeout
		require.NoError(t, err)
		require.Equal(t, 200, resp.StatusCode, "Request %d should succeed", i+1)
	}
}

// TestNewRateLimiter_CustomLimits tests rate limiter with custom limits
func TestNewRateLimiter_CustomLimits(t *testing.T) {
	app := fiber.New()
	app.Use(middleware.NewRateLimiter(middleware.RateLimiterConfig{
		Max:        5,
		Expiration: 10 * time.Second,
	}))
	app.Get("/test", func(c *fiber.Ctx) error {
		return c.SendStatus(fiber.StatusOK)
	})

	// First 5 requests should succeed
	for i := 0; i < 5; i++ {
		req := httptest.NewRequest("GET", "/test", nil)
		resp, err := app.Test(req, -1)
		require.NoError(t, err)
		require.Equal(t, 200, resp.StatusCode)
	}

	// 6th request should be rate limited
	req := httptest.NewRequest("GET", "/test", nil)
	resp, err := app.Test(req, -1)
	require.NoError(t, err)
	require.Equal(t, 429, resp.StatusCode)

	var payload map[string]interface{}
	require.NoError(t, json.NewDecoder(resp.Body).Decode(&payload))
	assert.Equal(t, "rate limit exceeded", payload["error"])
	assert.Equal(t, float64(10), payload["retry_after"]) // 10 seconds
}

// TestNewRateLimiter_ErrorResponse tests the rate limit error response structure
func TestNewRateLimiter_ErrorResponse(t *testing.T) {
	app := fiber.New()
	app.Use(middleware.NewRateLimiter(middleware.RateLimiterConfig{
		Max:        1,
		Expiration: 30 * time.Second,
	}))
	app.Get("/test", func(c *fiber.Ctx) error {
		return c.SendStatus(fiber.StatusOK)
	})

	// First request succeeds
	req := httptest.NewRequest("GET", "/test", nil)
	resp, err := app.Test(req, -1)
	require.NoError(t, err)
	require.Equal(t, 200, resp.StatusCode)

	// Second request gets rate limited
	req = httptest.NewRequest("GET", "/test", nil)
	resp, err = app.Test(req, -1)
	require.NoError(t, err)
	require.Equal(t, 429, resp.StatusCode)

	// Verify response structure
	var payload map[string]interface{}
	require.NoError(t, json.NewDecoder(resp.Body).Decode(&payload))

	assert.Contains(t, payload, "error")
	assert.Equal(t, "rate limit exceeded", payload["error"])

	assert.Contains(t, payload, "retry_after")
	assert.Equal(t, float64(30), payload["retry_after"])
}

// TestNewAPIRateLimiter tests the default API rate limiter
func TestNewAPIRateLimiter(t *testing.T) {
	app := fiber.New()
	app.Use(middleware.NewAPIRateLimiter())
	app.Get("/api/test", func(c *fiber.Ctx) error {
		return c.SendStatus(fiber.StatusOK)
	})

	// Should allow at least a few requests (default max is 100)
	for i := 0; i < 10; i++ {
		req := httptest.NewRequest("GET", "/api/test", nil)
		resp, err := app.Test(req, -1)
		require.NoError(t, err)
		require.Equal(t, 200, resp.StatusCode)
	}
}

// TestNewSyncRateLimiter tests the sync endpoint rate limiter
func TestNewSyncRateLimiter(t *testing.T) {
	app := fiber.New()
	app.Use(middleware.NewSyncRateLimiter())
	app.Post("/sync", func(c *fiber.Ctx) error {
		return c.SendStatus(fiber.StatusOK)
	})

	// Should allow 10 requests (sync endpoint limit)
	for i := 0; i < 10; i++ {
		req := httptest.NewRequest("POST", "/sync", nil)
		resp, err := app.Test(req, -1)
		require.NoError(t, err)
		require.Equal(t, 200, resp.StatusCode)
	}

	// 11th request should be rate limited
	req := httptest.NewRequest("POST", "/sync", nil)
	resp, err := app.Test(req, -1)
	require.NoError(t, err)
	require.Equal(t, 429, resp.StatusCode)
}

// TestNewSyncRateLimiter_ErrorResponse tests sync limiter error response
func TestNewSyncRateLimiter_ErrorResponse(t *testing.T) {
	app := fiber.New()
	app.Use(middleware.NewSyncRateLimiter())
	app.Post("/sync", func(c *fiber.Ctx) error {
		return c.SendStatus(fiber.StatusOK)
	})

	// Exhaust the limit
	for i := 0; i < 10; i++ {
		req := httptest.NewRequest("POST", "/sync", nil)
		app.Test(req, -1)
	}

	// Next request should be rate limited
	req := httptest.NewRequest("POST", "/sync", nil)
	resp, err := app.Test(req, -1)
	require.NoError(t, err)
	require.Equal(t, 429, resp.StatusCode)

	var payload map[string]interface{}
	require.NoError(t, json.NewDecoder(resp.Body).Decode(&payload))
	assert.Equal(t, "rate limit exceeded", payload["error"])
	assert.Equal(t, float64(60), payload["retry_after"]) // 1 minute = 60 seconds
}

// TestRateLimiter_ZeroExpiration tests rate limiter uses default expiration when zero
func TestRateLimiter_ZeroExpiration(t *testing.T) {
	app := fiber.New()
	app.Use(middleware.NewRateLimiter(middleware.RateLimiterConfig{
		Max:        2,
		Expiration: 0, // Should use default of 1 minute
	}))
	app.Get("/test", func(c *fiber.Ctx) error {
		return c.SendStatus(fiber.StatusOK)
	})

	// Make 2 requests
	for i := 0; i < 2; i++ {
		req := httptest.NewRequest("GET", "/test", nil)
		resp, err := app.Test(req, -1)
		require.NoError(t, err)
		require.Equal(t, 200, resp.StatusCode)
	}

	// Third should be rate limited
	req := httptest.NewRequest("GET", "/test", nil)
	resp, err := app.Test(req, -1)
	require.NoError(t, err)
	require.Equal(t, 429, resp.StatusCode)

	// Check retry_after is default (60 seconds)
	var payload map[string]interface{}
	require.NoError(t, json.NewDecoder(resp.Body).Decode(&payload))
	assert.Equal(t, float64(60), payload["retry_after"]) // Default 1 minute
}

// TestRateLimiter_MultipleEndpoints tests rate limiting across multiple endpoints
func TestRateLimiter_MultipleEndpoints(t *testing.T) {
	app := fiber.New()
	app.Use(middleware.NewRateLimiter(middleware.RateLimiterConfig{
		Max:        3,
		Expiration: 10 * time.Second,
	}))
	app.Get("/endpoint1", func(c *fiber.Ctx) error {
		return c.SendStatus(fiber.StatusOK)
	})
	app.Get("/endpoint2", func(c *fiber.Ctx) error {
		return c.SendStatus(fiber.StatusOK)
	})

	// Make 2 requests to endpoint1
	for i := 0; i < 2; i++ {
		req := httptest.NewRequest("GET", "/endpoint1", nil)
		resp, err := app.Test(req, -1)
		require.NoError(t, err)
		require.Equal(t, 200, resp.StatusCode)
	}

	// Make 1 request to endpoint2 - total 3 requests from same IP
	req := httptest.NewRequest("GET", "/endpoint2", nil)
	resp, err := app.Test(req, -1)
	require.NoError(t, err)
	require.Equal(t, 200, resp.StatusCode)

	// Both endpoints should now be rate limited
	req = httptest.NewRequest("GET", "/endpoint1", nil)
	resp, err = app.Test(req, -1)
	require.NoError(t, err)
	require.Equal(t, 429, resp.StatusCode)

	req = httptest.NewRequest("GET", "/endpoint2", nil)
	resp, err = app.Test(req, -1)
	require.NoError(t, err)
	require.Equal(t, 429, resp.StatusCode)
}
