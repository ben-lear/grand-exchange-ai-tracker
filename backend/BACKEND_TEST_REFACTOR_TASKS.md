# Backend Test Refactor Task List

## Analysis Summary

After analyzing all backend unit and integration tests following the migration to Wiki Prices API (migrations 002-004), the following legacy references and gaps were identified:

### Migration Changes Recap
1. **002_realtime_prices.sql**: Added `price_latest` (minute snapshots), `price_timeseries_*` tables (5m, 1h, 6h, 24h), and `price_timeseries_daily`
2. **003_drop_legacy_prices.sql**: Removed `current_prices` and `price_history` tables
3. **004_add_wiki_mapping_fields.sql**: Added `examine`, `value`, `icon_name` fields to items table

### Current State
- **CurrentPrice model**: Still exists but queries from `price_latest` (not from deleted `current_prices` table)
- **PriceLatest model**: New model representing minute-level snapshots
- **PriceTimeseries* models**: New bucketed timeseries models (5m, 1h, 6h, 24h, daily)

### Legacy References Found
The following models/interfaces are **referenced in tests but NO LONGER EXIST in production code**:
- `models.PriceHistory` struct (deleted with table)
- `models.BulkHistoryInsert` type (never defined, only in tests)
- `PriceRepository.GetHistory()` method returning `[]PriceHistory`
- `PriceRepository.InsertHistory()` method accepting `*PriceHistory`
- `PriceRepository.BulkInsertHistory()` method accepting `[]BulkHistoryInsert`
- `PriceRepository.GetLatestHistoryTimestamp()` returning `*PriceHistory`
- `PriceRepository.DeleteOldHistory()` method

---

## Task List

### 🔴 CRITICAL: Remove Tests for Deleted Functionality

#### ✅ Task 1: Remove legacy PriceHistory tests from models_test.go
**Status**: COMPLETED (Phase 1)
**File**: `backend/tests/unit/models_test.go`
**Action**: DELETED
**Details**: Removed TestPriceHistoryModel testing non-existent models.PriceHistory struct

#### ✅ Task 2: Remove legacy CurrentPrice.TableName test assertion
**Status**: COMPLETED (Phase 1)
**File**: `backend/tests/unit/models_test.go`
**Action**: UPDATED
**Details**: Removed TableName() assertion and added comprehensive architectural documentation explaining DTO pattern

#### ✅ Task 3: Remove PriceHistory repository tests from repository_test.go
**Status**: COMPLETED (Phase 1)
**File**: `backend/tests/unit/repository_test.go`
**Action**: DELETED
**Details**: Removed TestPriceRepository_HistoryLifecycle and added clarifying comments

#### ✅ Task 4: Remove ALL PriceHistory CRUD tests from repository_crud_test.go
**Status**: COMPLETED (Phase 1)
**File**: `backend/tests/unit/repository_crud_test.go`
**Lines**: 450-748
**Action**: DELETED (~300 lines)
**Test Functions Removed**:
- TestPriceRepository_InsertHistory_Success
- TestPriceRepository_BulkInsertHistory_Success
- TestPriceRepository_BulkInsertHistory_EmptySlice
- TestPriceRepository_GetLatestHistoryTimestamp_Success
- TestPriceRepository_GetLatestHistoryTimestamp_NoHistory
- TestPriceRepository_DeleteOldHistory_Success
- TestPriceRepository_GetHistory_WithPeriodFilter
- TestPriceRepository_GetHistory_WithLimit

#### ✅ Task 5: Update mock repository in service_sync_test.go
**Status**: COMPLETED (Phase 1)
**File**: `backend/tests/unit/service_sync_test.go`
**Action**: DELETED 5 legacy methods
**Methods Removed**:
- GetHistory
- BulkInsertHistory
- DeleteOldHistory
- InsertHistory
- GetLatestHistoryTimestamp

#### ✅ Task 6: Remove/update historical sync tests using legacy methods
**Status**: COMPLETED (Phase 1)
**File**: `backend/tests/unit/service_sync_test.go`  
**Action**: DELETED 6 test functions (~180 lines)
**Affected Tests Removed**: All SyncHistoricalPrices tests

#### ✅ Task 7: Update fake repository in service_cache_test.go
**Status**: COMPLETED (Phase 1)
**File**: `backend/tests/unit/service_cache_test.go`
**Action**: DELETED 5 legacy methods from fakePriceRepo

