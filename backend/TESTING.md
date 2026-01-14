# Testing Guide

## Overview

The backend includes comprehensive unit tests that run against a real PostgreSQL database using Docker. No CGO or SQLite dependencies are required - tests connect to the same PostgreSQL container used in development.

## Prerequisites

- Docker and Docker Compose installed
- Docker daemon running
- Go 1.22+ installed

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
1. Start PostgreSQL container (if not running)
2. Wait for database to be ready (with health checks)
3. Set environment variables
4. Run all unit tests (models + repositories)

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

### Run All Tests
```bash
# Ensure PostgreSQL is running
docker-compose up -d postgres

# Run all tests
POSTGRES_HOST=localhost \
POSTGRES_PORT=5432 \
POSTGRES_USER=osrs_tracker \
POSTGRES_PASSWORD=changeme \
POSTGRES_DB=osrs_ge_tracker \
go test ./tests/unit/... -v -count=1
```

### Windows PowerShell
```powershell
# Set environment variables
$env:POSTGRES_HOST="localhost"
$env:POSTGRES_PORT="5432"
$env:POSTGRES_USER="osrs_tracker"
$env:POSTGRES_PASSWORD="changeme"
$env:POSTGRES_DB="osrs_ge_tracker"

# Run tests
go test ./tests/unit/... -v -count=1
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

## Testing Strategy

### Development Workflow
1. **Quick feedback**: Run model tests only (`go test ./tests/unit/models_test.go -v`)
2. **Full validation**: Run test script (`.\test.ps1` or `./test.sh`)
3. **Continuous**: Tests use `-count=1` flag to disable caching for fresh results

### CI/CD Integration
```yaml
# Example GitHub Actions workflow
- name: Start PostgreSQL
  run: docker-compose up -d postgres

- name: Wait for PostgreSQL
  run: |
    timeout 60 bash -c 'until docker-compose exec -T postgres pg_isready -U osrs_tracker > /dev/null 2>&1; do sleep 1; done'

- name: Run tests
  env:
    POSTGRES_HOST: localhost
    POSTGRES_PORT: 5432
    POSTGRES_USER: osrs_tracker
    POSTGRES_PASSWORD: changeme
    POSTGRES_DB: osrs_ge_tracker
  run: go test ./tests/unit/... -v -count=1
```

## Why Docker PostgreSQL Instead of SQLite?

1. **Production Parity**: Tests run against the same database engine as production
2. **No CGO Required**: Avoids MinGW/GCC requirements on Windows
3. **Full Feature Support**: Tests use real PostgreSQL features (partitioning, CTEs, etc.)
4. **Consistent Results**: Same behavior across all platforms
5. **Simple Setup**: Just `docker-compose up -d postgres`

## Troubleshooting

### Tests fail with connection errors
- Ensure Docker is running: `docker info`
- Check PostgreSQL is healthy: `docker inspect osrs-ge-postgres --format='{{.State.Health.Status}}'`
- View logs: `docker-compose logs postgres`

### Tests fail with foreign key errors
- Tests create clean database state per test
- If you see FK errors, the test setup may be incomplete
- Check that tests create parent records before children (items before prices)

### Container not starting
- Check port 5432 is not in use: `netstat -an | findstr 5432` (Windows) or `lsof -i :5432` (Linux/macOS)
- Remove old containers: `docker-compose down -v`
- Restart: `docker-compose up -d postgres`

## Next Steps

- **Phase 3**: Add service layer tests with mocked repositories
- **Phase 4**: Add handler tests with mocked services  
- **Phase 6**: Add integration tests for end-to-end API workflows
