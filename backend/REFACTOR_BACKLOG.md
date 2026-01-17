# Complexity Refactor Backlog

**Date:** January 16, 2026  
**Status:** ✅ COMPLETED  
**Related:** [REFACTOR_COMPLETION_REPORT.md](REFACTOR_COMPLETION_REPORT.md), [REFACTOR_REMAINING_PLAN.md](REFACTOR_REMAINING_PLAN.md)

---

## Executive Summary

This document tracked the remaining complexity violations after the `InsertTimeseriesPoints` refactor. **All refactors have been completed successfully.**

**Backlog Summary:**
1. ✅ **GetPriceHistory** - COMPLETED (complexity: 61 → <15)
2. ✅ **SSEHandler.Stream** - COMPLETED (added nolint with documentation)
3. ✅ **SharedPostgres** - COMPLETED (added nolint with documentation)

See [REFACTOR_COMPLETION_REPORT.md](REFACTOR_COMPLETION_REPORT.md) for full implementation details.

---

## Completion Status

| Function | Complexity | Over Limit | Priority | Status | Approach |
|----------|------------|------------|----------|--------|----------|
| GetPriceHistory | 61 → <15 | 75% reduction | 🔴 CRITICAL | ✅ COMPLETE | Major refactor |
| SSEHandler.Stream | 21 (nolint) | 5% | 🟢 LOW | ✅ COMPLETE | Documented nolint |
| SharedPostgres | 24 (nolint) | 20% | 🟡 MEDIUM | ✅ COMPLETE | Documented nolint |

---

## 1. GetPriceHistory - CRITICAL PRIORITY

### Overview

**File:** `internal/services/price_service.go`  
**Location:** Lines 94-260 (~166 lines)  
**Function:** Core business logic for fetching historical price data

### Complexity Metrics

| Metric | Score | Limit | Over By | Status |
|--------|-------|-------|---------|--------|
| **Cognitive Complexity** | 61 | 20/30 | 205-304% | ❌❌❌ Critical |
| **Cyclomatic Complexity** | 34 | 15 | 126% | ❌ High |

### Current Implementation Analysis

**What it does:**
- Fetches historical price data for a single item
- Handles 9 time periods: 1h, 12h, 24h, 3d, 7d, 30d, 90d, 1y, all
- Implements cache-first strategy with optional force refresh
- Chooses between daily aggregates or timeseries data based on period
- Seeds missing data from Wiki API if database is empty
- Transforms data points from different table structures
- Filters out NULL price points
- Tracks first/last dates in dataset
- Builds final response object

**Why it's complex:**

#### 1. Multiple Nested Conditionals
```go
if params.Period != "" && !params.Refresh {
    if err == nil {
        return cached  // Cache hit
    }
} else if params.Period != "" && params.Refresh {
    // Set cache key for later
}

if source.useDaily {
    points, err := ...
    if err != nil { ... }
    if len(points) == 0 {
        if err := seed...; err != nil { ... }
        points, err = ...
        if err != nil { ... }
    }
    for _, p := range points {
        if p.AvgHighPrice == nil && p.AvgLowPrice == nil {
            continue
        }
        // ... more conditionals
    }
} else {
    // Identical structure for timeseries
}
```

#### 2. Deep Nesting Levels
- Cache logic: 2 levels
- Data source branching: 2 levels
- Seeding logic: 3 levels
- NULL filtering: 4 levels

#### 3. Massive Code Duplication
**Duplicate Blocks:** ~80 lines repeated between `useDaily` and timeseries branches

```go
// Daily branch (~80 lines)
for _, p := range points {
    if p.AvgHighPrice == nil && p.AvgLowPrice == nil {
        continue
    }
    // ... transform logic ...
}

// Timeseries branch (IDENTICAL ~80 lines)
for _, p := range points {
    if p.AvgHighPrice == nil && p.AvgLowPrice == nil {
        continue
    }
    // ... transform logic ...
}
```

