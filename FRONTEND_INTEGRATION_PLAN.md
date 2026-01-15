# Frontend-Backend Integration Plan

**Date:** 2026-01-14  
**Status:** Planning  
**Purpose:** Document required frontend changes to integrate with the migrated backend API

---

## Executive Summary

The backend has been migrated to use the **OSRS Wiki API** (via WeirdGloop) instead of the original OSRS API. This introduces significant changes to the data models, particularly around **pricing data** which now has:

1. **Separate high/low prices** with individual timestamps (not a single price)
2. **Volume data in timeseries** (not per current price snapshot)
3. **New time period options** (1h, 12h, 3d added; granular buckets: 5m, 1h, 6h, 24h)
4. **No 24h change calculations** built-in (must be computed from history)

---

## Key Data Shape Mismatches

### 1. CurrentPrice Type Mismatch

| Frontend (Expected) | Backend (Actual) |
|---------------------|------------------|
| `id: number` | ❌ Not provided |
| `price: number` | ❌ Not provided (has `highPrice`/`lowPrice` separately) |
| `highPrice: number` | ✅ `highPrice: *int64` (nullable) |
| `lowPrice: number` | ✅ `lowPrice: *int64` (nullable) |
| `volume: number` | ❌ Not in current price (volume is in timeseries) |
| `priceChange24h: number` | ❌ Not provided |
| `priceChangePercent24h: number` | ❌ Not provided |
| `trend: PriceTrend` | ❌ Not provided |
| `lastUpdated: string` | ✅ `updatedAt: time.Time` |
| `createdAt: string` | ❌ Not provided |

**Backend `CurrentPrice` actual shape:**
```json
{
  "itemId": 2,
  "highPrice": 149,
  "highPriceTime": "2026-01-14T12:00:00Z",
  "lowPrice": 145,
  "lowPriceTime": "2026-01-14T11:55:00Z",
  "updatedAt": "2026-01-14T12:01:00Z"
}
```

### 2. TimePeriod Mismatch

| Frontend | Backend |
|----------|---------|
| `'24h'` | `'1h'`, `'12h'`, `'24h'` |
| `'7d'` | `'3d'`, `'7d'` |
| `'30d'` | ✅ `'30d'` |
| `'90d'` | ✅ `'90d'` |
| `'1y'` | ✅ `'1y'` |
| `'all'` | ✅ `'all'` |

### 3. PricePoint Type Mismatch

| Frontend (Expected) | Backend (Actual) |
|---------------------|------------------|
| `timestamp: number` | ✅ `timestamp: string` (ISO8601) |
| `price: number` | ❌ Has `highPrice` and `lowPrice` separately |
| `volume?: number` | ✅ In timeseries: `highPriceVolume`, `lowPriceVolume` |

**Backend timeseries points have:**
- `avgHighPrice` / `avgLowPrice` (bucketed averages)
- `highPriceVolume` / `lowPriceVolume` (per direction)

### 4. API Endpoint Changes

| Frontend Expects | Backend Provides |
|------------------|------------------|
| `POST /prices/batch` | `GET /prices/current/batch?ids=1,2,3` |
| `POST /prices/sync/current` | `POST /sync/prices` |
| `POST /prices/sync/historical` | ❌ Not implemented |

---

## UI/UX Recommendations

Based on the new dual-price model (high/low prices with separate timestamps), here are recommended UI improvements:

### 1. Dual Price Display
- Show **high price** (instant-buy price) and **low price** (instant-sell price) prominently
- Add a **spread indicator** showing the margin (high - low)
- Display **profit margin %** for flippers: `(high - low) / low * 100`

### 2. Enhanced Table Columns
- **High Price** with last update time
- **Low Price** with last update time  
- **Spread/Margin** column (gp and %)
- **Remove Volume column** from current prices (not available)
- **Remove 24h Change columns** (compute from history or remove)

