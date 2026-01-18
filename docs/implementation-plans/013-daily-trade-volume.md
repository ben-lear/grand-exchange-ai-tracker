# Implementation Plan: Daily Trade Volume Integration

**Status:** Planning  
**Priority:** High  
**Estimated Effort:** 6-8 hours  
**Dependencies:** None

## Overview

Integrate daily trade volume data from the OSRS Wiki GEVolumes API into the Items table. This feature will poll volume data every 10 minutes, store it alongside item metadata, and display it in the frontend with SI unit formatting (e.g., "51.9K", "22.5M").

## Objectives

- Add `daily_volume` and `normalized_name` columns to items table
- Fetch volume data from `https://oldschool.runescape.wiki/w/Module:GEVolumes/data.json?action=raw`
- Implement name normalization for reliable item-to-volume matching
- Poll volume data every 10 minutes via cron job
- Sync volumes immediately on startup after items are loaded
- Display volumes in frontend table with SI unit formatting
- Optimize API payload by excluding unnecessary fields (id, createdAt)
- Auto-refresh frontend data every 10 minutes

## Technical Specifications

### API Response Format (GEVolumes)

```json
{
  "%LAST_UPDATE%": 1768685824,
  "%LAST_UPDATE_F%": "17 January 2026 21:37:04 (UTC)",
  "3rd age amulet": 36,
  "Abyssal whip": 18098,
  "Accumulation charm": 0,
  "Coins": 0
}
```

- Keys: Item names (strings) - need normalization for matching
- Values: Daily trade volume (integers)
- Metadata fields: `%LAST_UPDATE%`, `%LAST_UPDATE_F%` (skip these)
- Missing items or 0 values: Treat as 0 volume

### Name Normalization Strategy

To match volume data (keyed by name) to database items:
1. Add `normalized_name` column to items table
2. Normalize = `LOWER(TRIM(name))`
3. Populate during item sync from WikiMapping
4. Use normalized name as lookup key for volume matching
5. Log mismatches at DEBUG level (not ERROR)

### Database Schema Changes

```sql
-- Migration: 005_add_daily_volume.sql
ALTER TABLE items 
ADD COLUMN IF NOT EXISTS daily_volume BIGINT NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS normalized_name VARCHAR(255);

CREATE INDEX IF NOT EXISTS idx_items_daily_volume ON items(daily_volume);
CREATE INDEX IF NOT EXISTS idx_items_normalized_name ON items(normalized_name);

UPDATE items SET normalized_name = LOWER(TRIM(name)) WHERE normalized_name IS NULL;
```

**Indexes:**
- `idx_items_daily_volume`: For sorting table by volume
- `idx_items_normalized_name`: For future case-insensitive search queries

### API Payload Optimization

**Exclude from JSON responses:**
- `id` (database primary key) - frontend only needs `itemId`
- `createdAt` - not useful for frontend
- `normalized_name` - internal matching field only
- `deletedAt` - already excluded via soft delete

**Keep in JSON responses:**
- `itemId` - OSRS item ID (primary identifier)
- `updatedAt` - useful for tracking freshness
- All other existing fields (name, iconUrl, members, etc.)
- `dailyVolume` - new field

### Configuration

Add to `backend/internal/config/config.go`:
```go
type Config struct {
    // ... existing fields
    WikiDataBaseURL string
}
```

Environment variable:
```bash
WIKI_DATA_BASE_URL=https://oldschool.runescape.wiki
```

### Cron Schedule

- **Volume sync**: Every 10 minutes (`0 */10 * * * *`)
- **Initial sync**: After startup item sync completes
- **Timeout**: 10 minutes per job

### Frontend Formatting

**SI Unit Formatting Rules:**
- `< 1,000`: Show raw number ("0", "459", "892")
- `>= 1,000 and < 1,000,000`: Show "X.XK" ("51.9K", "999.9K")
- `>= 1,000,000`: Show "X.XM" ("22.5M", "1.2M")
- One decimal place for readability

### Cache Strategy

- Price caches and item/volume data are **independent**
- No need to invalidate price cache when volumes update
- Volume updates don't affect price data integrity

