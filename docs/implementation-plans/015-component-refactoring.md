# Component Refactoring Implementation Plan

**Created:** January 18, 2026  
**Status:** In Progress (Phase 5 Complete, Ready for Phase 6)  
**Priority:** High  
**Estimated Duration:** 5 weeks

## 🎯 Objective

Refactor 8 large monolithic components (>200 lines) into 43+ smaller, reusable pure components. Eliminate ~1,300 lines of code duplication and standardize 15 repeated UI patterns across the frontend codebase. Establish production-grade error handling, comprehensive testing, and component documentation standards.

## 📊 Current State Analysis

### Problem Components
- **ItemsTable.tsx** - 325 lines (table structure + column config + rendering)
- **PriceChart.tsx** - 400+ lines (data processing + SSE + chart + stats)
- **columns.tsx** - 277 lines (9 inline cell renderers)
- **ItemDetailPage.tsx** - 298 lines (data fetching + 4 sections)
- **DashboardPage.tsx** - 277 lines (filtering logic + page layout)
- **SharedWatchlistPage.tsx** - 277 lines (banners + grid + data)
- **GlobalSearch.tsx** - 229 lines (keyboard handling + dropdown)
- **Loading.tsx** - 248 lines (8 loading variants)

### Repeated Patterns (15+)
1. Modal wrapper boilerplate (5 instances)
2. Status banner pattern (4 instances)
3. Empty state pattern (6 instances)
4. Price display pattern (8 instances)
5. Item icon + name pattern (5 instances)
6. Action menu pattern (3 instances)
7. Form field wrapper (5 instances)
8. Icon fallback handling (5 instances)

### Current Metrics
- **Total Component Files:** 78
- **Total Lines:** ~8,500
- **Components >200 lines:** 8
- **Average Component Size:** ~110 lines
- **Duplicated Patterns:** ~15
- **Test Coverage:** ~65%
- **Error Boundaries:** ❌ None
- **Storybook:** ❌ Not installed

## 🎯 Target State

### Metrics After Refactoring
- **Total Component Files:** ~121 (+43)
- **Total Lines:** ~7,200 (-1,300 lines of duplication)
- **Components >200 lines:** 0 ✅
- **Average Component Size:** ~60 lines
- **Duplicated Patterns:** ~3 (unavoidable)
- **Test Coverage:** 80%+ ✅
- **Error Boundaries:** Full coverage ✅
- **Storybook:** All components documented ✅
- **Accessibility:** WCAG AA compliant ✅
- **Reusability Score:** +350%

---

## Phase 0: Setup & Infrastructure

### 0.1 Add ESLint Rules
**File:** `frontend/eslint.config.js`

**Add Rules:**
```javascript
rules: {
  // ... existing rules
  'max-lines': ['warn', { 
    max: 200, 
    skipBlankLines: true, 
    skipComments: true 
  }],
}
```

**Install Accessibility Plugin:**
```bash
npm install -D eslint-plugin-jsx-a11y @axe-core/react
```

**Validation:**
```bash
npm run lint
```

---

### 0.2 Setup Storybook
**Priority:** HIGH - Required for all new components

**Install:**
```bash
npm install -D @storybook/react-vite@^8.0.0 @storybook/addon-essentials@^8.0.0 @storybook/addon-a11y@^8.0.0
```

**Configuration Files:**

**`.storybook/main.ts`:**
```typescript
import type { StorybookConfig } from '@storybook/react-vite';

const config: StorybookConfig = {
  stories: ['../src/**/*.stories.@(ts|tsx)'],
  addons: [
    '@storybook/addon-essentials',
    '@storybook/addon-a11y',
  ],
  framework: {
    name: '@storybook/react-vite',
    options: {},
  },
  docs: {
    autodocs: 'tag',
  },
};

export default config;
```

**`.storybook/preview.ts`:**
```typescript
import type { Preview } from '@storybook/react';
import '../src/index.css';

const preview: Preview = {
  parameters: {
    actions: { argTypesRegex: '^on[A-Z].*' },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/,
      },
    },
  },
};

export default preview;
```

**Update `package.json`:**
```json
{
  "scripts": {
    "storybook": "storybook dev -p 6006",
    "build-storybook": "storybook build"
  }
}
```

**Reference:** Follow patterns from [Button.tsx](frontend/src/components/ui/Button.tsx)

---

### 0.3 Document Architecture Patterns
**New File:** `docs/frontend-architecture.md`

**Content Overview:**
- **Component Patterns:** Pure vs container components, composition strategies
- **State Management:** When to use useState, Zustand stores, TanStack Query, Context
- **Error Handling:** ErrorBoundary placement, graceful degradation
- **Form Patterns:** FormField wrapper, validation, error display
- **Testing Standards:** Unit test structure, Storybook requirements, coverage targets
- **Accessibility:** ARIA patterns, keyboard navigation, screen reader support

---

## Phase 1: Shared UI Primitives (Week 1)

### 1.1 Create ErrorBoundary Components
**Priority:** CRITICAL - Must be first

**New Files:**
- `frontend/src/components/common/ErrorBoundary.tsx` (~90 lines)
- `frontend/src/components/common/ErrorFallback.tsx` (~70 lines)

**ErrorBoundary Interface:**
```typescript
interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<ErrorFallbackProps>;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  resetKeys?: Array<string | number>;
}
```

**ErrorFallback Interface:**
```typescript
interface ErrorFallbackProps {
  error: Error;
  resetErrorBoundary: () => void;
  variant?: 'page' | 'section' | 'inline';
}
```

**Features:**
- Class component with componentDidCatch
- Logs errors to console (future: error service integration)
- Reset on prop changes (resetKeys)
- Different fallback variants for different contexts

**Usage Locations:**
1. **App-level:** Wrap entire app in [App.tsx](frontend/src/App.tsx)
2. **Route-level:** Wrap each route in MainLayout
3. **Component-level:** Wrap PriceChart, ItemsTable

**Test File:** `ErrorBoundary.test.tsx`
- Should catch errors in children
- Should call onError callback
- Should display fallback UI
- Should reset on resetKeys change
- Should log to console

**Storybook:** `ErrorBoundary.stories.tsx`
- Page variant fallback
- Section variant fallback  
- Inline variant fallback
- Interactive "Throw Error" button
- Reset functionality demo

