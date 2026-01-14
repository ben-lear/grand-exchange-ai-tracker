# OSRS Grand Exchange Tracker - Implementation Plan

## Project Overview
Build a full-stack application to track and visualize Old School RuneScape Grand Exchange item prices and trends. The backend fetches data from the OSRS API, stores it in PostgreSQL, and serves it via REST API. The frontend displays interactive price charts and item information.

---

## Phase 1: Backend Foundation

### 1.1 Database Layer
- [ ] Create database connection manager in `internal/repository/database.go`
- [ ] Implement GORM auto-migration on startup
- [ ] Create repository interfaces for Items, PriceHistory, and PriceTrends
- [ ] Implement ItemRepository with CRUD operations
- [ ] Implement PriceHistoryRepository with batch insert and time-range queries
- [ ] Implement PriceTrendRepository with upsert operations
- [ ] Add database connection pooling configuration
- [ ] Create Redis client connection manager
- [ ] Implement Redis caching helpers (get, set, delete with TTL)

### 1.2 OSRS API Client Service
- [ ] Create OSRS API client struct in `internal/services/osrs_client.go`
- [ ] Implement HTTP client with retry logic and rate limiting
- [ ] Add User-Agent header as per OSRS API guidelines
- [ ] Create method to fetch item list by category and letter
- [ ] Create method to fetch item details by item ID
- [ ] Create method to fetch price graph data (180 days)
- [ ] Implement response parsing for OSRS API JSON structures
- [ ] Add error handling for API failures and rate limits
- [ ] Implement caching layer for API responses (Redis)
- [ ] Add logging for all API requests and responses

### 1.3 Data Processing Service
- [ ] Create data service in `internal/services/data_service.go`
- [ ] Implement method to process and store item details
- [ ] Implement method to parse and store price history from graph data
- [ ] Implement method to calculate and update price trends
- [ ] Add logic to parse price strings (e.g., "5.2m" → 5200000)
- [ ] Implement trend calculation (positive/negative/neutral)
- [ ] Add percentage change calculations (30/90/180 day)
- [ ] Implement bulk item processing for initial data load
- [ ] Add data validation before database insertion

---

## Phase 2: Backend API Endpoints ✅ **COMPLETED**

### 2.1 Core API Setup
- [x] Initialize Fiber app in `cmd/api/main.go`
- [x] Configure middleware (CORS, logging, recovery)
- [x] Set up API versioning (v1 prefix)
- [x] Create router setup in `internal/api/router.go`
- [x] Implement health check endpoint (`GET /api/health`)
- [x] Implement readiness check endpoint (`GET /api/ready`)
- [x] Add request validation middleware
- [x] Implement error response formatting

### 2.2 Item Endpoints
- [x] Create items handler in `internal/api/handlers/items.go`
- [x] Implement `GET /api/v1/items` - List items with pagination
- [x] Implement `GET /api/v1/items/:id` - Get item details
- [x] Add query parameters for filtering (name, type, members)
- [x] Add sorting options (name, price, trend)
- [x] Implement search functionality by item name
- [x] Add response caching with Redis (5-minute TTL)

### 2.3 Price Data Endpoints
- [x] Create prices handler in `internal/api/handlers/prices.go`
- [x] Implement `GET /api/v1/items/:id/prices` - Get price history
- [x] Add time range parameters (7d, 30d, 90d, 180d)
- [x] Implement data aggregation for large time ranges
- [x] Implement `GET /api/v1/items/:id/graph` - Get chart-ready data
- [x] Implement `GET /api/v1/items/:id/trend` - Get current price trend
- [x] Implement price comparison endpoint for multiple items

### 2.4 Category & Statistics Endpoints
- [x] Create health handler in `internal/api/handlers/health.go`
- [x] Implement `GET /api/v1/stats/trending` - Get trending items
- [x] Implement `GET /api/v1/stats/biggest-movers` - Price gainers/losers
- [x] Add statistics for total items tracked
- [x] Implement most traded items endpoint

---

## Phase 3: Scheduled Tasks ✅ **COMPLETED**

