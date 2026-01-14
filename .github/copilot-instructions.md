# GitHub Copilot Instructions for OSRS Grand Exchange Tracker

## Project Overview

This is a full-stack application for tracking and visualizing **Old School RuneScape (OSRS)** Grand Exchange item prices and trends. The backend fetches data from the OSRS API, stores it in PostgreSQL, and serves it via REST API. The frontend displays interactive price charts and item information.

**IMPORTANT**: This project uses **OSRS** (Old School RuneScape) API, not RS3 (RuneScape 3). Always use `m=itemdb_oldschool` in API URLs.

## Tech Stack

### Backend
- **Language**: Go 1.22+
- **Framework**: Fiber (high-performance HTTP framework)
- **Database**: PostgreSQL 16 with GORM
- **Caching**: Redis 7
- **Scheduler**: Robfig Cron v3
- **Logging**: Uber Zap (structured JSON logging)
- **HTTP Client**: Resty v2
- **Validation**: go-playground/validator v10

### Frontend
- **Framework**: React 18 with TypeScript (strict mode)
- **Build Tool**: Vite 5
- **Routing**: React Router v6
- **Data Fetching**: TanStack Query (React Query) v5
- **Charts**: Recharts v2
- **State Management**: Zustand v4
- **Forms**: React Hook Form v7 + Zod validation
- **Styling**: TailwindCSS v3
- **Notifications**: Sonner
- **Date Utilities**: date-fns v3

## Project Structure

```
backend/
├── cmd/api/              # Application entry point
├── internal/
│   ├── api/              # HTTP handlers (Fiber routes)
│   ├── config/           # Configuration management (Viper)
│   ├── models/           # GORM database models
│   ├── repository/       # Database layer (interface-based)
│   ├── scheduler/        # Cron jobs for data collection
│   └── services/         # Business logic (OSRS API client, data processing)
├── pkg/logger/           # Reusable logging utilities
└── migrations/           # SQL migration files

frontend/
├── src/
│   ├── components/       # Reusable React components
│   ├── pages/            # Page-level components (routes)
│   ├── hooks/            # Custom React hooks
│   ├── services/         # API client (Axios)
│   ├── store/            # Zustand stores
│   ├── types/            # TypeScript interfaces/types
│   └── utils/            # Helper functions
└── public/               # Static assets
```

## Coding Guidelines

### General Principles
1. Write clean, self-documenting code with meaningful names
2. Follow the Single Responsibility Principle
3. Use interfaces for abstraction and dependency injection
4. Implement proper error handling at all levels
5. Add logging for important operations and errors
6. Write code that is testable and maintainable

### Backend (Go) Conventions

