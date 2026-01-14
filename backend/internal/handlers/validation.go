package handlers

import "github.com/gofiber/fiber/v2"

// Validation constants
const (
	MinLimit = 1
	MaxLimit = 200
	MinPage  = 1
)

// ValidSortFields defines valid sort fields for items
var ValidSortFields = map[string]bool{
	"name":      true,
	"item_id":   true,
	"buy_limit": true,
	"high_alch": true,
	"low_alch":  true,
}

// ValidSortOrders defines valid sort orders
var ValidSortOrders = map[string]bool{
	"asc":  true,
	"desc": true,
}

// errorResponse returns a standardized error response
func errorResponse(c *fiber.Ctx, statusCode int, message string) error {
	return c.Status(statusCode).JSON(fiber.Map{
		"error": message,
	})
}

// validatePagination validates pagination parameters
func validatePagination(page, limit int) error {
	if page < MinPage {
		return fiber.NewError(fiber.StatusBadRequest, "page must be greater than 0")
	}
	if limit < MinLimit || limit > MaxLimit {
		return fiber.NewError(fiber.StatusBadRequest, "limit must be between 1 and 200")
	}
	return nil
}

// validateSortParams validates sort parameters
func validateSortParams(sortBy, order string) error {
	if !ValidSortFields[sortBy] {
		return fiber.NewError(fiber.StatusBadRequest, "invalid sort_by field")
	}
	if !ValidSortOrders[order] {
		return fiber.NewError(fiber.StatusBadRequest, "order must be 'asc' or 'desc'")
	}
	return nil
}
