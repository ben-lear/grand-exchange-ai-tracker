//go:build slow
// +build slow

package integration

import (
	"context"
	"encoding/json"
	"net/http/httptest"
	"testing"

	"github.com/gofiber/fiber/v2"
	"github.com/stretchr/testify/require"
	"go.uber.org/zap"

	"github.com/guavi/osrs-ge-tracker/internal/handlers"
	"github.com/guavi/osrs-ge-tracker/internal/models"
	"github.com/guavi/osrs-ge-tracker/internal/repository"
	"github.com/guavi/osrs-ge-tracker/internal/services"
	"github.com/guavi/osrs-ge-tracker/tests/testutil"
)

func TestItemHandler_GetByID_NotFoundDoesNotPanic(t *testing.T) {
	db, release := testutil.SharedPostgres(t)
	t.Cleanup(release)

	logger := zap.NewNop().Sugar()
	ctx := context.Background()

	itemRepo := repository.NewItemRepository(db, logger)
	cache := testutil.NewNoopCache()
	itemSvc := services.NewItemService(itemRepo, cache, logger)
	itemHandler := handlers.NewItemHandler(itemSvc, logger)

	app := fiber.New()
	app.Get("/api/v1/items/:id", itemHandler.GetItemByID)

	// No items inserted; should return 404 (and not panic)
	resp, err := app.Test(httptest.NewRequest("GET", "/api/v1/items/12345", nil))
	require.NoError(t, err)
	require.Equal(t, 404, resp.StatusCode)

	// Insert item and verify 200
	require.NoError(t, itemRepo.Create(ctx, &models.Item{ItemID: 12345, Name: "Test Item"}))
	resp, err = app.Test(httptest.NewRequest("GET", "/api/v1/items/12345", nil))
	require.NoError(t, err)
	require.Equal(t, 200, resp.StatusCode)
}

