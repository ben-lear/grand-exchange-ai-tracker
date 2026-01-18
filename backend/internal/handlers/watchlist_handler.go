package handlers

import (
	"net/http"

	"github.com/gofiber/fiber/v2"
	"github.com/guavi/osrs-ge-tracker/internal/models"
	"github.com/guavi/osrs-ge-tracker/internal/services"
	"go.uber.org/zap"
)

// WatchlistHandler handles HTTP requests for watchlist sharing
type WatchlistHandler struct {
	service services.WatchlistService
	logger  *zap.SugaredLogger
}

// NewWatchlistHandler creates a new watchlist handler
func NewWatchlistHandler(service services.WatchlistService, logger *zap.SugaredLogger) *WatchlistHandler {
	return &WatchlistHandler{
		service: service,
		logger:  logger,
	}
}

// CreateShare creates a new watchlist share
// POST /api/v1/watchlists/share
func (h *WatchlistHandler) CreateShare(c *fiber.Ctx) error {
	var req models.WatchlistShareRequest

	// Parse request body
	if err := c.BodyParser(&req); err != nil {
		h.logger.Debugw("Invalid request body", "error", err)
		return c.Status(http.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid request body",
		})
	}

	// Validate request
	if req.WatchlistData == nil {
		return c.Status(http.StatusBadRequest).JSON(fiber.Map{
			"error": "watchlist_data is required",
		})
	}

	// Create share
	response, err := h.service.CreateShare(c.Context(), req.WatchlistData)
	if err != nil {
		h.logger.Errorw("Failed to create share", "error", err)
		return c.Status(http.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to create share",
		})
	}

	return c.Status(http.StatusCreated).JSON(response)
}

// GetShare retrieves a watchlist share by token
// GET /api/v1/watchlists/share/:token
func (h *WatchlistHandler) GetShare(c *fiber.Ctx) error {
	token := c.Params("token")

	if token == "" {
		return c.Status(http.StatusBadRequest).JSON(fiber.Map{
			"error": "Token is required",
		})
	}

	// Get share
	response, err := h.service.GetShare(c.Context(), token)
	if err != nil {
		if err.Error() == "share not found" || err.Error() == "share has expired" {
			return c.Status(http.StatusNotFound).JSON(fiber.Map{
				"error": err.Error(),
			})
		}

		if err.Error() == "invalid token format" {
			return c.Status(http.StatusBadRequest).JSON(fiber.Map{
				"error": "Invalid token format",
			})
		}

		h.logger.Errorw("Failed to get share", "error", err, "token", token)
		return c.Status(http.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to retrieve share",
		})
	}

	return c.JSON(response)
}

// RegisterRoutes registers the watchlist routes
func (h *WatchlistHandler) RegisterRoutes(app *fiber.App) {
	v1 := app.Group("/api/v1")

	// Watchlist share routes
	v1.Post("/watchlists/share", h.CreateShare)
	v1.Get("/watchlists/share/:token", h.GetShare)
}