### 3.1 Cron Scheduler Setup
- [x] Create scheduler in `internal/scheduler/scheduler.go`
- [x] Initialize Robfig cron with seconds-precision cron support
- [x] Add scheduler start/stop methods with graceful shutdown
- [x] Implement job status tracking and logging
- [x] Add 5-minute timeout context for all job executions

### 3.2 Data Collection Jobs
- [x] Create job to fetch item catalog (runs daily at 3 AM)
- [x] Create job to fetch item details (runs every 6 hours)
- [x] Create job to fetch price graphs (runs hourly for all items)
- [x] Implement job to update price trends (runs every 15 minutes)
- [x] Add job to clean up old price history (keep last 180 days)
- [x] Implement error recovery for failed jobs (continue on error)
- [x] Add comprehensive logging for all job operations
- [x] Fix OSRS API response parsing (SetResult issue, added manual JSON unmarshal)
- [x] Fix nil pointer issues with trend data (Day30/90/180)
- [x] Fix Members field type conversion (string to bool)

### 3.3 Cache Management
- [x] Redis caching integrated with OSRS API client
- [x] 5-minute TTL for API response cache
- [x] Cache hit/miss logging for debugging

### 3.4 Testing & Validation
- [x] Created test-sync utility for manual testing
- [x] Successfully populated database with 48 items
- [x] Created 10 price trend records
- [x] Verified scheduler integration with main.go
- [x] Tested graceful shutdown

**See PHASE3_SUMMARY.md for complete implementation details and testing results.**

---

## Phase 4: Frontend Foundation ✅ **COMPLETED**

### 4.1 API Client & Types
- [x] Enhance `frontend/src/services/api.ts` with all endpoints
- [x] Create API methods for items endpoints
- [x] Create API methods for prices endpoints
- [x] Create API methods for categories and stats
- [x] Add complete TypeScript interfaces in `types/index.ts`
- [x] Create API error types and error handling utilities
- [x] Add request/response interceptors for error handling

### 4.2 React Query Setup
- [x] Create custom hooks in `frontend/src/hooks/`
- [x] Implement `useItems()` hook for item list
- [x] Implement `useItemDetail()` hook for single item
- [x] Implement `usePriceHistory()` hook with time range support
- [x] Implement `usePriceGraph()` hook for chart data
- [x] Implement `useTrendingItems()` hook
- [x] Implement `useBiggestMovers()` hook
- [x] Add pagination support to query hooks
- [x] Configure query cache and stale time settings
- [x] Add React Query DevTools for development

### 4.3 State Management
- [x] Create Zustand stores in `frontend/src/store/`
- [x] Implement filter store (filters, search, sorting)
- [x] Implement watchlist store (local storage persistence)
- [x] Implement settings store (theme, chart preferences)
- [x] Create filter state for item list page
- [x] Add theme preference state (dark/light mode)
- [x] Implement user settings store

### 4.4 Utility Functions
- [x] Create formatters utility (price, date, percentage)
- [x] Create cn utility for Tailwind class merging
- [x] Add helper functions for price calculations
- [x] Implement relative time formatting

### 4.5 Example Implementation
- [x] Create ItemsListPage to demonstrate hooks
- [x] Update App.tsx with routing
- [x] Add basic layout structure

**See code for complete implementation details.**

---

## Phase 5: Frontend Components

### 5.1 Layout Components
- [ ] Create `Layout` component with header, main, footer
- [ ] Create `Header` component with navigation and search
- [ ] Create `Sidebar` component for categories/filters
- [ ] Create `Footer` component with links and info
- [ ] Implement responsive navigation menu

### 5.2 Item Components
- [ ] Create `ItemCard` component for grid view
- [ ] Create `ItemRow` component for list view
- [ ] Create `ItemDetail` component with full info
- [ ] Create `ItemImage` component with fallback
- [ ] Create `ItemBadge` component for members/free tags
- [ ] Create `PriceDisplay` component with formatting
- [ ] Create `TrendIndicator` component (up/down/neutral)