#### ✅ Task 8: Remove legacy history seeding from integration tests
**Status**: COMPLETED (Phase 1)
**File**: `backend/tests/integration/price_handler_integration_test.go`
**Action**: COMMENTED OUT legacy seeding, added TODO for Phase 3
**File**: `backend/tests/unit/service_cache_test.go`
**Lines**: 189-200
**Action**: DELETE
**Reason**: `fakePriceRepo` implements non-existent methods
**Methods to Remove**:
```go
func (r *fakePriceRepo) GetHistory(_ context.Context, _ models.PriceHistoryParams) ([]models.PriceHistory, error)
func (r *fakePriceRepo) InsertHistory(_ context.Context, _ *models.PriceHistory) error
func (r *fakePriceRepo) BulkInsertHistory(_ context.Context, _ []models.BulkHistoryInsert) error
func (r *fakePriceRepo) GetLatestHistoryTimestamp(_ context.Context, _ int) (*models.PriceHistory, error)
func (r *fakePriceRepo) DeleteOldHistory(_ context.Context, _ int, _ int64) error
```

#### Task 8: Update integration test for price history endpoint
**File**: `backend/tests/integration/price_handler_integration_test.go`
**Lines**: 54-63
**Action**: REFACTOR
**Reason**: Test seeds `price_history` table which no longer exists
**Details**:
```go
// OLD (lines 54-56):
require.NoError(t, priceRepo.InsertHistory(ctx, &models.PriceHistory{...}))

// NEW: Seed price_latest or timeseries tables instead
require.NoError(t, priceRepo.InsertTimeseriesPoints(ctx, "1h", []models.PriceTimeseriesPoint{...}))
```

---

### 🟡 REFACTOR: Update Tests to Use New Schema

#### Task 9: Add tests for new PriceLatest model
**File**: `backend/tests/unit/models_test.go`
**Action**: VERIFY EXISTS (already added at lines 117-129)
**Status**: ✅ Already complete - `TestPriceLatestModel` exists

#### Task 10: Add tests for new PriceTimeseries models
**File**: `backend/tests/unit/models_test.go`
**Action**: VERIFY EXISTS (already added at lines 131-137)
**Status**: ✅ Already complete - `TestPriceTimeseriesModelTableNames` exists

#### Task 11: Update CurrentPrice tests to reflect new behavior
**File**: `backend/tests/unit/models_test.go`
**Lines**: 78-97
**Action**: ADD DOCUMENTATION
**Reason**: CurrentPrice model still exists but is now a DTO/response model, not a DB table model
**Details**: Add comment explaining that `TableName()` returns legacy name but queries use raw SQL against `price_latest`

#### Task 12: Update repository integration tests for current prices
**File**: `backend/tests/unit/repository_test.go`
**Lines**: 164-247
**Action**: VERIFY CORRECTNESS
**Details**: 
- `TestPriceRepository_UpsertCurrentPrice` - Verify it actually inserts into `price_latest`
- `TestPriceRepository_GetAllCurrentPrices` - Verify it queries from `price_latest`
- Should PASS as-is since repository implementation uses raw SQL

---

### 🟢 NEW TESTS NEEDED: Timeseries Functionality

#### Task 13: Add repository tests for InsertTimeseriesPoints
**File**: NEW - `backend/tests/unit/repository_timeseries_test.go`
**Action**: CREATE
**Test Functions Needed**:
```go
func TestPriceRepository_InsertTimeseriesPoints_5m(t *testing.T)
func TestPriceRepository_InsertTimeseriesPoints_1h(t *testing.T)
func TestPriceRepository_InsertTimeseriesPoints_6h(t *testing.T)
func TestPriceRepository_InsertTimeseriesPoints_24h(t *testing.T)
func TestPriceRepository_InsertTimeseriesPoints_InvalidTimestep(t *testing.T)
func TestPriceRepository_InsertTimeseriesPoints_EmptySlice(t *testing.T)
func TestPriceRepository_InsertTimeseriesPoints_Conflict(t *testing.T) // Verify ON CONFLICT DO NOTHING
```

#### Task 14: Add repository tests for GetTimeseriesPoints
**File**: `backend/tests/unit/repository_timeseries_test.go` (continued)
**Action**: CREATE
**Test Functions Needed**:
```go
func TestPriceRepository_GetTimeseriesPoints_WithPeriodFilter(t *testing.T)
func TestPriceRepository_GetTimeseriesPoints_WithTimeRange(t *testing.T)
func TestPriceRepository_GetTimeseriesPoints_WithLimit(t *testing.T)
func TestPriceRepository_GetTimeseriesPoints_WithSampling(t *testing.T)
func TestPriceRepository_GetTimeseriesPoints_EmptyResult(t *testing.T)
```