**Reference:** [011-loading-error-states.md](docs/implementation-plans/011-loading-error-states.md)

---

### 1.2 Extract EmptyState Component

**New File:** `frontend/src/components/ui/EmptyState.tsx` (~50 lines)

**Source:** Extract from `ErrorDisplay.tsx` lines ~95-115

**Interface:**
```typescript
interface EmptyStateProps {
  icon?: React.ComponentType<{ className?: string }>;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}
```

**Replaces 6 instances:**
- ItemsTable empty state
- PriceChart empty state
- WatchlistsPage empty state
- SharedWatchlistPage empty items
- SearchResult no results

**Test File:** `EmptyState.test.tsx`
- Should render title and description
- Should render icon when provided
- Should render action button
- Should call action.onClick
- Should apply custom className

**Storybook:** `EmptyState.stories.tsx`
- Default (title + description)
- With icon
- With action button
- All props combined
- Long text content

---

### 1.3 Create PriceDisplay Component

**New File:** `frontend/src/components/ui/PriceDisplay.tsx` (~60 lines)

**Interface:**
```typescript
interface PriceDisplayProps {
  value: number;
  type: 'high' | 'low' | 'mid' | 'margin';
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}
```

**Features:**
- Auto-color coding (green=high, red=low, blue=mid, purple=margin)
- Consistent formatting via `formatGold()`
- Font mono styling
- CVA variant system

**Replaces 8 instances:**
- 3 in `columns.tsx` (high/low/avg columns)
- 4 in `ItemDetailPage.tsx` (current price card)
- 1 in `SearchResultItem.tsx`

**Test File:** `PriceDisplay.test.tsx`
- Should format price correctly
- Should apply color based on type
- Should handle all size variants
- Should show/hide label
- Should use formatGold utility

**Storybook:** `PriceDisplay.stories.tsx`
- All types with color coding
- All sizes
- With and without labels
- Interactive value controls
- Edge cases (0, negative, very large)

---

### 1.4 Create StatusBanner Component

**New File:** `frontend/src/components/ui/StatusBanner.tsx` (~70 lines)

**Interface:**
```typescript
interface StatusBannerProps {
  variant: 'info' | 'success' | 'warning' | 'error';
  title: string;
  description?: string;
  icon?: React.ComponentType<{ className?: string }>;
  action?: React.ReactNode;
  className?: string;
  onClose?: () => void;
}
```

**Replaces 4 instances:**
- ShareInfoBanner (SharedWatchlistPage)
- ImportSuccessBanner (SharedWatchlistPage)
- Error state banners
- Live indicator banner

**Test File:** `StatusBanner.test.tsx`
- Should render all variants
- Should show icon when provided
- Should render action button
- Should call onClose
- Should apply variant styles

**Storybook:** `StatusBanner.stories.tsx`
- All variants (info/success/warning/error)
- With/without icon
- With/without action
- Dismissible vs permanent
- Long content

---

### 1.5 Split Loading.tsx

**Current:** `components/common/Loading.tsx` (248 lines)

**New Structure:**
```
components/common/loading/
├── LoadingSpinner.tsx      (~40 lines)
├── DotsLoading.tsx         (~40 lines)
├── PulseLoading.tsx        (~30 lines)
├── TableLoading.tsx        (~60 lines)
├── CardGridLoading.tsx     (~40 lines)
└── index.ts                (exports all)
```

**Migration:**
```typescript
// Old import
import { Loading } from '@/components/common/Loading';

// New imports
import { LoadingSpinner, TableLoading } from '@/components/common/loading';
```

**Files to Update:** ~15 files importing `Loading`

**Test Files:**
- `LoadingSpinner.test.tsx` - All sizes, with message
- `DotsLoading.test.tsx` - Animation, sizes
- `TableLoading.test.tsx` - Row count, skeleton structure
- `CardGridLoading.test.tsx` - Grid layout, card count

**Storybook:** `loading/index.stories.tsx`
- All loading variants
- All sizes
- With/without messages

---

### 1.6 Create ItemIcon Component

**New File:** `frontend/src/components/common/ItemIcon.tsx` (~60 lines)

**Interface:**
```typescript
interface ItemIconProps {
  src: string;
  alt: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  fallback?: React.ReactNode;
  loading?: boolean;
  className?: string;
  onError?: () => void;
}
```

**Features:**
- Automatic fallback on load error
- Loading skeleton state
- Consistent sizing (xs=16px, sm=24px, md=32px, lg=48px, xl=64px)
- Default fallback ("?" icon)
- Border and background styling

**Replaces 5+ instances:**
- ItemDetailPage icon (lines 115-132)
- Table ItemNameCell
- Search result items
- Watchlist card previews
- GlobalSearch dropdown

**Test File:** `ItemIcon.test.tsx`
- Should render image with src
- Should show fallback on error
- Should show loading skeleton
- Should apply size classes
- Should call onError callback

**Storybook:** `ItemIcon.stories.tsx`
- All sizes
- Loading state
- Error state with fallback
- Custom fallback content

---

### 1.7 Create BackButton Component

**New File:** `frontend/src/components/common/BackButton.tsx` (~35 lines)

**Interface:**
```typescript
interface BackButtonProps {
  onClick?: () => void;
  label?: string;
  className?: string;
}
```

**Default Behavior:** `navigate(-1)`

**Replaces 2 instances:**
- ItemDetailPage back button (lines 103-110)
- Future detail pages

**Test File:** `BackButton.test.tsx`
- Should navigate back by default
- Should use custom onClick
- Should render custom label
- Should have proper ARIA label

**Storybook:** `BackButton.stories.tsx`
- Default
- Custom label
- Custom click handler

---

### 1.8 Create KeyboardShortcut Component

**New File:** `frontend/src/components/ui/KeyboardShortcut.tsx` (~45 lines)

**Interface:**
```typescript
interface KeyboardShortcutProps {
  keys: string | string[];
  size?: 'xs' | 'sm' | 'md';
  variant?: 'default' | 'inline';
}
```

**Features:**
- Platform-aware display (Ctrl vs Cmd)
- Multiple key display (Ctrl+K, Cmd+Shift+P)
- Consistent kbd styling

**Usage:**
- SearchInput "Ctrl+K" hint (replaces hardcoded text)
- Future shortcut help overlay
- Toolbar button hints

