# Linting Issues Report - Requires Manual Review

**Generated:** January 16, 2026  
**Total Remaining Issues:** 98  
**Auto-Fixed Issues:** ~220 (comments, imports, spelling)

---

## 🔴 Critical Issues (High Priority)

### 1. Error Handling - `errorlint` (4 issues)

Using `==` for error comparison will fail with wrapped errors. Use `errors.Is()` or `errors.As()` instead.

**Files Affected:**
- `internal/config/config.go:83`
- `internal/repository/item_repository.go:79, 92`
- `internal/services/cache_service.go:30`

**Impact:** **HIGH** - Wrapped errors won't be detected correctly

**Example Fix:**
```go
// ❌ BAD
if err == redis.Nil {
    return "", nil
}
if err == gorm.ErrRecordNotFound {
    return nil, fmt.Errorf("item not found")
}

// ✅ GOOD
if errors.Is(err, redis.Nil) {
    return "", nil
}
if errors.Is(err, gorm.ErrRecordNotFound) {
    return nil, fmt.Errorf("item not found")
}
```

**Files to Fix:**
1. **internal/services/cache_service.go:30**
   ```go
   if err == redis.Nil {
       return "", nil  // Cache miss
   }
   ```
   
2. **internal/repository/item_repository.go:79, 92**
   ```go
   if err == gorm.ErrRecordNotFound {
       return nil, fmt.Errorf("item with ID %d not found", id)
   }
   ```

3. **internal/config/config.go:83**
   ```go
   if _, ok := err.(viper.ConfigFileNotFoundError); !ok {
       return nil, fmt.Errorf("config file error: %w", err)
   }
   ```

**Recommendation:** Fix immediately - these are the most critical issues.

---

### 2. Unchecked Errors - `errcheck` (13 issues)

Cache operations not checking error returns. Most are intentional (cache failures should not break main flow).

**Impact:** **MEDIUM** - Cache failures are non-critical, but should be logged

**Occurrences:**

#### Cache Write Operations (7 issues)
- `internal/services/item_service.go:119` - `SetJSON`
- `internal/services/item_service.go:174` - `Delete`
- `internal/services/item_service.go:186` - `DeletePattern`
- `internal/services/price_service.go:65` - `SetJSON`
- `internal/services/price_service.go:100` - `SetJSON`
- `internal/services/price_service.go:236` - `SetJSON`
- `internal/services/price_service.go:364, 365` - `Delete` (2 calls)

#### Cache Invalidation (4 issues)
- `internal/services/price_service.go:311` - `DeletePattern`
- `internal/services/price_service.go:352` - `DeletePattern`
- `internal/services/price_service.go:437` - `DeletePattern`

#### Logger Sync (1 issue)
- `cmd/api/main.go:28` - `zapLogger.Sync()`

#### SSE Event Write (1 issue)
- `internal/handlers/sse_handler.go:126` - `writeSSEEvent` on timeout

**Recommended Fix Pattern:**

```go
// Option 1: Log errors (recommended for cache ops)
if err := s.cache.SetJSON(ctx, cacheKey, dbItem, cacheItemTTL); err != nil {
    s.logger.Warnw("Failed to cache item", "itemID", dbItem.ItemID, "error", err)
}

// Option 2: Use nolint with explanation
//nolint:errcheck // Cache write failures are non-critical, don't affect main flow
_ = s.cache.SetJSON(ctx, cacheKey, dbItem, cacheItemTTL)

// Option 3: For logger sync (common pattern)
//nolint:errcheck // Logger sync errors are non-critical at shutdown
defer zapLogger.Sync()
```

**Recommendation:** Add `//nolint:errcheck` comments with explanations for intentional ignores.

---

## 🟡 Performance Issues (Medium Priority)

### 3. Cognitive Complexity - `gocognit` (4 issues)

Functions with high cognitive complexity (nested logic, branching).

