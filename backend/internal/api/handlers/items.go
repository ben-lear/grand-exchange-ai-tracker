package handlers

import (
	"strconv"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/guavi/grand-exchange-ai-tracker/internal/repository"
	"github.com/guavi/grand-exchange-ai-tracker/internal/services"
	"github.com/guavi/grand-exchange-ai-tracker/pkg/logger"
)

// ItemHandler handles item-related endpoints
type ItemHandler struct {
	itemRepo         repository.ItemRepository
	priceHistoryRepo repository.PriceHistoryRepository
	priceTrendRepo   repository.PriceTrendRepository
	osrsClient       *services.OSRSAPIClient
}

// NewItemHandler creates a new item handler
func NewItemHandler(
	itemRepo repository.ItemRepository,
	priceHistoryRepo repository.PriceHistoryRepository,
	priceTrendRepo repository.PriceTrendRepository,
	osrsClient *services.OSRSAPIClient,
) *ItemHandler {
	return &ItemHandler{
		itemRepo:         itemRepo,
		priceHistoryRepo: priceHistoryRepo,
		priceTrendRepo:   priceTrendRepo,
		osrsClient:       osrsClient,
	}
}

// ListItems returns paginated list of items
// GET /api/v1/items?page=1&limit=20&search=abyssal&members=true&sort=name
func (h *ItemHandler) ListItems(c *fiber.Ctx) error {
	// Parse query parameters
	page, _ := strconv.Atoi(c.Query("page", "1"))
	limit, _ := strconv.Atoi(c.Query("limit", "20"))
	search := c.Query("search", "")
	sort := c.Query("sort", "name")
	order := c.Query("order", "asc")

	// Validate pagination
	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 100 {
		limit = 20
	}

	// Parse members filter (optional)
	var membersPtr *bool
	if membersStr := c.Query("members"); membersStr != "" {
		members := membersStr == "true"
		membersPtr = &members
	}

	// Calculate offset
	offset := (page - 1) * limit

	// Get items from database
	items, err := h.itemRepo.List(c.Context(), limit, offset, search, membersPtr, sort, order)
	if err != nil {
		logger.Error("failed to list items", "error", err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"status":  "error",
			"message": "Failed to retrieve items",
		})
	}

	// Get total count
	total, err := h.itemRepo.Count(c.Context(), search, membersPtr)
	if err != nil {
		logger.Error("failed to count items", "error", err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"status":  "error",
			"message": "Failed to count items",
		})
	}

	totalPages := (total + limit - 1) / limit

	return c.JSON(fiber.Map{
		"status": "success",
		"data":   items,
		"pagination": fiber.Map{
			"page":        page,
			"limit":       limit,
			"total":       total,
			"total_pages": totalPages,
		},
		"timestamp": time.Now().Format(time.RFC3339),
	})
}

// GetItem returns a single item by ID
// GET /api/v1/items/:id
func (h *ItemHandler) GetItem(c *fiber.Ctx) error {
	id := c.Params("id")
	itemID, err := strconv.Atoi(id)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"status":  "error",
			"message": "Invalid item ID",
		})
	}

	// Try to get from database first
	item, err := h.itemRepo.GetByItemID(c.Context(), itemID)
	if err != nil {
		logger.Error("failed to get item", "error", err, "itemID", itemID)
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"status":  "error",
			"message": "Item not found",
		})
	}

	// Get current price trend
	trend, err := h.priceTrendRepo.GetByItemID(c.Context(), item.ID)
	if err != nil {
		logger.Warn("failed to get price trend", "error", err, "itemID", itemID)
		// Continue without trend data
	}

	response := fiber.Map{
		"status":    "success",
		"data":      item,
		"timestamp": time.Now().Format(time.RFC3339),
	}

	if trend != nil {
		response["trend"] = trend
	}

	return c.JSON(response)
}

// GetTrending returns trending items based on price changes
// GET /api/v1/stats/trending?limit=10&timeframe=24h
func (h *ItemHandler) GetTrending(c *fiber.Ctx) error {
	limit, _ := strconv.Atoi(c.Query("limit", "10"))
	timeframe := c.Query("timeframe", "24h")

	if limit < 1 || limit > 50 {
		limit = 10
	}

	// Parse timeframe
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
	default:
		hours = 24
	}

	// Get items with biggest price changes
	trends, err := h.priceTrendRepo.GetTopTrending(c.Context(), limit, hours)
	if err != nil {
		logger.Error("failed to get trending items", "error", err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"status":  "error",
			"message": "Failed to retrieve trending items",
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
			"item":          item,
			"current_price": trend.CurrentPrice,
			"current_trend": trend.CurrentTrend,
			"day30_change":  trend.Day30Change,
			"day30_trend":   trend.Day30Trend,
		})
	}

	return c.JSON(fiber.Map{
		"status":    "success",
		"data":      result,
		"timeframe": timeframe,
		"timestamp": time.Now().Format(time.RFC3339),
	})
}
