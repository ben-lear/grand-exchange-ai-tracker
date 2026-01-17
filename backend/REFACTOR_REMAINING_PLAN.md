# Remaining Complexity Refactors - Implementation Plan

**Date:** January 16, 2026  
**Status:** Ready for Implementation  
**Related Documents:**
- [REFACTOR_BACKLOG.md](REFACTOR_BACKLOG.md) - Detailed analysis
- [REFACTOR_INSERT_TIMESERIES.md](REFACTOR_INSERT_TIMESERIES.md) - Completed refactor
- [REFACTOR_PROGRESS_REPORT.md](REFACTOR_PROGRESS_REPORT.md) - InsertTimeseriesPoints results

---

## Overview

This document provides a complete, step-by-step implementation plan for the 3 remaining complexity violations in the codebase:

1. **GetPriceHistory** (CRITICAL) - Extract helper functions to reduce complexity from 61 to ~15
2. **SSEHandler.Stream** (LOW) - Update nolint comment with better documentation
3. **SharedPostgres** (LOW) - Add nolint directive with justification

**Total Estimated Time:** 5-7 hours

---

## Priority Order

The refactors are ordered by business impact and effort:

| Order | Function | Priority | Effort | Rationale |
|-------|----------|----------|--------|-----------|
| 1 | GetPriceHistory | 🔴 CRITICAL | 4-6 hours | Core business logic, 205% over limit |
| 2 | SSEHandler.Stream | 🟢 LOW | 5 minutes | Documentation only, 5% over limit |
| 3 | SharedPostgres | 🟡 MEDIUM | 5 minutes | Test code documentation, 20% over limit |

---

## Refactor 1: GetPriceHistory (CRITICAL)

### Objective

Extract complex business logic into focused, testable helper functions to reduce cognitive complexity from 61 to ~15.

### Target Metrics

| Metric | Current | Target | Improvement |
|--------|---------|--------|-------------|
| Cognitive Complexity | 61 | ~15 | -75% |
| Cyclomatic Complexity | 34 | ~8 | -76% |
| Lines of Code | 166 | ~40 | -76% |
| Duplicate Lines | ~80 | 0 | -100% |
| Testability | Low | High | +++ |

### Implementation Plan

---

#### Phase 1: Extract Transformation Functions

**Goal:** Eliminate the 80-line duplication between daily and timeseries branches

##### Task 1.1: Create transformDailyPoints Helper

**File:** `internal/services/price_service.go`  
**Location:** Add before `GetPriceHistory` (around line 90)

**Implementation:**
```go
// transformDailyPoints converts daily aggregate points to response format,
// filtering out entries where both prices are NULL.
func (s *priceService) transformDailyPoints(points []models.PriceTimeseriesDaily) []models.PricePoint {
	result := make([]models.PricePoint, 0, len(points))
	
	for _, p := range points {
		// Skip if both prices are NULL
		if p.AvgHighPrice == nil && p.AvgLowPrice == nil {
			continue
		}
		
		// Convert day (date) to timestamp
		ts := time.Date(p.Day.Year(), p.Day.Month(), p.Day.Day(), 0, 0, 0, 0, time.UTC)
		
		result = append(result, models.PricePoint{
			Timestamp:       ts,
			AvgHighPrice:    p.AvgHighPrice,
			AvgLowPrice:     p.AvgLowPrice,
			HighPriceVolume: p.HighPriceVolume,
			LowPriceVolume:  p.LowPriceVolume,
		})
	}
	
	return result
}
```

**Checklist:**
- [ ] Add function before `GetPriceHistory`
- [ ] Add comprehensive godoc comment
- [ ] Implement NULL filtering logic
- [ ] Implement date-to-timestamp conversion
- [ ] Return transformed slice

---

##### Task 1.2: Create transformTimeseriesPoints Helper

**File:** `internal/services/price_service.go`  
**Location:** Add after `transformDailyPoints`

**Implementation:**
```go
// transformTimeseriesPoints converts timeseries points to response format,
// filtering out entries where both prices are NULL.
func (s *priceService) transformTimeseriesPoints(points []models.PriceTimeseriesPoint) []models.PricePoint {
	result := make([]models.PricePoint, 0, len(points))
	
	for _, p := range points {
		// Skip if both prices are NULL
		if p.AvgHighPrice == nil && p.AvgLowPrice == nil {
			continue
		}
		
		result = append(result, models.PricePoint{
			Timestamp:       p.Timestamp,
			AvgHighPrice:    p.AvgHighPrice,
			AvgLowPrice:     p.AvgLowPrice,
			HighPriceVolume: p.HighPriceVolume,
			LowPriceVolume:  p.LowPriceVolume,
		})
	}
	
	return result
}
```

