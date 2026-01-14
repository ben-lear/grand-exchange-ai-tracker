# GitHub Copilot Instructions for OSRS Grand Exchange Tracker

## 🚨 CRITICAL RULES

### Git Operations
**NEVER commit or push code without explicit user permission.**
- Do NOT run `git commit` on your own
- Do NOT run `git push` on your own
- ALWAYS wait for the user to say "commit and push" or "push the changes" or similar explicit permission
- You MAY stage files with `git add` when preparing changes
- You MAY show `git status` and `git diff` to preview changes

## Project Overview

This is a full-stack application for tracking and visualizing **Old School RuneScape (OSRS)** Grand Exchange item prices and trends. The backend fetches data from the OSRS API, stores it in PostgreSQL, and serves it via REST API. The frontend displays a comprehensive data table with all items and interactive price charts.

**IMPORTANT**: This project uses **OSRS** (Old School RuneScape) API, not RS3 (RuneScape 3). Always use `m=itemdb_oldschool` in API URLs.

## Tech Stack

### Backend
- **Language**: Go 1.22+
- **Framework**: Fiber v2 (high-performance HTTP framework)
- **Database**: PostgreSQL 16 with GORM
- **Caching**: Redis 7 with go-redis/v9
- **Scheduler**: Robfig Cron v3
- **Logging**: Uber Zap (structured JSON logging)
- **HTTP Client**: Resty v2
- **Validation**: go-playground/validator v10
- **Configuration**: Viper

### Frontend
- **Framework**: React 18 with TypeScript 5 (strict mode)
- **Build Tool**: Vite 5
- **Routing**: React Router v6
- **Data Fetching**: TanStack Query (React Query) v5
- **Data Table**: TanStack Table v8 (with virtual scrolling)
- **Charts**: Recharts v2
- **State Management**: Zustand v4
- **Forms**: React Hook Form v7 + Zod validation
- **Styling**: TailwindCSS v3 + HeadlessUI
- **Notifications**: Sonner
- **Date Utilities**: date-fns v3

### Testing
- **Backend**: Testify + httptest
- **Frontend Unit**: Vitest + Testing Library
- **Frontend E2E**: Playwright

## OSRS API Endpoints

### Bulk Price Dump (Primary - Use This for Current Prices)
```
URL: https://chisel.weirdgloop.org/gazproj/gazbot/os_dump.json
Purpose: Fetch ALL item prices in ONE request
Update Frequency: ~10 minutes from source
Our Poll Frequency: Every 1 minute
```

### Historical Data API
```
Base URL: https://api.weirdgloop.org/exchange/history/osrs

Endpoints:
- /latest?id=<ids>    - Most recent price (up to 100 items per request)
- /sample?id=<id>     - 150 data points across full history (1 item)
- /last90d?id=<id>    - Last 90 days (1 item)
- /all?id=<id>        - Complete history (1 item)
```

### Item Detail API
```
URL: https://secure.runescape.com/m=itemdb_oldschool/api/catalogue/detail.json?item=<id>
Purpose: Detailed item metadata
```

## Directory Structure

### Backend
```
backend/
├── cmd/api/main.go              # Entry point
├── internal/
│   ├── config/                  # Viper configuration
│   ├── database/                # PostgreSQL & Redis connections
│   ├── models/                  # GORM models (Item, Price, etc.)
│   ├── repository/              # Data access layer
│   ├── services/                # Business logic
│   │   └── osrs_client.go       # OSRS API client
│   ├── handlers/                # HTTP handlers
│   ├── middleware/              # CORS, logging, rate limiting
│   └── scheduler/jobs.go        # Cron job definitions
├── migrations/                  # SQL migrations
└── tests/
```

### Frontend
```
frontend/
├── src/
│   ├── api/                     # API client (axios)
│   ├── components/
│   │   ├── common/              # Shared components
│   │   ├── table/               # ItemsTable, filters, pagination
│   │   ├── charts/              # PriceChart, VolumeChart
│   │   └── layout/              # MainLayout, Header
│   ├── hooks/                   # useItems, usePrices, etc.
│   ├── pages/                   # DashboardPage, ItemDetailPage
│   ├── stores/                  # Zustand stores
│   ├── types/                   # TypeScript interfaces
│   └── utils/                   # Formatters, helpers
└── tests/
    ├── unit/                    # Vitest tests
    └── e2e/                     # Playwright tests
```