#### Issue 3.1: `GetPriceHistory` - **Complexity: 61** (limit: 30)
**File:** `internal/services/price_service.go:107`  
**Impact:** MEDIUM - Complex business logic makes maintenance harder

**Analysis:**
- 61 complexity points (2x the limit!)
- Handles multiple time periods, caching, sampling, and fallback logic
- Mix of cache checks, database queries, and data transformation

**Recommendation:** Refactor into smaller functions:
```go
// Split into:
func (s *priceService) GetPriceHistory(ctx, params) (*PriceHistoryResponse, error) {
    // Main orchestration
    if response, found := s.getCachedHistory(ctx, params); found {
        return response, nil
    }
    
    data, err := s.fetchHistoryData(ctx, params)
    if err != nil {
        return nil, err
    }
    
    response := s.buildHistoryResponse(params, data)
    s.cacheHistory(ctx, params, response)
    return response, nil
}

func (s *priceService) getCachedHistory(ctx, params) (*PriceHistoryResponse, bool)
func (s *priceService) fetchHistoryData(ctx, params) ([]PricePoint, error)
func (s *priceService) buildHistoryResponse(params, data) *PriceHistoryResponse
func (s *priceService) cacheHistory(ctx, params, response)
```

**Estimated Effort:** 2-4 hours

---

#### Issue 3.2: `InsertTimeseriesPoints` - **Complexity: 42** (limit: 30)
**File:** `internal/repository/price_repository.go:430`  
**Impact:** MEDIUM

**Analysis:**
- Handles 4 different timeseries tables (5m, 1h, 6h, 24h)
- Batch insertion logic for each table type
- Switch statement with repetitive patterns

**Recommendation:** Extract batch insert logic:
```go
func (r *priceRepository) InsertTimeseriesPoints(ctx, timestep, points) error {
    switch timestep {
    case "5m":
        return r.insertTimeseriesBatch(ctx, points, models.PriceTimeseries5m{})
    case "1h":
        return r.insertTimeseriesBatch(ctx, points, models.PriceTimeseries1h{})
    // ... etc
    }
}

func (r *priceRepository) insertTimeseriesBatch[T any](ctx, points, model T) error {
    // Generic batch insertion
}
```

**Estimated Effort:** 1-2 hours

---

#### Issue 3.3: `SSEHandler.Stream` - **Complexity: 21** (limit: 20)
**File:** `internal/handlers/sse_handler.go:52`  
**Impact:** LOW - Barely over limit, acceptable for handler

**Analysis:**
- SSE streaming with heartbeat, timeout, and message handling
- Select statement with 4 cases
- Inherently complex due to nature of SSE

**Recommendation:** Either:
1. Extract helper functions for each select case
2. Add `//nolint:gocognit` with explanation (acceptable for handlers)

```go
//nolint:gocognit // SSE streaming inherently complex: heartbeat, timeout, messages, cleanup
func (h *SSEHandler) Stream(c *fiber.Ctx) error {
    // ... existing code
}
```

**Estimated Effort:** 15 minutes (nolint) or 1 hour (refactor)

---

#### Issue 3.4: `SharedPostgres` Test Setup - **Complexity: 24** (limit: 20)
**File:** `tests/testutil/postgres.go:45`  
**Impact:** LOW - Test setup code, acceptable complexity

**Recommendation:** Add `//nolint` comment
```go
//nolint:gocognit // Test container setup inherently complex: initialization, retries, cleanup
func SharedPostgres(t *testing.T) (*gorm.DB, func()) {
```

**Estimated Effort:** 5 minutes

---

### 4. Code Duplication - `dupl` (5 groups)

#### Issue 4.1: Sampling Functions (2 duplicates)
**Files:**
- `internal/repository/price_repository.go:250-300` (sampleTimeseriesPoints)
- `internal/repository/price_repository.go:344-394` (sampleDailyPoints)

**Analysis:** Nearly identical sampling logic for two different types.

