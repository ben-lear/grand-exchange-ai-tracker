# OSRS Grand Exchange Tracker - Backend

High-performance Go backend API for tracking Old School RuneScape Grand Exchange item prices and trends.

## Tech Stack

- **Language**: Go 1.24.0+
- **Framework**: Fiber v2 (Express-inspired HTTP framework)
- **Database**: PostgreSQL 16 with GORM ORM
- **Caching**: Redis 7 with go-redis/v9
- **Scheduler**: Robfig Cron v3
- **Logging**: Uber Zap (structured JSON logging)
- **HTTP Client**: Resty v2
- **Configuration**: Viper (12-factor app config)

## Quick Start

### Prerequisites

- Go 1.24.0 or higher
- PostgreSQL 16
- Redis 7
- Make (optional, for convenience commands)

### Environment Setup

1. **Clone and navigate to backend**:
   ```bash
   cd backend
   ```

2. **Copy environment template**:
   ```bash
   cp .env.example .env
   ```

3. **Configure `.env`** (update with your settings):
   ```env
   PORT=8080
   ENVIRONMENT=development
   
   # Database
   POSTGRES_HOST=localhost
   POSTGRES_PORT=5432
   POSTGRES_USER=osrs_tracker
   POSTGRES_PASSWORD=your_password
   POSTGRES_DB=osrs_ge_tracker
   POSTGRES_SSL_MODE=disable
   
   # Cache
   REDIS_HOST=localhost
   REDIS_PORT=6379
   REDIS_PASSWORD=
   REDIS_DB=0
   
   # CORS
   CORS_ORIGINS=http://localhost:5173
   
   # OSRS API
   WIKI_PRICES_BASE_URL=https://prices.runescape.wiki/api/v1/osrs
   
   # SSE Configuration
   SSE_HEARTBEAT_INTERVAL=30s
   SSE_CONNECTION_TIMEOUT=5m
   SSE_MAX_CLIENTS=1000
   ```

4. **Install dependencies**:
   ```bash
   go mod download
   ```

5. **Run database migrations**:
   ```bash
   # Using psql
   psql -U osrs_tracker -d osrs_ge_tracker -f migrations/001_init.sql
   psql -U osrs_tracker -d osrs_ge_tracker -f migrations/002_realtime_prices.sql
   psql -U osrs_tracker -d osrs_ge_tracker -f migrations/003_drop_legacy_prices.sql
   psql -U osrs_tracker -d osrs_ge_tracker -f migrations/004_add_wiki_mapping_fields.sql
   ```

6. **Run the server**:
   ```bash
   go run cmd/api/main.go
   ```

   The API will be available at `http://localhost:8080`

### Development Mode (with hot reload)