**Checklist:**
- [ ] Add function after `transformDailyPoints`
- [ ] Add godoc comment
- [ ] Implement NULL filtering (identical logic)
- [ ] Use timestamp directly (no conversion needed)
- [ ] Return transformed slice

---

##### Task 1.3: Unit Test Transformation Functions

**File:** `tests/unit/price_service_transform_test.go` (new file)

**Test Cases:**
```go
func TestPriceService_transformDailyPoints(t *testing.T) {
	tests := []struct {
		name     string
		input    []models.PriceTimeseriesDaily
		expected int // Expected length after filtering
	}{
		{
			name: "filters out NULL prices",
			input: []models.PriceTimeseriesDaily{
				{AvgHighPrice: ptr(100), AvgLowPrice: ptr(90)}, // Keep
				{AvgHighPrice: nil, AvgLowPrice: nil},          // Filter
				{AvgHighPrice: ptr(110), AvgLowPrice: nil},     // Keep
			},
			expected: 2,
		},
		{
			name:     "empty input returns empty",
			input:    []models.PriceTimeseriesDaily{},
			expected: 0,
		},
		{
			name: "all NULL filtered out",
			input: []models.PriceTimeseriesDaily{
				{AvgHighPrice: nil, AvgLowPrice: nil},
				{AvgHighPrice: nil, AvgLowPrice: nil},
			},
			expected: 0,
		},
	}
	
	// Run tests...
}

func TestPriceService_transformTimeseriesPoints(t *testing.T) {
	// Similar structure for timeseries
}
```

**Checklist:**
- [ ] Create new test file
- [ ] Test NULL filtering logic
- [ ] Test empty input
- [ ] Test all-NULL scenario
- [ ] Test date conversion (daily)
- [ ] Verify volume fields preserved
- [ ] Run tests: `go test -v -run TestPriceService_transform`

---

#### Phase 2: Extract Date Range Calculation

**Goal:** Simplify date tracking logic

##### Task 2.1: Create calculateDateRange Helper

**File:** `internal/services/price_service.go`  
**Location:** Add after transformation functions

**Implementation:**
```go
// calculateDateRange determines the first and last dates in a dataset.
// Returns nil pointers if data is empty.
func (s *priceService) calculateDateRange(data []models.PricePoint) (*time.Time, *time.Time) {
	if len(data) == 0 {
		return nil, nil
	}
	
	var firstDate, lastDate *time.Time
	
	for i := range data {
		ts := data[i].Timestamp
		
		if firstDate == nil || ts.Before(*firstDate) {
			firstDate = &ts
		}
		
		if lastDate == nil || ts.After(*lastDate) {
			lastDate = &ts
		}
	}
	
	return firstDate, lastDate
}
```

**Checklist:**
- [ ] Add function after transformation helpers
- [ ] Add godoc comment
- [ ] Handle empty slice (return nil, nil)
- [ ] Track first date (earliest)
- [ ] Track last date (latest)
- [ ] Return both pointers

---

##### Task 2.2: Test Date Range Calculation

**File:** `tests/unit/price_service_transform_test.go`

**Test Cases:**
```go
func TestPriceService_calculateDateRange(t *testing.T) {
	t.Run("empty data returns nil", func(t *testing.T) {
		// Test empty slice
	})
	
	t.Run("single point", func(t *testing.T) {
		// First and last should be same
	})
	
	t.Run("multiple points in order", func(t *testing.T) {
		// Verify correct first/last
	})
	
	t.Run("multiple points out of order", func(t *testing.T) {
		// Verify still finds correct first/last
	})
}
```

**Checklist:**
- [ ] Test empty data
- [ ] Test single data point
- [ ] Test ordered data
- [ ] Test unordered data
- [ ] Verify pointer handling
- [ ] Run tests

---

#### Phase 3: Extract Cache Operations

**Goal:** Separate cache concerns from main business logic

##### Task 3.1: Create getCachedHistory Helper

**File:** `internal/services/price_service.go`  
**Location:** Add after date range helper

**Implementation:**
```go
// getCachedHistory attempts to retrieve cached price history for an item and period.
// Returns nil if cache miss or error (errors are logged but not returned).
func (s *priceService) getCachedHistory(itemID int, period models.TimePeriod) *models.PriceHistoryResponse {
	cacheKey := fmt.Sprintf("price:history:%d:%s", itemID, period)
	
	var cached models.PriceHistoryResponse
	err := s.cacheService.Get(context.Background(), cacheKey, &cached)
	if err != nil {
		// Cache miss is expected, don't treat as error
		if err != services.ErrCacheMiss {
			s.logger.Debugw("cache get error",
				"key", cacheKey,
				"error", err,
			)
		}
		return nil
	}
	
	s.logger.Debugw("cache hit",
		"itemId", itemID,
		"period", period,
	)
	
	return &cached
}
```