**Recommendation:** Use Go generics (1.18+):
```go
func samplePoints[T PricePoint](points []T, targetPoints int) []T {
    // Unified sampling logic
}

// Then use:
sampled := samplePoints(timeseriesPoints, maxPoints)
sampled := samplePoints(dailyPoints, maxPoints)
```

**Estimated Effort:** 1-2 hours

---

#### Issue 4.2: Batch Insert Logic (4 duplicates)
**Files:**
- `internal/repository/price_repository.go:442-457` (5m)
- `internal/repository/price_repository.go:458-473` (1h)
- `internal/repository/price_repository.go:474-489` (6h)
- `internal/repository/price_repository.go:490-505` (24h)

**Analysis:** Identical batch insertion for different table types.

**Recommendation:** Extract to generic helper (see Issue 3.2 fix).

**Estimated Effort:** Covered by Issue 3.2 refactor

---

### 5. Memory Optimization - `govet` (fieldalignment) (15 issues)

Struct field ordering could save 8-48 bytes per instance.

**Impact:** LOW-MEDIUM - Minor performance gains, but good practice

**Files:**
- `internal/services/icon_url_test.go:6` (48→40 bytes, save 8 bytes)
- `internal/services/price_service.go:242` (32→24 bytes, save 8 bytes)
- `internal/services/sse_hub.go:10, 19, 28, 39` (multiple structs)
- `internal/services/wiki_prices_client.go:35, 68, 93` (multiple structs)
- `tests/testutil/noop_cache.go:13` (32→8 bytes, save 24 bytes)
- `tests/testutil/postgres.go:28` (48→32 bytes, save 16 bytes)
- `tests/unit/service_cache_test.go:19, 98, 153` (multiple test structs)
- Multiple test structs in `tests/unit/utils_test.go`

**Recommendation:** Reorder fields to minimize padding.

**Example Fix:**
```go
// ❌ Before (48 bytes)
type SSEHub struct {
    clients     map[string]*SSEClient  // 8 bytes
    mu          sync.RWMutex           // 24 bytes
    register    chan *SSEClient        // 8 bytes
    unregister  chan string            // 8 bytes
}

// ✅ After (48 bytes - optimal)
type SSEHub struct {
    mu          sync.RWMutex           // 24 bytes (largest first)
    clients     map[string]*SSEClient  // 8 bytes
    register    chan *SSEClient        // 8 bytes
    unregister  chan string            // 8 bytes
}
```

**Tool:** Use `fieldalignment -fix` command to auto-fix:
```bash
go install golang.org/x/tools/go/analysis/passes/fieldalignment/cmd/fieldalignment@latest
fieldalignment -fix ./internal/services/...
```

**Estimated Effort:** 30 minutes (auto-fix + verify)

---

### 6. Performance - `gocritic` (rangeValCopy) (1 issue)

**File:** `internal/services/price_service.go:392`

```go
for _, item := range allItems {  // Copies 184 bytes per iteration
    // Process item
}
```

**Recommendation:**
```go
for i := range allItems {
    item := &allItems[i]  // Use pointer instead
    // Process item
}
```

**Estimated Effort:** 5 minutes

---

## 🟢 Low Priority Issues

### 7. Line Length - `lll` (24 issues)

Lines exceeding 120 characters. Mostly function signatures and log statements.

**Impact:** LOW - Readability issue only

**Files:**
- `cmd/api/main.go:132`
- `internal/handlers/item_handler.go:22`
- `internal/middleware/cors.go:18`
- `internal/models/types.go:27`
- `internal/repository/interfaces.go:68, 71`
- `internal/repository/item_repository.go:175, 191`
- Multiple lines in `internal/repository/price_repository.go`
- Multiple lines in `internal/services/wiki_prices_client.go`
- Multiple lines in `tests/testutil/postgres.go`

**Recommendation:** Break long lines, especially:
1. Function signatures → multi-line parameters
2. Log statements → multi-line field lists
3. SQL queries → use heredocs or multi-line strings

