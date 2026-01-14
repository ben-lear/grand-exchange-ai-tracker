# OSRS Grand Exchange Tracker - Project Proposal

## Executive Summary

This proposal outlines a comprehensive full-stack application for tracking and visualizing Old School RuneScape (OSRS) Grand Exchange item prices and market trends. The system will poll the official OSRS Grand Exchange API, store data in PostgreSQL, and present interactive time-series charts and current pricing data through a modern React-based frontend.

## Project Overview

### Core Objectives
1. **Real-time Price Tracking**: Poll all OSRS Grand Exchange items every 1 minute for current prices
2. **Historical Data Visualization**: Display time-series price charts with historical trend analysis
3. **Dual Query Support**: Support both bulk (all items) and singular (specific item) price queries
4. **Data Persistence**: Maintain historical data through backend restarts
5. **High Performance**: Utilize caching (Redis) and optimized database queries for fast response times

### API Integration Strategy

#### OSRS Grand Exchange API Endpoints
Based on the API documentation, we will use:

1. **Bulk Price Dump** (Primary for current prices):
   - URL: `https://chisel.weirdgloop.org/gazproj/gazbot/os_dump.json`
   - Contains: All item prices, volumes, and metadata
   - Update Frequency: Every ~10 minutes
   - Use Case: Fetch all current prices at once

2. **Historical Data API** (For charts):
   - URL: `https://api.weirdgloop.org/exchange/history/osrs/*`
   - Endpoints:
     - `/latest?id=<ids>` - Most recent price (up to 100 items)
     - `/sample?id=<id>` - 150 data points across full history (1 item)
     - `/last90d?id=<id>` - Last 90 days (1 item)
     - `/all?id=<id>` - Complete history (1 item)
   - Use Case: Populate time-series charts

3. **Item Detail API** (For individual lookups):
   - URL: `https://secure.runescape.com/m=itemdb_oldschool/api/catalogue/detail.json?item=<id>`
   - Contains: Item metadata, description, icon, trends
   - Use Case: Detailed item information display

4. **Item Listing API** (For discovery):
   - URL: `https://secure.runescape.com/m=itemdb_oldschool/api/catalogue/items.json?category=1&alpha=<letter>&page=<page>`
   - Contains: Paginated item lists
   - Use Case: Initial database population

## Technical Architecture

### Backend (Go 1.22+)

#### Technology Stack
- **Framework**: Fiber v2 (High-performance HTTP framework similar to Express)
- **Database ORM**: GORM v2 (PostgreSQL driver)
- **Cache**: Redis v7 with go-redis client
- **Scheduler**: Robfig Cron v3 (For periodic jobs)
- **HTTP Client**: Resty v2 (For API calls with retries)
- **Logging**: Uber Zap (Structured JSON logging)
- **Validation**: go-playground/validator v10
- **Configuration**: Viper (Environment-based config)
- **Testing**: Testify + httptest

#### Proposed Directory Structure
```
backend/
├── cmd/
│   └── api/
│       └── main.go                 # Application entrypoint
├── internal/
│   ├── config/
│   │   └── config.go              # Configuration management
│   ├── database/
│   │   ├── postgres.go            # PostgreSQL connection
│   │   └── redis.go               # Redis connection
│   ├── models/
│   │   ├── item.go                # Item model
│   │   ├── price.go               # Price history model
│   │   └── price_snapshot.go      # Current price snapshot
│   ├── repository/
│   │   ├── item_repository.go     # Item CRUD operations
│   │   └── price_repository.go    # Price data operations
│   ├── services/
│   │   ├── osrs_client.go         # OSRS API client
│   │   ├── cache_service.go       # Redis cache service
│   │   ├── item_service.go        # Business logic for items
│   │   └── price_service.go       # Business logic for prices
│   ├── scheduler/
│   │   └── jobs.go                # Cron job definitions
│   ├── handlers/
│   │   ├── item_handler.go        # Item endpoints
│   │   ├── price_handler.go       # Price endpoints
│   │   └── health_handler.go      # Health check
│   ├── middleware/
│   │   ├── logger.go              # Request logging
│   │   ├── cors.go                # CORS configuration
│   │   └── rate_limiter.go        # API rate limiting
│   └── utils/
│       ├── response.go            # Standard API responses
│       └── errors.go              # Error handling utilities
├── migrations/
│   ├── 001_create_items.up.sql
│   ├── 001_create_items.down.sql
│   ├── 002_create_prices.up.sql
│   └── 002_create_prices.down.sql
├── tests/
│   ├── integration/
│   └── unit/
├── go.mod
├── go.sum
├── Dockerfile
└── .env.example
```