**Checklist:**
- [ ] Add function with clear return semantics
- [ ] Generate cache key (match existing format)
- [ ] Call cache service
- [ ] Handle cache miss (return nil, not error)
- [ ] Log cache hits for observability
- [ ] Log unexpected errors at debug level

---

##### Task 3.2: Create setCachedHistory Helper

**File:** `internal/services/price_service.go`  
**Location:** Add after `getCachedHistory`

**Implementation:**
```go
// setCachedHistory stores price history in cache with appropriate TTL.
// Errors are logged but not returned (cache failures shouldn't break requests).
func (s *priceService) setCachedHistory(itemID int, period models.TimePeriod, response *models.PriceHistoryResponse) {
	cacheKey := fmt.Sprintf("price:history:%d:%s", itemID, period)
	
	// Cache for 10 minutes (matches existing TTL)
	ttl := 10 * time.Minute
	
	err := s.cacheService.Set(context.Background(), cacheKey, response, ttl)
	if err != nil {
		s.logger.Warnw("failed to cache price history",
			"itemId", itemID,
			"period", period,
			"error", err,
		)
	}
}
```

**Checklist:**
- [ ] Add function (void return - errors logged only)
- [ ] Generate cache key (consistent with get)
- [ ] Set TTL to 10 minutes
- [ ] Call cache service
- [ ] Log errors at warn level
- [ ] Don't return errors (cache is optimization)

---

##### Task 3.3: Test Cache Operations

**File:** `tests/unit/price_service_cache_test.go` (new file)

**Test Cases:**
```go
func TestPriceService_getCachedHistory(t *testing.T) {
	t.Run("cache hit returns data", func(t *testing.T) {
		// Mock cache service with data
		// Verify returns response
	})
	
	t.Run("cache miss returns nil", func(t *testing.T) {
		// Mock cache service with ErrCacheMiss
		// Verify returns nil (not error)
	})
	
	t.Run("cache error returns nil", func(t *testing.T) {
		// Mock cache service with error
		// Verify returns nil and logs error
	})
}

func TestPriceService_setCachedHistory(t *testing.T) {
	t.Run("successful cache set", func(t *testing.T) {
		// Mock cache service
		// Verify Set called with correct key, TTL
	})
	
	t.Run("cache error logged not returned", func(t *testing.T) {
		// Mock cache service with error
		// Verify error logged, function completes
	})
}
```

**Checklist:**
- [ ] Create test file
- [ ] Test cache hit scenario
- [ ] Test cache miss scenario
- [ ] Test error handling
- [ ] Verify logging behavior
- [ ] Verify TTL passed correctly
- [ ] Run tests

---

#### Phase 4: Extract Data Fetching Logic

**Goal:** Encapsulate repository calls and seeding logic

##### Task 4.1: Create fetchDailyPoints Helper

**File:** `internal/services/price_service.go`  
**Location:** Add after cache functions

**Implementation:**
```go
// fetchDailyPoints retrieves daily aggregates from repository, attempting to seed
// data from Wiki API if the repository returns empty results.
func (s *priceService) fetchDailyPoints(
	ctx context.Context,
	itemID int,
	source dataSource,
) ([]models.PriceTimeseriesDaily, error) {
	// Fetch from repository
	points, err := s.priceRepo.GetDailyAggregates(ctx, itemID, source.start, source.end, source.sampleSize)
	if err != nil {
		return nil, fmt.Errorf("fetch daily aggregates: %w", err)
	}
	
	// If empty, try seeding from Wiki API
	if len(points) == 0 {
		s.logger.Infow("no daily data found, attempting to seed from Wiki API",
			"itemId", itemID,
		)
		
		if err := s.seedHistoricalData(ctx, itemID); err != nil {
			s.logger.Warnw("failed to seed historical data",
				"itemId", itemID,
				"error", err,
			)
			// Don't return error - proceed with empty data
			return points, nil
		}
		
		// Retry fetch after seeding
		points, err = s.priceRepo.GetDailyAggregates(ctx, itemID, source.start, source.end, source.sampleSize)
		if err != nil {
			return nil, fmt.Errorf("fetch after seed: %w", err)
		}
	}
	
	return points, nil
}
```

**Checklist:**
- [ ] Add function with clear parameters
- [ ] Call repository for daily aggregates
- [ ] Handle repository errors
- [ ] Check if results empty
- [ ] Attempt seeding if empty
- [ ] Log seeding attempt
- [ ] Retry fetch after seeding
- [ ] Return points or error

---

##### Task 4.2: Create fetchTimeseriesPoints Helper

**File:** `internal/services/price_service.go`  
**Location:** Add after `fetchDailyPoints`

