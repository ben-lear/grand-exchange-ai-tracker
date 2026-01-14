# Testing Guide

## Unit Tests

The project includes comprehensive unit tests for models and repositories.

### Quick Test (No CGO Required)

Test models only (works on all platforms):
```bash
go test ./tests/unit/models_test.go -v
```

### Full Test Suite (Requires CGO)

Repository tests use SQLite for in-memory testing, which requires CGO and a C compiler.

#### On Linux/macOS:
```bash
CGO_ENABLED=1 go test ./tests/unit/... -v
```

#### On Windows:

**Option 1: Install MinGW-w64**
1. Install MinGW-w64: https://www.mingw-w64.org/downloads/
2. Add to PATH: `C:\mingw64\bin`
3. Run tests:
```powershell
$env:CGO_ENABLED="1"
go test ./tests/unit/... -v
```

**Option 2: Use Docker**
Run tests in Docker container (no local C compiler needed):
```powershell
docker-compose run --rm backend go test ./tests/unit/... -v
```

**Option 3: Integration Tests**
Run integration tests against real PostgreSQL database (recommended for Windows):
```bash
# Start PostgreSQL
docker-compose up -d postgres

# Run integration tests
go test ./tests/integration/... -v
```

## Test Structure

```
tests/
├── unit/           # Unit tests (models + repositories)
│   ├── models_test.go       # Model tests (no CGO)
│   └── repository_test.go   # Repository tests (needs CGO)
└── integration/    # Integration tests (real DB)
```

## Running Tests in CI/CD

In GitHub Actions or other CI systems:
```yaml
- name: Run tests
  run: |
    CGO_ENABLED=1 go test ./tests/unit/... -v
    go test ./tests/integration/... -v
```

## Test Coverage

Get test coverage report:
```bash
go test ./... -coverprofile=coverage.out
go tool cover -html=coverage.out
```

## Current Test Status

✅ **Model Tests** - 6 test suites (no CGO required)
- TestTimePeriod_IsValid
- TestTimePeriod_Duration
- TestDefaultItemListParams
- TestItemModel
- TestCurrentPriceModel
- TestPriceHistoryModel

✅ **Repository Tests** - 8 test suites (requires CGO or Docker)
- TestItemRepository_Create
- TestItemRepository_GetByItemID
- TestItemRepository_Upsert
- TestItemRepository_Search
- TestItemRepository_GetAll
- TestPriceRepository_UpsertCurrentPrice
- TestPriceRepository_GetAllCurrentPrices
- Additional integration tests recommended

## Recommended Testing Strategy

**For Development (Windows):**
1. Run model tests locally (no CGO): `go test ./tests/unit/models_test.go -v`
2. Run full suite in Docker: `docker-compose run --rm backend go test ./tests/unit/... -v`

**For Production/CI:**
1. Use Linux-based CI runners (CGO available by default)
2. Run all tests: `CGO_ENABLED=1 go test ./... -v`