**Test File:** `KeyboardShortcut.test.tsx`
- Should render single key
- Should render key combination
- Should detect platform (Windows/Mac)
- Should apply size variants

**Storybook:** `KeyboardShortcut.stories.tsx`
- Single keys (Esc, Enter, Tab)
- Combinations (Ctrl+K, Cmd+Shift+P, Alt+F4)
- Different sizes
- Inline vs default variant

---

## Phase 2: Table Components (Week 2)

### 2.1 Extract Table Cell Components

**New Folder:** `frontend/src/components/table/cells/`

**From:** `columns.tsx` (277 lines → ~120 lines)

#### PinCell.tsx (~35 lines)
**Source:** Lines 25-41
```typescript
interface PinCellProps {
  itemId: number;
}
```

#### FavoriteCell.tsx (~40 lines)
**Source:** Lines 44-73
```typescript
interface FavoriteCellProps {
  item: Item;
}
```

#### WatchlistCell.tsx (~55 lines)
**Source:** Lines 76-121
```typescript
interface WatchlistCellProps {
  item: Item;
}
```

#### ItemNameCell.tsx (~35 lines)
**Source:** Lines 124-148
```typescript
interface ItemNameCellProps {
  item: Item;
}
```
**Note:** Use `ItemIcon` from Phase 1.6

#### PriceCell.tsx (~30 lines)
**New:** Extract repeated price pattern
```typescript
interface PriceCellProps {
  value: number;
  type?: 'high' | 'low' | 'mid';
  label?: string;
}
```
**Note:** Use `PriceDisplay` from Phase 1.3

**Index File:** `cells/index.ts`

**Update:** `columns.tsx` to import cell components

**Test Files:** (One per cell, ~60 lines each)
- `PinCell.test.tsx` - Store interaction, pin/unpin states, icon toggle
- `FavoriteCell.test.tsx` - Favorite toggle, icon states, click handling
- `WatchlistCell.test.tsx` - Dropdown interaction, add/remove items
- `ItemNameCell.test.tsx` - Icon display, link navigation, name rendering
- `PriceCell.test.tsx` - Price formatting, color coding, label display

**Storybook:** `table/cells/index.stories.tsx`
- All cell types in mock table
- Interactive states
- All variants

---

### 2.2 Split ItemsTable.tsx

**Current:** `ItemsTable.tsx` (325 lines → ~120 lines)

#### TableHeader.tsx (~85 lines)
**Source:** Lines 179-242
```typescript
interface TableHeaderProps {
  headerGroups: HeaderGroup<ItemWithPrice>[];
  onSortChange?: (columnId: string) => void;
  onResize?: (columnId: string, size: number) => void;
}
```

#### TableBody.tsx (~65 lines)
**Source:** Lines 244-304
```typescript
interface TableBodyProps {
  rows: Row<ItemWithPrice>[];
  virtualRows?: VirtualItem[];
  paddingTop?: number;
  paddingBottom?: number;
  enableVirtualization?: boolean;
}
```

#### TableHeaderCell.tsx (~45 lines)
**Extract from header rendering**
```typescript
interface TableHeaderCellProps {
  header: Header<ItemWithPrice, unknown>;
  showDivider?: boolean;
  onSort?: () => void;
}
```

**Updated:** `ItemsTable.tsx` composes from new components

**Alternative:** Use `EmptyState` from Phase 1.2 for empty table state

**Test Files:**
- `TableHeader.test.tsx` - Sort interaction, resize handling, column rendering
- `TableBody.test.tsx` - Virtualization, cell rendering, scroll behavior
- `TableHeaderCell.test.tsx` - Sort indicators, resize handles

**Storybook:**
- `TableHeader.stories.tsx` - Sortable/non-sortable, resizable columns
- `TableBody.stories.tsx` - With/without virtualization, different row counts

---

### 2.3 Create TableContainer Wrapper

**New File:** `frontend/src/components/table/TableContainer.tsx` (~75 lines)

```typescript
interface TableContainerProps {
  toolbar?: React.ReactNode;
  table: React.ReactNode;
  pagination?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}
```

**Purpose:** Standard card + sections pattern for tables

**Used By:**
- DashboardPage
- WatchlistsPage

**Test File:** `TableContainer.test.tsx`
- Should render all sections
- Should apply proper spacing
- Should handle optional sections

**Storybook:** `TableContainer.stories.tsx`
- Full layout (all sections)
- Minimal (table only)
- Without pagination
- Custom toolbar

---

## Phase 3: Chart Components (Week 3)

**Current:** `PriceChart.tsx` (400+ lines → ~180 lines)

### 3.1 Extract useChartData Hook

**New File:** `frontend/src/hooks/useChartData.ts` (~90 lines)

**Source:** Lines 73-165

```typescript
interface UseChartDataParams {
  rawData: PriceHistory[];
  itemId: number;
  period: TimePeriod;
}

interface UseChartDataReturn {
  chartData: ChartDataPoint[];
  stats: ChartStats;
  isLoading: boolean;
}

export function useChartData(params: UseChartDataParams): UseChartDataReturn
```

**Features:**
- Data transformation for Recharts
- SSE real-time data merging
- Statistics calculation (current, high, low, change, %)
- Period-based sampling
- Memoization for performance

**Test File:** `useChartData.test.ts`
- Should process raw data
- Should merge SSE data
- Should calculate statistics
- Should handle empty data
- Should handle period changes
- Should memoize results

---

### 3.2 Extract ChartStatistics Component

**New File:** `frontend/src/components/charts/ChartStatistics.tsx` (~65 lines)

**Source:** Lines 291-330

```typescript
interface ChartStatisticsProps {
  stats: {
    current: number;
    high: number;
    low: number;
    change: number;
    changePercent: number;
  };
  itemName: string;
}
```

**Features:**
- 4-column responsive grid
- Current/High/Low prices with labels
- Trend indicators (up/down arrows)
- Color-coded percentage change

**Test File:** `ChartStatistics.test.tsx`
- Should display all stat values
- Should show trend indicators
- Should format prices
- Should handle negative changes
- Should be responsive

**Storybook:** `ChartStatistics.stories.tsx`
- Positive change
- Negative change
- Zero change
- Large numbers (billions)
- Responsive breakpoints

---

### 3.3 Extract CustomChartDot Component

**New File:** `frontend/src/components/charts/CustomChartDot.tsx` (~35 lines)

