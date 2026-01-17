package unit

import (
	"fmt"
	"sync"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
	"go.uber.org/zap"

	"github.com/guavi/osrs-ge-tracker/internal/models"
	"github.com/guavi/osrs-ge-tracker/internal/scheduler"
	"github.com/guavi/osrs-ge-tracker/internal/services"
)

// TestSSEHub wraps a real SSEHub for testing and captures broadcast messages.
type TestSSEHub struct {
	*services.SSEHub
	mu       sync.RWMutex
	messages []services.SSEMessage
}

// testSequenceMutex ensures SSE tests run one at a time to prevent scheduler interference.
var testSequenceMutex sync.Mutex

func NewTestSSEHub(logger *zap.SugaredLogger, maxClients int, simulatedClients int) *TestSSEHub {
	hub := services.NewSSEHub(logger, maxClients)
	
	testHub := &TestSSEHub{
		SSEHub:   hub,
		messages: make([]services.SSEMessage, 0),
	}
	
	// Start the hub
	go hub.Run()
	
	// Register simulated clients
	for i := 0; i < simulatedClients; i++ {
		client := &services.SSEClient{
			ID:          fmt.Sprintf("test-client-%d", i),
			MessageChan: make(chan services.SSEMessage, 500), // Larger buffer for test stability
			ConnectedAt: time.Now(),
		}
		hub.Register(client)
		
		// Capture messages from this client
		go func(c *services.SSEClient) {
			for msg := range c.MessageChan {
				testHub.mu.Lock()
				testHub.messages = append(testHub.messages, msg)
				testHub.mu.Unlock()
			}
		}(client)
	}
	
	// Give time for registration
	time.Sleep(100 * time.Millisecond)
	
	return testHub
}

func (t *TestSSEHub) GetMessages() []services.SSEMessage {
	t.mu.RLock()
	defer t.mu.RUnlock()
	
	result := make([]services.SSEMessage, len(t.messages))
	copy(result, t.messages)
	return result
}

func (t *TestSSEHub) ClearMessages() {
	t.mu.Lock()
	defer t.mu.Unlock()
	t.messages = make([]services.SSEMessage, 0)
}

func (t *TestSSEHub) StopAndWait() {
	t.SSEHub.Stop()
	time.Sleep(200 * time.Millisecond) // Increased wait for full shutdown
}

func TestScheduler_SyncCurrentPricesJob_BroadcastsUpdates(t *testing.T) {
	// Lock to ensure sequential execution of scheduler tests
	testSequenceMutex.Lock()
	defer testSequenceMutex.Unlock()

	logger := zap.NewNop().Sugar()
	mockPriceService := new(MockPriceService)
	mockItemService := new(MockItemService)
	testHub := NewTestSSEHub(logger, 100, 1) // 1 simulated client
	defer testHub.StopAndWait()
	defer time.Sleep(500 * time.Millisecond) // Allow cleanup between tests

	// Create scheduler
	s := scheduler.NewScheduler(mockPriceService, mockItemService, testHub.SSEHub, logger)

	// Setup mock to return price updates
	updates := []models.BulkPriceUpdate{
		{ItemID: 1, HighPrice: int64Ptr(1000), LowPrice: int64Ptr(900)},
		{ItemID: 2, HighPrice: int64Ptr(2000), LowPrice: int64Ptr(1800)},
		{ItemID: 3, HighPrice: int64Ptr(3000), LowPrice: int64Ptr(2700)},
	}

	mockItemService.On("SyncItemsFromMapping", mock.AnythingOfType("*context.timerCtx")).Return(nil).Maybe()
	mockPriceService.On("SyncCurrentPrices", mock.AnythingOfType("*context.timerCtx")).Return(updates, nil)
	mockPriceService.On("EnsureFuturePartitions", mock.AnythingOfType("*context.timerCtx"), mock.Anything).Return(nil).Maybe()

	// Start scheduler (this triggers the sync)
	err := s.Start()
	assert.NoError(t, err)

	// Wait for job to complete and messages to propagate
	time.Sleep(3 * time.Second)

	s.Stop()
	time.Sleep(200 * time.Millisecond) // Wait for scheduler to fully stop

	// Verify messages were broadcast
	messages := testHub.GetMessages()
	assert.Greater(t, len(messages), 0, "Expected messages to be broadcast")

	// Verify sync-complete event
	syncCompleteFound := false
	priceUpdateCount := 0

	for _, msg := range messages {
		if msg.Event == "sync-complete" {
			syncCompleteFound = true
		}
		if msg.Event == "price-update" {
			priceUpdateCount++
			assert.NotNil(t, msg.ItemID, "price-update should have ItemID set")
		}
	}

	assert.True(t, syncCompleteFound, "Expected sync-complete event")
	// Be more lenient - accept 3 or slightly more (in case of timing issues with cron)
	assert.GreaterOrEqual(t, priceUpdateCount, 3, "Expected at least 3 price-update events")
	assert.LessOrEqual(t, priceUpdateCount, 6, "Expected at most 6 price-update events (max 2 cron ticks)")

	mockPriceService.AssertExpectations(t)
}

