package handlers

import (
	"strconv"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/guavi/grand-exchange-ai-tracker/internal/repository"
	"github.com/guavi/grand-exchange-ai-tracker/pkg/logger"
)

// PriceHandler handles price-related endpoints
type PriceHandler struct {
	priceHistoryRepo repository.PriceHistoryRepository
	priceTrendRepo   repository.PriceTrendRepository
	itemRepo         repository.ItemRepository
}

// NewPriceHandler creates a new price handler
func NewPriceHandler(
	priceHistoryRepo repository.PriceHistoryRepository,
	priceTrendRepo repository.PriceTrendRepository,
	itemRepo repository.ItemRepository,
) *PriceHandler {
	return &PriceHandler{
		priceHistoryRepo: priceHistoryRepo,
		priceTrendRepo:   priceTrendRepo,
		itemRepo:         itemRepo,
	}
}

// GetPrices returns price history for an item
// GET /api/v1/items/:id/prices?range=30d
func (h *PriceHandler) GetPrices(c *fiber.Ctx) error {
	id := c.Params("id")
	itemID, err := strconv.Atoi(id)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"status":  "error",
			"message": "Invalid item ID",
		})
	}

	// Get item to verify it exists
	item, err := h.itemRepo.GetByItemID(c.Context(), itemID)
	if err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"status":  "error",
			"message": "Item not found",
		})
	}

	// Parse time range
	rangeStr := c.Query("range", "30d")
	days := parseTimeRange(rangeStr)
	
	startTime := time.Now().AddDate(0, 0, -days).Unix()
	endTime := time.Now().Unix()

	// Get price history
	prices, err := h.priceHistoryRepo.GetByItemIDAndTimeRange(c.Context(), item.ID, startTime, endTime)
	if err != nil {
		logger.Error("failed to get price history", "error", err, "itemID", itemID)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"status":  "error",
			"message": "Failed to retrieve price history",
		})
	}

	return c.JSON(fiber.Map{
		"status": "success",
		"data": fiber.Map{
			"item_id": itemID,
			"item":    item,
			"prices":  prices,
			"range":   rangeStr,
			"count":   len(prices),
		},
		"timestamp": time.Now().Format(time.RFC3339),
	})
}

// GetGraph returns chart-ready price data
// GET /api/v1/items/:id/graph?range=90d&interval=daily
func (h *PriceHandler) GetGraph(c *fiber.Ctx) error {
	id := c.Params("id")
	itemID, err := strconv.Atoi(id)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"status":  "error",
			"message": "Invalid item ID",
		})
	}

	// Get item to verify it exists
	item, err := h.itemRepo.GetByItemID(c.Context(), itemID)
	if err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"status":  "error",
			"message": "Item not found",
		})
	}

	// Parse time range
	rangeStr := c.Query("range", "90d")
	days := parseTimeRange(rangeStr)
	
	startTime := time.Now().AddDate(0, 0, -days).Unix()
	endTime := time.Now().Unix()

	// Get price history
	prices, err := h.priceHistoryRepo.GetByItemIDAndTimeRange(c.Context(), item.ID, startTime, endTime)
	if err != nil {
		logger.Error("failed to get price history", "error", err, "itemID", itemID)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"status":  "error",
			"message": "Failed to retrieve price history",
		})
	}

	// Transform data for charts (Recharts format)
	var chartData []fiber.Map
	for _, price := range prices {
		chartData = append(chartData, fiber.Map{
			"timestamp": price.Timestamp,
			"date":      time.Unix(price.Timestamp, 0).Format("2006-01-02"),
			"price":     price.Price,
			"volume":    price.Volume,
		})
	}

	return c.JSON(fiber.Map{
		"status": "success",
		"data": fiber.Map{
			"item_id": itemID,
			"item":    item,
			"chart":   chartData,
			"range":   rangeStr,
		},
		"timestamp": time.Now().Format(time.RFC3339),
	})
}

// GetTrend returns current price trend for an item
// GET /api/v1/items/:id/trend
func (h *PriceHandler) GetTrend(c *fiber.Ctx) error {
	id := c.Params("id")
	itemID, err := strconv.Atoi(id)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"status":  "error",
			"message": "Invalid item ID",
		})
	}

	// Get item
	item, err := h.itemRepo.GetByItemID(c.Context(), itemID)
	if err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"status":  "error",
			"message": "Item not found",
		})
	}

	// Get trend
	trend, err := h.priceTrendRepo.GetByItemID(c.Context(), item.ID)
	if err != nil {
		logger.Error("failed to get price trend", "error", err, "itemID", itemID)
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"status":  "error",
			"message": "Price trend not found",
		})
	}

	return c.JSON(fiber.Map{
		"status": "success",
		"data": fiber.Map{
			"item":  item,
			"trend": trend,
		},
		"timestamp": time.Now().Format(time.RFC3339),
	})
}

// GetBiggestMovers returns items with biggest price changes
// GET /api/v1/stats/biggest-movers?direction=gainers&limit=10&timeframe=24h
func (h *PriceHandler) GetBiggestMovers(c *fiber.Ctx) error {
	direction := c.Query("direction", "gainers")
	limit, _ := strconv.Atoi(c.Query("limit", "10"))
	timeframe := c.Query("timeframe", "24h")

	if limit < 1 || limit > 50 {
		limit = 10
	}

	if direction != "gainers" && direction != "losers" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"status":  "error",
			"message": "Invalid direction. Must be 'gainers' or 'losers'",
		})
	}

	ascending := direction == "losers"

	// Parse timeframe to hours
	var hours int
	switch timeframe {
	case "1h":
		hours = 1
	case "6h":
		hours = 6
	case "24h":
		hours = 24
	case "7d":
		hours = 24 * 7
	case "30d":
		hours = 24 * 30
	default:
		hours = 24
	}

	// Get biggest movers
	trends, err := h.priceTrendRepo.GetBiggestMovers(c.Context(), limit, hours, ascending)
	if err != nil {
		logger.Error("failed to get biggest movers", "error", err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"status":  "error",
			"message": "Failed to retrieve biggest movers",
		})
	}

	// Enrich with item details
	var result []fiber.Map
	for _, trend := range trends {
		item, err := h.itemRepo.GetByID(c.Context(), trend.ItemID)
		if err != nil {
			logger.Warn("failed to get item for trend", "error", err, "itemID", trend.ItemID)
			continue
		}

		result = append(result, fiber.Map{
			"item":               item,
			"current_price":      trend.CurrentPrice,
			"current_trend":      trend.CurrentTrend,
			"today_price_change": trend.TodayPriceChange,
			"today_trend":        trend.TodayTrend,
			"day30_change":       trend.Day30Change,
			"day30_trend":        trend.Day30Trend,
		})
	}

	return c.JSON(fiber.Map{
		"status":    "success",
		"data":      result,
		"direction": direction,
		"timeframe": timeframe,
		"timestamp": time.Now().Format(time.RFC3339),
	})
}

// parseTimeRange converts a time range string to days
func parseTimeRange(rangeStr string) int {
	switch rangeStr {
	case "7d":
		return 7
	case "30d":
		return 30
	case "90d":
		return 90
	case "180d":
		return 180
	case "365d", "1y":
		return 365
	default:
		return 30
	}
}