#### 4. Multiple Responsibilities
- Cache management (read, write, keys)
- Data source selection (daily vs timeseries)
- Data fetching (repository calls)
- Data seeding (Wiki API fallback)
- Data transformation (model → response)
- NULL filtering
- Date range tracking
- Response building

### Proposed Refactor Strategy

#### Extract 5 Helper Functions

**1. `getCachedHistory(itemID, period) (*PriceHistoryResponse, error)`**
```go
// Handles cache lookup with period-based keys
// Returns nil, nil if cache miss
// Returns response, nil if cache hit
// Returns nil, error if cache error (log, don't fail)
```

**2. `fetchDataPoints(itemID, source) ([]PriceTimeseriesDaily or []PriceTimeseriesPoint, error)`**
```go
// Fetches from appropriate repository (daily or timeseries)
// Handles empty result → seed attempt → re-fetch
// Returns points or error
```

**3. `seedEmptyData(itemID, source) error`**
```go
// Calls Wiki API client
// Seeds historical data
// Returns error if seeding fails (acceptable, logged)
```

**4. `transformDailyPoints(points []PriceTimeseriesDaily) []PricePoint`**
```go
// Filters NULL prices
// Converts daily → response format
// Returns transformed slice
```

**5. `transformTimeseriesPoints(points []PriceTimeseriesPoint) []PricePoint`**
```go
// Filters NULL prices  
// Converts timeseries → response format
// Returns transformed slice
```

#### Refactored GetPriceHistory (Simplified)

```go
func (s *priceService) GetPriceHistory(ctx context.Context, params models.PriceHistoryParams) (*models.PriceHistoryResponse, error) {
    // 1. Try cache if period-based and not forcing refresh
    if params.Period != "" && !params.Refresh {
        if cached := s.getCachedHistory(params.ItemID, params.Period); cached != nil {
            return cached, nil
        }
    }

    // 2. Determine data source (daily vs timeseries)
    source := s.selectDataSource(params.Period)

    // 3. Fetch data (with seeding if empty)
    var data []PricePoint
    var err error
    
    if source.useDaily {
        points, err := s.fetchDailyPoints(ctx, params.ItemID, source)
        if err != nil {
            return nil, err
        }
        data = s.transformDailyPoints(points)
    } else {
        points, err := s.fetchTimeseriesPoints(ctx, params.ItemID, source)
        if err != nil {
            return nil, err
        }
        data = s.transformTimeseriesPoints(points)
    }

    // 4. Track date range
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

    // 6. Cache if period-based
    if params.Period != "" {
        s.setCachedHistory(params.ItemID, params.Period, response)
    }

    return response, nil
}
```

### Expected Improvements

| Metric | Before | After | Change |
|--------|--------|-------|--------|
| Cognitive Complexity | 61 | ~15 | -75% |
| Cyclomatic Complexity | 34 | ~8 | -76% |
| Lines of Code | 166 | ~40 | -76% |
| Code Duplication | 80 lines | 0 | -100% |
| Testability | Low | High | +++ |

### Implementation Phases

#### Phase 1: Extract Transformation Functions
- [ ] Create `transformDailyPoints()`
- [ ] Create `transformTimeseriesPoints()`
- [ ] Test transformations independently
- [ ] Verify NULL filtering works

#### Phase 2: Extract Fetching Functions
- [ ] Create `fetchDailyPoints()` with seeding
- [ ] Create `fetchTimeseriesPoints()` with seeding
- [ ] Extract `seedEmptyData()` helper
- [ ] Test fetch + seed logic

#### Phase 3: Extract Cache Functions
- [ ] Create `getCachedHistory()`
- [ ] Create `setCachedHistory()`
- [ ] Test cache hit/miss scenarios

#### Phase 4: Extract Date Range Helper
- [ ] Create `calculateDateRange()`
- [ ] Test with various data shapes