---

## Implementation Tasks

### Phase 1: Backend Database & Models (1-2 hours)

#### Task 1.1: Create Database Migration
**File:** `backend/migrations/005_add_daily_volume.sql`

```sql
-- Add daily volume and normalized name columns to items table
-- Migration: 005_add_daily_volume.sql

ALTER TABLE items 
ADD COLUMN IF NOT EXISTS daily_volume BIGINT NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS normalized_name VARCHAR(255);

-- Create indexes for sorting and searching
CREATE INDEX IF NOT EXISTS idx_items_daily_volume ON items(daily_volume);
CREATE INDEX IF NOT EXISTS idx_items_normalized_name ON items(normalized_name);

-- Populate normalized_name for existing items
UPDATE items SET normalized_name = LOWER(TRIM(name)) WHERE normalized_name IS NULL;

COMMENT ON COLUMN items.daily_volume IS 'Daily trade volume from OSRS Wiki';
COMMENT ON COLUMN items.normalized_name IS 'Lowercase trimmed name for volume matching';
```

**Verification:**
- Run migration locally
- Check indexes created with `\d items`
- Verify existing items have normalized_name populated

---

#### Task 1.2: Update Item Model
**File:** `backend/internal/models/item.go`

**Changes:**
1. Add `DailyVolume int64` field with GORM tags
2. Add `NormalizedName string` field (excluded from JSON)
3. Update `ID` field to exclude from JSON (`json:"-"`)
4. Update `CreatedAt` field to exclude from JSON (`json:"-"`)
5. Keep `UpdatedAt` in JSON response