**Implementation:**
```go
// fetchTimeseriesPoints retrieves timeseries data from repository, attempting to seed
// data from Wiki API if the repository returns empty results.
func (s *priceService) fetchTimeseriesPoints(
	ctx context.Context,
	itemID int,
	source dataSource,
) ([]models.PriceTimeseriesPoint, error) {
	// Fetch from repository
	points, err := s.priceRepo.GetTimeseriesData(ctx, itemID, source.timestep, source.start, source.end, source.sampleSize)
	if err != nil {
		return nil, fmt.Errorf("fetch timeseries: %w", err)
	}
	
	// If empty, try seeding from Wiki API
	if len(points) == 0 {
		s.logger.Infow("no timeseries data found, attempting to seed from Wiki API",
			"itemId", itemID,
			"timestep", source.timestep,
		)
		
		if err := s.seedHistoricalData(ctx, itemID); err != nil {
			s.logger.Warnw("failed to seed historical data",
				"itemId", itemID,
				"error", err,
			)
			// Don't return error - proceed with empty data
			return points, nil
		}
		
		// Retry fetch after seeding
		points, err = s.priceRepo.GetTimeseriesData(ctx, itemID, source.timestep, source.start, source.end, source.sampleSize)
		if err != nil {
			return nil, fmt.Errorf("fetch after seed: %w", err)
		}
	}
	
	return points, nil
}
```

**Checklist:**
- [ ] Add function (similar to daily version)
- [ ] Call repository for timeseries
- [ ] Handle repository errors
- [ ] Check if results empty
- [ ] Attempt seeding if empty
- [ ] Log seeding with timestep info
- [ ] Retry fetch after seeding
- [ ] Return points or error

---

##### Task 4.3: Extract seedHistoricalData Helper (If Not Exists)

**Check:** Look for existing `seedHistoricalData` method in `price_service.go`

**If Exists:**
- [ ] Verify it's private method on service
- [ ] Verify signature: `func (s *priceService) seedHistoricalData(ctx context.Context, itemID int) error`
- [ ] Skip to Task 4.4

**If Not Exists - Create:**

**File:** `internal/services/price_service.go`  
**Location:** Add after fetch functions

**Implementation:**
```go
// seedHistoricalData fetches historical price data from Wiki API and stores it
// in the database for the given item.
func (s *priceService) seedHistoricalData(ctx context.Context, itemID int) error {
	// Call Wiki API client (assuming it exists in service)
	// This is a placeholder - adjust based on actual Wiki client interface
	historicalData, err := s.wikiClient.FetchHistoricalPrices(ctx, itemID)
	if err != nil {
		return fmt.Errorf("wiki api fetch: %w", err)
	}
	
	if len(historicalData) == 0 {
		return fmt.Errorf("wiki api returned no data for item %d", itemID)
	}
	
	// Store in repository
	if err := s.priceRepo.InsertTimeseriesPoints(ctx, historicalData); err != nil {
		return fmt.Errorf("insert seeded data: %w", err)
	}
	
	s.logger.Infow("successfully seeded historical data",
		"itemId", itemID,
		"points", len(historicalData),
	)
	
	return nil
}
```

**Checklist:**
- [ ] Add function if not exists
- [ ] Call Wiki API client
- [ ] Handle API errors
- [ ] Check for empty response
- [ ] Insert data via repository
- [ ] Log success with point count
- [ ] Return error if any step fails

---

##### Task 4.4: Test Fetch Functions

**File:** `tests/unit/price_service_fetch_test.go` (new file)

**Test Cases:**
```go
func TestPriceService_fetchDailyPoints(t *testing.T) {
	t.Run("successful fetch returns data", func(t *testing.T) {
		// Mock repository with data
		// Verify no seeding attempted
	})
	
	t.Run("empty result triggers seeding", func(t *testing.T) {
		// Mock repository empty first, then with data
		// Mock Wiki client
		// Verify seeding called
		// Verify retry fetch called
	})
	
	t.Run("seeding failure returns empty", func(t *testing.T) {
		// Mock repository empty
		// Mock Wiki client with error
		// Verify returns empty (not error)
	})
	
	t.Run("repository error returned", func(t *testing.T) {
		// Mock repository with error
		// Verify error returned
	})
}

func TestPriceService_fetchTimeseriesPoints(t *testing.T) {
	// Similar test structure
}
```

**Checklist:**
- [ ] Create test file
- [ ] Test successful fetch
- [ ] Test seeding trigger
- [ ] Test seeding failure handling
- [ ] Test repository errors
- [ ] Test retry after seed
- [ ] Run tests

---

#### Phase 5: Refactor Main Function

**Goal:** Rewrite `GetPriceHistory` using extracted helpers

##### Task 5.1: Rewrite GetPriceHistory

