# Testing Guide

## Overview

The backend test suite runs against a real PostgreSQL database started on-demand via Testcontainers (Docker). No CGO or SQLite dependencies are required.

## Prerequisites

- Docker installed (Docker Desktop on Windows)
- Docker daemon running
- Go 1.24.0+ installed

## Quick Start

Use the provided test scripts which handle everything automatically:

**Linux/macOS:**
```bash
chmod +x test.sh
./test.sh
```

**Windows PowerShell:**
```powershell
.\test.ps1
```

These scripts will:
1. Verify Docker is reachable
2. Run the Go test suite

The tests themselves start and tear down an ephemeral PostgreSQL 16 container as needed.

## Test Suites

✅ **Model Tests** (6 test suites) - No database required
- TestTimePeriod_IsValid - Validates time period enum
- TestTimePeriod_Duration - Validates duration calculation
- TestDefaultItemListParams - Tests default pagination params
- TestItemModel - Tests Item struct validation
- TestCurrentPriceModel - Tests CurrentPrice struct
- TestPriceHistoryModel - Tests PriceHistory struct

✅ **Repository Tests** (7 test suites) - Uses PostgreSQL via Docker
- TestItemRepository_Create - Item creation
- TestItemRepository_GetByItemID - Item retrieval by ID
- TestItemRepository_Upsert - Insert/update item
- TestItemRepository_Search - Item search by name
- TestItemRepository_GetAll - Pagination and filtering
- TestPriceRepository_UpsertCurrentPrice - Price upsert
- TestPriceRepository_GetAllCurrentPrices - Bulk price retrieval

**Total: 13 test suites, all passing ✓**

## Manual Testing

## Validation Standard

When validating changes to tests (or any backend change that could affect behavior), the standard is:

1. Run **fast** tests for quick feedback (no Docker)
2. Run the **full** suite (includes `-tags=slow`, requires Docker)

Even though the full suite includes the fast tests, we still run the fast suite first because it fails faster and doesn’t require Docker.

### Run Fast Tests (Default)
Runs unit tests that do not require Docker/Postgres.

```bash
go test ./... -v -count=1
```

### Run Full Test Suite (Includes Docker/Postgres)
Runs everything, including Postgres/Testcontainers-backed tests.

```bash
go test ./... -v -count=1 -tags=slow
```

## Coverage

Coverage is generated via Go's built-in coverage tooling.

Important: we use `-coverpkg=./...` so that coverage reflects execution of code across the whole backend module, not just the package under test.

Note: To generate a *combined* coverage profile across many packages, the scripts use `GOCOVERDIR` + `go tool covdata` under the hood.

### Fast Coverage (No Docker)

```bash
mkdir -p coverage
rm -rf coverage/cov_fast
mkdir -p coverage/cov_fast

GOCOVERDIR="$(pwd)/coverage/cov_fast" go test ./... -v -count=1 -cover -covermode=atomic -coverpkg=./...
go tool covdata textfmt -i coverage/cov_fast -o coverage/fast.out
go tool cover -html=coverage/fast.out -o coverage/fast.html
```

### Full Coverage (Includes Docker/Postgres)

```bash
mkdir -p coverage
rm -rf coverage/cov_full
mkdir -p coverage/cov_full

GOCOVERDIR="$(pwd)/coverage/cov_full" go test ./... -v -count=1 -tags=slow -cover -covermode=atomic -coverpkg=./...
go tool covdata textfmt -i coverage/cov_full -o coverage/full.out
go tool cover -html=coverage/full.out -o coverage/full.html
```

### Using the Scripts

**Linux/macOS:**
```bash
./test.sh --coverage
./test.sh --fast --coverage
```

**Windows PowerShell:**
```powershell
./test.ps1 -Coverage
./test.ps1 -Fast -Coverage
```

### Windows PowerShell
```powershell
# Fast
go test ./... -v -count=1

# Full (includes Postgres/Testcontainers)
go test ./... -v -count=1 -tags=slow
```

### Model Tests Only (No Database)
```bash
go test ./tests/unit/models_test.go -v
```

## Test Structure

```
backend/tests/
├── unit/
│   ├── models_test.go       # Model tests (no database needed)
│   └── repository_test.go   # Repository tests (PostgreSQL)
├── integration/             # Integration tests (Phase 6)
└── e2e/                     # End-to-end tests (Phase 6)
```

## How Postgres Works In Tests

- The suite uses Testcontainers to launch `postgres:16-alpine` on a random host port.
- Migrations are applied automatically from `backend/migrations/001_init.sql`.
- Tests truncate tables between runs to keep isolation.

This behavior is implemented in `backend/tests/testutil/postgres.go`.

## Testing Strategy

### Development Workflow
1. **Quick feedback**: Run fast tests (`go test ./... -v`)
2. **Full validation**: Run full suite with Docker (`go test ./... -v -tags=slow` or use `.\test.ps1` / `./test.sh`)
3. **Continuous**: Use `-count=1` to disable caching for fresh results

### CI/CD Integration
```yaml
# Example GitHub Actions workflow (docker-enabled runner)
- name: Run backend tests
  run: go test ./... -v -count=1
```

## Why Docker PostgreSQL Instead of SQLite?

1. **Production Parity**: Tests run against the same database engine as production
2. **No CGO Required**: Avoids MinGW/GCC requirements on Windows
3. **Full Feature Support**: Tests use real PostgreSQL features (partitioning, CTEs, etc.)
4. **Consistent Results**: Same behavior across all platforms
5. **Simple Setup**: Just run `go test` with Docker available

## Troubleshooting

### Tests fail with connection errors
- Ensure Docker is running: `docker info`
- Ensure the `postgres:16-alpine` image can be pulled
- If Docker Desktop is in WSL2 mode, ensure your terminal environment can reach Docker

### Tests fail with foreign key errors
- Tests create clean database state per test
- If you see FK errors, the test setup may be incomplete
- Check that tests create parent records before children (items before prices)

### Container not starting
- Testcontainers uses random host ports, so port 5432 conflicts are unlikely.
- Check Docker resources (CPU/RAM) and pull permissions.

## Next Steps

- **Phase 3**: Add service layer tests with mocked repositories
- **Phase 4**: Add handler tests with mocked services  
- **Phase 6**: Add integration tests for end-to-end API workflows