#### Database Schema

**Items Table**:
```sql
CREATE TABLE items (
    id SERIAL PRIMARY KEY,
    item_id INTEGER UNIQUE NOT NULL,  -- OSRS item ID
    name VARCHAR(255) NOT NULL,
    description TEXT,
    icon_url VARCHAR(512),
    members BOOLEAN DEFAULT false,
    category VARCHAR(100),
    buy_limit INTEGER,
    high_alch INTEGER,
    low_alch INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_item_id (item_id),
    INDEX idx_name (name)
);
```

**Price History Table** (Time-series data):
```sql
CREATE TABLE price_history (
    id BIGSERIAL PRIMARY KEY,
    item_id INTEGER NOT NULL REFERENCES items(item_id),
    price BIGINT NOT NULL,
    volume INTEGER,
    timestamp TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_item_timestamp (item_id, timestamp DESC),
    UNIQUE(item_id, timestamp)
);

-- Partition by month for performance
CREATE TABLE price_history_2026_01 PARTITION OF price_history
    FOR VALUES FROM ('2026-01-01') TO ('2026-02-01');
```

**Current Prices Table** (Latest snapshot):
```sql
CREATE TABLE current_prices (
    item_id INTEGER PRIMARY KEY REFERENCES items(item_id),
    price BIGINT NOT NULL,
    volume INTEGER,
    price_change_today BIGINT,
    trend VARCHAR(20),  -- 'positive', 'negative', 'neutral'
    last_updated TIMESTAMP NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### API Endpoints

**Item Endpoints**:
- `GET /api/v1/items` - List all items (with pagination, search, filter)
- `GET /api/v1/items/:id` - Get specific item details
- `GET /api/v1/items/search?q=<query>` - Search items by name

**Price Endpoints**:
- `GET /api/v1/prices/current` - Get current prices for all items
- `GET /api/v1/prices/current/:id` - Get current price for specific item
- `GET /api/v1/prices/history/:id` - Get historical prices for item
  - Query params: `?period=24h|7d|30d|90d|1y|all`, `?sample=true`
- `GET /api/v1/prices/batch` - Get current prices for multiple items
  - Query params: `?ids=4151,4153,4155`

**Health & Metrics**:
- `GET /health` - Health check
- `GET /metrics` - Prometheus metrics (optional)

#### Caching Strategy
- **Redis Cache Keys**:
  - `item:all` - All items metadata (TTL: 1 hour)
  - `price:current:all` - All current prices (TTL: 1 minute)
  - `price:current:<item_id>` - Specific item current price (TTL: 1 minute)
  - `price:history:<item_id>:<period>` - Historical price data (TTL: 10 minutes)

#### Job Scheduler
```go
// Price collection jobs
1. Every 1 minute: Fetch and update current prices (bulk dump)
2. Every 1 hour: Fetch historical sample data for popular items
3. Every 24 hours: Full historical data sync for all items
4. Every 7 days: Cleanup old historical data (optional retention policy)
```

#### Startup Process
1. Connect to PostgreSQL and Redis
2. Run database migrations
3. Fetch bulk dump to populate initial cache
4. Fetch sample historical data for top 100 items
5. Start Fiber HTTP server
6. Start cron scheduler

### Frontend (React 18 + TypeScript)

#### Technology Stack
- **Framework**: React 18.2+ with TypeScript 5.0+
- **Build Tool**: Vite 5
- **Routing**: React Router v6
- **State Management**: Zustand v4 (lightweight alternative to Redux)
- **Data Fetching**: TanStack Query (React Query) v5
  - Auto-refetching every 1 minute for current prices
  - Cache management for API responses
- **Table Component**: TanStack Table (React Table) v8
  - Virtual scrolling for 15K+ rows
  - Column sorting, filtering, resizing
  - Built-in pagination
- **Charts**: Recharts v2 (Built on D3.js)
- **Forms**: React Hook Form v7 + Zod validation
- **Styling**: TailwindCSS v3 + HeadlessUI
- **Notifications**: Sonner (toast notifications)
- **Date Utilities**: date-fns v3
- **Testing**: 
  - **Vitest** (Unit tests, component tests)
  - **Playwright** (E2E tests)
  - **Testing Library** (React component testing)

#### Proposed Directory Structure
```
frontend/
├── public/
│   └── favicon.ico
├── src/
│   ├── api/
│   │   ├── client.ts              # Axios/fetch client
│   │   ├── items.ts               # Item API calls
│   │   └── prices.ts              # Price API calls
│   ├── components/
│   │   ├── common/
│   │   │   ├── Header.tsx
│   │   │   ├── Footer.tsx
│   │   │   ├── Loader.tsx
│   │   │   └── ErrorBoundary.tsx
│   │   ├── table/
│   │   │   ├── ItemsTable.tsx     # Main data table component
│   │   │   ├── TableHeader.tsx    # Sortable column headers
│   │   │   ├── TableRow.tsx       # Individual item row
│   │   │   ├── TableFilters.tsx   # Filter controls
│   │   │   ├── TablePagination.tsx
│   │   │   ├── ColumnSelector.tsx # Toggle column visibility
│   │   │   └── ExportButton.tsx   # CSV/JSON export
│   │   ├── items/
│   │   │   ├── ItemDetail.tsx
│   │   │   └── ItemQuickView.tsx  # Hover preview
│   │   ├── charts/
│   │   │   ├── PriceChart.tsx
│   │   │   ├── VolumeChart.tsx
│   │   │   ├── MiniChart.tsx      # Small chart for table hover
│   │   │   └── TrendIndicator.tsx
│   │   └── layout/
│   │       ├── MainLayout.tsx
│   │       └── Sidebar.tsx
│   ├── hooks/
│   │   ├── useItems.ts            # TanStack Query hooks
│   │   ├── usePrices.ts
│   │   ├── useDebounce.ts
│   │   └── useLocalStorage.ts
│   ├── pages/
│   │   ├── DashboardPage.tsx      # Main table view (all items)
│   │   ├── ItemDetailPage.tsx     # Individual item view
│   │   └── NotFoundPage.tsx
│   ├── stores/
│   │   ├── useItemStore.ts        # Zustand store
│   │   └── usePreferencesStore.ts
│   ├── types/
│   │   ├── item.ts
│   │   ├── price.ts
│   │   └── api.ts
│   ├── utils/
│   │   ├── formatters.ts          # Number/date formatting
│   │   ├── constants.ts
│   │   └── helpers.ts
│   ├── App.tsx
│   ├── main.tsx
│   └── vite-env.d.ts
├── tests/
│   ├── e2e/
│   │   └── home.spec.ts
│   └── unit/
│       └── components/
├── .env.example
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
├── tailwind.config.js
├── postcss.config.js
├── playwright.config.ts
└── vitest.config.ts
```

#### Key Features

**1. Dashboard/Home Page**:
- **Comprehensive Items Table** displaying all tradeable items with:
  - Item icon and name
  - Current price
  - 24h price change (absolute & percentage)
  - Volume
  - Buy limit
  - High/Low alch values
  - Last updated timestamp
- **Advanced Filtering**:
  - Text search by item name
  - Filter by category
  - Filter by members/F2P
  - Price range slider
  - Volume range filter
  - Custom filters (gainers/losers/stable)
- **Column Sorting**:
  - Sort by any column (ascending/descending)
  - Multi-column sorting support
  - Persisted sort preferences
- **Table Features**:
  - Pagination (50/100/200 items per page)
  - Virtual scrolling for performance with large datasets
  - Sticky header for scrolling
  - Resizable columns
  - Column visibility toggles
  - Export to CSV/JSON
- **Quick Actions**:
  - Click row to view item detail page
  - Favorite items (with local storage)
  - Quick price chart preview on hover

**2. Item Detail Page**:
- Item icon and metadata
- Current price with trend indicator
- Interactive price chart (Recharts)
  - Time range selector: 24h, 7d, 30d, 90d, 1y, All
  - Zoom/pan functionality
  - Tooltip with exact price and date
- Volume chart
- Price statistics:
  - 24h high/low
  - 7d/30d average
  - Historical high/low
- Buy limit information
- High/Low alchemy values

**3. Chart Component Features**:
- Responsive design (mobile-friendly)
- Real-time updates via React Query polling
- Loading states and skeletons
- Error handling with retry
- Export chart data (CSV)
- Dark/Light mode support

#### React Query Setup
```typescript
// Auto-refetch current prices every 1 minute for table
const { data: allPrices, isLoading } = useQuery({
  queryKey: ['prices', 'current', 'all'],
  queryFn: fetchAllCurrentPrices,
  refetchInterval: 60000, // 1 minute
  staleTime: 50000,
  // Keep previous data while refetching for smooth UX
  placeholderData: (previousData) => previousData,
});