Install [Air](https://github.com/cosmtrek/air) for automatic reloading:

```bash
go install github.com/cosmtrek/air@latest
air
```

## API Endpoints

### Health Check
```
GET /health
```

### Items
```
GET /api/v1/items              # List all items (with pagination/filters)
GET /api/v1/items/:id          # Get item by ID
GET /api/v1/items/search?q=    # Search items by name
```

### Prices
```
GET /api/v1/prices/current              # All current prices
GET /api/v1/prices/current/:id          # Current price for specific item
GET /api/v1/prices/history/:id          # Historical prices
    ?period=24h|7d|30d|90d|1y|all       # Time period
    ?sample=true                        # Return sampled data for charts
```

### Real-time (SSE)
```
GET /api/v1/events                      # Server-Sent Events for live price updates
```

## Testing

### Prerequisites

**Docker must be running** for unit tests that use testcontainers (e.g., watchlist tests). Testcontainers automatically starts PostgreSQL in Docker for testing.

- **Windows**: Docker Desktop must be running
- **Linux/macOS**: Docker daemon must be running
- No CGO required - testcontainers works without CGO

### Run all tests

**Note**: First run will be slower as Docker images are downloaded. Subsequent runs use cached containers.

```bash
go test ./...
```

### Run with coverage
```bash
go test ./... -cover
```

### Generate HTML coverage report
```bash
go test ./... -coverprofile=coverage.out
go tool cover -html=coverage.out -o coverage.html
```

### Run specific test package
```bash
go test ./tests/unit/...          # Unit tests (requires Docker for watchlist tests)
go test ./tests/integration/...   # Integration tests (requires Docker + services)
go test ./internal/services/...   # Service tests only (no Docker needed)
```

### Fast tests (skip integration)
```bash
go test -short ./...
```

### Troubleshooting Tests

**If watchlist tests fail:**
1. Ensure Docker Desktop is running
2. Check Docker is accessible: `docker ps`
3. First run downloads `postgres:16-alpine` image (~80MB)
4. Tests reuse shared container for speed

**If Docker is unavailable:**
```bash
# Run only non-Docker tests
go test ./internal/services/... ./tests/testutil/...
```

## Linting

### Run linter
**Windows (PowerShell):**
```powershell
.\lint.ps1                # Run all linters
.\lint.ps1 -Fix           # Run with auto-fix
.\lint.ps1 -Verbose       # Run with verbose output
```

**Unix (Linux/macOS):**
```bash
./lint.sh                 # Run all linters
./lint.sh --fix           # Run with auto-fix
./lint.sh --verbose       # Run with verbose output
```

### Direct golangci-lint commands
```bash
golangci-lint run                    # Run all configured linters
golangci-lint run --fix              # Auto-fix issues where possible
golangci-lint run --fast             # Fast mode (skip slow linters)
golangci-lint run --new              # Only new issues (since last commit)
```

See [LINTING.md](./LINTING.md) for comprehensive linting documentation, IDE integration, and CI/CD setup.

## Project Structure

```
backend/
├── cmd/
│   └── api/
│       └── main.go              # Application entry point
├── internal/
│   ├── config/                  # Configuration loading (Viper)
│   ├── database/                # Database clients (PostgreSQL, Redis)
│   ├── models/                  # Data models and GORM schemas
│   ├── repository/              # Data access layer (interfaces + implementations)
│   ├── services/                # Business logic layer
│   ├── handlers/                # HTTP handlers (Fiber routes)
│   ├── middleware/              # HTTP middleware (CORS, logging, rate limiting)
│   ├── scheduler/               # Cron jobs and background tasks
│   └── utils/                   # Shared utilities and helpers
├── migrations/                  # SQL database migrations
├── tests/
│   ├── unit/                    # Unit tests (uses testcontainers + PostgreSQL)
│   ├── integration/             # Integration tests (real DB/Redis via Docker)
│   └── testutil/                # Test utilities (testcontainers helpers)
├── coverage/                    # Test coverage reports
├── go.mod                       # Go module dependencies
├── go.sum                       # Dependency checksums
├── Dockerfile                   # Production container image
└── README.md                    # This file
```

## Development

### Code Style and Standards

**See [CODING_STANDARDS.md](CODING_STANDARDS.md) for comprehensive naming conventions and design patterns.**

Key conventions:
- Use descriptive variable names (`dbClient`, `redisClient`, not `db`, `redis`)
- Config structs: implementation-specific names (`PostgresConfig`), purpose-generic fields (`cfg.Database`)
- Pass appropriate config level to reduce chaining
- Use `uber-go/zap` for all logging (no `fmt.Println`)
- Follow standard Go project layout

### Database Migrations

Migrations are plain SQL files in `migrations/` directory. Apply them in order:

```bash
# Example: New migration
psql -U osrs_tracker -d osrs_ge_tracker -f migrations/005_your_migration.sql
```

### Background Jobs

The scheduler runs these cron jobs:

- **Every 1 minute**: Fetch bulk price dump from OSRS API, update current prices
- **Every 1 hour**: Fetch historical sample data for trending items
- **Every 24 hours**: Full historical sync for all items

Jobs are defined in `internal/scheduler/jobs.go`

### Logging

Use structured logging with Zap:

```go
logger.Info("Server started", zap.Int("port", cfg.Port))
logger.Error("Database connection failed", zap.Error(err))
logger.Debug("Cache hit", zap.String("key", cacheKey))
```

**Never use `fmt.Println` or `log.Println` in production code.**

### Adding a New Endpoint

1. **Define handler** in `internal/handlers/`:
   ```go
   func (h *itemHandler) GetNewEndpoint(c *fiber.Ctx) error {
       // Handler logic
   }
   ```

2. **Register route** in `cmd/api/main.go`:
   ```go
   apiV1.Get("/new-endpoint", itemHandler.GetNewEndpoint)
   ```

3. **Add tests** in `tests/unit/` or `tests/integration/`:
   ```go
   func TestGetNewEndpoint(t *testing.T) {
       // Test logic
   }
   ```

## Building for Production

### Build binary
```bash
go build -o bin/api cmd/api/main.go
```

### Run binary
```bash
./bin/api
```

### Docker build
```bash
docker build -t osrs-backend:latest .
```

### Docker run
```bash
docker run -p 8080:8080 --env-file .env osrs-backend:latest
```

## Configuration

Configuration is loaded from environment variables using Viper. Nested config maps to env vars with underscores:

| Environment Variable | Config Path | Default |
|---------------------|-------------|---------|
| `POSTGRES_HOST` | `cfg.Database.Host` | `localhost` |
| `POSTGRES_PORT` | `cfg.Database.Port` | `5432` |
| `REDIS_HOST` | `cfg.Cache.Host` | `localhost` |
| `REDIS_PORT` | `cfg.Cache.Port` | `6379` |
| `SSE_MAX_CLIENTS` | `cfg.SSE.MaxClients` | `1000` |

See `internal/config/config.go` for full configuration structure.

## Troubleshooting

### Database connection fails
- Verify PostgreSQL is running: `pg_isready -h localhost -p 5432`
- Check credentials in `.env`
- Ensure database exists: `createdb -U postgres osrs_ge_tracker`

### Redis connection fails
- Verify Redis is running: `redis-cli ping`
- Check Redis host/port in `.env`
- Ensure Redis is not protected: set password if needed

### Tests fail with "cannot connect to database"
- Integration tests require live PostgreSQL and Redis
- Run unit tests only: `go test ./tests/unit/...`
- Or skip integration: `go test -short ./...`

### Port already in use
- Change `PORT` in `.env`
- Or kill process using port: `lsof -ti:8080 | xargs kill`

## Contributing

1. Follow coding standards in [CODING_STANDARDS.md](CODING_STANDARDS.md)
2. Write tests for new features
3. Run `go test ./...` before committing
4. Use `go fmt` to format code
5. Update documentation if adding new features

## Related Documentation

- **[CODING_STANDARDS.md](CODING_STANDARDS.md)** - Naming conventions and design patterns
- **[CONFIG_REFACTOR_PLAN.md](CONFIG_REFACTOR_PLAN.md)** - Configuration refactor plan
- **[REFACTOR_PROGRESS.md](REFACTOR_PROGRESS.md)** - Current refactor status
- **[TESTING.md](TESTING.md)** - Testing guide and strategies

## License

[Your License Here]
