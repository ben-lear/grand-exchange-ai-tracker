# SSE Implementation Plan: Real-Time Price Updates

## Overview

Implement Server-Sent Events (SSE) to push real-time price updates to the frontend. This complements the existing fetch-based historical data loading by appending fresh data points as they arrive, ensuring charts stay up-to-date without requiring page refreshes.

---

## Design Principles

1. **Initial load remains fetch-based** – Historical/downsampled data is fetched via REST API on page load
2. **SSE appends only** – SSE stream sends raw, un-downsampled price points as they arrive
3. **Long-lived connections** – SSE connections have a 30-60 minute stale timer (configurable)
4. **Frontend-side buffering** – The UI maintains a "live buffer" of SSE points separate from historical data
5. **Smart display logic** – Only the most recent SSE point is shown as the "live tip" until enough data accumulates for client-side consolidation
6. **Time-series initial-load cache bypass (Redis reads)** – On a fresh browser load/refresh, *all* time-series fetches (every period) should bypass Redis *reads* to ensure the client sees authoritative backend-computed data.
   - **Bypass reads only**: still **warm Redis** by writing the freshly computed response back into cache.
   - Applies consistently to all time-series periods (`24h|7d|30d|90d|1y|all`) and any “sample”/downsample time-series variants.

---

## API Design (Additions)

### Time-series endpoints: cache bypass flag

Add a query parameter to time-series endpoints:

- `cache=skip` (or `bypass_cache=true`) — **skip Redis GET**, still **perform Redis SET** after DB/service retrieval.

Example:
```
GET /api/v1/prices/history/:id?period=7d&sample=true&cache=skip
```

Notes:
- This flag is intended primarily for *initial page load after refresh*.
- Default behavior remains cache-friendly (read-through cache).

---

## Backend Implementation Tasks

### Task 1: Create SSE Hub (Broadcast Manager)

**File:** `backend/internal/services/sse_hub.go`

**Purpose:** Manages connected SSE clients, handles subscription/unsubscription, and broadcasts price updates to all connected clients.

**Implementation Details:**

```go
type SSEHub struct {
    clients    map[string]chan SSEMessage  // clientID -> message channel
    register   chan *SSEClient
    unregister chan string
    broadcast  chan SSEMessage
    mu         sync.RWMutex
    logger     *zap.SugaredLogger
}

type SSEClient struct {
    ID           string
    MessageChan  chan SSEMessage
    ItemFilters  []int          // Optional: subscribe to specific items
    ConnectedAt  time.Time
}

type SSEMessage struct {
    Event     string      `json:"event"`     // "price-update", "heartbeat"
    Data      interface{} `json:"data"`
    Timestamp time.Time   `json:"timestamp"`
}

type PriceUpdatePayload struct {
    ItemID    int       `json:"item_id"`
    High      *int64    `json:"high"`
    Low       *int64    `json:"low"`
    HighTime  *int64    `json:"high_time"`
    LowTime   *int64    `json:"low_time"`
    Timestamp time.Time `json:"timestamp"`
}
```

**Key Methods:**
- `NewSSEHub(logger) *SSEHub` – Constructor
- `Run()` – Main loop processing register/unregister/broadcast
- `Register(client *SSEClient)` – Add client to registry
- `Unregister(clientID string)` – Remove client from registry
- `Broadcast(msg SSEMessage)` – Send message to all connected clients
- `ClientCount() int` – Return number of connected clients

**Subtasks:**
- [ ] Create `sse_hub.go` with SSEHub struct and methods
- [ ] Add hub interface to `services/interfaces.go`
- [ ] Implement graceful shutdown (drain clients on stop)
- [ ] Add metrics/logging for connection count

---

### Task 2: Create SSE HTTP Handler

**File:** `backend/internal/handlers/sse_handler.go`

**Purpose:** HTTP handler for the SSE endpoint that establishes long-lived connections with clients.

**Endpoint:** `GET /api/v1/prices/stream`

**Query Parameters:**
- `items` (optional): Comma-separated item IDs to filter updates (e.g., `?items=2,4151,11832`)

**Implementation Details:**