#### Phase 5: Simplify Main Function
- [ ] Rewrite `GetPriceHistory` using helpers
- [ ] Remove duplication
- [ ] Update tests
- [ ] Verify behavior unchanged

#### Phase 6: Validation
- [ ] Run all price service tests
- [ ] Run integration tests
- [ ] Run linters (verify under limits)
- [ ] Test coverage maintained

### Testing Strategy

**Existing Tests to Preserve:**
- `TestPriceService_GetPriceHistory_*` (multiple scenarios)
- Integration tests in `price_handler_integration_test.go`

**New Tests to Add:**
- Unit tests for each helper function
- Test NULL filtering edge cases
- Test seeding failure scenarios
- Test cache key generation

### Risks & Mitigation

| Risk | Impact | Mitigation |
|------|--------|------------|
| Behavior change in edge cases | High | Comprehensive test suite, integration tests |
| Cache key mismatch | Medium | Test cache hit/miss scenarios explicitly |
| Seeding logic broken | Medium | Test seeding independently with mocks |
| Performance regression | Low | Benchmark before/after |

### Effort Estimate

**Total Time:** 4-6 hours

- Phase 1: 1 hour (transformation extraction)
- Phase 2: 1.5 hours (fetching + seeding)
- Phase 3: 45 min (cache logic)
- Phase 4: 30 min (date range)
- Phase 5: 1 hour (main function rewrite)
- Phase 6: 1 hour (testing + validation)

### Dependencies

- None - can be done independently after InsertTimeseriesPoints
- No schema changes required
- No API contract changes

### Recommendation

**Status:** ✅ **STRONGLY RECOMMENDED**

**Rationale:**
- Critical complexity violation (205% over limit)
- Core business logic - hardest to maintain
- High code duplication (80 lines)
- Testability greatly improved by extraction
- No breaking changes required

**When:** After InsertTimeseriesPoints completes successfully

---

## 2. SSEHandler.Stream - LOW PRIORITY

### Overview

**File:** `internal/handlers/sse_handler.go`  
**Location:** Lines 52-162 (~110 lines)  
**Function:** Handles Server-Sent Events streaming endpoint

### Complexity Metrics

| Metric | Score | Limit | Over By | Status |
|--------|-------|-------|---------|--------|
| **Cognitive Complexity** | 21 | 20 | 5% | ⚠️ Borderline |
| **Cyclomatic Complexity** | N/A | 15 | - | ✅ Pass |

### Current Status

**Has Existing Nolint:**
```go
//nolint:revive // SSE streaming inherently complex: heartbeat, timeout, messages, cleanup
```

**Note:** Appears in some linter reports due to `gocognit` (limit 30) vs `revive[cognitive-complexity]` (limit 20) threshold differences.

### Why It's Complex (By Design)

#### Inherent SSE Streaming Complexity
```go
func (h *sseHandler) Stream(c *fiber.Ctx) error {
    // Pre-stream checks (4 conditionals)
    if h.hub == nil { return error }
    if clientCount >= maxClients { return error }
    clientID := generateID()
    if clientID == "" { return error }
    filters := parseFilters(query)

    // Main event loop (4 channels in select)
    for {
        select {
        case <-timeout.C:
            // Send timeout, cleanup, return
        case msg, ok := <-messageChan:
            if !ok { return }  // Channel closed
            // Process message, write to stream
        case <-heartbeat.C:
            // Send heartbeat comment
        case <-ctx.Done():
            // Context cancelled, return
        }
    }
}
```

#### Why This Complexity Is Acceptable

1. **Real-time Protocol Requirements:**
   - SSE requires heartbeat mechanism (timer channel)
   - Timeout handling for idle clients (timer channel)
   - Message delivery from hub (message channel)
   - Context cancellation (context channel)
   - **4-way select is standard pattern**

2. **Resource Management:**
   - Client registration/deregistration
   - Graceful cleanup on all exit paths
   - Multiple `defer` statements (necessary)