**Updated struct:**
```go
type Item struct {
    // Identifiers (ID excluded from API, only itemId exposed)
    ID        uint           `gorm:"primaryKey" json:"-"`
    ItemID    int            `gorm:"uniqueIndex;not null" json:"itemId" validate:"required"`
    
    // Core fields
    Name           string         `gorm:"size:255;not null;index" json:"name" validate:"required"`
    NormalizedName string         `gorm:"size:255;index" json:"-"` // Internal matching field
    IconURL        string         `gorm:"type:text" json:"iconUrl"`
    Members        bool           `gorm:"default:false" json:"members"`
    
    // Optional metadata
    BuyLimit   *int           `gorm:"type:integer" json:"buyLimit"`
    HighAlch   *int           `gorm:"type:integer" json:"highAlch"`
    LowAlch    *int           `gorm:"type:integer" json:"lowAlch"`
    Examine    *string        `gorm:"type:text" json:"examine,omitempty"`
    Value      *int           `gorm:"type:integer" json:"value,omitempty"`
    IconName   *string        `gorm:"type:text" json:"iconName,omitempty"`
    
    // Volume data
    DailyVolume int64         `gorm:"type:bigint;not null;default:0" json:"dailyVolume"`
    
    // Timestamps (CreatedAt excluded from API)
    CreatedAt time.Time      `json:"-"`
    UpdatedAt time.Time      `json:"updatedAt"`
    DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`
}
```

**Testing:**
- Verify JSON serialization excludes `id`, `createdAt`, `normalizedName`
- Verify `dailyVolume` defaults to 0 for new items

---

### Phase 2: Backend Configuration (30 min)

#### Task 2.1: Add Wiki Data Base URL to Config
**File:** `backend/internal/config/config.go`

**Changes:**
1. Add `WikiDataBaseURL string` field to `Config` struct
2. Set default value
3. Load from environment variable
4. Pass to services that need it

**Config struct update:**
```go
type Config struct {
    // ... existing fields
    WikiPricesBaseURL string
    WikiDataBaseURL   string  // New: for GEVolumes endpoint
}
```

**Default and loading:**
```go
viper.SetDefault("WIKI_DATA_BASE_URL", "https://oldschool.runescape.wiki")
// ... in Load() function:
WikiDataBaseURL: viper.GetString("WIKI_DATA_BASE_URL"),
```

---

#### Task 2.2: Update Environment Files
**Files:** `.env.example`, `.env`

Add line:
```bash
WIKI_DATA_BASE_URL=https://oldschool.runescape.wiki
```

---

### Phase 3: Backend API Client (1-2 hours)

#### Task 3.1: Extend Wiki Prices Client Interface
**File:** `backend/internal/services/wiki_prices_client.go`

**Changes:**
1. Add `FetchDailyVolumes(ctx context.Context) (map[string]int64, error)` to `WikiPricesClient` interface
2. Update `wikiPricesClient` struct to accept wiki data base URL
3. Update constructor to accept both base URLs
4. Implement `FetchDailyVolumes` method

**Interface update:**
```go
type WikiPricesClient interface {
    FetchMapping(ctx context.Context) ([]WikiMappingItem, error)
    FetchLatestAll(ctx context.Context) (map[int]WikiLatestItem, error)
    FetchLatest(ctx context.Context, itemIDs []int) (map[int]WikiLatestItem, error)
    FetchTimeseries(ctx context.Context, itemID int, timestep string) ([]WikiTimeseriesPoint, error)
    FetchDailyVolumes(ctx context.Context) (map[string]int64, error) // New method
}
```

**Constructor signature update:**
```go
func NewWikiPricesClient(logger *zap.SugaredLogger, pricesBaseURL string, dataBaseURL string) WikiPricesClient
```

**Struct update:**
```go
type wikiPricesClient struct {
    client        *resty.Client
    logger        *zap.SugaredLogger
    pricesBaseURL string // For /latest, /mapping, /timeseries
    dataBaseURL   string // For /w/Module:GEVolumes/data.json
}
```

**Implementation:**
```go
func (c *wikiPricesClient) FetchDailyVolumes(ctx context.Context) (map[string]int64, error) {
    url := c.dataBaseURL + "/w/Module:GEVolumes/data.json?action=raw"
    c.logger.Infow("Fetching daily volumes", "url", url)

    resp, err := c.client.R().SetContext(ctx).Get(url)
    if err != nil {
        c.logger.Errorw("Failed to fetch daily volumes", "error", err)
        return nil, fmt.Errorf("fetch daily volumes: %w", err)
    }
    if resp.StatusCode() != 200 {
        c.logger.Errorw("Daily volumes request failed", 
            "statusCode", resp.StatusCode(), 
            "body", string(resp.Body()))
        return nil, fmt.Errorf("daily volumes request failed with status %d", resp.StatusCode())
    }

    // Parse JSON as map[string]interface{} first to filter metadata
    var rawData map[string]interface{}
    if err := json.Unmarshal(resp.Body(), &rawData); err != nil {
        c.logger.Errorw("Failed to parse daily volumes response", "error", err)
        return nil, fmt.Errorf("parse daily volumes response: %w", err)
    }

    // Build normalized name -> volume map, skip metadata fields
    volumeMap := make(map[string]int64, len(rawData))
    for key, value := range rawData {
        // Skip metadata fields
        if strings.HasPrefix(key, "%") {
            continue
        }
        
        // Normalize item name (lowercase + trim)
        normalizedKey := strings.ToLower(strings.TrimSpace(key))
        
        // Convert volume to int64 (JSON numbers come as float64)
        var volume int64
        switch v := value.(type) {
        case float64:
            volume = int64(v)
        case int64:
            volume = v
        case int:
            volume = int64(v)
        default:
            c.logger.Debugw("Unexpected volume type", "key", key, "type", fmt.Sprintf("%T", value))
            volume = 0
        }
        
        volumeMap[normalizedKey] = volume
    }

    c.logger.Infow("Successfully fetched daily volumes", "volumeCount", len(volumeMap))
    return volumeMap, nil
}
```

**Testing:**
- Unit test for metadata filtering
- Unit test for name normalization
- Unit test for type conversion
- Integration test with real API (optional, use mocks)

---

### Phase 4: Backend Service Layer (1-2 hours)

#### Task 4.1: Add Name Normalization Helper
**File:** `backend/internal/services/item_service.go`

Add helper function at package level:
```go
// normalizeItemName returns a lowercase, trimmed version of the item name
// for case-insensitive matching with volume data.
func normalizeItemName(name string) string {
    return strings.ToLower(strings.TrimSpace(name))
}
```

---

#### Task 4.2: Update Item Service Constructor
**File:** `backend/internal/services/item_service.go`

**Changes:**
1. Add `wikiDataBaseURL string` parameter to `NewItemService`
2. Pass both base URLs to `NewWikiPricesClient`

**Updated constructor:**
```go
func NewItemService(
    itemRepo repository.ItemRepository,
    cache CacheService,
    wikiPricesBaseURL string,
    wikiDataBaseURL string,
    logger *zap.SugaredLogger,
) ItemService {
    return &itemService{
        itemRepo:   itemRepo,
        wikiClient: NewWikiPricesClient(logger, wikiPricesBaseURL, wikiDataBaseURL),
        cache:      cache,
        logger:     logger,
    }
}
```

---

#### Task 4.3: Update SyncItemsFromMapping
**File:** `backend/internal/services/item_service.go`

**Changes:**
- Populate `NormalizedName` field when creating items

**Update in the loop where items are built:**
```go
items = append(items, models.Item{
    ItemID:         m.ID,
    Name:           name,
    NormalizedName: normalizeItemName(name), // New field
    IconURL:        normalizeItemIconURL(m.ID, m.Icon),
    Members:        m.Members,
    BuyLimit:       buyLimit,
    LowAlch:        lowAlch,
    HighAlch:       highAlch,
    Examine:        examine,
    Value:          value,
    IconName:       iconName,
})
```

---

#### Task 4.4: Implement SyncDailyVolumes Method
**File:** `backend/internal/services/item_service.go`

Add new method to `ItemService` interface (in `interfaces.go` or at top of service file):
```go
type ItemService interface {
    // ... existing methods
    SyncDailyVolumes(ctx context.Context) error
}
```

**Implementation:**
```go
// SyncDailyVolumes fetches daily trade volume data from OSRS Wiki and updates items.
func (s *itemService) SyncDailyVolumes(ctx context.Context) error {
    s.logger.Info("Starting daily volumes sync from OSRS Wiki")
    startTime := time.Now()

    // Step 1: Fetch volume data (map of normalized name -> volume)
    volumeMap, err := s.wikiClient.FetchDailyVolumes(ctx)
    if err != nil {
        return fmt.Errorf("fetch daily volumes: %w", err)
    }

    s.logger.Infow("Fetched volume data", "volumeCount", len(volumeMap))

    // Step 2: Fetch all items from database
    items, _, err := s.itemRepo.GetAll(ctx, models.ItemListParams{
        Limit:  999999, // Get all items
        Offset: 0,
    })
    if err != nil {
        return fmt.Errorf("fetch items from database: %w", err)
    }

    s.logger.Infow("Fetched items from database", "itemCount", len(items))

    // Step 3: Match items to volumes and build update list
    itemsToUpdate := make([]models.Item, 0, len(items))
    matched := 0
    mismatched := 0

    for _, item := range items {
        // Lookup volume by normalized name
        volume, found := volumeMap[item.NormalizedName]
        if !found {
            // Item not in volume data, default to 0
            volume = 0
            mismatched++
            s.logger.Debugw("Item not found in volume data",
                "itemId", item.ItemID,
                "name", item.Name,
                "normalizedName", item.NormalizedName,
            )
        } else {
            matched++
        }

        // Build update item (only need ItemID and DailyVolume for upsert)
        itemsToUpdate = append(itemsToUpdate, models.Item{
            ItemID:      item.ItemID,
            DailyVolume: volume,
        })
    }

    // Step 4: Bulk upsert volumes
    if err := s.itemRepo.BulkUpsert(ctx, itemsToUpdate); err != nil {
        return fmt.Errorf("bulk upsert daily volumes: %w", err)
    }

    duration := time.Since(startTime)
    s.logger.Infow("Successfully synced daily volumes",
        "duration_ms", duration.Milliseconds(),
        "totalItems", len(items),
        "matched", matched,
        "mismatched", mismatched,
    )

    return nil
}
```

**Note:** We intentionally do NOT invalidate item cache here since price and volume caches are independent.

---

### Phase 5: Backend Repository Layer (30 min)

#### Task 5.1: Update BulkUpsert to Include New Columns
**File:** `backend/internal/repository/item_repository.go`

**Changes:**
- Add `"daily_volume"` and `"normalized_name"` to `DoUpdates` clause

**Find the BulkUpsert method and update:**
```go
func (r *itemRepository) BulkUpsert(ctx context.Context, items []models.Item) error {
    if len(items) == 0 {
        return nil
    }

    if err := r.dbClient.WithContext(ctx).Clauses(clause.OnConflict{
        Columns: []clause.Column{{Name: "item_id"}},
        DoUpdates: clause.AssignmentColumns([]string{
            "name",
            "normalized_name", // New column
            "icon_url",
            "members",
            "buy_limit",
            "high_alch",
            "low_alch",
            "examine",
            "value",
            "icon_name",
            "daily_volume",    // New column
            "updated_at",
        }),
    }).Create(&items).Error; err != nil {
        r.logger.Errorw("Failed to bulk upsert items", "count", len(items), "error", err)
        return fmt.Errorf("failed to bulk upsert items: %w", err)
    }

    r.logger.Infow("Successfully bulk upserted items", "count", len(items))
    return nil
}
```

---

### Phase 6: Backend Scheduler (1 hour)

#### Task 6.1: Add Volume Sync Job Method
**File:** `backend/internal/scheduler/jobs.go`

**Add method to Scheduler:**
```go
// syncDailyVolumesJob fetches and updates daily trade volumes from OSRS Wiki.
func (s *Scheduler) syncDailyVolumesJob() {
    s.logger.Info("Starting daily volumes sync job")
    start := time.Now()

    // 10-minute timeout for volume sync
    ctx, cancel := context.WithTimeout(context.Background(), 10*time.Minute)
    defer cancel()

    err := s.itemService.SyncDailyVolumes(ctx)
    if err != nil {
        s.logger.Errorf("Daily volumes sync failed: %v", err)
        return
    }

    duration := time.Since(start)
    s.logger.Infow("Daily volumes sync completed", "duration_ms", duration.Milliseconds())
}
```

---

#### Task 6.2: Register Volume Sync Cron Job
**File:** `backend/internal/scheduler/jobs.go`

**In the `Start()` method, add cron registration:**
```go
func (s *Scheduler) Start() {
    // ... existing job registrations

    // Sync daily volumes every 10 minutes
    _, err = s.cron.AddFunc("0 */10 * * * *", s.syncDailyVolumesJob)
    if err != nil {
        s.logger.Fatalf("Failed to schedule daily volumes sync job: %v", err)
    }

    // ... rest of Start() method
}
```

---

#### Task 6.3: Update Initial Sync to Include Volumes
**File:** `backend/internal/scheduler/jobs.go`

**Modify `initialItemsSyncJob()` to sync volumes after items:**
```go
func (s *Scheduler) initialItemsSyncJob() {
    if s.itemsSynced.Load() {
        s.logger.Info("Items already synced, skipping initial sync")
        return
    }

    s.logger.Info("Starting initial items sync")
    start := time.Now()

    ctx, cancel := context.WithTimeout(context.Background(), 10*time.Minute)
    defer cancel()

    // Step 1: Sync items from WikiMapping
    err := s.itemService.SyncItemsFromMapping(ctx)
    if err != nil {
        s.logger.Errorf("Initial items sync failed: %v", err)
        return
    }

    // Step 2: Sync daily volumes (depends on items existing)
    err = s.itemService.SyncDailyVolumes(ctx)
    if err != nil {
        s.logger.Errorf("Initial volumes sync failed: %v", err)
        // Don't return - items are synced, volumes can be retried later
    }

    // Mark items as synced (allows price sync to proceed)
    s.itemsSynced.Store(true)

    duration := time.Since(start)
    s.logger.Infow("Initial items and volumes sync completed", "duration_ms", duration.Milliseconds())
}
```

---

### Phase 7: Backend Main.go Update (15 min)

#### Task 7.1: Pass Wiki Data URL to Item Service
**File:** `backend/cmd/api/main.go`

**Update ItemService initialization:**
```go
// Services
cacheService := services.NewCacheService(redisClient, logger)