**File:** `internal/services/price_service.go`  
**Location:** Replace existing function (lines ~94-260)

**New Implementation:**
```go
// GetPriceHistory retrieves historical price data for an item based on the given parameters.
// It attempts to serve from cache first, falls back to database, and can seed data from
// Wiki API if the database is empty.
func (s *priceService) GetPriceHistory(
	ctx context.Context,
	params models.PriceHistoryParams,
) (*models.PriceHistoryResponse, error) {
	// 1. Try cache if period-based and not forcing refresh
	if params.Period != "" && !params.Refresh {
		if cached := s.getCachedHistory(params.ItemID, params.Period); cached != nil {
			return cached, nil
		}
	}

	// 2. Determine data source (daily vs timeseries, start/end times, sample size)
	source := s.selectDataSource(params.Period)

	// 3. Fetch data points (with automatic seeding if empty)
	var data []models.PricePoint
	var err error
	
	if source.useDaily {
		points, fetchErr := s.fetchDailyPoints(ctx, params.ItemID, source)
		if fetchErr != nil {
			return nil, fetchErr
		}
		data = s.transformDailyPoints(points)
	} else {
		points, fetchErr := s.fetchTimeseriesPoints(ctx, params.ItemID, source)
		if fetchErr != nil {
			return nil, fetchErr
		}
		data = s.transformTimeseriesPoints(points)
	}

	// 4. Calculate date range
	firstDate, lastDate := s.calculateDateRange(data)

	// 5. Build response
	response := &models.PriceHistoryResponse{
		ItemID:    params.ItemID,
		Period:    string(params.Period),
		Data:      data,
		Count:     len(data),
		FirstDate: firstDate,
		LastDate:  lastDate,
	}

	// 6. Cache if period-based (don't cache custom date ranges)
	if params.Period != "" {
		s.setCachedHistory(params.ItemID, params.Period, response)
	}

	return response, nil
}
```

**Key Changes:**
- ✅ Reduced to ~45 lines (from 166)
- ✅ Single level of nesting (from 4+ levels)
- ✅ No code duplication
- ✅ Clear step-by-step flow
- ✅ Each helper has single responsibility
- ✅ Error handling preserved

**Checklist:**
- [ ] Backup existing implementation
- [ ] Replace function body
- [ ] Verify cache logic preserved
- [ ] Verify data source selection called
- [ ] Verify fetch + transform pattern
- [ ] Verify date range calculation
- [ ] Verify response building
- [ ] Verify cache write logic
- [ ] Update godoc if needed

---

##### Task 5.2: Verify selectDataSource Exists

**Check:** Ensure `selectDataSource` helper exists in `price_service.go`

**Expected Signature:**
```go
type dataSource struct {
	useDaily   bool
	timestep   string
	start      *time.Time
	end        *time.Time
	sampleSize *int
}

func (s *priceService) selectDataSource(period models.TimePeriod) dataSource
```

**If Not Exists:**
- [ ] Extract from existing `GetPriceHistory` implementation
- [ ] Test with various period inputs
- [ ] Document the decision logic

**If Exists:**
- [ ] Verify return type matches usage
- [ ] No changes needed

---

#### Phase 6: Testing & Validation

##### Task 6.1: Update Existing Tests

**File:** Look for existing tests like `TestPriceService_GetPriceHistory_*`

**Actions:**
- [ ] Run existing tests: `go test -v -run TestPriceService_GetPriceHistory`
- [ ] Verify all pass without modification
- [ ] If failures, debug differences in behavior
- [ ] Update test setup if needed (mock changes)

---

##### Task 6.2: Add Integration Tests

**File:** `tests/integration/price_handler_integration_test.go`

**Verify:**
- [ ] Existing integration tests still pass
- [ ] Cache behavior works end-to-end
- [ ] Seeding behavior works end-to-end
- [ ] Error scenarios handled correctly

---

##### Task 6.3: Run Linters

**Command:**
```powershell
cd backend
golangci-lint run internal/services/price_service.go
```

**Expected Results:**
- ✅ `gocognit` - No violations (was 61, now <15)
- ✅ `revive[cognitive-complexity]` - No violations (now <20)
- ✅ `dupl` - No violations (80 lines duplication eliminated)
- ✅ `gocyclo` - No violations (was 34, now <15)

**Checklist:**
- [ ] Run linter on file
- [ ] Verify no complexity violations
- [ ] Verify no duplication warnings
- [ ] Check for any new issues
- [ ] Fix any cosmetic issues (line length, etc.)

---

##### Task 6.4: Verify Test Coverage

**Command:**
```powershell
cd backend
go test -coverprofile=coverage.out ./internal/services ./tests/unit/...
go tool cover -func=coverage.out | Select-String "price_service"
```

