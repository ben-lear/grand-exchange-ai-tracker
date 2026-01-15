package handlers

import (
	"bufio"
	"encoding/json"
	"fmt"
	"strconv"
	"strings"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	"github.com/guavi/osrs-ge-tracker/internal/services"
	"go.uber.org/zap"
)

// SSEHandler handles Server-Sent Events connections
type SSEHandler struct {
	hub    *services.SSEHub
	logger *zap.SugaredLogger
	config SSEConfig
}

// SSEConfig contains SSE-specific configuration
type SSEConfig struct {
	ConnectionTimeout time.Duration
	HeartbeatInterval time.Duration
	MaxClients        int
}

// NewSSEHandler creates a new SSE handler
func NewSSEHandler(hub *services.SSEHub, logger *zap.SugaredLogger, config SSEConfig) *SSEHandler {
	// Set defaults
	if config.ConnectionTimeout == 0 {
		config.ConnectionTimeout = 30 * time.Minute
	}
	if config.HeartbeatInterval == 0 {
		config.HeartbeatInterval = 30 * time.Second
	}
	if config.MaxClients == 0 {
		config.MaxClients = 100
	}

	return &SSEHandler{
		hub:    hub,
		logger: logger,
		config: config,
	}
}

// Stream handles the SSE endpoint for real-time price updates
// @Summary Stream real-time price updates
// @Description Establishes a Server-Sent Events connection for real-time price updates
// @Tags prices
// @Param items query string false "Comma-separated item IDs to filter (e.g., 2,4151,11832)"
// @Success 200 {string} string "text/event-stream"
// @Router /api/v1/prices/stream [get]
func (h *SSEHandler) Stream(c *fiber.Ctx) error {
	// Check if hub is available
	if h.hub == nil {
		return c.Status(fiber.StatusServiceUnavailable).JSON(fiber.Map{
			"error": "SSE service not available",
		})
	}

	// Check client count
	if h.hub.ClientCount() >= h.config.MaxClients {
		h.logger.Warn("SSE max clients reached, rejecting connection")
		return c.Status(fiber.StatusServiceUnavailable).JSON(fiber.Map{
			"error": "Maximum number of SSE clients reached",
		})
	}

	// Set SSE headers
	c.Set("Content-Type", "text/event-stream")
	c.Set("Cache-Control", "no-cache")
	c.Set("Connection", "keep-alive")
	c.Set("X-Accel-Buffering", "no") // Disable nginx buffering

	// Create unique client ID
	clientID := uuid.New().String()

	// Parse optional item filters
	itemFilters := parseItemFilters(c.Query("items"))

	// Create client
	messageChan := make(chan services.SSEMessage, 100)
	client := &services.SSEClient{
		ID:          clientID,
		MessageChan: messageChan,
		ItemFilters: itemFilters,
		ConnectedAt: time.Now(),
	}

	// Register client with hub
	h.hub.Register(client)

	h.logger.Infow("SSE client connected",
		"client_id", clientID,
		"item_filters", len(itemFilters),
		"remote_ip", c.IP())

	// Use Fiber's streaming with context
	c.Context().SetBodyStreamWriter(func(w *bufio.Writer) {
		// Ensure client is unregistered when stream ends
		defer h.hub.Unregister(clientID)

		// Send initial connection confirmation
		if err := writeSSEEvent(w, "connected", map[string]string{
			"client_id": clientID,
			"timestamp": time.Now().Format(time.RFC3339),
		}); err != nil {
			h.logger.Errorw("Failed to send connection event", "error", err)
			return
		}

		// Create heartbeat ticker
		heartbeat := time.NewTicker(h.config.HeartbeatInterval)
		defer heartbeat.Stop()

		// Create connection timeout timer
		timeout := time.NewTimer(h.config.ConnectionTimeout)
		defer timeout.Stop()

		for {
			select {
			case <-timeout.C:
				// Connection timeout reached
				h.logger.Infow("SSE client connection timeout",
					"client_id", clientID,
					"timeout", h.config.ConnectionTimeout)
				writeSSEEvent(w, "timeout", map[string]string{
					"message": "Connection timeout reached",
				})
				return

			case msg, ok := <-messageChan:
				if !ok {
					// Channel closed (hub shutdown or unregister)
					h.logger.Infow("SSE client channel closed",
						"client_id", clientID)
					return
				}

				// Send message to client
				if err := writeSSEEvent(w, msg.Event, msg.Data); err != nil {
					h.logger.Errorw("Failed to write SSE event",
						"error", err,
						"client_id", clientID)
					return
				}

			case <-heartbeat.C:
				// Send heartbeat to keep connection alive
				if err := writeSSEEvent(w, "heartbeat", map[string]int64{
					"ts": time.Now().Unix(),
				}); err != nil {
					h.logger.Errorw("Failed to send heartbeat",
						"error", err,
						"client_id", clientID)
					return
				}
			}
		}
	})

	return nil
}

// writeSSEEvent writes an SSE event to the response writer
func writeSSEEvent(w *bufio.Writer, event string, data interface{}) error {
	// Write event field
	if _, err := fmt.Fprintf(w, "event: %s\n", event); err != nil {
		return err
	}

	// Marshal data to JSON
	jsonData, err := json.Marshal(data)
	if err != nil {
		return err
	}

	// Write data field
	if _, err := fmt.Fprintf(w, "data: %s\n\n", string(jsonData)); err != nil {
		return err
	}

	// Flush to send immediately
	return w.Flush()
}

// parseItemFilters parses comma-separated item IDs from query string
func parseItemFilters(itemsQuery string) map[int]struct{} {
	if itemsQuery == "" {
		return nil
	}

	filters := make(map[int]struct{})
	items := strings.Split(itemsQuery, ",")

	for _, item := range items {
		item = strings.TrimSpace(item)
		if id, err := strconv.Atoi(item); err == nil && id > 0 {
			filters[id] = struct{}{}
		}
	}

	if len(filters) == 0 {
		return nil
	}

	return filters
}