#### Code Style
- Use `gofmt` and `goimports` for formatting
- Follow [Effective Go](https://go.dev/doc/effective_go) guidelines
- Use `camelCase` for private functions, `PascalCase` for exported functions
- Package names should be short, lowercase, single-word

#### Structure Patterns
- **Repository Pattern**: All database operations go through repository interfaces
- **Service Layer**: Business logic separated from HTTP handlers
- **Dependency Injection**: Pass dependencies through constructors

#### Error Handling
```go
// Return errors, don't panic (except in init/main for critical failures)
if err != nil {
    logger.Error("failed to process item", "error", err, "itemId", itemID)
    return fmt.Errorf("process item: %w", err)
}
```

#### Database Operations
- Use GORM for all database interactions
- Always use transactions for multi-step operations
- Use prepared statements (GORM handles this)
- Implement proper connection pooling
- Use indexes for frequently queried columns

#### API Handlers
```go
// Use Fiber context
func GetItem(c *fiber.Ctx) error {
    id := c.Params("id")
    // ... validation and logic
    return c.JSON(fiber.Map{
        "data": item,
        "status": "success",
    })
}
```

#### Logging
```go
// Use structured logging with Zap
logger.Info("processing item", 
    "itemId", item.ItemID, 
    "name", item.Name,
)
logger.Error("failed operation",
    "error", err,
    "context", additionalInfo,
)
```

### Frontend (React/TypeScript) Conventions

#### Code Style
- Use ESLint and Prettier for formatting
- Prefer functional components with hooks
- Use TypeScript strict mode - no `any` types
- Use named exports for components

#### Component Patterns
```typescript
// Functional component with TypeScript
interface ItemCardProps {
  item: Item;
  onSelect?: (id: number) => void;
}

export const ItemCard: React.FC<ItemCardProps> = ({ item, onSelect }) => {
  // Component logic
  return (/* JSX */);
};
```

#### Custom Hooks
```typescript
// Use TanStack Query for data fetching
export const useItemDetail = (itemId: number) => {
  return useQuery({
    queryKey: ['item', itemId],
    queryFn: () => apiClient.getItem(itemId),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};
```

#### State Management
- Use Zustand for global state
- Use React Query for server state
- Use local state (useState) for component-specific state
- Avoid prop drilling - use composition or context

#### Styling
- Use TailwindCSS utility classes
- Create reusable component variants with `clsx` or `cn` utility
- Follow mobile-first responsive design
- Use OSRS-themed colors: gold (#FFD700), orange (#FF9800)

## OSRS API Specifics

### Base URL
```
https://secure.runescape.com/m=itemdb_oldschool/api
```

### Key Endpoints
- **Items List**: `/catalogue/items.json?category=1&alpha={letter}&page={page}`
- **Item Detail**: `/catalogue/detail.json?item={itemId}`
- **Price Graph**: `/graph/{itemId}.json` (returns 180 days of data)

### Important Notes
1. **OSRS uses only 1 category** (unlike RS3's 43 categories)
2. **Rate Limiting**: Implement exponential backoff and caching
3. **Price Formats**: API returns strings like "5.2m", "1.5k" - parse to integers
4. **Timestamp Format**: Unix milliseconds (divide by 1000 for seconds)
5. **User-Agent**: Always set a descriptive User-Agent header

### Price Parsing
```go
// Example: Parse "5.2m" → 5200000
// Parse "1.5k" → 1500
// Parse "125" → 125
```

## Database Schema

### Tables
- **items**: OSRS item information (id, name, description, icon URLs, type, members flag)
- **price_history**: Historical price points (item_id, timestamp, price, volume)
- **price_trends**: Current trends and statistics (item_id, current_price, trend, day30/90/180 changes)

### Key Relationships
- `price_history.item_id` → `items.id` (foreign key with cascade delete)
- `price_trends.item_id` → `items.id` (foreign key with cascade delete)

### Indexes
- `items.item_id` (unique)
- `items.name` (for search)
- `price_history.item_id` (for queries)
- `price_history.timestamp` (for time-range queries)

## Caching Strategy

### Redis Usage
- **API Response Cache**: 5-minute TTL for OSRS API responses
- **Item Details**: 10-minute TTL for frequently accessed items
- **Price History**: 5-minute TTL for chart data
- **Search Results**: 2-minute TTL for search queries

### Cache Keys
```
osrs:item:{itemId}
osrs:items:list:{category}:{page}
osrs:graph:{itemId}
osrs:search:{query}
```

## Scheduled Jobs (Cron)

### Job Schedule
- **Item Catalog Sync**: Daily at 3:00 AM
- **Item Details Update**: Every 6 hours
- **Popular Items Price Sync**: Every 5 minutes (top 100 items)
- **All Items Price Sync**: Every hour
- **Trend Calculation**: Every 15 minutes
- **Old Data Cleanup**: Daily at 2:00 AM (keep last 180 days)

### Job Patterns
```go
// Use Robfig cron syntax
c.AddFunc("*/5 * * * *", func() {
    // Job logic with error handling
})
```

## API Response Formats

### Success Response
```json
{
  "status": "success",
  "data": { /* payload */ },
  "timestamp": "2026-01-13T19:45:00Z"
}
```

### Error Response
```json
{
  "status": "error",
  "message": "Item not found",
  "code": "ITEM_NOT_FOUND",
  "timestamp": "2026-01-13T19:45:00Z"
}
```

### Pagination
```json
{
  "data": [/* items */],
  "pagination": {
    "page": 1,
    "per_page": 20,
    "total": 500,
    "total_pages": 25
  }
}
```

## Testing Guidelines

### Backend Tests
- Use `testify` for assertions
- Create mock repositories for unit tests
- Use test database for integration tests
- Test error cases and edge cases

### Frontend Tests
- Use Vitest for unit tests
- Use React Testing Library for component tests
- Test user interactions, not implementation details
- Mock API calls with MSW (Mock Service Worker)

## Performance Considerations

### Backend
- Use connection pooling (max 25 connections)
- Implement request rate limiting (100 req/min per IP)
- Use batch operations for bulk inserts
- Index frequently queried columns
- Use Redis caching aggressively

### Frontend
- Implement virtual scrolling for large lists (>100 items)
- Lazy load images with placeholders
- Code split routes with React.lazy()
- Optimize Recharts by limiting data points
- Use React.memo for expensive components

## Security Best Practices

### Backend
- Validate all user inputs
- Use parameterized queries (GORM handles this)
- Set proper CORS headers
- Implement rate limiting
- Don't expose internal errors to users
- Use environment variables for secrets

### Frontend
- Sanitize user inputs
- Implement CSRF protection
- Use HTTPS in production
- Don't store sensitive data in localStorage
- Validate data from API before use

## Environment Variables

### Backend (.env)
```bash
PORT=8080
ENV=development
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=osrs_ge_tracker
REDIS_HOST=localhost
REDIS_PORT=6379
OSRS_API_BASE_URL=https://secure.runescape.com/m=itemdb_oldschool/api
LOG_LEVEL=info
```

### Frontend (.env)
```bash
VITE_API_URL=http://localhost:8080/api
```

## Common Patterns and Examples

### Backend: Create a New API Endpoint
1. Define handler in `internal/api/handlers/`
2. Add route in router setup
3. Use repository for data access
4. Return consistent JSON response
5. Add logging for operations
6. Handle errors gracefully

### Frontend: Create a New Page
1. Create page component in `src/pages/`
2. Add route in App.tsx
3. Use custom hooks for data fetching
4. Implement loading and error states
5. Use existing UI components
6. Add to navigation if needed

### Adding a Scheduled Job
1. Create job function in `internal/scheduler/`
2. Add cron schedule to scheduler
3. Implement error handling and logging
4. Add job status tracking
5. Test job execution manually

## Troubleshooting Tips

### Common Issues
1. **CORS errors**: Check backend CORS middleware configuration
2. **Database connection failed**: Verify PostgreSQL is running and credentials are correct
3. **API rate limit**: Implement exponential backoff and caching
4. **Build errors**: Run `go mod tidy` or `npm install` to sync dependencies
5. **Type errors**: Ensure TypeScript interfaces match API responses

### Debugging
- Backend: Check logs with structured fields
- Frontend: Use React DevTools and TanStack Query DevTools
- Database: Check queries with PostgreSQL logs
- API: Use browser DevTools Network tab

## Resources

- [OSRS API Documentation](https://runescape.wiki/w/Application_programming_interface)
- [Fiber Documentation](https://docs.gofiber.io/)
- [GORM Documentation](https://gorm.io/docs/)
- [React Router Documentation](https://reactrouter.com/)
- [TanStack Query Documentation](https://tanstack.com/query/latest)
- [Recharts Documentation](https://recharts.org/)

## When Generating Code

1. **Always** use TypeScript for frontend (no JavaScript)
2. **Always** handle errors appropriately
3. **Always** add logging for important operations
4. **Always** follow the project structure
5. **Always** use existing patterns and conventions
6. **Prefer** functional components over class components
7. **Prefer** repository pattern over direct database access
8. **Prefer** composition over inheritance
9. **Avoid** any types in TypeScript
10. **Avoid** inline styles - use TailwindCSS

## Priority for MVP

Phase 1-2 are complete! Focus on these remaining core features:

### ✅ COMPLETED
1. ✅ OSRS API client with caching
2. ✅ Database layer (items, price history, price trends)
3. ✅ REST API endpoints (all routes)
4. ✅ Health check endpoints
5. ✅ Frontend: Basic structure exists

### 🎯 NEXT (Phase 3)
1. Scheduled job system for data collection
2. Background jobs to fetch item catalog from OSRS API
3. Price update jobs (popular items every 5 min, all items hourly)
4. Trend calculation jobs
5. Old data cleanup jobs

### 📋 UPCOMING (Phase 4+)
6. Frontend: Dashboard and item list pages
7. Price history charts (Recharts integration)
8. Basic search and filtering
9. Trending items display
10. Real-time price updates

## Current API Endpoints (Phase 2 ✅)

### Health & Readiness
- `GET /api/health` - Basic health check
- `GET /api/ready` - Database + Redis readiness check

### Items (v1)
- `GET /api/v1/items` - List items (pagination, search, filtering, sorting)
- `GET /api/v1/items/:id` - Get item detail with trend

### Prices (v1)
- `GET /api/v1/items/:id/prices?range=30d` - Price history
- `GET /api/v1/items/:id/graph?range=90d` - Chart-ready data
- `GET /api/v1/items/:id/trend` - Current price trend

### Statistics (v1)
- `GET /api/v1/stats/trending?limit=10&timeframe=24h` - Trending items
- `GET /api/v1/stats/biggest-movers?direction=gainers&limit=10` - Price movers

## Recent Architecture Decisions

1. **Import Paths**: Using full module path `github.com/guavi/grand-exchange-ai-tracker` throughout
2. **Repository Pattern**: All database access through repository interfaces
3. **Middleware Stack**: Request ID → Recovery → CORS → Fiber Logger → Custom Logger
4. **API Versioning**: All endpoints under `/api/v1/` prefix
5. **Error Handling**: Centralized error handler in Fiber config
6. **Response Format**: Consistent JSON with `status`, `data`, `timestamp`
7. **Pagination**: Standard `page`, `limit`, `total`, `total_pages` format

---

**Remember**: This is an OSRS (Old School RuneScape) tracker, not RS3. Always use `itemdb_oldschool` in API URLs!