**Target:** Maintain or improve coverage (currently should be ≥80%)

**Checklist:**
- [ ] Run coverage analysis
- [ ] Verify `GetPriceHistory` covered
- [ ] Verify all new helpers covered
- [ ] Check overall service coverage
- [ ] Generate HTML report: `go tool cover -html=coverage.out`
- [ ] Review uncovered lines

---

##### Task 6.5: Build & Integration Check

**Commands:**
```powershell
cd backend

# Build service package
go build -v ./internal/services

# Build full backend
go build -o bin/api.exe ./cmd/api

# If Docker available, run integration tests
docker-compose up -d
go test -v -tags=slow ./tests/integration/...
docker-compose down
```

**Checklist:**
- [ ] Service package builds
- [ ] Full backend builds
- [ ] Binary size reasonable
- [ ] Integration tests pass (if Docker available)
- [ ] No runtime errors in logs

---

#### Phase 7: Documentation & Cleanup

##### Task 7.1: Update Function Documentation

**File:** `internal/services/price_service.go`

**Review All New Functions:**
- [ ] `transformDailyPoints` - Clear godoc
- [ ] `transformTimeseriesPoints` - Clear godoc
- [ ] `calculateDateRange` - Clear godoc
- [ ] `getCachedHistory` - Clear godoc
- [ ] `setCachedHistory` - Clear godoc
- [ ] `fetchDailyPoints` - Clear godoc
- [ ] `fetchTimeseriesPoints` - Clear godoc
- [ ] `seedHistoricalData` - Clear godoc (if created)
- [ ] `GetPriceHistory` - Updated godoc reflecting simplified logic

---

##### Task 7.2: Update Interface Documentation

**File:** `internal/services/interfaces.go`

**If PriceService Interface Exists:**
- [ ] Verify `GetPriceHistory` signature unchanged
- [ ] Update interface comment if needed

---

##### Task 7.3: Code Review Checklist

**Complexity Reduction:**
- [ ] Main function <50 lines
- [ ] No nesting deeper than 2 levels
- [ ] No code duplication
- [ ] Each helper has single responsibility

**Error Handling:**
- [ ] Repository errors propagated
- [ ] Cache errors logged, not returned
- [ ] Seeding errors logged, don't fail request
- [ ] All errors wrapped with context

**Logging:**
- [ ] Cache hits logged at debug level
- [ ] Seeding attempts logged at info level
- [ ] Seeding failures logged at warn level
- [ ] Appropriate structured fields (itemId, period, etc.)

**Testing:**
- [ ] Each helper has unit tests
- [ ] Integration tests pass
- [ ] Test coverage maintained
- [ ] Edge cases covered (empty data, NULL values)

---

### GetPriceHistory Summary

**Total Tasks:** 28 tasks across 7 phases

**Estimated Time:** 4-6 hours
- Phase 1: 1 hour (transformation + tests)
- Phase 2: 30 min (date range + tests)
- Phase 3: 45 min (cache + tests)
- Phase 4: 1.5 hours (fetch + tests)
- Phase 5: 30 min (main refactor)
- Phase 6: 1 hour (testing & validation)
- Phase 7: 30 min (documentation)

**Success Criteria:**
- ✅ Complexity: 61 → <15 (under all limits)
- ✅ Duplication: 80 lines → 0
- ✅ LOC: 166 → ~40
- ✅ All tests pass
- ✅ Linters pass

---

## Refactor 2: SSEHandler.Stream (LOW PRIORITY)

### Objective

Enhance existing nolint directive with comprehensive documentation explaining why the complexity is acceptable.

### Current Status

**File:** `internal/handlers/sse_handler.go`  
**Line:** ~52  
**Complexity:** 21 (5% over limit of 20)  
**Has Nolint:** Yes, but minimal comment

### Implementation Plan

#### Task 2.1: Update Nolint Comment

**File:** `internal/handlers/sse_handler.go`  
**Location:** Line ~52 (before `Stream` method)

**Current:**
```go
//nolint:revive // SSE streaming inherently complex: heartbeat, timeout, messages, cleanup
func (h *sseHandler) Stream(c *fiber.Ctx) error {
```

**Updated:**
```go
//nolint:revive,gocognit // SSE streaming inherently requires 4-way select for heartbeat,
// timeout, messages, and cancellation per SSE specification (https://html.spec.whatwg.org/multipage/server-sent-events.html).
// This complexity is standard across SSE implementations (e.g., github.com/r3labs/sse) and
// necessary for proper connection lifecycle management. Complexity: 21 (1 point over limit).
func (h *sseHandler) Stream(c *fiber.Ctx) error {
```

