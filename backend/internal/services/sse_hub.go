package services

import (
	"sync"
	"time"

	"go.uber.org/zap"

	"github.com/guavi/osrs-ge-tracker/internal/models"
)

type SSEMessage struct {
	Timestamp time.Time `json:"timestamp"`
	Data      any       `json:"data"`
	ItemID    *int      `json:"-"`
	Event     string    `json:"event"`
}

type PriceUpdatePayload struct {
	Timestamp time.Time `json:"timestamp"`
	High      *int64    `json:"high"`
	Low       *int64    `json:"low"`
	HighTime  *int64    `json:"high_time"`
	LowTime   *int64    `json:"low_time"`
	ItemID    int       `json:"item_id"`
}

type SSEClient struct {
	ConnectedAt time.Time
	MessageChan chan SSEMessage
	ItemFilters map[int]struct{}
	ID          string
}

type SSEHub struct {
	logger     *zap.SugaredLogger
	clients    map[string]*SSEClient
	register   chan *SSEClient
	unregister chan string
	broadcast  chan SSEMessage
	stop       chan struct{}
	maxClients int
	mu         sync.RWMutex
}

func NewSSEHub(logger *zap.SugaredLogger, maxClients int) *SSEHub {
	if maxClients <= 0 {
		maxClients = 100
	}

	return &SSEHub{
		logger:     logger,
		maxClients: maxClients,
		clients:    make(map[string]*SSEClient),
		register:   make(chan *SSEClient),
		unregister: make(chan string),
		broadcast:  make(chan SSEMessage, 1024),
		stop:       make(chan struct{}),
	}
}

func (h *SSEHub) Run() {
	for {
		select {
		case <-h.stop:
			h.drainAndCloseClients()
			return

		case c := <-h.register:
			h.handleRegister(c)

		case id := <-h.unregister:
			h.handleUnregister(id)

		case msg := <-h.broadcast:
			h.handleBroadcast(msg)
		}
	}
}

func (h *SSEHub) Stop() {
	select {
	case <-h.stop:
		return
	default:
		close(h.stop)
	}
}

func (h *SSEHub) Register(client *SSEClient) {
	h.register <- client
}

func (h *SSEHub) Unregister(clientID string) {
	h.unregister <- clientID
}

func (h *SSEHub) Broadcast(msg SSEMessage) {
	// Non-blocking enqueue; if the hub is overloaded, drop rather than block scheduler/job loops.
	select {
	case h.broadcast <- msg:
		if h.logger != nil {
			queueUtilization := float64(len(h.broadcast)) / float64(cap(h.broadcast)) * 100
			h.logger.Debugw("sse message queued",
				"event", msg.Event,
				"queue_size", len(h.broadcast),
				"queue_capacity", cap(h.broadcast),
				"utilization_pct", queueUtilization,
			)
		}
	default:
		if h.logger != nil {
			h.logger.Warnw("sse hub broadcast queue full; dropping message",
				"event", msg.Event,
				"queue_capacity", cap(h.broadcast),
			)
		}
	}
}

// BulkPriceUpdateToPayload converts a BulkPriceUpdate to PriceUpdatePayload.
func BulkPriceUpdateToPayload(update models.BulkPriceUpdate) PriceUpdatePayload {
	var highTime, lowTime *int64
	if update.HighPriceTime != nil {
		t := update.HighPriceTime.Unix()
		highTime = &t
	}
	if update.LowPriceTime != nil {
		t := update.LowPriceTime.Unix()
		lowTime = &t
	}

	return PriceUpdatePayload{
		Timestamp: time.Now(),
		High:      update.HighPrice,
		Low:       update.LowPrice,
		HighTime:  highTime,
		LowTime:   lowTime,
		ItemID:    update.ItemID,
	}
}

func (h *SSEHub) ClientCount() int {
	h.mu.RLock()
	defer h.mu.RUnlock()
	return len(h.clients)
}

func (h *SSEHub) handleRegister(c *SSEClient) {
	if c == nil || c.ID == "" || c.MessageChan == nil {
		return
	}

	h.mu.Lock()
	defer h.mu.Unlock()

	if len(h.clients) >= h.maxClients {
		// Refuse registration; caller/handler should close the connection.
		if h.logger != nil {
			h.logger.Warnw("sse max clients reached; refusing client", "client_id", c.ID, "max", h.maxClients)
		}
		return
	}

	h.clients[c.ID] = c
	if h.logger != nil {
		h.logger.Infow("sse client registered", "client_id", c.ID, "clients", len(h.clients))
	}
}

func (h *SSEHub) handleUnregister(id string) {
	h.mu.Lock()
	defer h.mu.Unlock()

	c, ok := h.clients[id]
	if !ok {
		return
	}
	delete(h.clients, id)

	// Close client channel to signal writer loops.
	close(c.MessageChan)

	if h.logger != nil {
		h.logger.Infow("sse client unregistered", "client_id", id, "clients", len(h.clients))
	}
}

func (h *SSEHub) handleBroadcast(msg SSEMessage) {
	h.mu.RLock()
	defer h.mu.RUnlock()

	for _, c := range h.clients {
		if !clientWantsMessage(c, msg) {
			continue
		}

		// Never block the hub on a slow client.
		select {
		case c.MessageChan <- msg:
		default:
			if h.logger != nil {
				h.logger.Debugw("sse client channel full; dropping", "client_id", c.ID, "event", msg.Event)
			}
		}
	}
}

func (h *SSEHub) drainAndCloseClients() {
	h.mu.Lock()
	defer h.mu.Unlock()

	for id, c := range h.clients {
		delete(h.clients, id)
		close(c.MessageChan)
	}

	if h.logger != nil {
		h.logger.Infow("sse hub stopped; all clients drained")
	}
}

func clientWantsMessage(c *SSEClient, msg SSEMessage) bool {
	if c == nil {
		return false
	}
	if len(c.ItemFilters) == 0 {
		return true
	}
	if msg.ItemID == nil {
		return false
	}
	_, ok := c.ItemFilters[*msg.ItemID]
	return ok
}
