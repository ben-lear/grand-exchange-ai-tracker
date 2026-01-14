# Historical Data & Bulk API Implementation Plan

## Problem Analysis

### Current State
1. **Limited Bulk API Usage**: Only uses the bulk dump (`os_dump.json`) for current prices
2. **No Historical Data on Startup**: Historical price data is NOT fetched during initial startup
3. **Slow Chart Data**: Charts have no data until jobs run, limiting UX
4. **Separate API Calls**: Historical data fetched one-by-one on subsequent job runs

### Root Causes
1. `CollectPriceData()` only runs hourly (scheduled job)
2. No initial historical data collection during app startup
3. Bulk API endpoints for historical data not utilized
4. No batch processing of sample data

## Bulk API Capabilities (from documentation)

### Available Endpoints
| Endpoint | Purpose | Data Format | Rate Limit |
|----------|---------|-------------|-----------|
| `/all` | Complete price history | `[[timestamp, price, volume?], ...]` | 1 item per request |
| `/sample` | 150 data points spread across entire history | `[[timestamp, price, volume?], ...]` | 1 item per request |
| `/last90d` | Last 90 days of data | `[[timestamp, price, volume?], ...]` | 1 item per request |
| `/latest` | Most recent price | JSON object with id, timestamp, price, volume | 100 items per request |

### Data Format Notes
- All arrays return `[UNIX_timestamp, price, volume?]` tuples
- Latest endpoint returns objects with ISO 8601 timestamps
- Volume field may be null or missing
- Timestamps are Unix seconds (not milliseconds)

## Implementation Plan

### Phase 1: Enhance osrs_client.go
**Objective**: Add proper support for bulk sample data fetching

**Changes**:
1. Add `FetchSampleHistoricalData(ctx, itemID)` method
   - Calls `/sample` endpoint
   - Returns 150 data points spread across all history
   - Perfect for initial startup (smaller payload)
   
2. Improve `FetchHistoricalData(ctx, itemID, timeframe)` method
   - Keep existing `/all`, `/last90d` support
   - Add better error handling for JSON parsing
   - Fix current issue with object vs array parsing

3. Add `FetchBulkLatestPrices(ctx, itemIDs []int)` method
   - Already partially exists but needs refinement
   - Supports up to 100 items per request
   - Returns latest prices with timestamps

### Phase 2: Enhance Scheduler (jobs.go)
**Objective**: Fetch historical data on startup and optimize subsequent updates

**Changes**:
1. Create `CollectInitialHistoricalData()` method
   - Called during initial startup
   - Uses `/sample` endpoint for all tradeable items (fast!)
   - Populates price_history table immediately
   - Prevents empty charts on app start

2. Modify `InitialSync()` in app.go
   - Add call to `CollectInitialHistoricalData()` after catalog sync
   - Ensures charts have data before server starts serving requests

3. Optimize `CollectPriceData()` job
   - Keep hourly schedule
   - Prioritize trending items (already implemented)
   - Fetch full `/all` data for trending items
   - Update existing `/sample` data for non-trending items (weekly)

### Phase 3: Data Collection Strategy

**Initial Startup (0-2 minutes)**:
```
1. SyncItemCatalog()           - 4,500 items: ~0.5s
2. UpdateItemPrices()         - 4,500 items: ~1s  
3. CollectInitialHistoricalData() - 4,500 items × /sample: ~90-120s
   - Fetch in batches (e.g., 10 items per second)
   - Store 150 data points per item
   - Results in ~675K data points in database
```

**Hourly Update (every 60 minutes)**:
```
1. UpdateItemPrices()         - 4,500 items: ~1s (already done)
2. CollectPriceData()
   - Fetch top 100 trending items using `/all`
   - Fetch remaining items using `/sample` (weekly rotation)
```

**Every 5 Minutes**:
```
1. UpdateItemPrices()         - Current prices only: ~1s
```

### Phase 4: Database Optimization
**Changes needed in migrations (if applicable)**:
```sql
-- Ensure indexes exist for efficient queries
CREATE INDEX IF NOT EXISTS idx_price_history_item_id_timestamp 
  ON price_history(item_id, timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_items_item_id 
  ON items(item_id);
```

## Benefits

### Performance
- **Startup**: +90-120s (one-time cost for 675K initial data points)
- **Ongoing**: No additional overhead (same as current)
- **Scalability**: Efficient batch processing prevents rate limiting

### User Experience
- Charts populated immediately on app load
- No "No data available" messages
- Historical context for all 4,500 items

### API Efficiency
- ~4,500 requests to `/sample` on startup
- Then only ~100 requests/hour to `/all` for trending items
- Total: ~4,600 requests on startup, then ~100/hour ongoing
- **Without optimization**: Would need 4,500 requests per item fetch × many jobs = exponential waste

## Implementation Order

1. ✅ **Review Documentation** - Understand bulk API endpoints
2. ⚙️ **Add FetchSampleHistoricalData()** in osrs_client.go
3. ⚙️ **Create CollectInitialHistoricalData()** in jobs.go
4. ⚙️ **Modify InitialSync()** in app.go to call new method
5. ⚙️ **Test startup data collection**
6. ⚙️ **Optimize ongoing collection** in CollectPriceData()
7. ⚙️ **Verify database performance** with full dataset

## Estimated Impact

### Database Size
- Before: ~4,500 items only (minimal)
- After: ~4,500 items + 675K price history entries (~50MB with indexes)

### API Calls per 24 Hours
- Before: 4 calls × 4,500 items = 18,000 calls/day
- After: 4,600 initial + (100 × 24 × 2) = 9,400 calls/day
- **Reduction: ~48% fewer API calls**

### Time to Charts
- Before: Wait until next hourly job (~60 min)
- After: Available immediately after startup (~2 min)

## Risk Mitigation

1. **Rate Limiting**: Implement exponential backoff if 429 received
2. **Batch Processing**: Use delays between requests (100ms per item)
3. **Transaction Safety**: Wrap bulk inserts in transactions
4. **Monitoring**: Log collection progress with timestamps
5. **Fallback**: If initial collection fails, mark for retry in next job

## Success Criteria

✅ Charts display data immediately after app startup
✅ All 4,500 items have at least 150 historical data points
✅ No increase in ongoing API call frequency
✅ App responds normally during data collection
✅ Graceful handling of network errors
