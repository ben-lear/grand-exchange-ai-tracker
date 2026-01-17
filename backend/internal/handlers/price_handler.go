package handlers

import (
	"strconv"
	"strings"

	"github.com/gofiber/fiber/v2"
	"go.uber.org/zap"

	"github.com/guavi/osrs-ge-tracker/internal/models"
	"github.com/guavi/osrs-ge-tracker/internal/services"
)

// PriceHandler handles price-related endpoints.
type PriceHandler struct {
	priceService services.PriceService
	logger       *zap.SugaredLogger
}

// NewPriceHandler creates a new price handler.
func NewPriceHandler(priceService services.PriceService, logger *zap.SugaredLogger) *PriceHandler {
	return &PriceHandler{
		priceService: priceService,
		logger:       logger,
	}
}

// GetAllCurrentPrices handles GET /api/v1/prices/current.
func (h *PriceHandler) GetAllCurrentPrices(c *fiber.Ctx) error {
	ctx := c.Context()

	prices, err := h.priceService.GetAllCurrentPrices(ctx)
	if err != nil {
		h.logger.Errorf("Failed to get all current prices: %v", err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "failed to fetch current prices",
		})
	}

	return c.JSON(fiber.Map{
		"data": prices,
		"meta": fiber.Map{
			"count": len(prices),
		},
	})
}

// GetCurrentPrice handles GET /api/v1/prices/current/:id.
func (h *PriceHandler) GetCurrentPrice(c *fiber.Ctx) error {
	ctx := c.Context()

	// Parse item ID
	itemIDStr := c.Params("id")
	itemID, err := strconv.Atoi(itemIDStr)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "invalid item ID",
		})
	}

	// Get current price
	price, err := h.priceService.GetCurrentPrice(ctx, itemID)
	if err != nil {
		h.logger.Errorf("Failed to get current price for item %d: %v", itemID, err)
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"error": "price not found",
		})
	}
	if price == nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"error": "price not found",
		})
	}

	return c.JSON(fiber.Map{
		"data": price,
	})
}

// GetBatchCurrentPrices handles GET /api/v1/prices/current/batch?ids=1,2,3.
func (h *PriceHandler) GetBatchCurrentPrices(c *fiber.Ctx) error {
	ctx := c.Context()

	// Parse item IDs from query parameter
	idsStr := c.Query("ids")
	if idsStr == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "ids query parameter is required",
		})
	}

	// Split and parse IDs
	idStrings := strings.Split(idsStr, ",")
	if len(idStrings) > 100 {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "maximum 100 items per batch request",
		})
	}

	itemIDs := make([]int, 0, len(idStrings))
	for _, idStr := range idStrings {
		id, err := strconv.Atoi(strings.TrimSpace(idStr))
		if err != nil {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": "invalid item ID in batch: " + idStr,
			})
		}
		itemIDs = append(itemIDs, id)
	}

	// Get batch prices
	prices, err := h.priceService.GetBatchCurrentPrices(ctx, itemIDs)
	if err != nil {
		h.logger.Errorf("Failed to get batch current prices: %v", err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "failed to fetch batch prices",
		})
	}

	return c.JSON(fiber.Map{
		"data": prices,
		"meta": fiber.Map{
			"requested": len(itemIDs),
			"found":     len(prices),
		},
	})
}

// GetPriceHistory handles GET /api/v1/prices/history/:id.
func (h *PriceHandler) GetPriceHistory(c *fiber.Ctx) error {
	ctx := c.Context()

	// Parse item ID
	itemIDStr := c.Params("id")
	itemID, err := strconv.Atoi(itemIDStr)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "invalid item ID",
		})
	}

	// Parse query parameters
	periodStr := c.Query("period", "7d")
	sampleStr := c.Query("sample")
	refreshStr := c.Query("refresh") // If "true", bypass cache

	// Parse period
	period := models.TimePeriod(periodStr)
	validPeriods := map[models.TimePeriod]bool{
		models.Period1Hour:   true,
		models.Period12Hours: true,
		models.Period24Hours: true,
		models.Period3Days:   true,
		models.Period7Days:   true,
		models.Period30Days:  true,
		models.Period90Days:  true,
		models.Period1Year:   true,
		models.PeriodAll:     true,
	}

	if !validPeriods[period] {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "invalid period, must be one of: 1h, 12h, 24h, 3d, 7d, 30d, 90d, 1y, all",
		})
	}

	// Parse sample parameter
	var maxPoints *int
	if sampleStr != "" {
		points, err := strconv.Atoi(sampleStr)
		if err != nil || points < 10 || points > 1000 {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": "sample must be between 10 and 1000",
			})
		}
		maxPoints = &points
	}

	refresh := refreshStr == "true"

	params := models.PriceHistoryParams{
		ItemID:    itemID,
		Period:    period,
		MaxPoints: maxPoints,
		Refresh:   refresh,
	}

	// Get price history
	history, err := h.priceService.GetPriceHistory(ctx, params)
	if err != nil {
		h.logger.Errorf("Failed to get price history for item %d: %v", itemID, err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "failed to fetch price history",
		})
	}

	return c.JSON(fiber.Map{
		"data": history.Data,
		"meta": fiber.Map{
			"item_id":    history.ItemID,
			"period":     history.Period,
			"count":      history.Count,
			"first_date": history.FirstDate,
			"last_date":  history.LastDate,
			"sampled":    maxPoints != nil && history.Count > *maxPoints,
		},
	})
}

// SyncCurrentPrices handles POST /api/v1/prices/sync (admin endpoint).
func (h *PriceHandler) SyncCurrentPrices(c *fiber.Ctx) error {
	ctx := c.Context()

	// This would typically have auth middleware
	// For now, it's unprotected but can be called manually

	updates, err := h.priceService.SyncCurrentPrices(ctx)
	if err != nil {
		h.logger.Errorf("Failed to sync current prices: %v", err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "failed to sync prices",
		})
	}

	return c.JSON(fiber.Map{
		"message":       "current prices synced successfully",
		"synced_count":  len(updates),
	})
}