### 5.3 Chart Components
- [ ] Create `PriceChart` component using Recharts
- [ ] Implement line chart for price history
- [ ] Add area chart variant
- [ ] Create `ComparisonChart` for multiple items
- [ ] Implement time range selector (7d/30d/90d/180d)
- [ ] Add zoom and pan functionality
- [ ] Create chart tooltip with price and date
- [ ] Implement moving average overlay option

### 5.4 UI Components
- [ ] Create `SearchBar` component with autocomplete
- [ ] Create `FilterPanel` component for item filtering
- [ ] Create `Pagination` component
- [ ] Create `Loading` skeleton components
- [ ] Create `ErrorBoundary` component
- [ ] Create `Toast` notification wrapper (Sonner)
- [ ] Create `Modal` component for dialogs
- [ ] Create `Button` component variants
- [ ] Create `Input` component with validation styles
- [ ] Create `Select` dropdown component

---

## Phase 6: Frontend Pages

### 6.1 Dashboard Page
- [ ] Create `Dashboard` page at `/`
- [ ] Display summary statistics (total items, trending, etc.)
- [ ] Show featured/popular items grid
- [ ] Add biggest price movers section
- [ ] Implement recently updated items
- [ ] Add quick search functionality

### 6.2 Items List Page
- [ ] Create `ItemsList` page at `/items`
- [ ] Implement grid/list view toggle
- [ ] Add category filter sidebar
- [ ] Implement search and name filtering
- [ ] Add sorting options (price, name, trend)
- [ ] Implement pagination
- [ ] Add member/free filter toggle
- [ ] Show loading states and empty states

### 6.3 Item Detail Page
- [ ] Create `ItemDetail` page at `/items/:id`
- [ ] Display item information (name, desc, icon)
- [ ] Show current price and trend
- [ ] Display price history chart
- [ ] Show 30/90/180 day statistics
- [ ] Add watchlist/favorite button
- [ ] Display last update timestamp
- [ ] Implement share functionality

### 6.4 Categories Page
- [ ] Create `Categories` page at `/categories`
- [ ] Display all OSRS item categories
- [ ] Show item count per category
- [ ] Implement category cards with navigation
- [ ] Add category-specific filtering

### 6.5 Watchlist Page
- [ ] Create `Watchlist` page at `/watchlist`
- [ ] Display user's watched items
- [ ] Show quick price updates for watched items
- [ ] Implement remove from watchlist
- [ ] Add bulk actions
- [ ] Persist watchlist to local storage

### 6.6 About/Help Page
- [ ] Create `About` page at `/about`
- [ ] Add project information and credits
- [ ] Link to OSRS API documentation
- [ ] Add FAQ section
- [ ] Create usage guide

---

## Phase 7: Polish & Features

### 7.1 Search & Filtering
- [ ] Implement debounced search
- [ ] Add autocomplete suggestions
- [ ] Create advanced filter modal
- [ ] Add filter chips/tags display
- [ ] Implement filter persistence in URL params
- [ ] Add clear all filters button

### 7.2 Data Visualization Enhancements
- [ ] Add candlestick chart option
- [ ] Implement volume overlay on price charts
- [ ] Add price alerts/notifications (browser notifications)
- [ ] Create price calculator/profit calculator
- [ ] Add export data to CSV functionality
- [ ] Implement chart screenshot/share feature

### 7.3 Performance Optimization
- [ ] Implement virtual scrolling for large lists
- [ ] Add lazy loading for images
- [ ] Optimize bundle size (code splitting)
- [ ] Implement service worker for offline support
- [ ] Add progressive image loading
- [ ] Optimize Recharts rendering performance

### 7.4 User Experience
- [ ] Implement dark/light theme toggle
- [ ] Add keyboard shortcuts
- [ ] Create loading skeletons for all components
- [ ] Add smooth page transitions
- [ ] Implement error retry mechanisms
- [ ] Add tooltips for better UX
- [ ] Create onboarding tour for first-time users

---

## Phase 8: Testing

