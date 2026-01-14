# OSRS Grand Exchange Tracker - Implementation Plan

This document provides a high-level implementation plan for building the OSRS Grand Exchange Tracker from start to finish.

## 📅 Timeline Overview

| Phase | Duration | Focus Area |
|-------|----------|------------|
| Phase 1 | 3-4 days | Project Setup & Infrastructure |
| Phase 2 | 5-6 days | Backend Core Development |
| Phase 3 | 3-4 days | Backend API & Scheduler |
| Phase 4 | 4-5 days | Frontend Foundation |
| Phase 5 | 5-6 days | Frontend Features |
| Phase 6 | 3-4 days | Testing & Polish |
| Phase 7 | 2-3 days | Deployment & Documentation |
| **Total** | **~4-5 weeks** | **Complete Application** |

---

## Phase 1: Project Setup & Infrastructure (Days 1-4)

### 1.1 Repository & Project Structure
- [ ] Initialize Git repository with proper `.gitignore`
- [ ] Create directory structure for backend and frontend
- [ ] Set up branch protection rules (main, develop)
- [ ] Create issue templates and PR templates

### 1.2 Backend Project Initialization
```bash
backend/
├── cmd/api/main.go
├── internal/
│   ├── config/
│   ├── database/
│   ├── models/
│   ├── repository/
│   ├── services/
│   ├── handlers/
│   ├── middleware/
│   └── scheduler/
├── migrations/
├── go.mod
├── go.sum
└── .env.example
```

**Tasks:**
- [ ] Initialize Go module (`go mod init`)
- [ ] Install core dependencies (Fiber, GORM, Redis, Zap, Viper)
- [ ] Create configuration management with Viper
- [ ] Set up environment variable loading
- [ ] Create `.env.example` template

### 1.3 Frontend Project Initialization
```bash
frontend/
├── src/
│   ├── api/
│   ├── components/
│   ├── hooks/
│   ├── pages/
│   ├── stores/
│   ├── types/
│   └── utils/
├── tests/
├── package.json
├── vite.config.ts
├── tsconfig.json
└── tailwind.config.js
```

**Tasks:**
- [ ] Create Vite project with React + TypeScript template
- [ ] Install dependencies (TanStack Query, TanStack Table, Recharts, etc.)
- [ ] Configure TailwindCSS
- [ ] Set up ESLint and Prettier
- [ ] Configure Vitest and Playwright

### 1.4 Docker & Development Environment
- [ ] Create `docker-compose.yml` with PostgreSQL, Redis
- [ ] Create `Dockerfile` for backend
- [ ] Create `Dockerfile.dev` for frontend
- [ ] Test local development environment
- [ ] Document setup process in README

### Deliverables:
- ✅ Working development environment
- ✅ Backend and frontend projects initialized
- ✅ Docker Compose running PostgreSQL and Redis
- ✅ All dependencies installed

---

## Phase 2: Backend Core Development (Days 5-10)

### 2.1 Database Models & Migrations
**Models to create:**
- [ ] `Item` - Item metadata (id, name, icon, members, buy_limit, alch values)
- [ ] `CurrentPrice` - Latest price snapshot
- [ ] `PriceHistory` - Time-series price data

**Tasks:**
- [ ] Create GORM models in `internal/models/`
- [ ] Write SQL migrations (up/down) for each table
- [ ] Implement migration runner
- [ ] Add indexes for performance
- [ ] Set up table partitioning for `price_history`

### 2.2 Database Connections
- [ ] Implement PostgreSQL connection with GORM
- [ ] Implement Redis connection with go-redis
- [ ] Add connection pooling configuration
- [ ] Implement health checks for both connections
- [ ] Add graceful shutdown handling

### 2.3 Repository Layer
**Repositories to create:**
- [ ] `ItemRepository` - CRUD operations for items
  - `GetAll()`, `GetByID()`, `Search()`, `Upsert()`
- [ ] `PriceRepository` - Price data operations
  - `GetCurrentPrices()`, `GetCurrentPrice()`, `GetHistory()`, `BulkInsert()`

### 2.4 OSRS API Client
**Create `osrs_client.go` with methods:**
- [ ] `FetchBulkDump()` - Get all current prices
- [ ] `FetchLatestPrices(ids []int)` - Get latest for specific items
- [ ] `FetchHistoricalData(id, period)` - Get chart data
- [ ] `FetchSampleData(id)` - Get 150-point sample
- [ ] `FetchItemDetail(id)` - Get item metadata