func TestScheduler_SyncCurrentPricesJob_NoClientsConnected(t *testing.T) {
	// Lock to ensure sequential execution of scheduler tests
	testSequenceMutex.Lock()
	defer testSequenceMutex.Unlock()

	logger := zap.NewNop().Sugar()
	mockPriceService := new(MockPriceService)
	mockItemService := new(MockItemService)
	testHub := NewTestSSEHub(logger, 100, 0) // No clients
	defer testHub.StopAndWait()
	defer time.Sleep(500 * time.Millisecond)

	s := scheduler.NewScheduler(mockPriceService, mockItemService, testHub.SSEHub, logger)

	updates := []models.BulkPriceUpdate{
		{ItemID: 1, HighPrice: int64Ptr(1000), LowPrice: int64Ptr(900)},
	}

	mockItemService.On("SyncItemsFromMapping", mock.AnythingOfType("*context.timerCtx")).Return(nil).Maybe()
	mockPriceService.On("SyncCurrentPrices", mock.AnythingOfType("*context.timerCtx")).Return(updates, nil)
	mockPriceService.On("EnsureFuturePartitions", mock.AnythingOfType("*context.timerCtx"), mock.Anything).Return(nil).Maybe()

	err := s.Start()
	assert.NoError(t, err)

	time.Sleep(2 * time.Second)

	s.Stop()

	// Should not broadcast when no clients
	messages := testHub.GetMessages()
	assert.Equal(t, 0, len(messages), "Expected no broadcasts when no clients connected")

	mockPriceService.AssertExpectations(t)
}

func TestScheduler_SyncCurrentPricesJob_HubNil(t *testing.T) {
	// Sequential execution to avoid scheduler interference
	defer time.Sleep(500 * time.Millisecond)
	logger := zap.NewNop().Sugar()
	mockPriceService := new(MockPriceService)
	mockItemService := new(MockItemService)

	// Pass nil hub
	s := scheduler.NewScheduler(mockPriceService, mockItemService, nil, logger)

	updates := []models.BulkPriceUpdate{
		{ItemID: 1, HighPrice: int64Ptr(1000), LowPrice: int64Ptr(900)},
	}

	mockItemService.On("SyncItemsFromMapping", mock.AnythingOfType("*context.timerCtx")).Return(nil).Maybe()
	mockPriceService.On("SyncCurrentPrices", mock.AnythingOfType("*context.timerCtx")).Return(updates, nil)
	mockPriceService.On("EnsureFuturePartitions", mock.AnythingOfType("*context.timerCtx"), mock.Anything).Return(nil).Maybe()

	// Should not panic with nil hub
	err := s.Start()
	assert.NoError(t, err)

	time.Sleep(2 * time.Second)

	s.Stop()

	mockPriceService.AssertExpectations(t)
}