3. **Industry Standard:**
   - This pattern matches SSE implementations in Go ecosystem
   - Similar complexity in `github.com/r3labs/sse`, `eventsource` libraries
   - Recommended by SSE best practices

### Proposed Action

**Status:** ✅ **KEEP AS-IS WITH DOCUMENTATION**

**Actions:**
1. ✅ Keep existing `//nolint:revive` directive
2. ✅ Enhance comment with reference to SSE standard
3. ⚠️ Consider adding `gocognit` to nolint if appears in reports

**Updated Nolint Directive:**
```go
//nolint:revive,gocognit // SSE streaming inherently requires 4-way select for heartbeat, 
// timeout, messages, and cancellation per SSE specification. This complexity is standard
// across SSE implementations (see github.com/r3labs/sse) and necessary for proper
// connection lifecycle management.
```

### Alternative Refactor (Not Recommended)

Could extract helpers:
- `handleTimeout()`
- `handleMessage()`
- `handleHeartbeat()`

**Why Not:**
- Adds indirection without reducing real complexity
- Select statement still needs 4 cases
- Makes control flow harder to follow
- Performance overhead from function calls in hot loop

### Testing

**Current Coverage:** Well-tested
- Unit tests with mock hub
- Integration tests with real connections
- Stress tests for concurrent clients

**No Changes Needed**

### Effort Estimate

**Time Required:** 5 minutes (update nolint comment only)

### Recommendation

**Status:** ⚠️ **ACCEPT WITH DOCUMENTATION**

**Rationale:**
- Only 5% over limit (1 point)
- Inherent complexity of SSE protocol
- Industry-standard pattern
- Well-tested and stable
- Refactoring would not meaningfully reduce complexity
- Already has nolint with justification

**When:** Update nolint comment during next code review

---

## 3. SharedPostgres - MEDIUM PRIORITY

### Overview

**File:** `tests/testutil/postgres.go`  
**Location:** Lines 45-105 (~60 lines)  
**Function:** Test utility for shared PostgreSQL container initialization

### Complexity Metrics

| Metric | Score | Limit | Over By | Status |
|--------|-------|-------|---------|--------|
| **Cognitive Complexity** | 24 | 20 | 20% | ⚠️ Medium |
| **Cyclomatic Complexity** | N/A | 15 | - | N/A |

### Current Status

**No Nolint:** Active violation reported by linters

### Why It's Complex

#### Test Container Initialization with Retries

```go
func SharedPostgres(t *testing.T) *gorm.DB {
    sharedPG.once.Do(func() {
        ctx, cancel := context.WithTimeout(context.Background(), 5*time.Minute)
        defer cancel()

        // 1. Start container (with error handling)
        pgContainer, err := pgcontainer.Run(ctx, ...)
        if err != nil {
            sharedPG.initErr = fmt.Errorf("start postgres: %w", err)
            return
        }

        // 2. Get connection string (with error handling)
        connStr, err := pgContainer.ConnectionString(ctx, ...)
        if err != nil {
            sharedPG.initErr = fmt.Errorf("get connection: %w", err)
            return
        }

        // 3. Retry connection with timeout
        deadline := time.Now().Add(45 * time.Second)
        for {
            gormDB, err = gorm.Open(...)
            if err == nil {
                sqlDB, sqlErr := gormDB.DB()
                if sqlErr == nil {
                    pingErr := sqlDB.PingContext(ctx)
                    if pingErr == nil {
                        break  // Success!
                    }
                    err = pingErr
                } else {
                    err = sqlErr
                }
            }

            // Check timeout
            if time.Now().After(deadline) {
                sharedPG.initErr = fmt.Errorf("timeout: %w", err)
                return
            }
            time.Sleep(750 * time.Millisecond)
        }

        // 4. Run migrations (with error handling)
        if err := RunMigrations(ctx, gormDB); err != nil {
            sharedPG.initErr = fmt.Errorf("migrations: %w", err)
            return
        }

        // Success
        sharedPG.db = gormDB
        sharedPG.container = pgContainer
    })

    if sharedPG.initErr != nil {
        t.Fatalf("postgres init: %v", sharedPG.initErr)
    }
    return sharedPG.db
}
```