**Checklist:**
- [ ] Locate existing nolint directive
- [ ] Add `gocognit` to suppressions
- [ ] Add reference to SSE specification
- [ ] Mention industry-standard pattern
- [ ] Note actual complexity score
- [ ] Format comment (max 100 chars per line)
- [ ] Verify linters no longer complain

---

#### Task 2.2: Verify Linters Accept Update

**Command:**
```powershell
cd backend
golangci-lint run internal/handlers/sse_handler.go
```

**Expected:**
- ✅ No `revive[cognitive-complexity]` warnings
- ✅ No `gocognit` warnings
- ✅ Comment explains justification

**Checklist:**
- [ ] Run linter on file
- [ ] Verify no complexity warnings
- [ ] Check for other issues in file
- [ ] No changes to function body needed

---

### SSEHandler.Stream Summary

**Total Tasks:** 2 tasks

**Estimated Time:** 5 minutes

**Success Criteria:**
- ✅ Enhanced documentation
- ✅ Linters pass with suppressions
- ✅ No code changes needed

---

## Refactor 3: SharedPostgres (MEDIUM PRIORITY)

### Objective

Add nolint directive with justification for test infrastructure complexity.

### Current Status

**File:** `tests/testutil/postgres.go`  
**Line:** ~45  
**Complexity:** 24 (20% over limit of 20)  
**Has Nolint:** No

### Implementation Plan

#### Task 3.1: Add Nolint Directive

**File:** `tests/testutil/postgres.go`  
**Location:** Line ~45 (before `SharedPostgres` function)

**Add:**
```go
//nolint:revive,gocognit // Test container initialization requires retry logic with multiple
// error paths within sync.Once. This complexity is inherent to testcontainers pattern
// (https://testcontainers.com/guides/getting-started-with-testcontainers-for-go/) and
// necessary for reliable CI/CD execution. Complexity: 24 (acceptable for test infrastructure).
func SharedPostgres(t *testing.T) *gorm.DB {
```

**Checklist:**
- [ ] Locate `SharedPostgres` function
- [ ] Add nolint directive before function
- [ ] Suppress both `revive` and `gocognit`
- [ ] Reference testcontainers pattern
- [ ] Explain sync.Once complexity
- [ ] Note it's test infrastructure
- [ ] Mention actual complexity score

---

#### Task 3.2: Verify Linters Accept Directive

**Command:**
```powershell
cd backend
golangci-lint run tests/testutil/postgres.go
```

**Expected:**
- ✅ No `revive[cognitive-complexity]` warnings
- ✅ No `gocognit` warnings
- ✅ Comment explains why acceptable

**Checklist:**
- [ ] Run linter on file
- [ ] Verify no complexity warnings
- [ ] Check for other issues
- [ ] No code changes needed

---

#### Task 3.3: Document in Test README (Optional)

**File:** `tests/README.md` (if exists, otherwise skip)

**Add Section:**
```markdown
## Test Utilities

### SharedPostgres

The `SharedPostgres` function uses `sync.Once` to initialize a single PostgreSQL
testcontainer shared across all tests. This pattern has higher complexity (24)
due to:

- Container lifecycle management
- Connection retry logic
- Error handling within sync.Once closure
- Migration execution

This complexity is acceptable for test infrastructure as it provides:
- Faster test execution (single container vs per-test containers)
- Reliable CI/CD execution with retries
- Proper cleanup on all error paths
```

**Checklist:**
- [ ] Check if tests/README.md exists
- [ ] If exists, add section
- [ ] If not, skip this task
- [ ] Commit with documentation changes

---

### SharedPostgres Summary

**Total Tasks:** 3 tasks (1 optional)

**Estimated Time:** 5 minutes

**Success Criteria:**
- ✅ Nolint directive added
- ✅ Linters pass with suppressions
- ✅ Justification documented
- ✅ No code changes needed

---

## Overall Progress Tracking

### Refactor Completion Checklist

#### GetPriceHistory (CRITICAL)
- [ ] Phase 1: Extract transformation functions (6 tasks)
- [ ] Phase 2: Extract date range calculation (2 tasks)
- [ ] Phase 3: Extract cache operations (3 tasks)
- [ ] Phase 4: Extract data fetching (4 tasks)
- [ ] Phase 5: Refactor main function (2 tasks)
- [ ] Phase 6: Testing & validation (5 tasks)
- [ ] Phase 7: Documentation & cleanup (3 tasks)

**Sub-total: 28 tasks**

#### SSEHandler.Stream (LOW)
- [ ] Update nolint comment
- [ ] Verify linters pass

**Sub-total: 2 tasks**

#### SharedPostgres (MEDIUM)
- [ ] Add nolint directive
- [ ] Verify linters pass
- [ ] Document in README (optional)

**Sub-total: 3 tasks**

---

### Grand Total

**Total Tasks:** 33 tasks  
**Total Estimated Time:** 5-7 hours