**Source:** Lines 242-256

```typescript
interface CustomChartDotProps {
  cx?: number;
  cy?: number;
  payload?: any;
  isLiveData?: boolean;
}
```

**Purpose:** Reusable dot renderer highlighting live data

**Test File:** `CustomChartDot.test.tsx`
- Should render at coordinates
- Should highlight live data
- Should apply custom styles
- Should handle missing coordinates

**Storybook:** `CustomChartDot.stories.tsx`
- Normal data point
- Live data point (highlighted)
- Different sizes
- In mock chart

---

### 3.4 Create Chart Formatters Utility

**New File:** `frontend/src/utils/chartFormatters.ts` (~45 lines)

**Source:** Lines 196-215

```typescript
export function formatXAxisTick(timestamp: number, period: TimePeriod): string;
export function formatYAxisTick(value: number): string;
export function formatTooltipValue(value: number, name: string): string;
export function formatTooltipLabel(timestamp: number): string;
```

**Test File:** `chartFormatters.test.ts`
- Should format timestamps by period (1h, 24h, 7d, etc.)
- Should format Y-axis values (K, M notation)
- Should format tooltip values
- Should handle edge cases (0, negative, undefined)

---

### 3.5 Update PriceChart.tsx

**Result:** 400+ lines → ~180 lines using extracted parts

---

## Phase 4: Page Components (Week 4)

### 4.1 ItemDetailPage Decomposition

**Current:** `ItemDetailPage.tsx` (298 lines → ~100 lines)

**New Folder:** `frontend/src/components/item/`

#### ItemHeader.tsx (~85 lines)
**Source:** Lines 94-147
```typescript
interface ItemHeaderProps {
  item: Item;
}
```
**Features:** Icon (use `ItemIcon`), name, badges, description, ID

#### CurrentPriceCard.tsx (~75 lines)
**Source:** Lines 150-188
```typescript
interface CurrentPriceCardProps {
  price: CurrentPrice;
}
```
**Features:** 4-column grid, use `PriceDisplay` for each price

#### ItemMetadata.tsx (~55 lines)
**Source:** Lines 217-249
```typescript
interface ItemMetadataProps {
  item: Item;
}
```
**Features:** Buy limit, membership badge, alch values

#### PriceChartSection.tsx (~65 lines)
**Source:** Lines 191-214
```typescript
interface PriceChartSectionProps {
  itemId: number;
  itemName: string;
  period: TimePeriod;
  onPeriodChange: (period: TimePeriod) => void;
}
```

#### ItemDisplay.tsx (~45 lines)
**New:** Reusable item icon + name
```typescript
interface ItemDisplayProps {
  item: Item;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  showId?: boolean;
  showLink?: boolean;
  showBadges?: boolean;
}
```

**Replaces 5 instances:**
- ItemNameCell, SearchResultItem, RecentSearchItem, WatchlistCard, GlobalSearch

**Test Files:** (All with 80%+ coverage)
- `ItemHeader.test.tsx`
- `CurrentPriceCard.test.tsx`
- `ItemMetadata.test.tsx`
- `PriceChartSection.test.tsx`
- `ItemDisplay.test.tsx`

**Storybook:** One story file per component with all variants

---

### 4.2 DashboardPage Decomposition

**Current:** `DashboardPage.tsx` (277 lines → ~120 lines)

#### useItemFiltering Hook (~85 lines)
**Source:** Lines 68-116

```typescript
interface UseItemFilteringParams {
  items: Item[];
  filters: FilterState;
  searchQuery: string;
  pinnedIds: number[];
}

export function useItemFiltering(params: UseItemFilteringParams)
```

**Test File:** `useItemFiltering.test.ts`

#### DashboardHeader Component (~45 lines)
**Source:** Lines 159-173

```typescript
interface DashboardHeaderProps {
  title?: string;
  description?: string;
}
```

**Test File:** `DashboardHeader.test.tsx`

**Storybook:** `DashboardHeader.stories.tsx`

---

### 4.3 SharedWatchlistPage Decomposition

**Current:** `SharedWatchlistPage.tsx` (277 lines → ~140 lines)

#### ShareInfoBanner.tsx (~50 lines)
**Use:** `StatusBanner` from Phase 1.4 as base

#### ImportSuccessBanner.tsx (~35 lines)
**Use:** `StatusBanner` from Phase 1.4 as base

#### ItemGrid.tsx (~55 lines)
**Use:** `ItemDisplay` from Phase 4.1 for grid items

**Test Files + Storybook:** For each component

---

## Phase 4.5: Remediation (Catch-up) ✅ COMPLETE

**Priority:** HIGH - Must complete before Phase 5  
**Completed:** January 2026

This phase addressed gaps identified in Phases 1-4: missing Loading component split, test utilities, component tests, and Storybook stories.

---

### 4.5.1 Split Loading.tsx ✅ COMPLETE

**Priority:** CRITICAL - Blocks proper test/story organization

**Current:** `components/common/Loading.tsx` (248 lines)

**New Structure:**
```
components/common/loading/
├── LoadingSpinner.tsx      (~40 lines)
├── DotsLoading.tsx         (~40 lines)
├── PulseLoading.tsx        (~30 lines)
├── InlineLoading.tsx       (~45 lines)
├── TableLoading.tsx        (~45 lines)
├── CardGridLoading.tsx     (~45 lines)
├── Loading.tsx             (unified wrapper)
├── Loading.test.tsx        (migrated tests)
├── loading.stories.tsx     (Storybook stories)
└── index.ts                (barrel export)
```

**Migration:**
```typescript
// Old import
import { Loading, TableLoading } from '@/components/common/Loading';

// New imports
import { Loading, TableLoading } from '@/components/common/loading';
```

**Files to Update:** ~15 files importing `Loading`

**Validation:**
- [x] All loading variants extracted
- [x] Barrel export works
- [x] All import paths updated
- [x] Original Loading.tsx removed
- [x] No TypeScript errors
- [x] Visual parity with original

---

### 4.5.2 Create Test Utilities ✅ COMPLETE

**Priority:** CRITICAL - Required for consistent testing

**New Files:**
- `frontend/src/test/test-utils.tsx` - renderWithProviders helper
- `frontend/src/test/mocks/mockItems.ts` - Item data factories
- `frontend/src/test/mocks/mockPrices.ts` - Price data factories
- `frontend/src/test/mocks/mockStores.ts` - Zustand store mocks
- `frontend/src/test/mocks/index.ts` - Barrel export