**Features:**
- [ ] Retry logic with exponential backoff
- [ ] Rate limiting
- [ ] Custom User-Agent header
- [ ] Error handling and logging
- [ ] Response parsing and validation

### 2.5 Service Layer
**Services to create:**
- [ ] `ItemService` - Business logic for items
- [ ] `PriceService` - Business logic for prices
- [ ] `CacheService` - Redis caching operations

### 2.6 Logging Setup
- [ ] Configure Zap logger
- [ ] Create structured logging helpers
- [ ] Add request ID tracking
- [ ] Set up log levels (debug, info, warn, error)

### Deliverables:
- ✅ Database schema implemented and migrated
- ✅ Repository layer with all CRUD operations
- ✅ OSRS API client fetching data successfully
- ✅ Service layer with business logic
- ✅ Structured logging throughout

---

## Phase 3: Backend API & Scheduler (Days 11-14)

### 3.1 HTTP Server Setup
- [ ] Initialize Fiber app
- [ ] Configure server settings (timeouts, body limits)
- [ ] Set up graceful shutdown
- [ ] Add recovery middleware

### 3.2 Middleware
- [ ] CORS middleware (allow frontend origin)
- [ ] Request logging middleware
- [ ] Rate limiting middleware
- [ ] Error handling middleware

### 3.3 API Handlers

**Item Handlers:**
- [ ] `GET /api/v1/items` - List items (pagination, filters)
- [ ] `GET /api/v1/items/:id` - Get item by ID
- [ ] `GET /api/v1/items/search` - Search by name

**Price Handlers:**
- [ ] `GET /api/v1/prices/current` - All current prices
- [ ] `GET /api/v1/prices/current/:id` - Single item price
- [ ] `GET /api/v1/prices/history/:id` - Historical data
- [ ] `GET /api/v1/prices/batch` - Multiple items

**Health Handler:**
- [ ] `GET /health` - Health check endpoint

### 3.4 Scheduler Jobs
- [ ] Set up Robfig Cron scheduler
- [ ] **Job 1**: Fetch bulk dump every 1 minute
  - Fetch from os_dump.json
  - Update current_prices table
  - Invalidate Redis cache
- [ ] **Job 2**: Fetch historical data every 1 hour
  - Fetch sample data for top 100 items
  - Store in price_history
- [ ] **Job 3**: Full historical sync every 24 hours
  - Staggered fetching for all items
  - Avoid rate limiting

### 3.5 Startup Routine
- [ ] Connect to databases
- [ ] Run migrations
- [ ] Initial data load:
  - Fetch bulk dump
  - Fetch sample historical data for top items
- [ ] Start HTTP server
- [ ] Start scheduler

### 3.6 Unit & Integration Tests
- [ ] Repository tests (with test database)
- [ ] Service tests (with mocks)
- [ ] Handler tests (with httptest)
- [ ] API client tests (with mock server)

### Deliverables:
- ✅ REST API fully functional
- ✅ Scheduler running and collecting data
- ✅ Caching working correctly
- ✅ Unit and integration tests passing

---

## Phase 4: Frontend Foundation (Days 15-18)

### 4.1 Project Configuration
- [ ] Configure Vite for development and production
- [ ] Set up path aliases (@/ for src)
- [ ] Configure environment variables
- [ ] Set up TailwindCSS with custom theme

### 4.2 API Client Layer
- [ ] Create Axios instance with base URL
- [ ] Add request/response interceptors
- [ ] Create API functions:
  - `fetchItems()`, `fetchItem(id)`, `searchItems(query)`
  - `fetchCurrentPrices()`, `fetchCurrentPrice(id)`
  - `fetchPriceHistory(id, period)`

### 4.3 Type Definitions
```typescript
// types/item.ts
interface Item {
  id: number;
  itemId: number;
  name: string;
  iconUrl: string;
  members: boolean;
  buyLimit: number;
  highAlch: number;
  lowAlch: number;
}

// types/price.ts
interface CurrentPrice {
  itemId: number;
  price: number;
  volume: number;
  priceChange24h: number;
  trend: 'positive' | 'negative' | 'neutral';
  lastUpdated: string;
}

interface PricePoint {
  timestamp: number;
  price: number;
  volume?: number;
}
```

### 4.4 TanStack Query Setup
- [ ] Configure QueryClient with defaults
- [ ] Create custom hooks:
  - `useItems()`, `useItem(id)`
  - `useCurrentPrices()`, `useCurrentPrice(id)`
  - `usePriceHistory(id, period)`
- [ ] Set up polling for current prices (1 minute)