```go
func (h *SSEHandler) Stream(c *fiber.Ctx) error {
    // Set SSE headers
    c.Set("Content-Type", "text/event-stream")
    c.Set("Cache-Control", "no-cache")
    c.Set("Connection", "keep-alive")
    c.Set("X-Accel-Buffering", "no") // Disable nginx buffering
    
    // Create client with unique ID
    clientID := uuid.New().String()
    messageChan := make(chan SSEMessage, 100)
    
    // Parse optional item filters
    itemFilters := parseItemFilters(c.Query("items"))
    
    client := &SSEClient{
        ID:          clientID,
        MessageChan: messageChan,
        ItemFilters: itemFilters,
        ConnectedAt: time.Now(),
    }
    
    // Register client
    h.hub.Register(client)
    defer h.hub.Unregister(clientID)
    
    // Stream context with timeout (30-60 min)
    ctx, cancel := context.WithTimeout(c.Context(), 30*time.Minute)
    defer cancel()
    
    // Use Fiber's streaming
    c.Context().SetBodyStreamWriter(func(w *bufio.Writer) {
        // Send initial connection confirmation
        writeSSEEvent(w, "connected", map[string]string{"client_id": clientID})
        
        // Heartbeat ticker (every 30 seconds)
        heartbeat := time.NewTicker(30 * time.Second)
        defer heartbeat.Stop()
        
        for {
            select {
            case <-ctx.Done():
                return
            case msg := <-messageChan:
                writeSSEEvent(w, msg.Event, msg.Data)
            case <-heartbeat.C:
                writeSSEEvent(w, "heartbeat", map[string]int64{"ts": time.Now().Unix()})
            }
        }
    })
    
    return nil
}
```

**SSE Wire Format:**
```
event: price-update
data: {"item_id":4151,"high":2850000,"low":2845000,"timestamp":"2026-01-14T12:34:56Z"}

event: heartbeat
data: {"ts":1736859296}

```

**Subtasks:**
- [ ] Create `sse_handler.go` with Stream handler
- [ ] Add SSE helper function `writeSSEEvent(w, event, data)`
- [ ] Implement item filtering logic
- [ ] Add connection timeout (configurable via config)
- [ ] Handle client disconnection gracefully
- [ ] Register route in `cmd/api/main.go`

---

### Task 3: Integrate SSE Hub with Scheduler

**File:** `backend/internal/scheduler/jobs.go`

**Purpose:** After each price sync, broadcast the new prices to all connected SSE clients.

**Implementation Details:**

```go
// In syncCurrentPricesJob, after successful sync:
func (s *Scheduler) syncCurrentPricesJob() {
    // ... existing sync logic ...
    
    // After successful price update, broadcast to SSE clients
    if s.sseHub != nil && len(updatedPrices) > 0 {
        for _, price := range updatedPrices {
            s.sseHub.Broadcast(services.SSEMessage{
                Event: "price-update",
                Data: services.PriceUpdatePayload{
                    ItemID:    price.ItemID,
                    High:      price.High,
                    Low:       price.Low,
                    HighTime:  price.HighTime,
                    LowTime:   price.LowTime,
                    Timestamp: price.UpdatedAt,
                },
                Timestamp: time.Now(),
            })
        }
    }
}
```

**Subtasks:**
- [ ] Add `sseHub` field to Scheduler struct
- [ ] Update `NewScheduler` to accept SSEHub dependency
- [ ] Modify `syncCurrentPricesJob` to broadcast after sync
- [ ] Ensure broadcast is non-blocking (buffered channels)

---

### Task 4: Update Backend Configuration

**File:** `backend/internal/config/config.go`

**New Config Fields:**
```go
type SSEConfig struct {
    Enabled           bool          `mapstructure:"enabled"`
    ConnectionTimeout time.Duration `mapstructure:"connection_timeout"` // Default: 30m
    HeartbeatInterval time.Duration `mapstructure:"heartbeat_interval"` // Default: 30s
    MaxClients        int           `mapstructure:"max_clients"`        // Default: 100
}
```

**Subtasks:**
- [ ] Add SSEConfig to main Config struct
- [ ] Set sensible defaults
- [ ] Update `.env.example` with SSE config options

---

### Task 5: Wire Up Dependencies in Main

**File:** `backend/cmd/api/main.go`