**Validation:**
- [x] test-utils.tsx compiles without errors
- [x] renderWithProviders works in existing tests
- [x] Mock factories produce valid typed data
- [x] Can import from `@/test/test-utils` and `@/test/mocks`

---

### 4.5.3 Add Missing Tests ✅ COMPLETE

**Priority:** HIGH - Required for 80% coverage target

**Audit Results:** Most tests already existed. Only 3 were actually missing:

**Phase 2 Tests (Actually Missing: 3):**
- [x] TableHeader.test.tsx (8 tests)
- [x] TableBody.test.tsx (11 tests)
- [x] TableHeaderCell.test.tsx (12 tests)

**Phase 2 Tests (Already Existed):**
- WatchlistCell.test.tsx ✅
- ItemNameCell.test.tsx ✅
- PriceCell.test.tsx ✅
- TableContainer.test.tsx ✅

**Phase 3 Tests (Already Existed):**
- CustomChartDot.test.tsx ✅
- useChartData.test.ts ✅
- chartFormatters.test.ts ✅

**Phase 4 Tests (Already Existed):**
- CurrentPriceCard.test.tsx ✅
- ItemMetadata.test.tsx ✅
- PriceChartSection.test.tsx ✅
- ItemDisplay.test.tsx ✅
- DashboardHeader.test.tsx ✅
- useItemFiltering.test.ts ✅
- ShareInfoBanner.test.tsx ✅
- ImportSuccessBanner.test.tsx ✅
- ItemGrid.test.tsx ✅

**Validation:**
- [x] All 3 missing test files created (31 new tests)
- [x] All tests pass (`npm run test` - 79 files, 1230 tests)
- [x] Coverage maintained

---

### 4.5.4 Add Missing Storybook Stories ✅ COMPLETE

**Priority:** MEDIUM - Required for component documentation

**Audit Results:** Most stories already existed. Created remaining missing ones.

**Phase 2 Stories:**
- [x] table/cells/index.stories.tsx ✅ (existed as combined file)
- [x] table/TableHeader.stories.tsx (CREATED)
- [x] table/TableBody.stories.tsx (CREATED)
- [x] table/TableHeaderCell.stories.tsx (CREATED)
- [x] table/TableContainer.stories.tsx ✅ (existed)

**Phase 3 Stories:**
- [x] charts/ChartStatistics.stories.tsx ✅ (existed)
- [x] charts/CustomChartDot.stories.tsx ✅ (existed)

**Phase 4 Stories:**
- [x] item/ItemHeader.stories.tsx ✅ (existed)
- [x] item/CurrentPriceCard.stories.tsx ✅ (existed)
- [x] item/ItemMetadata.stories.tsx ✅ (existed)
- [x] item/PriceChartSection.stories.tsx ✅ (existed)
- [x] item/ItemDisplay.stories.tsx ✅ (existed)
- [x] dashboard/DashboardHeader.stories.tsx ✅ (existed)
- [x] watchlist/ShareInfoBanner.stories.tsx ✅ (existed)
- [x] watchlist/ImportSuccessBanner.stories.tsx ✅ (existed)
- [x] watchlist/ItemGrid.stories.tsx ✅ (existed)
- [ ] watchlist/ItemGrid.stories.tsx

**Loading Stories (after 4.5.1):**
- [x] common/loading/loading.stories.tsx (CREATED)

**Final Story Count:** 24 story files

**Validation:**
- [x] All story files created (4 new + 20 existing)
- [x] Storybook builds (`npm run build-storybook`) ✅
- [x] All stories render without errors

---

## Phase 5: Standardize Patterns (Week 5) ✅

### 5.1 GlobalSearch Decomposition ✅

**Current:** `GlobalSearch.tsx` (229 lines → ~130 lines)

#### useSearchKeyboard Hook (~65 lines) ✅
**Source:** Lines 113-152

```typescript
interface UseSearchKeyboardParams {
  isOpen: boolean;
  itemCount: number;
  selectedIndex: number;
  setSelectedIndex: (index: number) => void;
  onSelect: () => void;
  onClose: () => void;
}
```

**Test File:** `useSearchKeyboard.test.ts` ✅
- [x] Arrow key navigation
- [x] Enter to select
- [x] Escape to close
- [x] Tab handling

#### SearchDropdownContent Component (~55 lines) ✅
**Source:** Lines 179-221

**Test File:** `SearchDropdownContent.test.tsx` ✅

**Storybook:** `SearchDropdownContent.stories.tsx` ✅

---

### 5.2 Create StandardModal Wrapper ✅

**New File:** `frontend/src/components/ui/StandardModal.tsx` (~85 lines) ✅

```typescript
interface StandardModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  icon?: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
}
```

**Features:**
- [x] Wraps HeadlessUI Dialog + Transition
- [x] Consistent animations (ease-out 300ms)
- [x] Backdrop blur
- [x] Focus trap
- [x] Escape key handling

**Update 5 Modals:** Each reduces ~80 lines (deferred to Phase 6)
1. CreateWatchlistModal
2. EditWatchlistModal
3. ShareWatchlistModal
4. ImportWatchlistModal
5. ConfirmDeleteModal

**Test File:** `StandardModal.test.tsx` ✅
- [x] Should render when open
- [x] Should trap focus
- [x] Should close on Escape
- [x] Should close on backdrop click

**Storybook:** `StandardModal.stories.tsx` ✅
- [x] All sizes
- [x] With/without icon
- [x] With/without footer
- [x] Long scrolling content

---

### 5.3 Create ActionMenu Component ✅

**New File:** `frontend/src/components/ui/ActionMenu.tsx` (~65 lines) ✅

```typescript
interface ActionMenuItem {
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  onClick: () => void;
  variant?: 'default' | 'destructive';
  disabled?: boolean;
}

interface ActionMenuProps {
  items: ActionMenuItem[];
  trigger?: React.ReactNode;
  align?: 'left' | 'right';
}
```

**Replaces 3 instances:** (deferred to Phase 6)
- WatchlistCard 3-dot menu
- Potential table row actions
- Header dropdowns

**Test File:** `ActionMenu.test.tsx` ✅

**Storybook:** `ActionMenu.stories.tsx` ✅