itemService := services.NewItemService(
    itemRepo,
    cacheService,
    cfg.WikiPricesBaseURL,
    cfg.WikiDataBaseURL, // New parameter
    logger,
)
```

---

### Phase 8: Frontend Types (15 min)

#### Task 8.1: Update Item Type Definition
**File:** `frontend/src/types/item.ts`

**Update interface:**
```typescript
export interface Item {
  // Remove 'id' if it exists - only use itemId
  itemId: number;          // OSRS item ID
  name: string;
  iconUrl: string;
  members: boolean;
  
  // Optional metadata
  buyLimit?: number;
  highAlch?: number;
  lowAlch?: number;
  examine?: string;
  value?: number;
  iconName?: string;
  
  // New: Daily trade volume
  dailyVolume: number;     // Always present (0 or positive integer)
  
  // Timestamps (createdAt removed, updatedAt kept)
  updatedAt: string;
}
```

**Verify removals:**
- `id` field (database primary key) - should not exist
- `createdAt` field - should not exist
- Keep `updatedAt` for freshness tracking

---

### Phase 9: Frontend Utilities (30 min)

#### Task 9.1: Add Volume Formatting Function
**File:** `frontend/src/utils/formatters.ts` (create if doesn't exist)

**Add function:**
```typescript
/**
 * Formats a trade volume number with SI unit suffixes.
 * 
 * Examples:
 * - 0 → "0"
 * - 459 → "459"
 * - 51,900 → "51.9K"
 * - 22,500,000 → "22.5M"
 * 
 * @param volume - The trade volume number to format
 * @returns Formatted string with SI suffix (K, M) or raw number
 */