**Subtasks:**
- [ ] Create SSEHub instance
- [ ] Start SSEHub.Run() in goroutine
- [ ] Create SSEHandler with hub dependency
- [ ] Register `/api/v1/prices/stream` route
- [ ] Pass SSEHub to Scheduler
- [ ] Graceful shutdown: stop hub before exit

---

### Task X: Add Cache-Bypass Support for Time-Series Reads (Warm Cache Still)

**Primary target endpoint(s):**
- `GET /api/v1/prices/history/:id?period=...` (and any other time-series endpoints used for charts)

**Backend behavior:**
- If `cache=skip`:
  - Do **not** read from Redis
  - Fetch from DB/service as usual
  - **Write result to Redis** with the normal TTL (warming the cache)
- If not set:
  - Current behavior (read-through cache)

**Subtasks:**
- [ ] Add query param parsing (`cache=skip`) to time-series handlers
- [ ] Plumb a `CacheReadPolicy` (or boolean) down into service/repository layer
- [ ] Ensure Redis SET still happens when bypassing reads
- [ ] Apply consistently across all time-series periods and chart endpoints

---

## Frontend Implementation Tasks

### Task 6: Create SSE Connection Hook

**File:** `frontend/src/hooks/usePriceStream.ts`

**Purpose:** Manages the SSE connection lifecycle and provides live price updates to components.

**Implementation Details:**

```typescript
interface PriceUpdate {
  item_id: number;
  high: number | null;
  low: number | null;
  high_time: number | null;
  low_time: number | null;
  timestamp: string;
}

interface UsePriceStreamOptions {
  itemIds?: number[];          // Filter to specific items
  enabled?: boolean;           // Enable/disable connection
  onUpdate?: (update: PriceUpdate) => void;
}

interface UsePriceStreamReturn {
  isConnected: boolean;
  lastUpdate: PriceUpdate | null;
  connectionError: Error | null;
  reconnectCount: number;
}

export function usePriceStream(options: UsePriceStreamOptions): UsePriceStreamReturn {
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<PriceUpdate | null>(null);
  const [connectionError, setConnectionError] = useState<Error | null>(null);
  const [reconnectCount, setReconnectCount] = useState(0);
  const eventSourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    if (!options.enabled) return;

    const connect = () => {
      const params = options.itemIds?.length 
        ? `?items=${options.itemIds.join(',')}` 
        : '';
      const url = `${API_BASE_URL}/prices/stream${params}`;
      
      const eventSource = new EventSource(url);
      eventSourceRef.current = eventSource;

      eventSource.onopen = () => {
        setIsConnected(true);
        setConnectionError(null);
      };

      eventSource.addEventListener('price-update', (e) => {
        const update = JSON.parse(e.data) as PriceUpdate;
        setLastUpdate(update);
        options.onUpdate?.(update);
      });

      eventSource.addEventListener('heartbeat', () => {
        // Connection still alive, no action needed
      });

      eventSource.onerror = () => {
        setIsConnected(false);
        eventSource.close();
        
        // Reconnect with exponential backoff (max 30s)
        const delay = Math.min(1000 * Math.pow(2, reconnectCount), 30000);
        setTimeout(() => {
          setReconnectCount(c => c + 1);
          connect();
        }, delay);
      };
    };

    connect();

    return () => {
      eventSourceRef.current?.close();
    };
  }, [options.enabled, options.itemIds?.join(',')]);

  return { isConnected, lastUpdate, connectionError, reconnectCount };
}
```

**Subtasks:**
- [ ] Create `usePriceStream.ts` hook
- [ ] Implement EventSource connection logic
- [ ] Add automatic reconnection with exponential backoff
- [ ] Handle connection lifecycle (open, error, close)
- [ ] Add connection status state
- [ ] Integrate with React Query for cache invalidation (optional)

---

### Task 7: Create Live Buffer Store

**File:** `frontend/src/stores/liveBufferStore.ts`

**Purpose:** Zustand store that maintains a buffer of live SSE price points per item, separate from the fetched historical data.

**Implementation Details:**