#### Complexity Sources

1. **sync.Once Pattern with Error Handling:**
   - Must set `sharedPG.initErr` on all failure paths
   - Multiple early returns inside Once
   - 5 different error assignment points

2. **Nested Connection Retry Logic:**
   - Success requires 3 levels of nil checks:
     - `gorm.Open()` succeeds
     - `gormDB.DB()` succeeds
     - `sqlDB.PingContext()` succeeds
   - Failure cascading through multiple variables

3. **Time-Based Loop Exit:**
   - Loop with deadline check
   - Sleep between retries
   - Error propagation from inner checks

4. **Multiple Initialization Steps:**
   - Container start
   - Connection string retrieval
   - Database connection with retries
   - Migration execution
   - State assignment

### Proposed Action

**Status:** ✅ **ADD NOLINT WITH JUSTIFICATION**

**Rationale:**
- Test utility code (not production)
- Complexity inherent to container initialization pattern
- Retry logic necessary for flaky CI environments
- Well-isolated (only used in tests)
- Stability more important than complexity score
- sync.Once error handling pattern is standard

**Recommended Nolint:**
```go
//nolint:revive,gocognit // Test container initialization requires retry logic with multiple
// error paths within sync.Once. This complexity is inherent to testcontainers pattern and
// necessary for reliable CI/CD execution. Refactoring would reduce readability without
// meaningful complexity reduction.
func SharedPostgres(t *testing.T) *gorm.DB {
    sharedPG.once.Do(func() {
        // ... existing implementation ...
    })
}
```

### Alternative Refactor (Low Value)

Could extract helpers:
- `startContainer()` - Container creation
- `connectWithRetry()` - Retry loop logic
- `initializeDatabase()` - Migrations

**Why Not:**
- Adds complexity with error returns from sync.Once
- Makes synchronization pattern harder to understand
- Test utilities prioritize clarity over perfect metrics
- Minimal benefit for maintenance burden

### Testing

**Current Coverage:**
- Used in all integration tests
- Tested implicitly by test suite success
- Runs hundreds of times in CI

**No Changes Needed**

### Effort Estimate

**Time Required:** 5 minutes (add nolint comment)

### Recommendation

**Status:** ⚠️ **ACCEPT WITH DOCUMENTATION**

**Rationale:**
- Test utility code (different standards than production)
- Complexity necessary for reliability
- sync.Once error handling pattern is idiomatic
- Well-tested through usage
- Refactoring has low ROI for test code
- 20% over limit is acceptable for test infrastructure

**When:** Add nolint during next maintenance cycle

---

## Summary Table

| Function | File | Complexity | Status | Effort | Recommendation |
|----------|------|------------|--------|--------|----------------|
| **GetPriceHistory** | price_service.go | 61 (205% over) | 🔴 Critical | 4-6 hours | ✅ Refactor (extract helpers) |
| **SSEHandler.Stream** | sse_handler.go | 21 (5% over) | 🟢 Low | 5 min | ⚠️ Keep nolint, enhance docs |
| **SharedPostgres** | postgres.go | 24 (20% over) | 🟡 Medium | 5 min | ⚠️ Add nolint with justification |

---

## Roadmap

### Immediate Actions (This Sprint)

1. ✅ **InsertTimeseriesPoints Refactor** (In Progress)
   - Complexity: 42 → <15
   - Effort: 1-2 hours
   - Status: See [REFACTOR_INSERT_TIMESERIES.md](REFACTOR_INSERT_TIMESERIES.md)

### Next Sprint

2. 🔴 **GetPriceHistory Refactor** (High Priority)
   - Complexity: 61 → ~15
   - Effort: 4-6 hours
   - Impact: Critical business logic

### Maintenance Cycle