// Historical data cached for 10 minutes
const { data: historicalPrices } = useQuery({
  queryKey: ['prices', 'history', itemId, period],
  queryFn: () => fetchHistoricalPrices(itemId, period),
  staleTime: 600000, // 10 minutes
});
```

#### TanStack Table Setup
```typescript
// Define columns for the items table
const columns = [
  columnHelper.accessor('icon', {
    header: 'Icon',
    cell: (info) => <img src={info.getValue()} alt="" width={32} />,
    enableSorting: false,
  }),
  columnHelper.accessor('name', {
    header: 'Item Name',
    cell: (info) => <Link to={`/items/${info.row.original.id}`}>{info.getValue()}</Link>,
  }),
  columnHelper.accessor('currentPrice', {
    header: 'Current Price',
    cell: (info) => formatGP(info.getValue()),
  }),
  columnHelper.accessor('priceChange24h', {
    header: '24h Change',
    cell: (info) => <PriceChange value={info.getValue()} />,
  }),
  columnHelper.accessor('volume', {
    header: 'Volume',
    cell: (info) => formatNumber(info.getValue()),
  }),
  // ... more columns
];

// Initialize table with filtering and sorting
const table = useReactTable({
  data: allPrices || [],
  columns,
  getCoreRowModel: getCoreRowModel(),
  getSortedRowModel: getSortedRowModel(),
  getFilteredRowModel: getFilteredRowModel(),
  getPaginationRowModel: getPaginationRowModel(),
  state: {
    sorting,
    columnFilters,
    pagination,
  },
  onSortingChange: setSorting,
  onColumnFiltersChange: setColumnFilters,
  onPaginationChange: setPagination,
});
```

### Infrastructure & Deployment

#### Development Environment
- **Docker Compose** for local development:
  - PostgreSQL 16 container
  - Redis 7 container
  - Backend Go service
  - Frontend Vite dev server
  - Nginx reverse proxy (optional)

#### Environment Variables
**Backend** (`.env`):
```env
# Server
PORT=8080
ENV=development

