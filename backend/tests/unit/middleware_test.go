package unit

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/stretchr/testify/require"
	"go.uber.org/zap"
	"gorm.io/gorm"

	"github.com/guavi/osrs-ge-tracker/internal/middleware"
)

func TestRequestLogger_SetsRequestIDHeader(t *testing.T) {
	logger := zap.NewNop().Sugar()
	app := fiber.New()
	app.Use(middleware.NewRequestLogger(middleware.RequestLoggerConfig{Logger: logger}))
	app.Get("/ok", func(c *fiber.Ctx) error {
		return c.SendStatus(fiber.StatusOK)
	})

	resp, err := app.Test(httptest.NewRequest("GET", "/ok", http.NoBody))
	require.NoError(t, err)
	require.Equal(t, 200, resp.StatusCode)
	// Fiber writes response headers; we expect the request-id to be set.
	require.NotEmpty(t, resp.Header.Get("X-Request-ID"))
}

func TestErrorHandler_FiberError_UsesStatusAndMessage(t *testing.T) {
	logger := zap.NewNop().Sugar()
	app := fiber.New(fiber.Config{
		ErrorHandler: middleware.NewErrorHandler(middleware.ErrorHandlerConfig{Logger: logger}),
	})
	app.Get("/bad", func(_ *fiber.Ctx) error {
		return fiber.NewError(fiber.StatusBadRequest, "bad request")
	})

	resp, err := app.Test(httptest.NewRequest("GET", "/bad", http.NoBody))
	require.NoError(t, err)
	require.Equal(t, 400, resp.StatusCode)

	var payload map[string]any
	require.NoError(t, json.NewDecoder(resp.Body).Decode(&payload))
	require.Equal(t, "bad request", payload["error"])
	require.NotNil(t, payload["request_id"])
}

func TestErrorHandler_GormNotFound_MapsTo404(t *testing.T) {
	logger := zap.NewNop().Sugar()
	app := fiber.New(fiber.Config{
		ErrorHandler: middleware.NewErrorHandler(middleware.ErrorHandlerConfig{Logger: logger}),
	})
	app.Get("/missing", func(_ *fiber.Ctx) error {
		return gorm.ErrRecordNotFound
	})

	resp, err := app.Test(httptest.NewRequest("GET", "/missing", http.NoBody))
	require.NoError(t, err)
	require.Equal(t, 404, resp.StatusCode)
}

func TestRecoverMiddleware_ConvertsPanicTo500(t *testing.T) {
	logger := zap.NewNop().Sugar()
	app := fiber.New()
	app.Use(middleware.RecoverMiddleware(logger))
	app.Get("/panic", func(_ *fiber.Ctx) error {
		panic("boom")
	})

	resp, err := app.Test(httptest.NewRequest("GET", "/panic", http.NoBody))
	require.NoError(t, err)
	require.Equal(t, 500, resp.StatusCode)

	var payload map[string]any
	require.NoError(t, json.NewDecoder(resp.Body).Decode(&payload))
	require.Equal(t, "internal server error", payload["error"])
	require.NotNil(t, payload["request_id"])
}

func TestRateLimiter_EnforcesLimit(t *testing.T) {
	app := fiber.New()
	app.Use(middleware.NewRateLimiter(middleware.RateLimiterConfig{Max: 2, Expiration: 5 * time.Second}))
	app.Get("/ok", func(c *fiber.Ctx) error {
		return c.SendStatus(fiber.StatusOK)
	})

	// First 2 should pass.
	for i := 0; i < 2; i++ {
		resp, err := app.Test(httptest.NewRequest("GET", "/ok", http.NoBody))
		require.NoError(t, err)
		require.Equal(t, 200, resp.StatusCode)
	}

	// Third should be rate limited.
	resp, err := app.Test(httptest.NewRequest("GET", "/ok", http.NoBody))
	require.NoError(t, err)
	require.Equal(t, 429, resp.StatusCode)

	var payload map[string]any
	require.NoError(t, json.NewDecoder(resp.Body).Decode(&payload))
	require.Equal(t, "rate limit exceeded", payload["error"])
	require.NotNil(t, payload["retry_after"])
}

func TestCORS_AllowsConfiguredOrigin_Preflight(t *testing.T) {
	app := fiber.New()
	app.Use(middleware.NewCORSMiddleware(middleware.CORSConfig{AllowedOrigins: []string{"http://localhost:5173"}}))
	app.Get("/ok", func(c *fiber.Ctx) error { return c.SendStatus(200) })

	req := httptest.NewRequest("OPTIONS", "/ok", http.NoBody)
	req.Header.Set("Origin", "http://localhost:5173")
	req.Header.Set("Access-Control-Request-Method", "GET")

	resp, err := app.Test(req)
	require.NoError(t, err)

	// Fiber CORS middleware should include allow-origin for matched origin.
	require.Equal(t, "http://localhost:5173", resp.Header.Get("Access-Control-Allow-Origin"))
	require.NotEmpty(t, resp.Header.Get("Access-Control-Allow-Methods"))
}