```typescript
interface LivePricePoint {
  timestamp: Date;
  high: number | null;
  low: number | null;
  isLive: true;  // Marker to identify SSE-sourced points
}

interface LiveBuffer {
  points: LivePricePoint[];      // All accumulated SSE points
  latestPoint: LivePricePoint | null;  // The current "live tip"
}

interface LiveBufferState {
  buffers: Map<number, LiveBuffer>;  // itemId -> LiveBuffer
  
  // Actions
  addPoint: (itemId: number, point: LivePricePoint) => void;
  getBuffer: (itemId: number) => LiveBuffer | undefined;
  getLiveTip: (itemId: number) => LivePricePoint | null;
  getConsolidatedPoints: (itemId: number, timestepMs: number) => LivePricePoint[];
  clearBuffer: (itemId: number) => void;
  clearAllBuffers: () => void;
}

export const useLiveBufferStore = create<LiveBufferState>((set, get) => ({
  buffers: new Map(),

  addPoint: (itemId, point) => {
    set((state) => {
      const buffers = new Map(state.buffers);
      const existing = buffers.get(itemId) || { points: [], latestPoint: null };
      
      buffers.set(itemId, {
        points: [...existing.points, point],
        latestPoint: point,  // Always update live tip
      });
      
      return { buffers };
    });
  },

  getLiveTip: (itemId) => {
    return get().buffers.get(itemId)?.latestPoint ?? null;
  },

  getConsolidatedPoints: (itemId, timestepMs) => {
    const buffer = get().buffers.get(itemId);
    if (!buffer || buffer.points.length === 0) return [];
    
    // Group points by timestep bucket and average
    const buckets = new Map<number, LivePricePoint[]>();
    for (const point of buffer.points) {
      const bucketKey = Math.floor(point.timestamp.getTime() / timestepMs) * timestepMs;
      const bucket = buckets.get(bucketKey) || [];
      bucket.push(point);
      buckets.set(bucketKey, bucket);
    }
    
    // Return averaged points per bucket
    return Array.from(buckets.entries()).map(([ts, points]) => ({
      timestamp: new Date(ts),
      high: average(points.map(p => p.high).filter(notNull)),
      low: average(points.map(p => p.low).filter(notNull)),
      isLive: true,
    }));
  },
  
  // ... other methods
}));
```

**Subtasks:**
- [ ] Create `liveBufferStore.ts` with Zustand
- [ ] Implement `addPoint` action
- [ ] Implement `getLiveTip` selector
- [ ] Implement `getConsolidatedPoints` with timestep-based bucketing
- [ ] Add buffer size limits (prevent memory leaks)
- [ ] Add `clearBuffer` for when switching items

---

### Task 8: Define Timestep Configuration Per Period

**File:** `frontend/src/utils/chartTimesteps.ts`

**Purpose:** Define the display granularity for each time period, used for client-side consolidation of SSE data.

**Implementation Details:**

```typescript
interface TimestepConfig {
  period: TimePeriod;
  displayTimestepMs: number;    // How often a new point appears on chart
  consolidationThreshold: number; // How many SSE points before consolidating
}

export const TIMESTEP_CONFIG: Record<TimePeriod, TimestepConfig> = {
  '1h':  { period: '1h',  displayTimestepMs: 1 * 60 * 1000,      consolidationThreshold: 1 },   // 1 min
  '24h': { period: '24h', displayTimestepMs: 5 * 60 * 1000,      consolidationThreshold: 5 },   // 5 min
  '7d':  { period: '7d',  displayTimestepMs: 30 * 60 * 1000,     consolidationThreshold: 30 },  // 30 min
  '30d': { period: '30d', displayTimestepMs: 2 * 60 * 60 * 1000, consolidationThreshold: 120 }, // 2 hr
  '90d': { period: '90d', displayTimestepMs: 6 * 60 * 60 * 1000, consolidationThreshold: 360 }, // 6 hr
  '1y':  { period: '1y',  displayTimestepMs: 24 * 60 * 60 * 1000, consolidationThreshold: 1440 }, // 1 day
  'all': { period: 'all', displayTimestepMs: 24 * 60 * 60 * 1000, consolidationThreshold: 1440 }, // 1 day
};

export function getTimestepForPeriod(period: TimePeriod): TimestepConfig {
  return TIMESTEP_CONFIG[period];
}
```