### 4.5 Zustand Stores
- [ ] `usePreferencesStore` - User preferences
  - Table columns visibility
  - Sort preferences
  - Theme (light/dark)
- [ ] `useFavoritesStore` - Favorite items (localStorage)

### 4.6 Layout Components
- [ ] `MainLayout` - App shell with header
- [ ] `Header` - Navigation, search bar
- [ ] `Loader` - Loading spinner
- [ ] `ErrorBoundary` - Error handling

### 4.7 Routing Setup
- [ ] Configure React Router
- [ ] Routes:
  - `/` - Dashboard (main table)
  - `/items/:id` - Item detail page
  - `*` - 404 Not Found

### Deliverables:
- ✅ API client connected to backend
- ✅ TanStack Query fetching data
- ✅ Basic layout and routing working
- ✅ Type definitions complete

---

## Phase 5: Frontend Features (Days 19-24)

### 5.1 Items Table Component
**Main table with TanStack Table:**
- [ ] Column definitions:
  - Icon, Name, Current Price, 24h Change, Volume
  - Buy Limit, High Alch, Low Alch, Last Updated
- [ ] Virtual scrolling for 15K+ rows
- [ ] Sortable columns (click header)
- [ ] Sticky header on scroll
- [ ] Row click → navigate to detail page

### 5.2 Table Filters
- [ ] Text search input (with debounce)
- [ ] Category dropdown filter
- [ ] Members/F2P toggle
- [ ] Price range slider
- [ ] Volume range filter
- [ ] Reset filters button

### 5.3 Table Features
- [ ] Pagination controls (50/100/200 per page)
- [ ] Column visibility selector
- [ ] Column resizing
- [ ] Export to CSV button
- [ ] Export to JSON button

### 5.4 Price Chart Component
- [ ] Line chart with Recharts
- [ ] Time range selector (24h, 7d, 30d, 90d, 1y, All)
- [ ] Tooltip with price and date
- [ ] Responsive design
- [ ] Loading state
- [ ] Empty state (no data)

### 5.5 Item Detail Page
- [ ] Item header (icon, name, members badge)
- [ ] Current price card with trend indicator
- [ ] Price chart (full width)
- [ ] Volume chart
- [ ] Statistics panel:
  - 24h high/low
  - 7d/30d average
  - All-time high/low
- [ ] Item details (buy limit, alch values)
- [ ] Back button to dashboard

### 5.6 Additional Components
- [ ] `TrendIndicator` - Green/red arrow with percentage
- [ ] `PriceDisplay` - Formatted price with GP suffix
- [ ] `MiniChart` - Small sparkline for table hover
- [ ] `FavoriteButton` - Star toggle

### 5.7 Utility Functions
- [ ] `formatGP(price)` - Format as "1.5M", "250K", etc.
- [ ] `formatNumber(num)` - Number with commas
- [ ] `formatDate(date)` - Human-readable date
- [ ] `formatPercentage(change)` - +5.2% / -3.1%

### Deliverables:
- ✅ Full-featured data table with filtering/sorting
- ✅ Interactive price charts
- ✅ Item detail page complete
- ✅ All UI components functional

---

## Phase 6: Testing & Polish (Days 25-28)

### 6.1 Unit Tests (Vitest)
- [ ] Component tests:
  - `ItemsTable.test.tsx`
  - `PriceChart.test.tsx`
  - `TableFilters.test.tsx`
- [ ] Hook tests:
  - `useItems.test.ts`
  - `usePrices.test.ts`
- [ ] Utility tests:
  - `formatters.test.ts`

### 6.2 E2E Tests (Playwright)
- [ ] `dashboard.spec.ts`:
  - Table loads with data
  - Search filters items
  - Sorting works
  - Pagination works
- [ ] `item-detail.spec.ts`:
  - Navigate from table
  - Chart renders
  - Time range selector works
  - Back navigation works

### 6.3 UI Polish
- [ ] Loading skeletons for table and charts
- [ ] Error states with retry buttons
- [ ] Empty states with helpful messages
- [ ] Toast notifications (Sonner)
- [ ] Keyboard navigation

### 6.4 Performance Optimization
- [ ] Memoize expensive computations
- [ ] Lazy load chart components
- [ ] Optimize re-renders with React.memo
- [ ] Virtual scrolling tuning
- [ ] Bundle size analysis

### 6.5 Accessibility
- [ ] ARIA labels for interactive elements
- [ ] Keyboard navigation support
- [ ] Screen reader compatibility
- [ ] Color contrast compliance