# Database
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_USER=osrs_tracker
POSTGRES_PASSWORD=secure_password
POSTGRES_DB=osrs_ge_tracker
POSTGRES_SSL_MODE=disable

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0

# OSRS API
OSRS_BULK_DUMP_URL=https://chisel.weirdgloop.org/gazproj/gazbot/os_dump.json
OSRS_HISTORY_API_URL=https://api.weirdgloop.org/exchange/history/osrs
OSRS_DETAIL_API_URL=https://secure.runescape.com/m=itemdb_oldschool/api

# Cron Schedule
PRICE_POLL_INTERVAL=@every 1m
HISTORICAL_SYNC_INTERVAL=@every 1h

# Rate Limiting
API_RATE_LIMIT=100  # requests per minute
```

**Frontend** (`.env`):
```env
VITE_API_BASE_URL=http://localhost:8080/api/v1
VITE_WS_URL=ws://localhost:8080/ws  # Future WebSocket support
```

#### Docker Setup
```yaml
# docker-compose.yml
version: '3.8'

services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: osrs_tracker
      POSTGRES_PASSWORD: secure_password
      POSTGRES_DB: osrs_ge_tracker
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U osrs_tracker"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    ports:
      - "8080:8080"
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_started
    environment:
      - POSTGRES_HOST=postgres
      - REDIS_HOST=redis
    volumes:
      - ./backend:/app

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile.dev
    ports:
      - "5173:5173"
    volumes:
      - ./frontend:/app
      - /app/node_modules
    environment:
      - VITE_API_BASE_URL=http://localhost:8080/api/v1

volumes:
  postgres_data:
  redis_data:
```

## Implementation Phases

### Phase 1: Backend Foundation (Week 1-2)
- [ ] Set up Go project structure
- [ ] Implement database models and migrations
- [ ] Create OSRS API client (bulk dump, historical, detail endpoints)
- [ ] Implement Redis caching layer
- [ ] Build repository layer (CRUD operations)
- [ ] Create basic service layer
- [ ] Set up structured logging (Zap)
- [ ] Write unit tests for core components

### Phase 2: Backend API & Scheduler (Week 2-3)
- [ ] Implement Fiber HTTP server
- [ ] Create REST API endpoints (items, prices, health)
- [ ] Add middleware (CORS, logging, rate limiting)
- [ ] Implement cron scheduler for price polling
- [ ] Add startup routine (initial data load)
- [ ] Implement graceful shutdown
- [ ] Write integration tests
- [ ] Create Docker configuration

### Phase 3: Frontend Foundation (Week 3-4)
- [ ] Set up Vite + React + TypeScript project
- [ ] Configure TailwindCSS and HeadlessUI
- [ ] Implement routing (React Router)
- [ ] Create layout components
- [ ] Set up TanStack Query with auto-refetch
- [ ] Create API client layer
- [ ] Implement Zustand stores
- [ ] Configure testing framework (Vitest + Playwright)

### Phase 4: Frontend Features (Week 4-5)
- [ ] Create item detail page
- [ ] Build price chart component (Recharts)
- [ ] Add mini chart hover preview
- [ ] Create responsive design
- [ ] Implement dark mode

### Phase 5: Polish & Testing (Week 6)
- [ ] Add loading states and skeletons
- [ ] Implement error boundaries
- [ ] Add toast notifications
- [ ] Write E2E tests (Playwright)
- [ ] Write component tests
- [ ] Performance optimization
- [ ] Accessibility audit
- [ ] Documentation

### Phase 6: Deployment (Week 7)
- [ ] Set up CI/CD pipeline
- [ ] Deploy to production environment
- [ ] Configure monitoring (logs, metrics)
- [ ] Set up database backups
- [ ] Load testing
- [ ] Final QA

## Dependencies & Installation

### Backend Dependencies (Go)
```bash
# Core
go get github.com/gofiber/fiber/v2
go get gorm.io/gorm
go get gorm.io/driver/postgres
go get github.com/redis/go-redis/v9
go get github.com/robfig/cron/v3
go get github.com/go-resty/resty/v2

# Utilities
go get github.com/spf13/viper
go get go.uber.org/zap
go get github.com/go-playground/validator/v10
go get github.com/google/uuid

# Testing
go get github.com/stretchr/testify
### Frontend Dependencies (React)
```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.20.0",
    "@tanstack/react-query": "^5.15.0",
    "@tanstack/react-table": "^8.11.0",
    "@tanstack/react-virtual": "^3.0.1",
    "zustand": "^4.4.7",
    "recharts": "^2.10.3",
    "react-hook-form": "^7.49.2",
    "zod": "^3.22.4",
    "axios": "^1.6.2",
    "date-fns": "^3.0.6",
    "sonner": "^1.3.1",
    "@headlessui/react": "^1.7.17",
    "@heroicons/react": "^2.1.1",
    "clsx": "^2.1.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.45",
    "@types/react-dom": "^18.2.18",
    "@vitejs/plugin-react": "^4.2.1",
    "typescript": "^5.3.3",
    "vite": "^5.0.8",
    "tailwindcss": "^3.4.0",
    "autoprefixer": "^10.4.16",
    "postcss": "^8.4.32",
    "vitest": "^1.1.0",
    "@testing-library/react": "^14.1.2",
    "@testing-library/jest-dom": "^6.1.5",
    "@playwright/test": "^1.40.1",
    "eslint": "^8.56.0",
    "prettier": "^3.1.1"
  }
}
```

## Suggested Improvements & Additions

### 1. **WebSocket Support** (Future Enhancement)
- Real-time price updates via WebSocket connection
- Reduces polling overhead
- Better UX with instant updates

**Backend**:
```go
// Add WebSocket endpoint using Fiber's WebSocket support
app.Get("/ws", websocket.New(func(c *websocket.Conn) {
    // Broadcast price updates to connected clients
}))
```

**Frontend**:
```typescript
// useWebSocket hook for real-time updates
const { data } = useWebSocket('/ws');
```

### 2. **Price Alerts** (User Feature)
- Allow users to set price alerts for items
- Email/push notifications when price thresholds are met
- Requires user authentication system

**Additional Tables**:
```sql
CREATE TABLE users (
    id UUID PRIMARY KEY,
    email VARCHAR(255) UNIQUE,
    created_at TIMESTAMP
);

CREATE TABLE price_alerts (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES users(id),
    item_id INTEGER REFERENCES items(item_id),
    target_price BIGINT,
    condition VARCHAR(10),  -- 'above', 'below'
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP
);
```

### 3. **Portfolio Tracking** (Advanced Feature)
- Track user's OSRS inventory value
- Calculate portfolio performance over time
- Profit/loss calculations

### 4. **Advanced Analytics** (Premium Feature)
- Moving averages (7-day, 30-day, 90-day)
- Volatility indicators
- Correlation analysis between items
- Machine learning price predictions (TensorFlow/PyTorch)