---

### 5.4 Create Form Components ✅

**New File:** `frontend/src/components/forms/FormField.tsx` (~75 lines) ✅

```typescript
interface FormFieldProps {
  label: string;
  htmlFor: string;
  children: React.ReactNode;
  error?: string;
  hint?: string;
  required?: boolean;
  className?: string;
}
```

**Replaces pattern in 5+ locations:** (deferred to Phase 6)
- CreateWatchlistModal
- EditWatchlistModal
- ImportWatchlistModal
- FilterPanel (4 fields)

**Common Pattern Replaced:**
```tsx
<Stack direction="col" gap={2}>
  <Text as="label" ...>
    {required && <span>*</span>} Label
  </Text>
  <Input ... />
  {error && <Text variant="error">{error}</Text>}
  {hint && <Text variant="muted">{hint}</Text>}
</Stack>
```

**Test File:** `FormField.test.tsx` ✅
- [x] Label association (htmlFor)
- [x] Error message display
- [x] Hint text display
- [x] Required indicator
- [x] Accessibility (ARIA attributes)

**Storybook:** `FormField.stories.tsx` ✅
- [x] Default field
- [x] With error
- [x] With hint
- [x] Required
- [x] All combinations

---

### 5.5 Create AnimatedDropdown Wrapper ✅

**New File:** `frontend/src/components/ui/AnimatedDropdown.tsx` (~55 lines) ✅

```typescript
interface AnimatedDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  trigger: React.ReactNode;
  children: React.ReactNode;
  align?: 'left' | 'right';
  className?: string;
}
```

**Wraps:** HeadlessUI Transition + Menu pattern

**Replaces:** (deferred to Phase 6)
- WatchlistDropdown transition boilerplate
- Future dropdown components

**Test File:** `AnimatedDropdown.test.tsx` ✅

**Storybook:** `AnimatedDropdown.stories.tsx` ✅

---

### Phase 5 Completion Checklist ✅

- [x] useSearchKeyboard hook created with tests
- [x] SearchDropdownContent component created with tests and stories
- [x] GlobalSearch updated to use useSearchKeyboard hook
- [x] StandardModal wrapper created with tests and stories
- [x] ActionMenu component created with tests and stories
- [x] FormField component created with tests and stories
- [x] AnimatedDropdown wrapper created with tests and stories
- [x] All exports updated (ui/index.ts, hooks/index.ts)
- [x] Build passes (`npm run build`)
- [x] All tests pass (`npm test`)

---

## Testing Strategy

### Unit Tests (Required for ALL Components)

**Standards:**
- **File Naming:** `ComponentName.test.tsx` alongside component
- **Coverage Target:** 80%+ per component
- **Test Structure:** Describe blocks for: Rendering, Interactions, Edge Cases, Accessibility

**Test Checklist per Component:**
- [ ] Renders with all prop variants
- [ ] Handles user interactions (click, hover, keyboard)
- [ ] Edge cases (empty data, errors, loading states)
- [ ] Accessibility (ARIA labels, roles, keyboard nav, focus management)
- [ ] Integration with parent components

**Test Utilities:**

**File:** `frontend/src/test/test-utils.tsx`
```typescript
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, RenderOptions } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';

export function renderWithProviders(
  ui: React.ReactElement,
  options?: RenderOptions
) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>{ui}</BrowserRouter>
    </QueryClientProvider>,
    options
  );
}
```

**Test Mocks:** `frontend/src/test/mocks/`
- `mockItems.ts` - Sample item data
- `mockPrices.ts` - Sample price data  
- `mockStores.ts` - Zustand store mocks
- `mockHandlers.ts` - MSW API mocks (future)

**Test Fixtures:** `frontend/src/test/fixtures/`
```typescript
export function createMockItem(overrides?: Partial<Item>): Item;
export function createMockPrice(overrides?: Partial<CurrentPrice>): CurrentPrice;
export function createMockWatchlist(overrides?: Partial<Watchlist>): Watchlist;
```

---

### Storybook Stories (Required for ALL UI Components)

**Standards:**
- **File Naming:** `ComponentName.stories.tsx` alongside component
- **Structure:** Use CSF3 format (default export + named exports)
- **Args:** Interactive controls for all props
- **Documentation:** JSDoc comments, usage examples

**Story Checklist per Component:**
- [ ] Default story with common props
- [ ] All variant stories (size, color, state)
- [ ] Edge case stories (long text, empty, error)
- [ ] Interactive stories (with actions, form interactions)
- [ ] Accessibility story (test with a11y addon)

**Example Story Structure:**
```typescript
import type { Meta, StoryObj } from '@storybook/react';
import { ComponentName } from './ComponentName';

const meta: Meta<typeof ComponentName> = {
  title: 'UI/ComponentName',
  component: ComponentName,
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'primary', 'secondary'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof ComponentName>;

export const Default: Story = {
  args: {
    // default props
  },
};

export const AllVariants: Story = {
  render: () => (
    <Stack direction="col" gap={4}>
      <ComponentName variant="default" />
      <ComponentName variant="primary" />
      <ComponentName variant="secondary" />
    </Stack>
  ),
};
```

---

### Integration Tests

- [ ] Keep existing page-level tests passing
- [ ] Update imports for refactored components
- [ ] Add tests for new component compositions
- [ ] Test ErrorBoundary integration at page level
- [ ] Test form submission flows with FormField

---

### Accessibility Testing

**Per Component Checklist:**
- [ ] **ARIA labels** - All interactive elements
- [ ] **ARIA roles** - Semantic roles for custom widgets
- [ ] **Keyboard navigation** - Tab order, arrow keys, Enter/Space
- [ ] **Focus management** - Visible focus, focus trapping (modals/dropdowns)
- [ ] **Screen reader** - Announcements for dynamic content (aria-live)
- [ ] **Color contrast** - WCAG AA (4.5:1 text, 3:1 UI)
- [ ] **Skip links** - Main content navigation (pages)

**Tools:**
```bash
# Install accessibility tools
npm install -D eslint-plugin-jsx-a11y @axe-core/react
```

**ESLint Configuration:**
```javascript
import jsxA11y from 'eslint-plugin-jsx-a11y';

export default [
  {
    plugins: {
      'jsx-a11y': jsxA11y,
    },
    rules: {
      ...jsxA11y.configs.recommended.rules,
    },
  },
];
```