export function formatVolume(volume: number): string {
  if (volume === 0) {
    return '0';
  }
  
  if (volume < 1000) {
    return volume.toString();
  }
  
  if (volume < 1000000) {
    const thousands = volume / 1000;
    return `${thousands.toFixed(1)}K`;
  }
  
  const millions = volume / 1000000;
  return `${millions.toFixed(1)}M`;
}
```

**Testing:**
```typescript
// Test cases to validate
formatVolume(0);         // "0"
formatVolume(459);       // "459"
formatVolume(999);       // "999"
formatVolume(1000);      // "1.0K"
formatVolume(51900);     // "51.9K"
formatVolume(999900);    // "999.9K"
formatVolume(1000000);   // "1.0M"
formatVolume(22500000);  // "22.5M"
formatVolume(59105000);  // "59.1M"
```

---

### Phase 10: Frontend Data Fetching (30 min)

#### Task 10.1: Update Item Query Configuration
**File:** `frontend/src/hooks/useItems.ts` (or wherever TanStack Query is configured)

**Update query options to refetch every 10 minutes:**
```typescript
export function useItems(params?: ItemQueryParams) {
  return useQuery({
    queryKey: ['items', params],
    queryFn: () => fetchItems(params),
    staleTime: 10 * 60 * 1000,      // 10 minutes - data considered fresh
    refetchInterval: 10 * 60 * 1000, // Auto-refetch every 10 minutes
    // ... other options
  });
}
```

**Apply to all relevant item queries:**
- List items query
- Search items query  
- Single item query (if applicable)

**Note:** This ensures volumes stay current without manual refresh

---

### Phase 11: Frontend Table Component (1 hour)

#### Task 11.1: Add Daily Volume Column to Table
**File:** `frontend/src/components/table/ItemsTable.tsx` (or main table component)

**Add column definition using TanStack Table:**
```typescript
import { formatVolume } from '@/utils/formatters';

