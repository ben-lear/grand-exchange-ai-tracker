//go:build slow
// +build slow

package integration

import (
	"context"
	"encoding/json"
	"net/http/httptest"
	"testing"

	"github.com/alicebob/miniredis/v2"
	"github.com/gofiber/fiber/v2"
	"github.com/redis/go-redis/v9"
	"github.com/stretchr/testify/require"
	"go.uber.org/zap"

	"github.com/guavi/osrs-ge-tracker/internal/handlers"
	"github.com/guavi/osrs-ge-tracker/tests/testutil"
)

func TestHealthHandler_HealthyWithPostgresAndRedis(t *testing.T) {
	db, release := testutil.SharedPostgres(t)
	t.Cleanup(release)

	mr := miniredis.RunT(t)
	redisClient := redis.NewClient(&redis.Options{Addr: mr.Addr()})
	t.Cleanup(func() { _ = redisClient.Close() })

	logger := zap.NewNop().Sugar()
	h := handlers.NewHealthHandler(db, redisClient, logger)

	app := fiber.New()
	app.Get("/health", h.Health)
	app.Get("/health/ready", h.Readiness)
	app.Get("/health/live", h.Liveness)

	// Liveness
	resp, err := app.Test(httptest.NewRequest("GET", "/health/live", nil))
	require.NoError(t, err)
	require.Equal(t, 200, resp.StatusCode)

	// Readiness
	resp, err = app.Test(httptest.NewRequest("GET", "/health/ready", nil))
	require.NoError(t, err)
	require.Equal(t, 200, resp.StatusCode)

	// Full health should be OK (not degraded)
	resp, err = app.Test(httptest.NewRequest("GET", "/health", nil))
	require.NoError(t, err)
	require.Equal(t, 200, resp.StatusCode)

	var payload struct {
		Status   string                 `json:"status"`
		Database map[string]any         `json:"database"`
		Cache    map[string]any         `json:"cache"`
		Service  string                 `json:"service"`
		Version  string                 `json:"version"`
		Time     any                    `json:"time"`
		Extra    map[string]interface{} `json:"-"`
	}
	require.NoError(t, json.NewDecoder(resp.Body).Decode(&payload))
	require.Equal(t, "ok", payload.Status)
	require.Equal(t, "up", payload.Database["status"])
	require.Equal(t, "up", payload.Cache["status"])

	// sanity: redis actually responds
	require.NoError(t, redisClient.Set(context.Background(), "k", "v", 0).Err())
}