**Storybook:**
- `@storybook/addon-a11y` - Automated checks in every story
- Review violations panel before merging
- Fix all violations or document exceptions

---

## Performance Considerations

### Code Splitting

**Lazy Load Heavy Components:**
```typescript
// Lazy load chart components
const PriceChart = lazy(() => import('./components/charts/PriceChart'));

// Lazy load modals (only load when opened)
const CreateWatchlistModal = lazy(() => 
  import('./components/watchlist/CreateWatchlistModal')
);

// Route-based splitting (already implemented)
```

**When to Lazy Load:**
- Components >50KB
- Modals/dialogs
- Chart libraries
- Editor components

---

### Memoization Strategy

**React.memo:**
```typescript
// Pure display components with expensive renders
export const PriceDisplay = React.memo(PriceDisplayComponent);
export const ItemDisplay = React.memo(ItemDisplayComponent);
```

**useMemo:**
```typescript
// Expensive computations (filtering, sorting)
const filteredItems = useMemo(
  () => items.filter(matchesFilters).sort(byPrice),
  [items, filters, sortOrder]
);
```

**useCallback:**
```typescript
// Stable function references for child props
const handleItemClick = useCallback(
  (itemId: number) => navigate(`/items/${itemId}`),
  [navigate]
);
```

**When NOT to Memoize:**
- Simple components (<50 lines)
- Cheap computations
- Functions that don't cause re-renders

---

### Bundle Analysis

```bash
# Analyze bundle size
npm run build -- --analyze

# Check for:
# - Large dependencies (>100KB)
# - Duplicate code
# - Unused exports
```

**Target Metrics:**
- Initial bundle: <500KB gzipped
- Lazy chunks: <100KB each
- Lighthouse score: 90+

---

### Virtual Scrolling

- ✅ Already implemented in ItemsTable
- Consider for other long lists (>100 items)
- Use `@tanstack/react-virtual` (already installed)

---

## Migration Checklist

### Per Component
- [ ] Create new component file with full JSDoc
- [ ] Write unit tests (80%+ coverage)
- [ ] Create Storybook story (all variants)
- [ ] Update original component to import new component
- [ ] Run `npm run build` - verify TypeScript
- [ ] Run `npm run test` - verify tests pass
- [ ] Run `npm run lint` - verify no warnings
- [ ] Run `npm run storybook` - verify story renders
- [ ] Test accessibility in Storybook
- [ ] Search codebase for other usages
- [ ] Update all import paths
- [ ] Mark old code as `@deprecated` (if keeping temporarily)

### Before Merging Phase
- [ ] All tests passing (100%)
- [ ] No TypeScript errors
- [ ] No ESLint warnings (including max-lines)
- [ ] Build succeeds
- [ ] Storybook builds successfully
- [ ] Manual testing in browser
- [ ] Accessibility audit (no violations)
- [ ] Code review completed
- [ ] Update documentation

---

## Validation Commands

```bash
# Type checking
npm run build

# Linting (includes max-lines + accessibility checks)
npm run lint

# Unit tests
npm run test

# Test coverage (must be 80%+)
npm run test:coverage

# E2E tests
npm run test:e2e

# Storybook (visual testing + accessibility)
npm run storybook

# Build Storybook (CI check)
npm run build-storybook

# Full validation suite
npm run build && npm run lint && npm run test:coverage && npm run build-storybook
```

---

## Dependencies

### Already Installed ✅
- `class-variance-authority` - Variant system
- `clsx` / `cn` utility - ClassName merging
- `lucide-react` - Icons
- `@headlessui/react` - Modals, menus
- `@tanstack/react-table` - Table state
- `@tanstack/react-virtual` - Virtual scrolling
- `vitest` - Unit testing
- `@testing-library/react` - Component testing
- `@playwright/test` - E2E testing

### To Install 🆕
```bash
# Storybook
npm install -D @storybook/react-vite@^8.0.0
npm install -D @storybook/addon-essentials@^8.0.0
npm install -D @storybook/addon-a11y@^8.0.0

# Accessibility
npm install -D eslint-plugin-jsx-a11y@^6.8.0
npm install -D @axe-core/react@^4.8.0
```

---

## Files Summary

### New Files (43 components + 6 utilities + 3 docs)

**UI Components (11):**
- EmptyState, PriceDisplay, StatusBanner, StandardModal
- ActionMenu, AnimatedDropdown, KeyboardShortcut, ItemIcon
- BackButton, FormField, TableContainer

**Error Handling (2):**
- ErrorBoundary, ErrorFallback

**Loading (5):**
- LoadingSpinner, DotsLoading, PulseLoading, TableLoading, CardGridLoading

**Table Components (8):**
- TableHeader, TableBody, TableHeaderCell
- PinCell, FavoriteCell, WatchlistCell, ItemNameCell, PriceCell

**Chart Components (3):**
- ChartStatistics, CustomChartDot, [PriceChart simplified]

**Item Components (5):**
- ItemHeader, CurrentPriceCard, ItemMetadata, PriceChartSection, ItemDisplay

**Watchlist Components (3):**
- ShareInfoBanner, ImportSuccessBanner, ItemGrid

**Search Components (2):**
- SearchDropdownContent, [GlobalSearch simplified]

**Dashboard Components (1):**
- DashboardHeader

**Hooks (3):**
- useChartData, useItemFiltering, useSearchKeyboard

**Utilities (3):**
- chartFormatters, test-utils, test fixtures/mocks

**Documentation (3):**
- frontend-architecture.md, .storybook/main.ts, .storybook/preview.ts

**Storybook Stories (43):**
- One `.stories.tsx` per component

**Tests (43):**
- One `.test.tsx` per component

---

### Modified Files (20+)

**Components (8):**
- ItemsTable.tsx, PriceChart.tsx, columns.tsx
- ItemDetailPage.tsx, DashboardPage.tsx, SharedWatchlistPage.tsx
- GlobalSearch.tsx, Loading.tsx (replaced)

**Modals (5):**
- CreateWatchlistModal, EditWatchlistModal, ShareWatchlistModal
- ImportWatchlistModal, ConfirmDeleteModal

**Configuration (3):**
- eslint.config.js (max-lines + a11y)
- package.json (Storybook scripts)
- App.tsx (ErrorBoundary wrapper)