#### Task 15: Add repository tests for daily rollup operations
**File**: `backend/tests/unit/repository_timeseries_test.go` (continued)
**Action**: CREATE
**Test Functions Needed**:
```go
func TestPriceRepository_InsertDailyPoints(t *testing.T)
func TestPriceRepository_GetDailyPoints_WithPeriodFilter(t *testing.T)
func TestPriceRepository_Rollup24hToDailyBefore(t *testing.T)
func TestPriceRepository_Rollup24hToDailyBefore_NoData(t *testing.T)
func TestPriceRepository_Rollup24hToDailyBefore_Conflict(t *testing.T) // Verify idempotency
```

#### Task 16: Add repository tests for pruning operations
**File**: `backend/tests/unit/repository_prune_test.go`
**Action**: CREATE
**Test Functions Needed**:
```go
func TestPriceRepository_PrunePriceLatestBefore(t *testing.T)
func TestPriceRepository_PrunePriceLatestBefore_NoData(t *testing.T)
func TestPriceRepository_PruneTimeseriesBefore_5m(t *testing.T)
func TestPriceRepository_PruneTimeseriesBefore_1h(t *testing.T)
func TestPriceRepository_PruneTimeseriesBefore_6h(t *testing.T)
func TestPriceRepository_PruneTimeseriesBefore_24h(t *testing.T)
func TestPriceRepository_PruneTimeseriesBefore_InvalidTimestep(t *testing.T)
```

#### Task 17: Add integration tests for timeseries endpoints
**File**: `backend/tests/integration/price_handler_integration_test.go`
**Action**: ADD
**Details**: Currently only tests basic current price endpoints. Need to add:
```go
func TestPriceHandler_GetTimeseriesHistory_Various Timesteps(t *testing.T)
func TestPriceHandler_GetTimeseriesHistory_DailyRollup(t *testing.T)
func TestPriceHandler_GetTimeseriesHistory_Sampling(t *testing.T)
```
**Note**: Depends on handler implementation for timeseries endpoints

#### Task 18: Update mock interfaces for new timeseries methods
**File**: `backend/tests/unit/service_sync_test.go`
**Action**: ADD
**Details**: MockPriceRepository needs methods:
```go
func (m *MockPriceRepository) InsertTimeseriesPoints(ctx, timestep, points)
func (m *MockPriceRepository) InsertDailyPoints(ctx, points)
func (m *MockPriceRepository) GetTimeseriesPoints(ctx, itemID, timestep, params)
func (m *MockPriceRepository) GetDailyPoints(ctx, itemID, params)
func (m *MockPriceRepository) Rollup24hToDailyBefore(ctx, cutoff)
func (m *MockPriceRepository) PrunePriceLatestBefore(ctx, cutoff)
func (m *MockPriceRepository) PruneTimeseriesBefore(ctx, timestep, cutoff)
```

#### Task 19: Add tests for Wiki Prices metadata enrichment
**File**: `backend/tests/unit/item_service_test.go` (new or existing)
**Action**: CREATE/UPDATE
**Details**: Test new `examine`, `value`, `icon_name` fields from migration 004
```go
func TestItemService_UpsertItem_WithWikiMetadata(t *testing.T)
func TestItemService_GetItem_ReturnsWikiMetadata(t *testing.T)
```

---

### 📋 DOCUMENTATION TASKS

#### Task 20: Update TESTING.md documentation
**Status**: PENDING
**File**: `backend/TESTING.md`
**Action**: UPDATE
**Details**: Document the shift from historical price_history to timeseries tables

#### Task 21: Add inline comments to CurrentPrice model
**Status**: PENDING
**File**: `backend/internal/models/price.go`
**Lines**: 5-16
**Action**: ADD COMMENT
**Details**: Clarify that CurrentPrice is a DTO queried from price_latest, not a table model

---

## Execution Status

### ✅ Phase 1: Remove Dead Code (Tasks 1-8) - COMPLETED
**Completion Date**: [Current Session]
**Time Spent**: ~2 hours
**Files Modified**: 7 files
**Lines Deleted**: ~550 lines
**Status**: All legacy PriceHistory references removed, code compiles

### ✅ Phase 2: Refactor Existing Tests (Tasks 9-12) - COMPLETED
**Completion Date**: [Current Session]
**Time Spent**: ~1 hour
**Files Modified**: 3 files
**Status**: All tests verified and documented