## Database Schema

### Tables
1. **items** - Item metadata (id, name, icon, members, buy_limit, alch values)
2. **current_prices** - Latest price snapshot (one row per item)
3. **price_history** - Time-series data (partitioned by month)

### Key Indexes
- `items(item_id)` - Unique, for lookups
- `items(name)` - For search
- `price_history(item_id, timestamp DESC)` - For chart queries
- `current_prices(item_id)` - Primary key

## API Design

### REST Endpoints
```
GET /api/v1/items              - List items (paginated, filterable)
GET /api/v1/items/:id          - Get item by ID
GET /api/v1/items/search?q=    - Search by name

GET /api/v1/prices/current     - All current prices
GET /api/v1/prices/current/:id - Current price for item
GET /api/v1/prices/history/:id - Historical prices
    ?period=24h|7d|30d|90d|1y|all
    ?sample=true

GET /health                    - Health check
```

## Caching Strategy

### Redis Keys
- `price:current:all` - All prices (TTL: 1 minute)
- `price:current:{id}` - Single item price (TTL: 1 minute)
- `price:history:{id}:{period}` - Chart data (TTL: 10 minutes)
- `item:all` - Item metadata (TTL: 1 hour)

## Scheduler Jobs

1. **Every 1 minute**: Fetch bulk dump, update current_prices
2. **Every 1 hour**: Fetch historical sample for top items
3. **Every 24 hours**: Full historical sync for all items

## Frontend Key Patterns

### Data Fetching (TanStack Query)
```typescript
// Auto-refetch every 1 minute
const { data } = useQuery({
  queryKey: ['prices', 'current', 'all'],
  queryFn: fetchAllCurrentPrices,
  refetchInterval: 60000,
  staleTime: 50000,
});
```

### Data Table (TanStack Table)
- Virtual scrolling for 15K+ rows
- Column sorting, filtering, resizing
- Pagination (50/100/200 per page)
- Export to CSV/JSON

### Charts (Recharts)
- Time range selector: 24h, 7d, 30d, 90d, 1y, All
- Zoom/pan support
- Responsive design

## Coding Standards

### Go
- Use `uber-go/zap` for all logging (no fmt.Println)
- Return errors, don't panic
- Use context for cancellation
- Follow standard project layout

### TypeScript
- Strict mode enabled
- No `any` types (use `unknown` if needed)
- Use type inference where obvious
- Prefer functional components with hooks

### Testing
- Backend: 80%+ coverage, table-driven tests
- Frontend: Vitest for units, Playwright for E2E
- Mock external APIs in tests

## Common Commands

### Backend
```bash
go run cmd/api/main.go          # Start server
go test ./...                   # Run tests
air                             # Hot reload (dev)
```

### Frontend
```bash
npm run dev                     # Start dev server
npm run build                   # Production build
npm run test                    # Run unit tests
npm run test:e2e                # Run Playwright tests
```

### Docker
```bash
docker-compose up -d            # Start all services
docker-compose logs -f backend  # View backend logs
docker-compose down             # Stop all services
```

## Environment Variables

### Backend (.env)
```
PORT=8080
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_USER=osrs_tracker
POSTGRES_PASSWORD=password
POSTGRES_DB=osrs_ge_tracker
REDIS_HOST=localhost
REDIS_PORT=6379
```

### Frontend (.env)
```
VITE_API_BASE_URL=http://localhost:8080/api/v1
```

## Important Notes

1. **Always use bulk dump** for fetching current prices - never loop over items
2. **Historical data is immutable** - fetch once, don't re-poll
3. **Cache aggressively** - Redis for hot data, query for cold
4. **Partition price_history** - By month for performance
5. **Use User-Agent header** when calling OSRS APIs
6. **Handle rate limits gracefully** - Exponential backoff