**Import Updates (~15 files):**
- All files importing Loading
- All files using old patterns

---

## Expected Results

### Code Metrics

| Metric | Before | After | Change |
|--------|--------|-------|--------|
| **Total Files** | 78 | 121 | +43 (+55%) |
| **Total Lines** | ~8,500 | ~7,200 | -1,300 (-15%) |
| **Largest Component** | 400+ lines | ~180 lines | -55% |
| **Components >200 lines** | 8 | 0 | -100% ✅ |
| **Average Size** | ~110 lines | ~60 lines | -45% |
| **Duplicated Patterns** | 15 | 3 | -80% |
| **Test Coverage** | ~65% | 80%+ | +15% ✅ |
| **Reusability Score** | Baseline | +350% | 🚀 |

### Quality Metrics

| Metric | Before | After |
|--------|--------|-------|
| **Error Boundaries** | ❌ None | ✅ Full coverage |
| **Storybook** | ❌ Not installed | ✅ 43 documented components |
| **Accessibility** | ⚠️ Partial | ✅ WCAG AA compliant |
| **TypeScript Errors** | 0 | 0 ✅ |
| **ESLint Warnings** | ~5 | 0 ✅ |
| **Build Time** | Baseline | Similar (lazy loading offsets) |

---

## Timeline

| Phase | Duration | Deliverables | Components | Test Coverage |
|-------|----------|--------------|------------|---------------|
| **Phase 0** | 1 day | Setup + Docs | 0 | N/A |
| **Phase 1** | Week 1 | UI Primitives + Error Handling | 11 | 80%+ each |
| **Phase 2** | Week 2 | Table Components | 8 | 80%+ each |
| **Phase 3** | Week 3 | Chart Components + Hook | 4 | 80%+ each |
| **Phase 4** | Week 4 | Item/Page Components + Hooks | 10 | 80%+ each |
| **Phase 5** | Week 5 | Pattern Standardization | 10 | 80%+ each |
| **TOTAL** | **5 weeks** | **43 components + 3 hooks + utils** | 43 | **80%+ overall** |

---

## Success Criteria

### Must Have ✅
- [ ] All 8 large components <200 lines
- [ ] 43 new reusable components created
- [ ] 1,300+ lines eliminated through deduplication
- [ ] 0 TypeScript errors
- [ ] 0 ESLint warnings (max-lines violations)
- [ ] 80%+ test coverage (all new components)
- [ ] All tests passing (unit + integration + E2E)
- [ ] Build succeeds
- [ ] Storybook builds successfully
- [ ] ErrorBoundary covers all routes
- [ ] No functionality regressions

### Should Have 🎯
- [ ] All components have Storybook stories
- [ ] All components have unit tests
- [ ] All a11y violations fixed
- [ ] Performance maintained (no regression)
- [ ] Documentation complete (frontend-architecture.md)

### Nice to Have 🌟
- [ ] Bundle size reduced (lazy loading)
- [ ] Lighthouse score improved
- [ ] Visual regression tests (Chromatic)
- [ ] Component usage analytics

---

## Future Enhancements (Phase 6+)

### Advanced Storybook
- [ ] Chromatic visual regression testing
- [ ] Interaction testing with play functions
- [ ] Component documentation site deployment
- [ ] Design token documentation
- [ ] Auto-generated prop tables

### Design System
- [ ] Figma integration
- [ ] Design token system (colors, spacing, typography)
- [ ] Component composition patterns guide
- [ ] Component API standards
- [ ] Migration guide from old patterns
- [ ] Component changelog

### Performance
- [ ] Lazy load routes
- [ ] Prefetch on hover
- [ ] Service worker caching
- [ ] Image optimization
- [ ] Code splitting optimization

### Developer Experience
- [ ] VS Code snippets for new components
- [ ] Component generator CLI
- [ ] Pre-commit hooks (lint + test)
- [ ] Automated changelog generation

### Optional Line Count Reductions
The following files are slightly over target line counts but functional. Consider further decomposition if they grow:
- [ ] `ItemsTable.tsx` (~150 lines, target: 120) - Could extract row selection logic
- [ ] `PriceChart.tsx` (~200 lines, target: 180) - Could extract tooltip component
- [ ] `SharedWatchlistPage.tsx` (~160 lines, target: 140) - Could extract URL parsing hook

---

## Maintenance (Separate)

### Polymorphic typing standardization
- Add shared helper types in frontend/src/types/polymorphic.ts
- Update Icon, Stack, and Text to use the helper
- Ensure displayName is set before polymorphic casts
- Scope intentionally limited to Icon, Stack, Text only

---

## References

- [Component Analysis Report](./component-analysis-report.md) - Detailed analysis
- [Button.tsx](../frontend/src/components/ui/Button.tsx) - Reference implementation
- [011-loading-error-states.md](./011-loading-error-states.md) - Error boundary requirements
- [TanStack Table Docs](https://tanstack.com/table/v8) - Table patterns
- [Recharts Docs](https://recharts.org/) - Chart patterns
- [HeadlessUI Docs](https://headlessui.com/) - Modal/Menu patterns
- [Storybook Docs](https://storybook.js.org/docs/react) - Story writing guide

---

## Notes & Best Practices

### Component Design
- Follow patterns from `components/ui/Button.tsx`
- Use `class-variance-authority` for variant systems
- Keep components pure (no side effects in render)
- Prefer composition over prop drilling
- Export types alongside components
- Use TypeScript strict mode

### Styling
- Use `cn()` utility for className merging
- Follow TailwindCSS conventions
- Maintain dark mode support
- Use CVA for variant systems
- Keep responsive design in mind

### Testing
- Write tests alongside code (TDD encouraged)
- Use Testing Library best practices (queries, user-centric)
- Aim for 80%+ coverage per component
- Test user interactions, not implementation
- Use Storybook for visual testing

### Accessibility
- Semantic HTML first
- ARIA when semantic HTML insufficient
- Keyboard navigation always
- Screen reader announcements for dynamic content
- Color contrast WCAG AA minimum
- Test with real assistive technology

### Performance
- Memoize expensive computations
- Lazy load heavy components
- Virtual scroll long lists
- Code split by route
- Monitor bundle size

---

**Document Version:** 2.0  
**Last Updated:** January 18, 2026  
**Next Review:** After Phase 1 completion  
**Maintainer:** Development Team