### 6.6 Responsive Design
- [ ] Mobile table (horizontal scroll)
- [ ] Mobile chart (full width)
- [ ] Mobile filters (collapsible)
- [ ] Touch-friendly interactions

### 6.7 Dark Mode
- [ ] Toggle switch in header
- [ ] TailwindCSS dark mode classes
- [ ] Persist preference in localStorage
- [ ] Chart colors for dark mode

### Deliverables:
- ✅ 80%+ test coverage
- ✅ All E2E tests passing
- ✅ Polished UI with loading/error states
- ✅ Mobile-responsive design
- ✅ Dark mode support

---

## Phase 7: Deployment & Documentation (Days 29-31)

### 7.1 Production Configuration
- [ ] Production Dockerfile for backend
- [ ] Production Dockerfile for frontend
- [ ] Production docker-compose.yml
- [ ] Environment variable management
- [ ] Secrets handling

### 7.2 CI/CD Pipeline
- [ ] GitHub Actions workflow:
  - Run tests on PR
  - Build Docker images
  - Deploy to staging
  - Deploy to production (manual trigger)
- [ ] Branch protection rules

### 7.3 Deployment
**Options:**
- **Option A**: DigitalOcean App Platform
- **Option B**: Railway
- **Option C**: AWS ECS
- **Option D**: VPS with Docker

**Tasks:**
- [ ] Choose deployment platform
- [ ] Set up production database
- [ ] Set up production Redis
- [ ] Configure domain and SSL
- [ ] Deploy backend
- [ ] Deploy frontend
- [ ] Verify production environment

### 7.4 Monitoring & Logging
- [ ] Application logging to stdout
- [ ] Log aggregation (if needed)
- [ ] Health check monitoring
- [ ] Error tracking (Sentry optional)

### 7.5 Documentation
- [ ] Update README with final instructions
- [ ] API documentation (Swagger/OpenAPI)
- [ ] Contributing guide
- [ ] Architecture decision records (ADRs)

### 7.6 Final Testing
- [ ] Smoke test production environment
- [ ] Load testing (optional)
- [ ] Security review
- [ ] Final QA pass

### Deliverables:
- ✅ Application deployed to production
- ✅ CI/CD pipeline automated
- ✅ Documentation complete
- ✅ Monitoring in place

---

## 📋 Checklist Summary

### Backend
- [ ] Database schema and migrations
- [ ] OSRS API client
- [ ] Repository layer
- [ ] Service layer
- [ ] REST API endpoints
- [ ] Scheduler jobs
- [ ] Caching with Redis
- [ ] Unit and integration tests
- [ ] Docker configuration

### Frontend
- [ ] API client layer
- [ ] TanStack Query setup
- [ ] Items table with virtual scroll
- [ ] Advanced filtering
- [ ] Column sorting and resizing
- [ ] Export functionality
- [ ] Price charts
- [ ] Item detail page
- [ ] Responsive design
- [ ] Dark mode
- [ ] Unit and E2E tests

### Infrastructure
- [ ] Docker Compose development
- [ ] Production Dockerfiles
- [ ] CI/CD pipeline
- [ ] Production deployment
- [ ] Monitoring

### Documentation
- [ ] README
- [ ] API documentation
- [ ] Contributing guide

---

## 🚦 Risk Mitigation

| Risk | Mitigation |
|------|------------|
| OSRS API rate limiting | Use bulk endpoints, cache aggressively |
| Large dataset (15K items) | Virtual scrolling, pagination, indexing |
| Database performance | Partitioning, proper indexes, connection pooling |
| Frontend bundle size | Code splitting, lazy loading |
| Data freshness | 1-minute polling with stale-while-revalidate |

---

## 📊 Success Criteria

- [ ] API response time < 200ms (p95)
- [ ] Frontend page load < 2s
- [ ] Test coverage > 80%
- [ ] Zero critical bugs
- [ ] Mobile-responsive design
- [ ] All OSRS items displayed with prices
- [ ] Historical charts working for all items

---

## 🎯 MVP Definition

**Minimum Viable Product includes:**
1. ✅ Backend polling OSRS API every minute
2. ✅ PostgreSQL storing current and historical prices
3. ✅ REST API serving data to frontend
4. ✅ Data table showing all items with current prices
5. ✅ Search and filter functionality
6. ✅ Price charts for individual items
7. ✅ Deployed and accessible

**Post-MVP features:**
- WebSocket real-time updates
- Price alerts
- User accounts
- Portfolio tracking
- Mobile app

---

*Last Updated: January 14, 2026*