### 5. **API Rate Limiting & Authentication** (Security)
- JWT-based authentication for protected endpoints
- API key system for external integrations
- Rate limiting per user/API key

**Backend**:
```go
// JWT middleware
app.Use(jwtware.New(jwtware.Config{
    SigningKey: []byte("secret"),
}))

// Rate limiter middleware
app.Use(limiter.New(limiter.Config{
    Max: 100,
    Expiration: 1 * time.Minute,
}))
```

### 6. **Export Functionality**
- Export historical data as CSV/JSON
- Generate PDF reports
- Share chart images

### 7. **Mobile App** (Future)
- React Native app using same backend
- Push notifications for price alerts
- Offline mode with local caching

### 8. **Admin Dashboard** (Operational)
- Monitor system health
- View API usage metrics
- Manage cron jobs
- Database statistics

### 9. **Enhanced Caching Strategy**
- Implement CDN for static assets
- Service worker for offline support
- GraphQL API (Apollo Server) as alternative to REST

### 10. **Performance Monitoring**
- Add Prometheus metrics endpoint
- Integrate with Grafana for visualization
- APM tools (DataDog, New Relic)

### 11. **Testing Enhancements**
- Increase test coverage to 80%+
- Load testing with k6 or Artillery
- Chaos engineering tests
- Accessibility testing (axe-core)

### 12. **Documentation**
- OpenAPI/Swagger documentation for API
- Storybook for UI components
- Developer onboarding guide
- User manual

## Technical Considerations

### Data Volume & Performance
- **Expected Data Size**: 
  - ~15,000 tradeable items in OSRS
  - At 1 price point per minute: ~21,600 records per item per day
  - Total daily inserts: ~324 million records/day (all items)
- **Optimization Strategies**:
  - Table partitioning by month
  - Batch inserts instead of individual
  - Async processing with worker pools
  - Database indexes on frequently queried columns
  - Archive old data (>1 year) to cold storage

### API Rate Limiting
- WikiScape API is community-maintained and has no published rate limits
- Implement polite scraping: User-Agent header, reasonable delays
- Bulk endpoints preferred over individual lookups
- Cache aggressively to minimize API calls

### Error Handling
- Graceful degradation when API is unavailable
- Fallback to cached data
- Exponential backoff for retries
- Circuit breaker pattern for external APIs

### Security
- Validate all user inputs
- Parameterized SQL queries (GORM handles this)
- CORS properly configured
- Rate limiting on public endpoints
- Environment-based secrets (never hardcode)

### Scalability
- Horizontal scaling: Multiple backend instances with load balancer
- Database read replicas for read-heavy queries
- Redis cluster for distributed caching
- Message queue (RabbitMQ/Kafka) for async tasks

## Success Metrics

### Technical Metrics
- API response time < 200ms (p95)
- Database query time < 50ms (p95)
- Frontend page load < 2s
- Test coverage > 80%
- Zero downtime deployments

### User Experience Metrics
- Chart render time < 1s
- Search results appear < 500ms
- Real-time updates within 1 minute
- Mobile-responsive (100% mobile score)

## Timeline Summary

| Phase | Duration | Key Deliverables |
|-------|----------|------------------|
| Phase 1 | 2 weeks | Backend foundation, database, API client |
| Phase 2 | 1 week | REST API, scheduler, Docker |
| Phase 3 | 1 week | Frontend setup, routing, state management |
| Phase 4 | 1 week | UI features, charts, search |
| Phase 5 | 1 week | Testing, polish, optimization |
| Phase 6 | 1 week | Deployment, monitoring, documentation |
| **Total** | **7 weeks** | **Fully functional production application** |

## Conclusion

This proposal outlines a robust, scalable, and performant full-stack application for tracking OSRS Grand Exchange prices. The architecture leverages modern best practices, industry-standard technologies, and the official OSRS APIs to deliver a high-quality user experience.

The modular design allows for incremental development and easy addition of future features. The comprehensive testing strategy ensures reliability, while the caching and optimization techniques guarantee fast response times even under heavy load.

### Recommended Next Steps
1. Review and approve this proposal
2. Set up development environment (Docker Compose)
3. Initialize Git repository with proper structure
4. Begin Phase 1 implementation
5. Establish weekly check-ins for progress review

---

**Document Version**: 1.0  
**Date**: January 14, 2026  
**Author**: GitHub Copilot  
**Status**: Awaiting Review