**Breakdown:**
- GetPriceHistory: 4-6 hours (28 tasks)
- SSEHandler.Stream: 5 minutes (2 tasks)
- SharedPostgres: 5 minutes (3 tasks)

---

## Success Metrics

### Before All Refactors

| Metric | Count |
|--------|-------|
| Functions >50 Complexity | 1 (GetPriceHistory: 61) |
| Functions >30 Complexity | 2 (GetPriceHistory: 61, InsertTimeseriesPoints: 42) |
| Functions >20 Complexity | 4 (+ SSEHandler: 21, SharedPostgres: 24) |
| Critical Violations | 2 (GetPriceHistory, InsertTimeseriesPoints) |
| Code Duplication Blocks | 6+ |

### After All Refactors

| Metric | Count | Change |
|--------|-------|--------|
| Functions >50 Complexity | 0 | ✅ -100% |
| Functions >30 Complexity | 0 | ✅ -100% |
| Functions >20 Complexity | 0* | ✅ -100% |
| Critical Violations | 0 | ✅ -100% |
| Code Duplication Blocks | 0 | ✅ -100% |

*SSEHandler (21) and SharedPostgres (24) will have documented nolint suppressions

### Quality Improvements

| Aspect | Before | After |
|--------|--------|-------|
| Testability | Low (complex integration tests) | High (unit testable helpers) |
| Maintainability | Low (multiple responsibilities) | High (single responsibility) |
| Readability | Low (deep nesting) | High (linear flow) |
| Documentation | Minimal | Comprehensive |

---

## Rollback Procedures

### For GetPriceHistory

**If Issues Arise During Refactor:**

1. **Partial Rollback (Keep Helpers):**
   ```bash
   # Revert only main function
   git checkout HEAD~1 -- internal/services/price_service.go
   # Re-apply helper functions
   # Keep: transform*, calculate*, get/setCached*, fetch*
   # Restore: GetPriceHistory original
   ```

2. **Full Rollback:**
   ```bash
   git revert <commit-hash>
   # Or restore from backup
   ```

3. **Debug Strategy:**
   - Run original tests against new code
   - Compare outputs side-by-side
   - Check logs for behavioral differences
   - Verify cache keys match

### For SSEHandler/SharedPostgres

**Low Risk - Just Remove Nolint:**
```bash
# Remove //nolint directive
# Revert to original if needed
```

---

## Post-Completion Actions

### Update Documentation

1. **Update [REFACTOR_BACKLOG.md](REFACTOR_BACKLOG.md):**
   - [ ] Mark GetPriceHistory as ✅ Complete
   - [ ] Mark SSEHandler as ✅ Documented
   - [ ] Mark SharedPostgres as ✅ Documented
   - [ ] Update success metrics table

2. **Create Progress Report:**
   - [ ] Create `REFACTOR_GETPRICEHISTORY_REPORT.md`
   - [ ] Document complexity reductions
   - [ ] List test results
   - [ ] Note lessons learned

3. **Update Main README (if applicable):**
   - [ ] Note complexity improvements
   - [ ] Update code quality badges
   - [ ] Link to refactor documentation

### Team Communication

1. **Code Review:**
   - [ ] Request review from team lead
   - [ ] Explain helper function pattern
   - [ ] Demonstrate test coverage
   - [ ] Walk through complexity reduction

2. **Knowledge Sharing:**
   - [ ] Share helper extraction pattern
   - [ ] Document when to extract vs inline
   - [ ] Add to coding standards if applicable

---

## References

### Related Documents
- [REFACTOR_BACKLOG.md](REFACTOR_BACKLOG.md) - Detailed analysis of all violations
- [REFACTOR_INSERT_TIMESERIES.md](REFACTOR_INSERT_TIMESERIES.md) - Previous refactor plan
- [REFACTOR_PROGRESS_REPORT.md](REFACTOR_PROGRESS_REPORT.md) - InsertTimeseriesPoints results
- [CODING_STANDARDS.md](CODING_STANDARDS.md) - Project coding standards
- [LINTING.md](LINTING.md) - Linter configuration

### External Resources
- [Cognitive Complexity Paper](https://www.sonarsource.com/docs/CognitiveComplexity.pdf)
- [Effective Go - Functions](https://go.dev/doc/effective_go#functions)
- [Go Testing Best Practices](https://go.dev/doc/tutorial/add-a-test)
- [GORM Documentation](https://gorm.io/docs/)

### Tools
- `golangci-lint` - Linting suite
- `go test` - Test runner with coverage
- `go tool cover` - Coverage visualization

---

**Document Version:** 1.0  
**Created:** January 16, 2026  
**Status:** Ready for Implementation  
**Next Action:** Begin Phase 1 of GetPriceHistory refactor
