package handlers

import (
	"strconv"

	"github.com/gofiber/fiber/v2"
	"go.uber.org/zap"

	"github.com/guavi/osrs-ge-tracker/internal/models"
	"github.com/guavi/osrs-ge-tracker/internal/services"
	"github.com/guavi/osrs-ge-tracker/internal/utils"
)

// ItemHandler handles item-related endpoints.
type ItemHandler struct {
	itemService  services.ItemService
	priceService services.PriceService
	logger       *zap.SugaredLogger
}

// NewItemHandler creates a new item handler.
func NewItemHandler(itemService services.ItemService, priceService services.PriceService, logger *zap.SugaredLogger) *ItemHandler {
	return &ItemHandler{
		itemService:  itemService,
		priceService: priceService,
		logger:       logger,
	}
}

// ListItems handles GET /api/v1/items.
func (h *ItemHandler) ListItems(c *fiber.Ctx) error {
	ctx := c.Context()

	// Parse query parameters
	params := models.ItemListParams{
		Page:    c.QueryInt("page", 1),
		Limit:   c.QueryInt("limit", 50),
		Members: utils.ParseNullableBool(c.Query("members")),
		SortBy:  c.Query("sort_by", "name"),
		Order:   c.Query("order", "asc"),
	}

	// Validate parameters
	if err := validatePagination(params.Page, params.Limit); err != nil {
		return errorResponse(c, fiber.StatusBadRequest, err.Error())
	}

	if err := validateSortParams(params.SortBy, params.Order); err != nil {
		return errorResponse(c, fiber.StatusBadRequest, err.Error())
	}

	// Compute offset from page/limit for repository queries.
	params.Offset = (params.Page - 1) * params.Limit

	// Get items
	items, total, err := h.itemService.ListItems(ctx, params)
	if err != nil {
		h.logger.Errorf("Failed to list items: %v", err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "failed to fetch items",
		})
	}

	// Calculate pagination metadata
	totalPages := (total + int64(params.Limit) - 1) / int64(params.Limit)

	return c.JSON(fiber.Map{
		"data": items,
		"meta": fiber.Map{
			"page":        params.Page,
			"limit":       params.Limit,
			"total":       total,
			"total_pages": totalPages,
		},
	})
}

// GetItemByID handles GET /api/v1/items/:id.
func (h *ItemHandler) GetItemByID(c *fiber.Ctx) error {
	ctx := c.Context()

	// Parse item ID from URL parameter
	itemIDStr := c.Params("id")
	itemID, err := strconv.Atoi(itemIDStr)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "invalid item ID",
		})
	}

	item, err := h.itemService.GetItemByItemID(ctx, itemID)
	if err != nil || item == nil {
		if err != nil {
			h.logger.Errorf("Failed to get item %d: %v", itemID, err)
		}
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"error": "item not found",
		})
	}

	price, err := h.priceService.GetCurrentPrice(ctx, itemID)
	if err != nil {
		// Item exists; if price is missing/unavailable, return the item without a price.
		h.logger.Warnf("Failed to get current price for item %d: %v", itemID, err)
		price = nil
	}

	result := &models.ItemWithCurrentPrice{Item: *item, CurrentPrice: price}

	return c.JSON(fiber.Map{
		"data": result,
	})
}

// SearchItems handles GET /api/v1/items/search.
func (h *ItemHandler) SearchItems(c *fiber.Ctx) error {
	ctx := c.Context()

	// Parse query parameters
	query := c.Query("q")
	if query == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "search query parameter 'q' is required",
		})
	}

	params := models.ItemSearchParams{
		Query:   query,
		Members: utils.ParseNullableBool(c.Query("members")),
		Limit:   c.QueryInt("limit", 50),
	}

	// Validate limit
	if params.Limit < 1 || params.Limit > 200 {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "limit must be between 1 and 200",
		})
	}

	// Search items
	items, err := h.itemService.SearchItems(ctx, params)
	if err != nil {
		h.logger.Errorf("Failed to search items: %v", err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "failed to search items",
		})
	}

	return c.JSON(fiber.Map{
		"data": items,
		"meta": fiber.Map{
			"query": params.Query,
			"count": len(items),
			"limit": params.Limit,
		},
	})
}

// GetItemCount handles GET /api/v1/items/count.
func (h *ItemHandler) GetItemCount(c *fiber.Ctx) error {
	ctx := c.Context()

	members := utils.ParseNullableBool(c.Query("members"))

	count, err := h.itemService.GetItemCount(ctx, members)
	if err != nil {
		h.logger.Errorf("Failed to get item count: %v", err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "failed to get item count",
		})
	}

	return c.JSON(fiber.Map{
		"count":   count,
		"members": members,
	})
}
