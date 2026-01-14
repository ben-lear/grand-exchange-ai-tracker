# OSRS GE Tracker - Frontend

React + TypeScript frontend for the OSRS Grand Exchange Tracker.

## Tech Stack

- **React 18** - UI framework
- **TypeScript 5** - Type-safe JavaScript
- **Vite 6** - Build tool and dev server
- **TanStack Query v5** - Data fetching and caching
- **TanStack Table v8** - Powerful table component
- **React Router v6** - Client-side routing
- **Zustand v5** - State management
- **Axios** - HTTP client
- **Recharts v2** - Charts and graphs
- **TailwindCSS v3** - Utility-first CSS
- **Lucide React** - Icon library
- **Sonner** - Toast notifications
- **date-fns v4** - Date utilities
- **Vitest** - Unit testing
- **Playwright** - E2E testing

## Project Structure

```
src/
├── api/           # API client and endpoints
├── components/    # React components
│   ├── common/    # Shared components (Loading, Error, etc.)
│   ├── layout/    # Layout components (Header, Footer, MainLayout)
│   ├── table/     # Table components (Phase 5)
│   └── charts/    # Chart components (Phase 5)
├── hooks/         # Custom React hooks for data fetching
├── pages/         # Page components
├── stores/        # Zustand state stores
├── test/          # Test setup files
├── types/         # TypeScript type definitions
└── utils/         # Utility functions (with co-located tests)
    ├── formatters.ts & formatters.test.ts
    ├── dateUtils.ts & dateUtils.test.ts
    ├── helpers.ts & helpers.test.ts
    └── cn.ts & cn.test.ts
```

### Test Organization

Tests follow these conventions:
- **Pattern**: `*.test.ts` or `*.test.tsx`
- **Location**: Co-located with source files (same directory)
- **Coverage**: Run `npm run test:coverage` for detailed report
- **Current**: 68 tests passing, 94.89% coverage on utilities

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Backend API running on http://localhost:8080

### Installation

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Start development server
npm run dev
```

The app will be available at http://localhost:5173

## Available Scripts

### Development
```bash
npm run dev          # Start dev server with hot reload
```

### Building
```bash
npm run build        # Build for production
npm run preview      # Preview production build
```

### Testing
```bash
npm run test         # Run unit tests in watch mode
npm run test:run     # Run tests once
npm run test:coverage # Run tests with coverage report
npm run test:ui      # Run tests with UI
npm run test:e2e     # Run E2E tests with Playwright
npm run test:e2e:ui  # Run E2E tests with UI
```

### Code Quality
```bash
npm run lint         # Run ESLint
npm run type-check   # Run TypeScript compiler check
```

## Environment Variables

Create a `.env` file:

```env
# API Base URL
VITE_API_BASE_URL=http://localhost:8080/api/v1
```

## Features

### Phase 4 (Complete) ✅

- TypeScript type definitions for all API responses
- Axios API client with interceptors and error handling
- TanStack Query hooks for data fetching and caching
- Zustand stores for user preferences, favorites, and UI state
- Layout components (Header, Footer, MainLayout)
- Common components (Loading, Error, EmptyState)
- Page components (Dashboard, ItemDetail, NotFound)
- React Router configuration
- Utility functions for formatting, dates, and helpers
- Comprehensive unit tests
- Dark mode support
- Responsive design

### Phase 5 (Coming Next) 🚧

- Items table with TanStack Table
- Virtual scrolling for 15K+ rows
- Table filters and sorting
- Price charts with Recharts
- Time range selector
- Favorite items functionality
- Export to CSV/JSON
- Advanced features

## Key Patterns

### Data Fetching

```typescript
// Using custom hooks
import { useItems, useCurrentPrice } from '../hooks';

function MyComponent() {
  // Auto-refetches every 1 minute
  const { data: prices, isLoading } = useAllCurrentPrices();
  
  // With filters
  const { data: items } = useItems({
    page: 1,
    pageSize: 100,
    sortBy: 'name',
    members: true,
  });
}
```

### State Management

```typescript
// Using Zustand stores
import { usePreferencesStore, useFavoritesStore } from '../stores';

function MyComponent() {
  const theme = usePreferencesStore(state => state.theme);
  const isFavorite = useFavoritesStore(state => state.isFavorite);
}
```

### Formatting

```typescript
import { formatGP, formatPercentage, formatRelativeTime } from '../utils';

formatGP(1234567)           // "1.2M"
formatPercentage(5.123)     // "+5.12%"
formatRelativeTime(date)    // "5 minutes ago"
```

## API Integration

All API calls go through the configured Axios client:

```typescript
// Item endpoints
GET /api/v1/items              # List items
GET /api/v1/items/:id          # Get item
GET /api/v1/items/search?q=    # Search items

// Price endpoints
GET /api/v1/prices/current     # All current prices
GET /api/v1/prices/current/:id # Single price
GET /api/v1/prices/history/:id # Historical data
```

## Development Guidelines

### TypeScript

- Strict mode enabled
- No `any` types (use `unknown` if needed)
- Use type inference where obvious
- Define interfaces for all props

### React

- Functional components with hooks
- Use React Query for server state
- Use Zustand for client state
- Avoid prop drilling (use stores)

### Styling

- TailwindCSS utility classes
- Dark mode with `dark:` prefix
- Responsive with `sm:`, `md:`, `lg:`, `xl:`
- Use `cn()` helper for conditional classes

### Testing

- Unit tests for utilities and helpers
- Component tests with Testing Library
- E2E tests with Playwright
- Aim for good coverage on critical paths

## Performance

- TanStack Query caching with smart stale times
- Virtual scrolling for large tables
- Prefetching for better UX
- Code splitting with React Router
- Optimized production builds

## Accessibility

- Semantic HTML elements
- ARIA labels where needed
- Keyboard navigation support
- Screen reader friendly
- Color contrast compliance

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Contributing

1. Follow the existing code style
2. Write tests for new features
3. Update documentation
4. Run linter before committing
5. Use conventional commit messages

## License

MIT