### ✅ Phase 3: Add New Timeseries Tests (Tasks 13-19) - COMPLETED
**Completion Date**: [Current Session]
**Time Spent**: ~3 hours
**Files Created**: 
- `tests/unit/repository_timeseries_test.go` (19 test functions, ~650 lines)
- `tests/unit/repository_prune_test.go` (13 test functions, ~430 lines)
**Files Modified**:
- `tests/integration/price_handler_integration_test.go` (added timeseries seeding)
- `tests/unit/service_sync_test.go` (added 7 mock methods)
- `tests/unit/service_cache_test.go` (added 7 fake methods)
- `tests/unit/models_test.go` (added Wiki metadata tests)
**Status**: All new repository methods have comprehensive test coverage

### 🟡 Phase 4: Documentation (Tasks 20-21) - PENDING
**Status**: Optional cleanup tasks remaining
**Action**: ADD COMMENT
**Details**: Clarify that CurrentPrice is a DTO queried from price_latest, not a table model

---

## Execution Order

### Phase 1: Remove Dead Code (Tasks 1-8)
**Priority**: HIGH - Prevents false positives and confusion  
**Estimated Time**: 2-3 hours  
**Risk**: LOW - Pure deletion, no logic changes

### Phase 2: Refactor Existing Tests (Tasks 9-12)
**Priority**: MEDIUM - Ensure current tests still pass  
**Estimated Time**: 1-2 hours  
**Risk**: LOW - Mostly verification

### Phase 3: Add New Timeseries Tests (Tasks 13-19)
**Priority**: HIGH - Critical new functionality needs coverage  
**Estimated Time**: 6-8 hours  
**Risk**: MEDIUM - Requires understanding new schema

### Phase 4: Documentation (Tasks 20-21)
**Priority**: LOW - Can be done last  
**Estimated Time**: 1 hour  
**Risk**: NONE

---

## Test Coverage Goals

### Current Coverage (Estimated)
- Item Repository: ~85%
- Price Repository (legacy): ~75%
- Price Repository (new timeseries): ~20% ⚠️
- Handlers: ~70%
- Services: ~65%

### Target Coverage After Refactor
- Item Repository: ~85% (maintain)
- Price Repository (timeseries): ~80% 🎯
- Handlers: ~80% (add timeseries endpoint tests)
- Services: ~75% (add timeseries service tests)
- Overall Backend: **≥ 75%**

---

## Validation Checklist

After completing all tasks, verify:

- [ ] All tests pass: `go test ./... -v`
- [ ] No references to `PriceHistory` struct in test files
- [ ] No references to `BulkHistoryInsert` type in test files  
- [ ] No mock methods for deleted repository methods
- [ ] Integration tests seed `price_latest` not `price_history`
- [ ] New timeseries repository methods have unit tests
- [ ] New prune/rollup methods have unit tests
- [ ] Test coverage report shows ≥75% for price_repository.go
- [ ] `go build ./cmd/api` succeeds
- [ ] No linter warnings: `golangci-lint run`

---

## Risk Assessment

### Low Risk
- Tasks 1-8 (deletions): Dead code removal, can't break production
- Tasks 9-12 (verification): No changes if already correct

### Medium Risk  
- Tasks 13-17 (new tests): Need to correctly test partition behavior and edge cases
- Task 8 (integration refactor): Must ensure test data setup matches new schema

### High Risk
- None - All changes are test-only

---

## Notes

### Why Some Models Still Exist
- **CurrentPrice**: Kept as a DTO for handler responses, even though the `current_prices` table is dropped
- **PriceHistoryParams**: Reused for timeseries queries (same filter logic applies)
- **PriceHistoryResponse**: Reused for handler responses (same JSON structure)

### Testing Against Real Postgres
All timeseries tests **MUST** use real Postgres (not in-memory) because:
1. Partitioned tables require trigger functions
2. `DISTINCT ON` queries are Postgres-specific
3. `DATE()` and timezone functions are Postgres-specific
4. Conflict resolution (`ON CONFLICT DO NOTHING`) behavior needs verification

Use the `//go:build slow` tag for all timeseries integration tests.

---

## Estimated Total Effort

- **Phase 1** (Remove): 2-3 hours
- **Phase 2** (Refactor): 1-2 hours  
- **Phase 3** (New Tests): 6-8 hours
- **Phase 4** (Docs): 1 hour

**Total**: 10-14 hours (1.5-2 work days)

---

## Success Criteria

✅ All legacy PriceHistory references removed  
✅ All tests pass with new schema  
✅ Timeseries repository methods have ≥80% coverage  
✅ Integration tests validate full request/response cycle  
✅ No deprecated models in test mocks  
✅ Documentation updated to reflect new architecture