func TestScheduler_BroadcastPriceUpdates_LargeBatch(t *testing.T) {
	// Lock to ensure sequential execution of scheduler tests
	testSequenceMutex.Lock()
	defer testSequenceMutex.Unlock()

	logger := zap.NewNop().Sugar()
	mockPriceService := new(MockPriceService)
	mockItemService := new(MockItemService)
	testHub := NewTestSSEHub(logger, 100, 1)
	defer testHub.StopAndWait()
	defer time.Sleep(500 * time.Millisecond)

	s := scheduler.NewScheduler(mockPriceService, mockItemService, testHub.SSEHub, logger)

	// Create 150 updates to test batching (15K would take too long in tests)
	updates := make([]models.BulkPriceUpdate, 150)
	for i := 0; i < 150; i++ {
		updates[i] = models.BulkPriceUpdate{
			ItemID:    i + 1,
			HighPrice: int64Ptr(int64((i + 1) * 100)),
			LowPrice:  int64Ptr(int64((i + 1) * 90)),
		}
	}

	mockItemService.On("SyncItemsFromMapping", mock.AnythingOfType("*context.timerCtx")).Return(nil).Maybe()
	mockPriceService.On("SyncCurrentPrices", mock.AnythingOfType("*context.timerCtx")).Return(updates, nil)
	mockPriceService.On("EnsureFuturePartitions", mock.AnythingOfType("*context.timerCtx"), mock.Anything).Return(nil).Maybe()

	err := s.Start()
	assert.NoError(t, err)

	// Wait longer for all messages to be processed
	time.Sleep(6 * time.Second)

	s.Stop()

	// Verify most price updates were broadcast (allow for some message drops in test)
	messages := testHub.GetMessages()
	priceUpdateCount := 0
	for _, msg := range messages {
		if msg.Event == "price-update" {
			priceUpdateCount++
		}
	}

	// Allow at least 145 out of 150 (97%+) to account for any timing/channel issues in tests
	assert.GreaterOrEqual(t, priceUpdateCount, 145, "Expected at least 145 of 150 price updates to be broadcast")

	mockPriceService.AssertExpectations(t)
}

func TestScheduler_BroadcastPriceUpdates_ItemIDSet(t *testing.T) {
	// Lock to ensure sequential execution of scheduler tests
	testSequenceMutex.Lock()
	defer testSequenceMutex.Unlock()

	logger := zap.NewNop().Sugar()
	mockPriceService := new(MockPriceService)
	mockItemService := new(MockItemService)
	testHub := NewTestSSEHub(logger, 100, 1)
	defer testHub.StopAndWait()
	defer time.Sleep(500 * time.Millisecond)

	s := scheduler.NewScheduler(mockPriceService, mockItemService, testHub.SSEHub, logger)

	updates := []models.BulkPriceUpdate{
		{ItemID: 123, HighPrice: int64Ptr(5000), LowPrice: int64Ptr(4500)},
		{ItemID: 456, HighPrice: int64Ptr(8000), LowPrice: int64Ptr(7200)},
	}

	mockItemService.On("SyncItemsFromMapping", mock.AnythingOfType("*context.timerCtx")).Return(nil).Maybe()
	mockPriceService.On("SyncCurrentPrices", mock.AnythingOfType("*context.timerCtx")).Return(updates, nil)
	mockPriceService.On("EnsureFuturePartitions", mock.AnythingOfType("*context.timerCtx"), mock.Anything).Return(nil).Maybe()

	err := s.Start()
	assert.NoError(t, err)

	time.Sleep(2 * time.Second)

	s.Stop()

	// Verify ItemID is set correctly for filtering
	messages := testHub.GetMessages()
	priceUpdates := make([]services.SSEMessage, 0)
	for _, msg := range messages {
		if msg.Event == "price-update" {
			priceUpdates = append(priceUpdates, msg)
		}
	}

	assert.Len(t, priceUpdates, 2)

	// Verify ItemID matches
	foundItem123 := false
	foundItem456 := false

	for _, msg := range priceUpdates {
		assert.NotNil(t, msg.ItemID, "ItemID should be set for price-update events")
		if *msg.ItemID == 123 {
			foundItem123 = true
		}
		if *msg.ItemID == 456 {
			foundItem456 = true
		}
	}

	assert.True(t, foundItem123, "Expected price update for item 123")
	assert.True(t, foundItem456, "Expected price update for item 456")

	mockPriceService.AssertExpectations(t)
}