**Subtasks:**
- [ ] Create `chartTimesteps.ts` with period configs
- [ ] Define sensible timesteps for each period
- [ ] Export helper functions

---

### Task 9: Update PriceChart Component

**File:** `frontend/src/components/Charts/PriceChart.tsx`

**Purpose:** Modify the chart to display both historical data and live SSE data with proper visual distinction.

**Implementation Changes:**

1. **Connect to SSE stream** for the current item
2. **Merge data sources**: historical (fetch) + live buffer (SSE)
3. **Display logic**:
   - Historical points: solid line
   - Live tip: distinct marker (pulsing dot, different color)
   - Once SSE buffer consolidates, merge into display data

```typescript
function PriceChart({ itemId, period }: PriceChartProps) {
  // Existing: fetch historical data
  const { data: history, isLoading } = usePriceHistory(itemId, period);
  
  // New: SSE live updates
  const { isConnected, lastUpdate } = usePriceStream({
    itemIds: [itemId],
    enabled: true,
  });
  
  // New: Live buffer store
  const { addPoint, getLiveTip, getConsolidatedPoints } = useLiveBufferStore();
  const timestepConfig = getTimestepForPeriod(period);
  
  // Add SSE updates to buffer
  useEffect(() => {
    if (lastUpdate && lastUpdate.item_id === itemId) {
      addPoint(itemId, {
        timestamp: new Date(lastUpdate.timestamp),
        high: lastUpdate.high,
        low: lastUpdate.low,
        isLive: true,
      });
    }
  }, [lastUpdate]);
  
  // Merge historical + live data for display
  const displayData = useMemo(() => {
    if (!history?.data) return [];
    
    const historical = history.data.map(p => ({ ...p, isLive: false }));
    const liveTip = getLiveTip(itemId);
    const consolidated = getConsolidatedPoints(itemId, timestepConfig.displayTimestepMs);
    
    // Merge: historical + consolidated SSE + live tip
    const merged = [...historical];
    
    // Add consolidated SSE points (excluding the current timestep bucket)
    for (const cp of consolidated) {
      // Only add if it's a complete bucket (not the current one)
      if (cp.timestamp.getTime() < getCurrentBucketStart(timestepConfig.displayTimestepMs)) {
        merged.push(cp);
      }
    }
    
    // Always add live tip as the rightmost point
    if (liveTip) {
      merged.push(liveTip);
    }
    
    return merged.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  }, [history, getLiveTip(itemId), period]);
  
  return (
    <ResponsiveContainer>
      <LineChart data={displayData}>
        <Line 
          dataKey="high"
          dot={(props) => props.payload.isLive ? <LiveDot {...props} /> : <Dot {...props} />}
        />
        {/* Live connection indicator */}
        {isConnected && <div className="live-indicator">● LIVE</div>}
      </LineChart>
    </ResponsiveContainer>
  );
}
```

**Subtasks:**
- [ ] Integrate `usePriceStream` hook into PriceChart
- [ ] Connect to live buffer store
- [ ] Implement data merging logic (historical + SSE)
- [ ] Add visual distinction for live data point (pulsing dot, different color)
- [ ] Add "LIVE" indicator when connected
- [ ] Clear buffer when item or period changes
- [ ] Handle edge case: SSE point arrives before initial fetch completes

---

### Task 10: Create Live Indicator Component

**File:** `frontend/src/components/Charts/LiveIndicator.tsx`

**Purpose:** Visual indicator showing SSE connection status and live data state.

**Implementation:**

```typescript
interface LiveIndicatorProps {
  isConnected: boolean;
  lastUpdateTime: Date | null;
}

export function LiveIndicator({ isConnected, lastUpdateTime }: LiveIndicatorProps) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <span 
        className={`w-2 h-2 rounded-full ${
          isConnected ? 'bg-green-500 animate-pulse' : 'bg-gray-400'
        }`} 
      />
      <span className={isConnected ? 'text-green-600' : 'text-gray-500'}>
        {isConnected ? 'LIVE' : 'Connecting...'}
      </span>
      {lastUpdateTime && (
        <span className="text-gray-400 text-xs">
          Updated {formatDistanceToNow(lastUpdateTime)} ago
        </span>
      )}
    </div>
  );
}
```