### 8.1 Backend Testing
- [ ] Set up testing framework (testify)
- [ ] Write unit tests for repository layer
- [ ] Write unit tests for service layer
- [ ] Write unit tests for API handlers
- [ ] Create integration tests for database operations
- [ ] Create integration tests for OSRS API client
- [ ] Write tests for scheduler jobs
- [ ] Add test coverage reporting
- [ ] Create mock data generators

### 8.2 Frontend Testing
- [ ] Set up Vitest for unit testing
- [ ] Write tests for utility functions
- [ ] Write tests for custom hooks
- [ ] Write component tests (React Testing Library)
- [ ] Create integration tests for pages
- [ ] Add E2E tests with Playwright (optional)
- [ ] Test error boundaries and fallbacks
- [ ] Add accessibility testing

---

## Phase 9: Documentation

### 9.1 Code Documentation
- [ ] Add JSDoc comments to all frontend functions
- [ ] Add godoc comments to all Go packages
- [ ] Document all API endpoints with examples
- [ ] Create database schema documentation
- [ ] Document environment variables

### 9.2 User Documentation
- [ ] Update README with complete setup instructions
- [ ] Create API documentation (Swagger/OpenAPI)
- [ ] Write deployment guide
- [ ] Create troubleshooting guide
- [ ] Add contributing guidelines

---

## Phase 10: Deployment & Production

### 10.1 Production Configuration
- [ ] Configure production environment variables
- [ ] Set up PostgreSQL backup strategy
- [ ] Configure Redis persistence
- [ ] Implement proper logging levels
- [ ] Add health check monitoring
- [ ] Configure rate limiting for API
- [ ] Set up HTTPS/SSL certificates

### 10.2 Docker Deployment
- [ ] Test Docker Compose production setup
- [ ] Optimize Docker images (multi-stage builds)
- [ ] Configure volume mounts for persistence
- [ ] Set up container restart policies
- [ ] Add Docker health checks

### 10.3 CI/CD (Optional)
- [ ] Set up GitHub Actions workflow
- [ ] Add automated testing on push
- [ ] Configure automated builds
- [ ] Set up automated deployment
- [ ] Add code quality checks (linting, formatting)

### 10.4 Monitoring & Analytics (Optional)
- [ ] Set up application monitoring
- [ ] Add error tracking (e.g., Sentry)
- [ ] Implement analytics tracking
- [ ] Create dashboard for system metrics
- [ ] Set up alerting for failures

---

## Phase 11: Future Enhancements (Optional)

### 11.1 Advanced Features
- [ ] Add user accounts and authentication
- [ ] Implement price alerts via email/webhook
- [ ] Create API for third-party integrations
- [ ] Add historical price prediction (ML)
- [ ] Implement WebSocket for real-time updates
- [ ] Create mobile-responsive PWA features
- [ ] Add multi-language support (i18n)

### 11.2 Additional Data Sources
- [ ] Integrate with OSRS Wiki for additional item info
- [ ] Add item use cases and requirements
- [ ] Show related items and recipes
- [ ] Add player statistics integration

---

## Estimated Timeline

- **Phase 1-3 (Backend)**: 2-3 weeks
- **Phase 4-6 (Frontend)**: 3-4 weeks
- **Phase 7 (Polish)**: 1 week
- **Phase 8 (Testing)**: 1-2 weeks
- **Phase 9 (Documentation)**: 3-5 days
- **Phase 10 (Deployment)**: 3-5 days

**Total Estimated Time**: 8-11 weeks for full implementation

---

## Priority Tasks for MVP

For a Minimum Viable Product, focus on:

1. Backend: Database layer, OSRS API client, basic endpoints
2. Scheduler: Item data collection and price history updates
3. Frontend: Dashboard, Items list, Item detail pages with charts
4. Basic search and filtering
5. Docker deployment

**MVP Estimated Time**: 3-4 weeks

---

## Notes

- The OSRS API has rate limits - implement exponential backoff
- OSRS uses only 1 category (unlike RS3's 43 categories)
- Price data format varies (strings like "5.2m" need parsing)
- Cache aggressively to reduce API calls
- Consider time zones for scheduled jobs (OSRS updates on game time)