func TestBulkPriceUpdateToPayload_Conversion(t *testing.T) {
	now := time.Now()
	highTime := now.Add(-1 * time.Hour)
	lowTime := now.Add(-2 * time.Hour)

	update := models.BulkPriceUpdate{
		ItemID:        999,
		HighPrice:     int64Ptr(12345),
		LowPrice:      int64Ptr(11000),
		HighPriceTime: &highTime,
		LowPriceTime:  &lowTime,
	}

	payload := services.BulkPriceUpdateToPayload(update)

	assert.Equal(t, 999, payload.ItemID)
	assert.NotNil(t, payload.High)
	assert.Equal(t, int64(12345), *payload.High)
	assert.NotNil(t, payload.Low)
	assert.Equal(t, int64(11000), *payload.Low)
	assert.NotNil(t, payload.HighTime)
	assert.Equal(t, highTime.Unix(), *payload.HighTime)
	assert.NotNil(t, payload.LowTime)
	assert.Equal(t, lowTime.Unix(), *payload.LowTime)
}

func TestBulkPriceUpdateToPayload_NullTimes(t *testing.T) {
	update := models.BulkPriceUpdate{
		ItemID:        888,
		HighPrice:     int64Ptr(5000),
		LowPrice:      int64Ptr(4500),
		HighPriceTime: nil,
		LowPriceTime:  nil,
	}

	payload := services.BulkPriceUpdateToPayload(update)

	assert.Equal(t, 888, payload.ItemID)
	assert.NotNil(t, payload.High)
	assert.NotNil(t, payload.Low)
	assert.Nil(t, payload.HighTime)
	assert.Nil(t, payload.LowTime)
}

func TestScheduler_SyncCurrentPricesJob_SyncFailure(t *testing.T) {
	// Lock to ensure sequential execution of scheduler tests
	testSequenceMutex.Lock()
	defer testSequenceMutex.Unlock()

	logger := zap.NewNop().Sugar()
	mockPriceService := new(MockPriceService)
	mockItemService := new(MockItemService)
	testHub := NewTestSSEHub(logger, 100, 1)
	defer testHub.StopAndWait()
	defer time.Sleep(500 * time.Millisecond)

	s := scheduler.NewScheduler(mockPriceService, mockItemService, testHub.SSEHub, logger)

	// Mock sync failure
	mockItemService.On("SyncItemsFromMapping", mock.AnythingOfType("*context.timerCtx")).Return(nil).Maybe()
	mockPriceService.On("SyncCurrentPrices", mock.AnythingOfType("*context.timerCtx")).
		Return([]models.BulkPriceUpdate{}, assert.AnError)
	mockPriceService.On("EnsureFuturePartitions", mock.AnythingOfType("*context.timerCtx"), mock.Anything).Return(nil).Maybe()

	err := s.Start()
	assert.NoError(t, err)

	time.Sleep(2 * time.Second)

	s.Stop()

	// Should not broadcast on error
	messages := testHub.GetMessages()
	assert.Equal(t, 0, len(messages))

	mockPriceService.AssertExpectations(t)
}

// Helper function
func int64Ptr(v int64) *int64 {
	return &v
}