func TestItemHandler_ListSearchCount_PostgresBacked(t *testing.T) {
	db, release := testutil.SharedPostgres(t)
	t.Cleanup(release)

	logger := zap.NewNop().Sugar()
	ctx := context.Background()

	itemRepo := repository.NewItemRepository(db, logger)
	cache := testutil.NewNoopCache()
	itemSvc := services.NewItemService(itemRepo, cache, logger)
	itemHandler := handlers.NewItemHandler(itemSvc, logger)

	app := fiber.New()
	app.Get("/api/v1/items", itemHandler.ListItems)
	app.Get("/api/v1/items/search", itemHandler.SearchItems)
	app.Get("/api/v1/items/count", itemHandler.GetItemCount)

	// Seed items
	require.NoError(t, itemRepo.Create(ctx, &models.Item{ItemID: 1, Name: "Dragon scimitar", Members: true}))
	require.NoError(t, itemRepo.Create(ctx, &models.Item{ItemID: 2, Name: "Rune scimitar", Members: false}))
	require.NoError(t, itemRepo.Create(ctx, &models.Item{ItemID: 3, Name: "Abyssal whip", Members: true}))

	// List: pagination + sort
	resp, err := app.Test(httptest.NewRequest("GET", "/api/v1/items?page=1&limit=2&sort_by=name&order=asc", nil))
	require.NoError(t, err)
	require.Equal(t, 200, resp.StatusCode)

	var listResp struct {
		Data []models.Item `json:"data"`
		Meta struct {
			Page       int   `json:"page"`
			Limit      int   `json:"limit"`
			Total      int64 `json:"total"`
			TotalPages int64 `json:"total_pages"`
		} `json:"meta"`
	}
	require.NoError(t, json.NewDecoder(resp.Body).Decode(&listResp))
	require.Equal(t, 1, listResp.Meta.Page)
	require.Equal(t, 2, listResp.Meta.Limit)
	require.Equal(t, int64(3), listResp.Meta.Total)
	require.Equal(t, int64(2), listResp.Meta.TotalPages)
	require.Len(t, listResp.Data, 2)
	require.Equal(t, "Abyssal whip", listResp.Data[0].Name)

	resp, err = app.Test(httptest.NewRequest("GET", "/api/v1/items?page=2&limit=2&sort_by=name&order=asc", nil))
	require.NoError(t, err)
	require.Equal(t, 200, resp.StatusCode)
	require.NoError(t, json.NewDecoder(resp.Body).Decode(&listResp))
	require.Len(t, listResp.Data, 1)
	require.Equal(t, "Rune scimitar", listResp.Data[0].Name)

	// List: members filter
	resp, err = app.Test(httptest.NewRequest("GET", "/api/v1/items?members=false&limit=50", nil))
	require.NoError(t, err)
	require.Equal(t, 200, resp.StatusCode)
	require.NoError(t, json.NewDecoder(resp.Body).Decode(&listResp))
	require.Len(t, listResp.Data, 1)
	require.Equal(t, "Rune scimitar", listResp.Data[0].Name)
	require.Equal(t, int64(1), listResp.Meta.Total)

	// Search
	resp, err = app.Test(httptest.NewRequest("GET", "/api/v1/items/search?q=scimitar&limit=50", nil))
	require.NoError(t, err)
	require.Equal(t, 200, resp.StatusCode)

	var searchResp struct {
		Data []models.Item `json:"data"`
		Meta struct {
			Query string `json:"query"`
			Count int    `json:"count"`
			Limit int    `json:"limit"`
		} `json:"meta"`
	}
	require.NoError(t, json.NewDecoder(resp.Body).Decode(&searchResp))
	require.Equal(t, "scimitar", searchResp.Meta.Query)
	require.Equal(t, 2, searchResp.Meta.Count)
	require.Len(t, searchResp.Data, 2)

	resp, err = app.Test(httptest.NewRequest("GET", "/api/v1/items/search?q=scimitar&members=true&limit=50", nil))
	require.NoError(t, err)
	require.Equal(t, 200, resp.StatusCode)
	require.NoError(t, json.NewDecoder(resp.Body).Decode(&searchResp))
	require.Equal(t, 1, searchResp.Meta.Count)
	require.Len(t, searchResp.Data, 1)
	require.Equal(t, "Dragon scimitar", searchResp.Data[0].Name)

	// Count
	resp, err = app.Test(httptest.NewRequest("GET", "/api/v1/items/count", nil))
	require.NoError(t, err)
	require.Equal(t, 200, resp.StatusCode)

	var countResp struct {
		Count   int64 `json:"count"`
		Members *bool `json:"members"`
	}
	require.NoError(t, json.NewDecoder(resp.Body).Decode(&countResp))
	require.Equal(t, int64(3), countResp.Count)
	require.Nil(t, countResp.Members)

	resp, err = app.Test(httptest.NewRequest("GET", "/api/v1/items/count?members=true", nil))
	require.NoError(t, err)
	require.Equal(t, 200, resp.StatusCode)
	require.NoError(t, json.NewDecoder(resp.Body).Decode(&countResp))
	require.Equal(t, int64(2), countResp.Count)
	require.NotNil(t, countResp.Members)
	require.True(t, *countResp.Members)
}

func TestItemHandler_ValidationErrors(t *testing.T) {
	db, release := testutil.SharedPostgres(t)
	t.Cleanup(release)

	logger := zap.NewNop().Sugar()

	itemRepo := repository.NewItemRepository(db, logger)
	cache := testutil.NewNoopCache()
	itemSvc := services.NewItemService(itemRepo, cache, logger)
	itemHandler := handlers.NewItemHandler(itemSvc, logger)

	app := fiber.New()
	app.Get("/api/v1/items", itemHandler.ListItems)
	app.Get("/api/v1/items/search", itemHandler.SearchItems)

	resp, err := app.Test(httptest.NewRequest("GET", "/api/v1/items?page=0", nil))
	require.NoError(t, err)
	require.Equal(t, 400, resp.StatusCode)

	resp, err = app.Test(httptest.NewRequest("GET", "/api/v1/items?sort_by=wat", nil))
	require.NoError(t, err)
	require.Equal(t, 400, resp.StatusCode)

	resp, err = app.Test(httptest.NewRequest("GET", "/api/v1/items/search", nil))
	require.NoError(t, err)
	require.Equal(t, 400, resp.StatusCode)
}
