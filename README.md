# OSRS Grand Exchange Tracker

A full-stack real-time price tracker for **Old School RuneScape (OSRS)** Grand Exchange items with historical charts, advanced filtering, and custom watchlists.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Go Version](https://img.shields.io/badge/Go-1.24.0+-00ADD8?logo=go)
![React](https://img.shields.io/badge/React-18-61DAFB?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178C6?logo=typescript)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?logo=postgresql)

## 📋 Overview

Track 4,000+ OSRS items with minute-by-minute price updates from the OSRS Wiki API. View historical trends, create custom watchlists, and get real-time alerts through a high-performance React frontend backed by a Go API with PostgreSQL and Redis.

### Features

- **📊 Real-time Prices** - Updates every minute from OSRS Wiki bulk dump
- **📈 Historical Charts** - Interactive time-series visualizations (24h to all-time)
- **🔍 Advanced Search** - Fuzzy search with instant results and keyboard shortcuts
- **📋 Data Table** - Virtual scrolling for 15K+ items with sorting and filtering
- **⭐ Watchlists** - Create and manage custom item lists with sharing
- **🎯 Favorites** - Quick access to frequently tracked items
- **🔔 Price Alerts** - Get notified when items hit target prices
- **📱 Responsive UI** - Full mobile support with touch interactions
- **⚡ Redis Cache** - Sub-100ms API responses with 95%+ hit rate
- **🔒 Type Safety** - End-to-end TypeScript with runtime validation

## 🛠️ Tech Stack

**Backend:** Go 1.24 • Fiber • GORM • PostgreSQL 16 • Redis 7 • Cron  
**Frontend:** React 18 • TypeScript 5 • Vite • TanStack Query/Table • Recharts • Zustand • TailwindCSS  
**Testing:** Vitest • Playwright • Testing Library • Testify

## 🚀 Getting Started

### Prerequisites

- **Docker & Docker Compose** (for containerized setup)
- **Go 1.24.0+** (for local backend development)
- **Node.js 20+** (for local frontend development)
- **PostgreSQL 16+** (if running without Docker)
- **Redis 7+** (if running without Docker)

### Quick Start with Docker (Recommended)

```bash
# Clone the repository
git clone https://github.com/yourusername/osrs-ge-tracker.git
cd osrs-ge-tracker

# Start all services (PostgreSQL, Redis, Backend, Frontend)
docker-compose up -d

# View logs
docker-compose logs -f backend
docker-compose logs -f frontend

# Stop all services
docker-compose down
```

**Access Points:**
- Frontend: http://localhost:3000
- Backend API: http://localhost:8080/api/v1
- Health Check: http://localhost:8080/health

### Local Development Setup

#### Backend Setup

**1. Install Dependencies**
```bash
cd backend
go mod download
```

**2. Database Setup**
```bash
# Start PostgreSQL (if not using Docker)
psql -U postgres

# Create database
CREATE DATABASE osrs_ge_tracker;

# Exit psql
\q

# Apply migrations manually
psql -U postgres -d osrs_ge_tracker -f migrations/001_init.sql
psql -U postgres -d osrs_ge_tracker -f migrations/002_realtime_prices.sql
psql -U postgres -d osrs_ge_tracker -f migrations/003_drop_legacy_prices.sql
psql -U postgres -d osrs_ge_tracker -f migrations/004_add_wiki_mapping_fields.sql
psql -U postgres -d osrs_ge_tracker -f migrations/005_watchlist_shares.sql
```

**3. Redis Setup (Optional but Recommended)**
```bash
# Install Redis (macOS)
brew install redis
brew services start redis

# Install Redis (Ubuntu/Debian)
sudo apt-get install redis-server
sudo systemctl start redis

# Install Redis (Windows)
# Download from https://github.com/microsoftarchive/redis/releases
```

**4. Environment Configuration**
```bash
# Copy example environment file
cp .env.example .env

# Edit .env with your settings
# Required variables:
# - POSTGRES_HOST=localhost
# - POSTGRES_PORT=5432
# - POSTGRES_USER=postgres
# - POSTGRES_PASSWORD=your_password
# - POSTGRES_DB=osrs_ge_tracker
# - REDIS_HOST=localhost
# - REDIS_PORT=6379
```

**5. Run Backend**
```bash
# Install Air for hot reload (recommended)
go install github.com/cosmtrek/air@latest
air

# Or run directly without hot reload
go run cmd/api/main.go
```

**Backend available at:** http://localhost:8080  
**API endpoints:** http://localhost:8080/api/v1  
**Health check:** http://localhost:8080/health

#### Frontend Setup

**1. Install Dependencies**
```bash
cd frontend
npm install
```

**2. Environment Configuration**
```bash
# Copy example environment file
cp .env.example .env

# Edit .env (default should work if backend is on :8080)
# VITE_API_BASE_URL=http://localhost:8080/api/v1
```

**3. Run Frontend**
```bash
npm run dev
```

**Frontend available at:** http://localhost:3000

#### Verification Steps

1. **Check Backend Health**
   ```bash
   curl http://localhost:8080/health
   # Expected: {"status":"healthy","database":"connected","cache":"connected"}
   ```

2. **Test API Endpoints**
   ```bash
   # Get items
   curl http://localhost:8080/api/v1/items?limit=5
   
   # Get current prices
   curl http://localhost:8080/api/v1/prices/current
   ```

3. **Check Frontend**
   - Open http://localhost:3000
   - Data table should load within 2-3 minutes (initial sync)
   - Check browser console for errors

#### Troubleshooting

**Backend won't start:**
- Verify PostgreSQL is running: `psql -U postgres -c "SELECT 1;"`
- Check database exists: `psql -U postgres -l | grep osrs`
- Verify Redis (if enabled): `redis-cli ping` should return `PONG`
- Check port availability: `lsof -i :8080` (Unix) or `netstat -ano | findstr :8080` (Windows)

**Frontend can't connect to backend:**
- Verify backend is running on port 8080
- Check CORS settings in backend `.env` (CORS_ORIGINS should include http://localhost:3000)
- Check browser console for network errors

**Database migrations fail:**
- Ensure PostgreSQL version is 16+ (`psql --version`)
- Check user has CREATE privileges
- Run migrations in order (001 → 005)

**No data loading:**
- Initial data sync takes 2-3 minutes
- Check backend logs for "Sync completed successfully"
- Verify internet connection (fetches from OSRS Wiki API)
- Check API health: `curl http://localhost:8080/health`

## 📡 API Documentation

### Data Sources

| Source | URL | Purpose | Update Frequency |
|--------|-----|---------|------------------|
| Bulk Dump | `chisel.weirdgloop.org/gazproj/gazbot/os_dump.json` | All current prices | Every 1 minute |
| Historical | `api.weirdgloop.org/exchange/history/osrs/*` | Price history | On demand |
| Item Metadata | `secure.runescape.com/m=itemdb_oldschool/api/*` | Item details | On startup |

**Important:** Always use `m=itemdb_oldschool` for OSRS data (not `m=itemdb_rs` which is RS3).

### Backend Endpoints

#### Health
```
GET /health
Response: { "status": "healthy", "database": "connected", "cache": "connected" }
```

#### Items
```
GET /api/v1/items?page=1&limit=50&search=dragon&members=true
GET /api/v1/items/:id
GET /api/v1/items/search?q=whip
```

#### Prices
```
GET /api/v1/prices/current           # All current prices
GET /api/v1/prices/current/:id       # Single item price
GET /api/v1/prices/history/:id?period=24h  # Historical data (24h, 7d, 30d, 90d, all)
```

#### Watchlists
```
POST   /api/v1/watchlist/share/:id   # Create shareable link
GET    /api/v1/watchlist/shared/:token  # View shared watchlist
```

### Scheduled Jobs

- **Every 1 minute:** Fetch bulk price dump and update `current_prices` table
- **On startup:** Load item metadata and perform initial price sync
- **Hourly:** Cleanup expired shared watchlist tokens

## 📁 Project Structure

```
osrs-ge-tracker/
├── backend/
│   ├── cmd/
│   │   └── api/
│   │       └── main.go           # Application entry point
│   ├── internal/
│   │   ├── config/               # Configuration management (Viper)
│   │   ├── database/             # PostgreSQL and Redis clients
│   │   ├── models/               # GORM data models
│   │   ├── repository/           # Data access layer (interfaces + implementations)
│   │   ├── services/             # Business logic and external API clients
│   │   ├── handlers/             # HTTP request handlers
│   │   ├── middleware/           # CORS, logging, rate limiting
│   │   └── scheduler/            # Cron job definitions
│   ├── migrations/               # SQL schema migrations
│   └── tests/
│       ├── unit/                 # Unit tests (uses testcontainers)
│       ├── integration/          # Integration tests (requires Docker)
│       └── testutil/             # Test helpers (testcontainers setup)
├── frontend/
│   ├── src/
│   │   ├── api/                  # Axios client and API functions
│   │   ├── components/           # React components
│   │   │   ├── common/           # Reusable UI components
│   │   │   ├── table/            # Data table components
│   │   │   ├── charts/           # Price chart components
│   │   │   ├── watchlist/        # Watchlist modals and cards
│   │   │   ├── search/           # Search components
│   │   │   └── layout/           # Layout components
│   │   ├── hooks/                # Custom React hooks
│   │   ├── pages/                # Route page components
│   │   ├── stores/               # Zustand state stores
│   │   ├── types/                # TypeScript type definitions
│   │   ├── schemas/              # Zod validation schemas
│   │   └── utils/                # Helper functions and formatters
│   └── tests/
│       ├── e2e/                  # Playwright end-to-end tests
│       └── unit/                 # Component and hook tests
└── docker-compose.yml            # Multi-container setup
```

## 🧪 Testing

### Backend Tests

**Prerequisites:**
- Docker Desktop must be running for unit tests with testcontainers
- First run downloads `postgres:16-alpine` image (~80MB)
- No CGO required - works on all platforms

```bash
cd backend

# Run all tests (requires Docker)
go test ./... -v

# Run tests with coverage
go test ./... -cover -coverprofile=coverage.out

# View coverage in browser
go tool cover -html=coverage.out

# Run specific package tests
go test ./internal/services/... -v      # Service tests (no Docker needed)
go test ./tests/unit/... -v             # Unit tests (requires Docker for watchlist)
go test ./internal/handlers/... -v      # Handler tests (no Docker needed)

# Run integration tests (requires Docker + services)
go test ./tests/integration/... -v

# Using test scripts (recommended)
# Unix/Linux/macOS
./test.sh --coverage
./test.sh --fast  # Skip slow integration tests

# Windows PowerShell
.\test.ps1 -Coverage
.\test.ps1 -Fast
```

**Test Structure:**
- `internal/*/` - Unit tests alongside source code (no Docker)
- `tests/unit/` - Unit tests with testcontainers (requires Docker)
- `tests/integration/` - Full integration tests (requires Docker + PostgreSQL + Redis)
- `tests/testutil/` - Testcontainers helpers and utilities
- Target coverage: 80%+

**Troubleshooting:**
- If tests fail, ensure Docker Desktop is running
- Check: `docker ps` to verify Docker is accessible
- If Docker unavailable: `go test ./internal/services/... ./tests/testutil/...`

### Frontend Tests

```bash
cd frontend

# Run unit tests (watch mode)
npm test

# Run all tests once
npm run test -- --run

# Run with coverage report
npm run test:coverage

# View coverage in browser
open coverage/index.html  # macOS
start coverage/index.html # Windows
xdg-open coverage/index.html # Linux

# Run E2E tests (requires dev server running)
npm run test:e2e

# Run E2E with interactive UI
npm run test:e2e:ui

# Run specific test file
npm test -- CreateWatchlistModal.test.tsx
```

**Test Structure:**
- `src/**/*.test.tsx` - Component tests
- `src/test/` - Test utilities and mocks
- `tests/e2e/` - Playwright end-to-end tests
- Target coverage: 80%+ (currently 767/768 tests passing)

### Test Coverage Summary

| Area | Coverage | Tests |
|------|----------|-------|
| Backend Services | 85%+ | Unit + Integration |
| Backend Handlers | 80%+ | HTTP Request Tests |
| Frontend Components | 82%+ | 767 passing |
| E2E Workflows | 90%+ | Critical paths covered |

### Running Full Test Suite

```bash
# Backend
cd backend && go test ./... -cover

# Frontend
cd frontend && npm run test:coverage

# E2E (requires both servers running)
cd frontend && npm run test:e2e
```

## � Data Flow Architecture

```
┌─────────────────┐
│   OSRS Wiki     │
│   Bulk Dump     │  Fetches every 1 minute
└────────┬────────┘
         │
         ▼
┌─────────────────┐     ┌─────────────────┐
│   Go Backend    │────▶│   PostgreSQL    │
│   (Fiber)       │     │   (Time-series) │
└────────┬────────┘     └─────────────────┘
         │
         ├──────────────┐
         │              │
         ▼              ▼
┌─────────────────┐  ┌─────────────────┐
│   Redis Cache   │  │  REST API       │
│   (Hot Data)    │  │  /api/v1/*      │
└─────────────────┘  └────────┬────────┘
                              │
                              ▼
                     ┌─────────────────┐
                     │ React Frontend  │
                     │ (Vite + Query)  │
                     └─────────────────┘
```

**Flow Details:**
1. Scheduler fetches bulk dump every minute
2. Data validated and stored in PostgreSQL
3. Current prices cached in Redis (1 min TTL)
4. Historical data cached (10 min TTL)
5. Frontend queries backend API
6. TanStack Query handles client-side caching

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. **Fork the repository** and clone to your local machine
2. **Create a feature branch**: `git checkout -b feature/your-feature-name`
3. **Make your changes** with clear, descriptive commits
4. **Add tests** for new functionality
5. **Run the test suite** to ensure nothing breaks
   ```bash
   cd backend && go test ./...
   cd frontend && npm test
   ```
6. **Push to your fork**: `git push origin feature/your-feature-name`
7. **Open a Pull Request** with a clear description of changes

### Development Guidelines
- Follow existing code style and conventions
- Write unit tests for new features
- Update documentation as needed
- Keep commits focused and atomic
- Reference issues in commit messages when applicable

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## ⚠️ Disclaimer

This project is not affiliated with or endorsed by Jagex Ltd. **Old School RuneScape** and **OSRS** are registered trademarks of Jagex Ltd. All game data is retrieved from publicly available community-maintained APIs.

Price data provided by the OSRS Wiki and community contributors.

---

**Built with ❤️ for the OSRS community**