**Estimated Effort:** 1-2 hours

---

### 8. Style Issues - `gocritic` (5 issues)

#### httpNoBody (tests only)
All test files use `nil` for request body instead of `http.NoBody`.

**Impact:** VERY LOW - Tests work fine with `nil`

**Recommendation:** Either fix or add to test exclusions in `.golangci.yml`.

---

#### paramTypeCombine (2 issues)
**Files:**
- `internal/services/cache_service.go:41`
- `tests/unit/service_cache_test.go:39`

```go
// Before
func Set(ctx context.Context, key string, value string, exp time.Duration) error

// After
func Set(ctx context.Context, key, value string, exp time.Duration) error
```

**Estimated Effort:** 2 minutes

---

#### ifElseChain (1 issue)
**File:** `internal/middleware/logger.go:51`

```go
// Rewrite if-else chain as switch
if statusCode >= 500 {
    logLevel = "error"
} else if statusCode >= 400 {
    logLevel = "warn"
} else {
    logLevel = "info"
}

// To:
switch {
case statusCode >= 500:
    logLevel = "error"
case statusCode >= 400:
    logLevel = "warn"
default:
    logLevel = "info"
}
```

**Estimated Effort:** 2 minutes

---

#### unnecessaryDefer (1 issue)
**File:** `tests/unit/utils_test.go:145`

```go
defer logger.Sync()
return  // Right after defer

// Fix: Just call directly
logger.Sync()
return
```

**Estimated Effort:** 1 minute

---

### 9. Unused Code - `unused` & `revive` (30+ issues)

#### Unused Field (1 issue)
**File:** `internal/services/price_service.go:245`
```go
type timeseriesSource struct {
    timestep string
    seedStep string  // ← Never used
}
```

**Recommendation:** Remove if truly unused, or explain purpose with comment.

---

#### Unused Test Parameters (29 issues)
All in test files - parameters not used in test functions.

**Files:**
- `internal/utils/helpers.go:20` - `MeasureTime(name string)`
- `tests/unit/utils_test.go:311` - `TestMeasureTime(t *testing.T)`
- All `tests/testutil/noop_*.go` - Mock implementations
- Multiple test handlers in `tests/unit/middleware_test.go`

**Recommendation:** Rename to `_`:
```go
func TestMeasureTime(_ *testing.T) {  // t not used
func (c *NoopCache) Get(_ context.Context, key string) (string, error) {
func handler(_ *fiber.Ctx) error {
```

**Estimated Effort:** 15 minutes

---

#### Unused Writes (4 issues)
**File:** `tests/unit/models_test.go:96, 97, 114, 116`

Test struct fields written but never read - likely test setup that's incomplete.

**Recommendation:** Either use the fields in assertions or remove them.

---

### 10. Constant Extraction - `goconst` (1 issue)

**File:** `internal/handlers/health_handler.go:65`

String "degraded" appears 4 times.

**Recommendation:**
```go
const (
    statusHealthy  = "healthy"
    statusDegraded = "degraded"
    statusUnhealthy = "unhealthy"
)
```

**Estimated Effort:** 5 minutes

---

### 11. Model Organization - `revive` (max-public-structs) (1 issue)

**File:** `internal/models/price.go:1`

More than 10 public structs in one package.

**Analysis:** 
- Price models have 12+ public structs (CurrentPrice, PriceLatest, timeseries types, etc.)
- All related to price data models

**Recommendation:** Either:
1. Split into sub-packages: `models/price/current.go`, `models/price/timeseries.go`
2. Increase limit in `.golangci.yml` to 15 (acceptable for model packages)
3. Add `//nolint` to package (models naturally have many types)

**Estimated Effort:** 2 hours (refactor) or 2 minutes (config/nolint)

---

### 12. Config Deprecation Warnings (3 warnings)

**Not errors, but should be fixed:**