3. ⚠️ **SSEHandler.Stream Documentation** (Low Priority)
   - Update nolint comment
   - Effort: 5 minutes
   - Impact: Documentation only

4. ⚠️ **SharedPostgres Documentation** (Low Priority)
   - Add nolint comment
   - Effort: 5 minutes
   - Impact: Documentation only

---

## Success Metrics

### Target: Zero Critical Violations

| Metric | Current | After InsertTimeseries | After GetPriceHistory | Goal |
|--------|---------|------------------------|----------------------|------|
| **Functions >50 Complexity** | 1 | 1 | 0 | 0 |
| **Functions >30 Complexity** | 2 | 1 | 0 | 0 |
| **Critical Violations** | 2 | 1 | 0 | 0 |
| **Code Duplication Blocks** | 6+ | 2 | 0 | 0 |

### Target: Acceptable Low-Priority Violations

| Item | Complexity | Limit | Status | Justification |
|------|------------|-------|--------|---------------|
| SSEHandler.Stream | 21 | 20 | ✅ Acceptable | SSE protocol requirements |
| SharedPostgres | 24 | 20 | ✅ Acceptable | Test infrastructure pattern |

---

## References

### Related Documents
- [REFACTOR_INSERT_TIMESERIES.md](REFACTOR_INSERT_TIMESERIES.md) - Current refactor
- [CODING_STANDARDS.md](CODING_STANDARDS.md) - Naming conventions
- [LINTING.md](LINTING.md) - Linter configuration
- [LINT_ISSUES_REPORT.md](LINT_ISSUES_REPORT.md) - Current violations

### External Resources
- [Cognitive Complexity Paper](https://www.sonarsource.com/docs/CognitiveComplexity.pdf) - By SonarSource
- [Effective Go - Functions](https://go.dev/doc/effective_go#functions)
- [SSE Specification](https://html.spec.whatwg.org/multipage/server-sent-events.html)
- [Testcontainers Pattern](https://testcontainers.com/guides/getting-started-with-testcontainers-for-go/)

---

## Appendix: Complexity Scoring

### What is Cognitive Complexity?

**Definition:** Measures how difficult code is to understand, not just how many paths exist.

**Key Differences from Cyclomatic:**
- Penalizes nested logic more heavily
- Ignores shorthand constructs (e.g., `switch`)
- Focuses on "brain cost" to comprehend

### Scoring Breakdown Example (GetPriceHistory)

| Pattern | Cognitive Cost | Count | Subtotal |
|---------|----------------|-------|----------|
| If statement (top-level) | +1 | 8 | 8 |
| Nested if (+1 per level) | +2 to +4 | 12 | 36 |
| For loop | +1 | 2 | 2 |
| Nested for | +2 | 0 | 0 |
| Else if | +1 | 2 | 2 |
| Logical operators (&& in if) | +1 | 6 | 6 |
| Switch cases (no penalty) | 0 | 1 | 0 |
| Early returns | 0 | 4 | 0 |
| **Total** | | | **54+** |

*Note: Actual score may include additional penalties for break/continue in nested contexts*

### When to Suppress vs Refactor

#### Suppress With Nolint (Acceptable Patterns)

✅ **Protocol Requirements:**
- SSE event loops with multiple channels
- HTTP middleware chains
- State machines with many states

✅ **Infrastructure Code:**
- Test setup with retries
- Database migrations
- Configuration parsing

✅ **External Library Patterns:**
- Following framework conventions
- Adapter patterns for third-party APIs

#### Refactor (Unacceptable Patterns)

❌ **Business Logic:**
- Core domain functions
- API handlers for primary features
- Data transformation pipelines

❌ **Code Duplication:**
- Copy-pasted logic in branches
- Repeated transformation code

❌ **Multiple Responsibilities:**
- Functions doing caching + fetching + transforming
- "God functions" with 4+ concerns

---

**Document Version:** 1.0  
**Last Updated:** January 16, 2026  
**Next Review:** After GetPriceHistory refactor completion