// In column definitions array:
{
  id: 'dailyVolume',
  accessorKey: 'dailyVolume',
  header: 'Daily Volume',
  cell: (info) => formatVolume(info.getValue<number>()),
  enableSorting: true,
  sortingFn: 'basic', // Numeric sort
  meta: {
    align: 'right', // Right-align numbers
  },
}
```

**Column positioning:**
- Place after "Name" or "Price" column for visibility
- Should be visible by default (not hidden initially)

**Styling considerations:**
- Right-align volume values (common for numeric data)
- Consider adding a tooltip explaining "daily trade volume"
- Use monospace or tabular numbers for alignment

---

## Testing Plan

### Backend Unit Tests

1. **Name Normalization Tests** (`item_service_test.go`)
   - Test `normalizeItemName()` with various inputs
   - Edge cases: empty string, special chars, unicode

2. **Volume Fetch Tests** (`wiki_prices_client_test.go`)
   - Mock API response parsing
   - Metadata field filtering
   - Type conversion edge cases

3. **Volume Sync Tests** (`item_service_test.go`)
   - Test matching logic
   - Test mismatch logging
   - Test zero volume handling

4. **Repository Tests** (`item_repository_test.go`)
   - Verify BulkUpsert includes new columns
   - Test conflict resolution with volumes

### Backend Integration Tests

1. **Migration Test**
   - Run migration on test database
   - Verify columns and indexes created
   - Verify existing data normalized

2. **Full Sync Flow Test**
   - Mock wiki API responses
   - Test end-to-end: fetch → match → upsert
   - Verify database state after sync

### Frontend Unit Tests

1. **Formatter Tests** (`formatters.test.ts`)
   - Test all volume ranges (0, <1K, <1M, >=1M)
   - Edge cases: very large numbers, negative (shouldn't happen)

2. **Type Safety Tests**
   - Verify Item interface matches backend response
   - Test that `dailyVolume` is always present (not optional)

### Frontend E2E Tests (Playwright)

1. **Volume Display Test**
   - Navigate to items table
   - Verify "Daily Volume" column exists
   - Verify values are formatted correctly
   - Verify column is sortable

2. **Auto-Refresh Test**
   - Load page, note initial volumes
   - Wait 10+ minutes
   - Verify query refetches without manual refresh

---

## Deployment Steps

### Pre-Deployment

1. **Code Review**
   - Review all backend changes
   - Review all frontend changes
   - Verify coding standards followed

2. **Testing**
   - Run all backend unit tests: `cd backend && go test ./...`
   - Run all backend integration tests
   - Run frontend unit tests: `cd frontend && npm run test`
   - Run E2E tests: `npm run test:e2e`

3. **Database Backup**
   - Backup production database before migration
   - Test migration on staging database first

### Deployment Sequence

1. **Backend Deployment**
   - Deploy backend with new code (includes migration runner)
   - Migration runs automatically on startup
   - Verify migration success in logs
   - Verify initial volume sync completes

2. **Frontend Deployment**
   - Deploy frontend with new types and components
   - Clear CDN cache if using one
   - Verify API responses include `dailyVolume` field

3. **Monitoring**
   - Watch scheduler logs for volume sync jobs
   - Monitor error rates for volume fetch failures
   - Check database for volume data population
   - Verify frontend displays volumes correctly

### Rollback Plan

If issues arise:
1. **Backend rollback**: Revert to previous backend version
   - Old code will ignore new columns (graceful degradation)
   - Data persists in database for retry

2. **Frontend rollback**: Revert to previous frontend version
   - Old frontend won't display volume column
   - No breaking changes to existing API

3. **Database rollback**: (Last resort, avoid if possible)
   - Manually drop new columns if needed
   - No data loss for existing functionality

---

## Success Criteria

### Backend
- ✅ Migration creates `daily_volume` and `normalized_name` columns
- ✅ Volume sync job runs every 10 minutes without errors
- ✅ Initial sync populates volumes for all items on startup
- ✅ Items with no volume data show 0 (not null)
- ✅ API responses exclude `id`, `createdAt`, `normalizedName`
- ✅ API responses include `dailyVolume` for all items
- ✅ Debug logs show mismatch counts but not errors
- ✅ Performance: volume sync completes in <30 seconds

### Frontend
- ✅ "Daily Volume" column visible by default in items table
- ✅ Volumes formatted with SI units (K, M)
- ✅ Column is sortable (numeric sort)
- ✅ Data auto-refreshes every 10 minutes
- ✅ No console errors related to item type mismatches
- ✅ Performance: table renders smoothly with new column

### Data Quality
- ✅ >95% of items match between database and volume API
- ✅ High-volume items (e.g., "Abyssal whip") show realistic volumes
- ✅ Rare items show low or zero volumes
- ✅ Volumes update every 10 minutes with fresh data

---

## Known Limitations & Future Enhancements

### Current Limitations
1. **Name matching accuracy**: Relies on exact name match after normalization
   - Items with special characters may mismatch
   - Wiki may use different naming conventions

2. **No historical volume tracking**: Only stores latest daily volume
   - Cannot show volume trends over time

3. **10-minute refresh interval**: Not real-time
   - Wiki API updates more frequently (~5 minutes)
   - Could reduce to 5-minute interval if needed

### Future Enhancements
1. **Volume History Table** (separate feature)
   - Store daily volume snapshots over time
   - Enable volume trend charts

2. **Volume Alerts** (separate feature)
   - Notify when item volume spikes
   - Useful for flipping/merching strategies

3. **Advanced Name Matching** (if needed)
   - Fuzzy matching for mismatches
   - Manual name override mapping table

4. **Volume Percentile Indicators** (UX enhancement)
   - Show if volume is "high", "medium", "low" relative to item category
   - Color-code volume values

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Name mismatch causes missing volumes | Medium | Low | Debug logging to identify mismatches; fallback to 0 is safe |
| Wiki API rate limiting | Low | Medium | Built-in retry logic with exponential backoff |
| Migration fails on production | Low | High | Test on staging first; migration is idempotent (IF NOT EXISTS) |
| Large volume data slows queries | Low | Low | Indexed column; volumes are simple integers |
| Frontend type errors from API changes | Low | Medium | TypeScript compile checks; backend tests verify JSON structure |

---

## Timeline Estimate

| Phase | Estimated Time | Priority |
|-------|---------------|----------|
| Phase 1: Database & Models | 1-2 hours | High |
| Phase 2: Configuration | 30 min | High |
| Phase 3: API Client | 1-2 hours | High |
| Phase 4: Service Layer | 1-2 hours | High |
| Phase 5: Repository | 30 min | High |
| Phase 6: Scheduler | 1 hour | High |
| Phase 7: Main.go | 15 min | High |
| Phase 8: Frontend Types | 15 min | High |
| Phase 9: Frontend Utils | 30 min | Medium |
| Phase 10: Data Fetching | 30 min | Medium |
| Phase 11: Table Component | 1 hour | Medium |
| Testing | 2 hours | High |
| Documentation | 30 min | Low |
| **Total** | **6-8 hours** | |

---

## Appendix

### Environment Variables Summary
```bash
# Backend .env additions
WIKI_DATA_BASE_URL=https://oldschool.runescape.wiki
```

### API Endpoint Reference
- **GEVolumes**: `https://oldschool.runescape.wiki/w/Module:GEVolumes/data.json?action=raw`
- **Rate Limit**: No official limit documented; respectful polling (10 min) is safe
- **Format**: JSON object with item names as keys, volumes as integer values

### Database Column Reference
| Column | Type | Nullable | Default | Index | Purpose |
|--------|------|----------|---------|-------|---------|
| `daily_volume` | BIGINT | No | 0 | Yes | Store daily trade volume |
| `normalized_name` | VARCHAR(255) | Yes | NULL | Yes | Lowercase trimmed name for matching |

### Code Style Notes
- Follow existing Go patterns (see `backend/CODING_STANDARDS.md`)
- Use descriptive config param names: `wikiDataBaseURL` not `url`
- Client suffix for connections: `wikiClient` not `wiki`
- Log errors with context using zap structured logging
- Frontend uses camelCase (TypeScript convention)

---

**Document Version:** 1.0  
**Created:** January 17, 2026  
**Last Updated:** January 17, 2026