### 3. Chart Improvements
- Display **dual-line charts** showing both high and low price trends
- Add **spread/margin area chart** between the lines
- New time period options: **1H**, **12H**, **3D** (short-term traders)
- Volume bars showing buy/sell volume separately

### 4. New Features to Consider
- **Flip Calculator**: Show potential profit considering buy limit
- **Price Alerts**: Notify when margin exceeds threshold
- **Last Trade Time**: Show how recently an item was actually traded

---

## Implementation Plan

### Phase 1: Type System Updates

**Files to modify:**
- `frontend/src/types/price.ts` - Update interfaces to match backend
- `frontend/src/types/index.ts` - Re-export new types

**Changes:**

1. Redefine `CurrentPrice` to match backend:
   - Remove `id`, `price`, `volume`, `priceChange24h`, `priceChangePercent24h`, `trend`, `createdAt`
   - Add nullable `highPriceTime`, `lowPriceTime`
   - Make `highPrice`/`lowPrice` nullable

2. Update `TimePeriod` type:
   ```typescript
   export type TimePeriod = '1h' | '12h' | '24h' | '3d' | '7d' | '30d' | '90d' | '1y' | 'all';
   ```

3. Redefine `PricePoint` for history:
   ```typescript
   export interface PricePoint {
     timestamp: number;
     highPrice?: number;
     lowPrice?: number;
     avgHighPrice?: number;
     avgLowPrice?: number;
     highPriceVolume?: number;
     lowPriceVolume?: number;
   }
   ```

### Phase 2: API Client Updates

**Files to modify:**
- `frontend/src/api/prices.ts` - Fix endpoints and data transformation
- `frontend/src/api/client.ts` - No changes needed

**Changes:**

1. Fix `fetchBatchCurrentPrices` to use GET with query params:
   ```typescript
   const response = await apiClient.get(`/prices/current/batch?ids=${itemIds.join(',')}`);
   ```

2. Update `fetchPriceHistory` response transformation to preserve dual prices

3. Fix sync endpoint paths (`/sync/prices` not `/prices/sync/current`)

### Phase 3: Component Updates

**Files to modify:**
- `frontend/src/components/table/columns.tsx` - Update price columns
- `frontend/src/components/charts/PriceChart.tsx` - Dual-line chart
- `frontend/src/components/charts/TimePeriodSelector.tsx` - Add new periods
- `frontend/src/components/charts/ChartTooltip.tsx` - Show both prices

**Changes:**

1. **Table columns:**
   - Remove `volume` column from current price view
   - Remove `priceChange24h`/`trend` indicators
   - Add spread/margin column
   - Add "last trade" timestamps

2. **Chart:**
   - Add second line for low price
   - Fill area between lines for spread visualization
   - Support new time periods (1h, 12h, 3d)

### Phase 4: Page and Hook Updates

**Files to modify:**
- `frontend/src/pages/DashboardPage.tsx` - Remove volume filters
- `frontend/src/pages/ItemDetailPage.tsx` - Update price display
- `frontend/src/hooks/usePrices.ts` - Update return type expectations

**Changes:**

1. Remove client-side volume filtering (volume not in current prices)
2. Update price display cards to show high/low separately with timestamps
3. Add spread/margin calculation helpers

### Phase 5: Utility and Formatter Updates

**Files to modify:**
- `frontend/src/utils/formatters.ts` - Add spread formatter

**Changes:**

1. Add `formatSpread(high, low)` utility
2. Add `formatMarginPercent(high, low)` utility
3. Add `formatRelativeTime(timestamp)` for "last trade" display

### Phase 6: Test Updates

**Files to modify:**
- All test files in `src/api/`, `src/components/`, `src/hooks/`

**Changes:**

1. Update mock data to match new schemas
2. Fix assertions for new price structure
3. Add tests for spread/margin calculations

---

## Detailed Task Breakdown