```yaml
# Deprecated options in .golangci.yml
run.skip-files → issues.exclude-files
run.skip-dirs → issues.exclude-dirs
output.uniq-by-line → issues.uniq-by-line
```

**Recommendation:** Update config file.

**Estimated Effort:** 2 minutes

---

### 13. Linter Deprecation (1 warning)

`exportloopref` is deprecated since Go 1.22 (loopvar feature built-in).

**Recommendation:** Remove from enabled linters in `.golangci.yml`.

**Estimated Effort:** 1 minute

---

## 📊 Summary & Prioritization

### Priority 1: Critical (Fix Now)
| Issue | Count | Effort | Files |
|-------|-------|--------|-------|
| Error handling (`errorlint`) | 4 | 30 min | config, repository, services |
| Unchecked errors (`errcheck`) | 13 | 1 hour | services, handlers |

**Total P1:** 17 issues, ~1.5 hours

---

### Priority 2: Performance & Maintainability
| Issue | Count | Effort | Impact |
|-------|-------|--------|--------|
| Cognitive complexity | 4 | 4-8 hours | Maintainability |
| Code duplication | 5 groups | 2-3 hours | DRY principle |
| Field alignment | 15 | 30 min | Memory usage |
| Range copy | 1 | 5 min | Performance |

**Total P2:** ~25 issues, 7-12 hours

---

### Priority 3: Style & Cleanup
| Issue | Count | Effort |
|-------|-------|--------|
| Line length | 24 | 1-2 hours |
| Unused parameters | 29 | 15 min |
| Style (gocritic) | 5 | 15 min |
| Config updates | 4 | 5 min |

**Total P3:** ~62 issues, 2-3 hours

---

## 🎯 Recommended Action Plan

### Week 1: Critical Fixes
1. **Day 1:** Fix all `errorlint` issues (use `errors.Is()`)
2. **Day 2:** Add `//nolint:errcheck` comments for intentional cache error ignores
3. **Day 3:** Test all error handling changes

### Week 2: Performance & Refactoring
1. **Refactor `GetPriceHistory`** (high complexity)
2. **Extract batch insert logic** (duplication + complexity)
3. **Run `fieldalignment -fix`** (memory optimization)

### Week 3: Polish
1. Fix line lengths
2. Clean up unused parameters
3. Update config deprecations
4. Final linting pass

---

## 📝 Quick Wins (< 30 minutes total)

Do these first for immediate improvement:

1. ✅ Update `.golangci.yml` (remove `exportloopref`, fix deprecated options) - 3 min
2. ✅ Fix `paramTypeCombine` issues - 2 min
3. ✅ Fix `ifElseChain` in logger middleware - 2 min
4. ✅ Fix `unnecessaryDefer` in test - 1 min
5. ✅ Add `const` for "degraded" status - 5 min
6. ✅ Fix `rangeValCopy` (use pointer) - 5 min
7. ✅ Rename unused test parameters to `_` - 15 min

**Total:** 33 minutes, 40+ issues resolved

---

## 🔧 Automation Opportunities

### Scripts to Create:

1. **`scripts/lint-fix-easy.sh`** - Auto-fix quick wins
2. **`scripts/add-nolint-cache.sh`** - Add nolint to cache operations
3. **`scripts/fix-line-lengths.sh`** - Break long lines

### CI/CD Integration:

Add to GitHub Actions:
```yaml
- name: Check for new lint issues
  run: golangci-lint run --new-from-rev=origin/main
```

This catches new issues without forcing old code cleanup.

---

## 📚 Resources

- **Error handling:** https://go.dev/blog/go1.13-errors
- **Generics:** https://go.dev/blog/intro-generics
- **Field alignment:** https://pkg.go.dev/golang.org/x/tools/go/analysis/passes/fieldalignment
- **Go best practices:** https://github.com/uber-go/guide/blob/master/style.md

---

**Next Steps:** Review this report and let me know which priority level to start with!