**Subtasks:**
- [ ] Create LiveIndicator component
- [ ] Add connection status styling (green pulse when connected)
- [ ] Show time since last update
- [ ] Add reconnection indicator

---

### Task 11: Update API Client

**File:** `frontend/src/api/index.ts`

**Purpose:** Add SSE endpoint URL constant.

**Subtasks:**
- [ ] Add `SSE_STREAM_URL` constant
- [ ] Ensure CORS is configured for SSE on backend

---

## Testing Tasks

### Task 12: Backend Unit Tests

**Files:**
- `backend/tests/unit/sse_hub_test.go`
- `backend/tests/unit/sse_handler_test.go`

**Test Cases:**
- [ ] SSE Hub: Register/unregister clients
- [ ] SSE Hub: Broadcast to multiple clients
- [ ] SSE Hub: Client filtering by item ID
- [ ] SSE Handler: Connection establishment
- [ ] SSE Handler: Heartbeat timing
- [ ] SSE Handler: Connection timeout
- [ ] SSE Handler: Graceful client disconnection

---

### Task 13: Backend Integration Tests

**File:** `backend/tests/integration/sse_integration_test.go`

**Test Cases:**
- [ ] Full flow: scheduler sync → SSE broadcast → client receives
- [ ] Multiple clients receive same broadcast
- [ ] Connection survives for extended period
- [ ] Proper cleanup on server shutdown

---

### Task 14: Frontend Unit Tests

**Files:**
- `frontend/src/hooks/usePriceStream.test.ts`
- `frontend/src/stores/liveBufferStore.test.ts`

**Test Cases:**
- [ ] usePriceStream: Connection lifecycle
- [ ] usePriceStream: Reconnection logic
- [ ] usePriceStream: Update handling
- [ ] liveBufferStore: Point accumulation
- [ ] liveBufferStore: Consolidation logic
- [ ] liveBufferStore: Buffer clearing

---

### Task 15: E2E Tests

**File:** `frontend/tests/e2e/sse-realtime.spec.ts`

**Test Cases:**
- [ ] Chart updates when SSE message received
- [ ] Live indicator shows connected state
- [ ] Data persists across period switches
- [ ] Reconnection after connection drop

---

## Implementation Order

### Phase 1: Backend Foundation (Tasks 1-5)
1. Task 1: SSE Hub
2. Task 2: SSE Handler
3. Task 4: Configuration
4. Task 5: Wire up main.go
5. Task 3: Scheduler integration

### Phase 2: Frontend Foundation (Tasks 6-8)
1. Task 6: usePriceStream hook
2. Task 7: Live buffer store
3. Task 8: Timestep configuration

### Phase 3: UI Integration (Tasks 9-11)
1. Task 11: API client update
2. Task 10: Live indicator component
3. Task 9: PriceChart integration

### Phase 4: Testing (Tasks 12-15)
1. Task 12: Backend unit tests
2. Task 13: Backend integration tests
3. Task 14: Frontend unit tests
4. Task 15: E2E tests

---

## Estimated Effort

| Phase | Tasks | Estimated Hours |
|-------|-------|-----------------|
| Phase 1: Backend Foundation | 1-5 | 6-8 hours |
| Phase 2: Frontend Foundation | 6-8 | 4-6 hours |
| Phase 3: UI Integration | 9-11 | 4-6 hours |
| Phase 4: Testing | 12-15 | 4-6 hours |
| **Total** | | **18-26 hours** |

---

## Configuration Defaults

```yaml
# Backend (.env)
SSE_ENABLED=true
SSE_CONNECTION_TIMEOUT=30m
SSE_HEARTBEAT_INTERVAL=30s
SSE_MAX_CLIENTS=100

# Frontend (constants)
SSE_RECONNECT_BASE_DELAY=1000    # 1 second
SSE_RECONNECT_MAX_DELAY=30000    # 30 seconds
```

---

## Future Enhancements

1. **Redis Pub/Sub** – For horizontal scaling across multiple backend instances
2. **Item subscription filtering** – Only send updates for items the client cares about
3. **Compression** – Batch multiple price updates into single SSE message
4. **Metrics** – Prometheus metrics for SSE connection count, message rate
5. **Rate limiting** – Prevent SSE connection spam

---