| # | Task | Priority | Effort | Status |
|---|------|----------|--------|--------|
| 1 | Update `CurrentPrice` interface | 🔴 Critical | Small | ⬜ Todo |
| 2 | Update `PricePoint` interface | 🔴 Critical | Small | ⬜ Todo |
| 3 | Update `TimePeriod` type | 🟡 High | Trivial | ⬜ Todo |
| 4 | Fix `fetchBatchCurrentPrices` endpoint | 🔴 Critical | Small | ⬜ Todo |
| 5 | Fix sync endpoint paths | 🟡 High | Trivial | ⬜ Todo |
| 6 | Update table columns (remove volume, add spread) | 🔴 Critical | Medium | ⬜ Todo |
| 7 | Update `ItemDetailPage` price card | 🔴 Critical | Medium | ⬜ Todo |
| 8 | Add dual-line chart support | 🟡 High | Large | ⬜ Todo |
| 9 | Update `TimePeriodSelector` options | 🟡 High | Small | ⬜ Todo |
| 10 | Remove volume filters from Dashboard | 🔴 Critical | Small | ⬜ Todo |
| 11 | Add spread/margin formatters | 🟢 Medium | Small | ⬜ Todo |
| 12 | Update tooltip to show both prices | 🟡 High | Small | ⬜ Todo |
| 13 | Update all tests | 🟡 High | Medium | ⬜ Todo |

---

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| Breaking changes to UI | Users will see different data | Ensure display gracefully handles null prices |
| Computed fields | 24h change must now be computed by fetching history | May impact performance - consider caching |
| Volume display | Cannot show real-time volume in table | Consider fetching latest timeseries point |
| Null price handling | Prices can be null if no recent trades | Add proper fallback UI states |

---

## Backend Model Reference

### CurrentPrice (from `backend/internal/models/price.go`)
```go
type CurrentPrice struct {
    ItemID        int        `json:"itemId"`
    HighPrice     *int64     `json:"highPrice"`
    HighPriceTime *time.Time `json:"highPriceTime"`
    LowPrice      *int64     `json:"lowPrice"`
    LowPriceTime  *time.Time `json:"lowPriceTime"`
    UpdatedAt     time.Time  `json:"updatedAt"`
}
```

### PriceTimeseriesPoint (from `backend/internal/models/price.go`)
```go
type PriceTimeseriesPoint struct {
    ItemID          int       `json:"itemId"`
    Timestamp       time.Time `json:"timestamp"`
    AvgHighPrice    *int64    `json:"avgHighPrice"`
    AvgLowPrice     *int64    `json:"avgLowPrice"`
    HighPriceVolume int64     `json:"highPriceVolume"`
    LowPriceVolume  int64     `json:"lowPriceVolume"`
    InsertedAt      time.Time `json:"insertedAt"`
}
```

### TimePeriod Options (from `backend/internal/models/types.go`)
```go
const (
    Period1Hour   TimePeriod = "1h"
    Period12Hours TimePeriod = "12h"
    Period24Hours TimePeriod = "24h"
    Period3Days   TimePeriod = "3d"
    Period7Days   TimePeriod = "7d"
    Period30Days  TimePeriod = "30d"
    Period90Days  TimePeriod = "90d"
    Period1Year   TimePeriod = "1y"
    PeriodAll     TimePeriod = "all"
)
```

### API Routes (from `backend/cmd/api/main.go`)
```
GET  /api/v1/items              - List items (paginated)
GET  /api/v1/items/search       - Search items
GET  /api/v1/items/count        - Get item count
GET  /api/v1/items/:id          - Get item by ID

GET  /api/v1/prices/current           - All current prices
GET  /api/v1/prices/current/batch     - Batch prices (?ids=1,2,3)
GET  /api/v1/prices/current/:id       - Single item price
GET  /api/v1/prices/history/:id       - Price history (?period=7d&sample=150)

POST /api/v1/sync/prices        - Trigger price sync (admin)
```

---

## Next Steps

1. Review and approve this plan
2. Begin Phase 1: Type System Updates
3. Proceed through phases sequentially
4. Run tests after each phase
5. Manual QA of UI after all changes
