# 002: Search System

**Priority:** Critical  
**Effort:** M (4-8 hours)  
**Status:** Not Started  
**Related Issues:** [FRONTEND_INSPECTION_FINDINGS.md](../../FRONTEND_INSPECTION_FINDINGS.md) - Issues #2, #8

---

## Overview

Implement a complete search experience including a command-palette style modal, keyboard shortcuts, and fix existing inline search. This addresses the non-functional header search button (Ctrl+K) and improves the inline table search filtering.

---

## Task Breakdown

### 2.1 Create SearchModal Component

**Priority:** Critical  
**Estimated Time:** 2-3 hours  
**Location:** `frontend/src/components/common/SearchModal.tsx`

#### Implementation Steps

1. **Create base modal component** (30 min)
   ```tsx
   // frontend/src/components/common/SearchModal.tsx
   interface SearchModalProps {
     isOpen: boolean;
     onClose: () => void;
   }
   
   export function SearchModal({ isOpen, onClose }: SearchModalProps) {
     // Implement modal with HeadlessUI Dialog
     // Full-screen overlay with backdrop
     // Centered search panel (max-w-2xl)
   }
   ```

2. **Add search input with auto-focus** (20 min)
   - Use `useRef` and `useEffect` to focus on open
   - Style with search icon (Lucide `Search`)
   - Add clear button when input has value
   - Add `aria-label` for accessibility

3. **Implement real-time search** (45 min)
   - Use `useItems` hook with search parameter
   - Debounce input (300ms) using `useDebouncedValue` hook
   - Show loading spinner during search
   - Display "No results" state

4. **Add keyboard navigation** (45 min)
   - Track selected index with `useState`
   - Arrow Up/Down to navigate results
   - Enter to select highlighted item
   - Escape to close modal
   - Tab cycles through results

5. **Implement recent searches** (30 min)
   - Create `useRecentSearches` hook
   - Store in localStorage (`recent-searches` key)
   - Max 5 recent items
   - Display above results when input is empty
   - Clear button for recent searches

6. **Add result items** (30 min)
   - Show item icon, name, current price
   - Highlight matching text
   - Click to navigate to item detail page
   - Hover/selected states

#### Acceptance Criteria
- [ ] Modal opens with backdrop overlay
- [ ] Search input auto-focuses on open
- [ ] Results update as user types (debounced)
- [ ] Keyboard navigation works (arrows, enter, escape)
- [ ] Recent searches persist across sessions
- [ ] Clicking result navigates and closes modal
- [ ] Click outside or Escape closes modal
- [ ] Accessible (proper ARIA labels, keyboard only navigation)

#### Files to Create/Modify
- `frontend/src/components/common/SearchModal.tsx` (new)
- `frontend/src/components/common/SearchResult.tsx` (new)
- `frontend/src/hooks/useRecentSearches.ts` (new)
- `frontend/src/hooks/useDebouncedValue.ts` (new, if doesn't exist)
- `frontend/src/components/common/index.ts` (update exports)

---

### 2.2 Add Global Keyboard Listener

**Priority:** Critical  
**Estimated Time:** 45 min  
**Location:** `frontend/src/App.tsx` or `frontend/src/components/layout/MainLayout.tsx`

#### Implementation Steps

1. **Add keyboard event listener** (20 min)
   ```tsx
   // In MainLayout or App
   useEffect(() => {
     const handleKeyDown = (e: KeyboardEvent) => {
       // Check for Ctrl+K (Windows/Linux) or Cmd+K (Mac)
       if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
         e.preventDefault();
         setSearchModalOpen(true);
       }
     };
     
     document.addEventListener('keydown', handleKeyDown);
     return () => document.removeEventListener('keydown', handleKeyDown);
   }, []);
   ```

2. **Test across operating systems** (15 min)
   - Verify Ctrl+K works on Windows/Linux
   - Verify Cmd+K works on Mac
   - Ensure default browser search is prevented

3. **Add visual hint** (10 min)
   - Ensure header button shows correct shortcut for OS
   - Display platform-specific key (⌘K for Mac, Ctrl K for Windows)

#### Acceptance Criteria
- [ ] Ctrl+K opens search modal on Windows/Linux
- [ ] Cmd+K opens search modal on Mac
- [ ] Default browser behavior is prevented
- [ ] Works from anywhere in the application
- [ ] Visual hint matches platform

#### Files to Modify
- `frontend/src/components/layout/MainLayout.tsx` or `frontend/src/App.tsx`
- `frontend/src/components/layout/Header.tsx` (platform detection for keyboard hint)

---

### 2.3 Wire SearchModal to UIStore

**Priority:** Critical  
**Estimated Time:** 30 min  
**Location:** `frontend/src/components/layout/MainLayout.tsx`

#### Implementation Steps

1. **Import and render SearchModal** (15 min)
   ```tsx
   import { SearchModal } from '../common/SearchModal';
   import { useUIStore } from '../../stores/useUIStore';
   
   function MainLayout() {
     const { searchModalOpen, setSearchModalOpen } = useUIStore();
     
     return (
       <>
         <Header />
         <main>{children}</main>
         <Footer />
         <SearchModal 
           isOpen={searchModalOpen} 
           onClose={() => setSearchModalOpen(false)} 
         />
       </>
     );
   }
   ```

2. **Verify UIStore state** (10 min)
   - Confirm `searchModalOpen` exists in UIStore
   - Confirm `setSearchModalOpen` action exists
   - Test state updates with React DevTools

3. **Test header button integration** (5 min)
   - Click header search button
   - Verify modal opens
   - Verify state updates

#### Acceptance Criteria
- [ ] SearchModal renders when `searchModalOpen` is true
- [ ] Header button opens modal
- [ ] Modal close updates UIStore state
- [ ] No console errors or warnings

#### Files to Modify
- `frontend/src/components/layout/MainLayout.tsx`
- `frontend/src/stores/useUIStore.ts` (verify existing state)

---

### 2.4 Fix Inline Table Search

**Priority:** High  
**Estimated Time:** 1-1.5 hours  
**Location:** `frontend/src/pages/DashboardPage.tsx`, `frontend/src/components/table/TableToolbar.tsx`

#### Investigation Steps (30 min)

1. **Trace search parameter flow**
   - Check if `searchQuery` is passed to `useItems` hook
   - Verify API request includes `search` query param
   - Check Network tab in DevTools for API calls

2. **Identify filtering strategy**
   - Determine if filtering is server-side (API) or client-side
   - Check backend handler for search implementation
   - Verify database query includes LIKE/ILIKE clause

3. **Test debounce mechanism**
   - Verify debounce delay (should be 300ms)
   - Check if debounce is working correctly
   - Test with console.logs

#### Implementation Steps (30-45 min)

Based on findings, implement one of:

**Option A: Server-side filtering (preferred)**
```tsx
// In DashboardPage or items hook
const { data, isLoading } = useItems({
  page: currentPage,
  pageSize: pageSize,
  search: debouncedSearchQuery, // Add search param
  filters: activeFilters
});
```

**Option B: Client-side filtering (if API doesn't support search)**
```tsx
const filteredItems = useMemo(() => {
  if (!searchQuery) return items;
  return items.filter(item => 
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );
}, [items, searchQuery]);
```

#### Fix Steps
1. Add search parameter to API hook
2. Update backend handler if needed (check `item_handler.go`)
3. Verify SQL query includes search clause
4. Test filtering with various inputs
5. Add loading state during search

#### Acceptance Criteria
- [ ] Typing in search field filters items in real-time
- [ ] Search is debounced (300ms delay)
- [ ] Search is case-insensitive
- [ ] Search matches item names
- [ ] Loading state shows during search
- [ ] Empty search shows all items
- [ ] Clear button resets search

#### Files to Modify
- `frontend/src/hooks/useItems.ts` (add search param)
- `frontend/src/pages/DashboardPage.tsx` (pass search to hook)
- `frontend/src/components/table/TableToolbar.tsx` (verify search input)
- `backend/internal/handlers/item_handler.go` (verify backend support)

---

## Component Structure

```
frontend/src/
├── components/
│   ├── common/
│   │   ├── SearchModal.tsx          (new - main modal component)
│   │   ├── SearchResult.tsx         (new - individual result item)
│   │   └── index.ts                 (update - add exports)
│   ├── layout/
│   │   ├── MainLayout.tsx           (modify - render SearchModal)
│   │   └── Header.tsx               (modify - platform-specific hint)
│   └── table/
│       └── TableToolbar.tsx         (modify - fix search filtering)
├── hooks/
│   ├── useRecentSearches.ts         (new - localStorage hook)
│   ├── useDebouncedValue.ts         (new/verify - debounce hook)
│   └── useItems.ts                  (modify - add search param)
├── pages/
│   └── DashboardPage.tsx            (modify - fix inline search)
└── stores/
    └── useUIStore.ts                (verify - searchModalOpen state)
```

---

## Testing Strategy

### Unit Tests

#### SearchModal Component Tests
**File:** `frontend/src/components/common/__tests__/SearchModal.test.tsx`

```tsx
describe('SearchModal', () => {
  test('renders when isOpen is true', () => {});
  test('does not render when isOpen is false', () => {});
  test('calls onClose when Escape is pressed', () => {});
  test('calls onClose when backdrop is clicked', () => {});
  test('auto-focuses search input on open', () => {});
  test('shows recent searches when input is empty', () => {});
  test('shows results when searching', () => {});
  test('shows no results message when no matches', () => {});
  test('navigates to item when result is clicked', () => {});
  test('keyboard navigation selects correct item', () => {});
  test('clear button clears input', () => {});
});
```

#### useRecentSearches Hook Tests
**File:** `frontend/src/hooks/__tests__/useRecentSearches.test.ts`

```tsx
describe('useRecentSearches', () => {
  test('loads recent searches from localStorage', () => {});
  test('adds new search to recent searches', () => {});
  test('limits recent searches to 5 items', () => {});
  test('removes duplicate searches', () => {});
  test('clears all recent searches', () => {});
  test('persists searches across sessions', () => {});
});
```

#### Inline Search Tests
**File:** `frontend/src/pages/__tests__/DashboardPage.test.tsx`

```tsx
describe('Dashboard Inline Search', () => {
  test('filters items when search query changes', () => {});
  test('debounces search input', () => {});
  test('shows all items when search is empty', () => {});
  test('displays loading state during search', () => {});
  test('updates URL with search parameter', () => {});
});
```

### Integration Tests

#### E2E Search Flow
**File:** `frontend/tests/e2e/search.spec.ts` (Playwright)

```typescript
test.describe('Search System', () => {
  test('opens search modal with Ctrl+K', async ({ page }) => {
    await page.goto('/');
    await page.keyboard.press('Control+K');
    await expect(page.getByRole('dialog')).toBeVisible();
  });
  
  test('searches and navigates to item', async ({ page }) => {
    await page.goto('/');
    await page.keyboard.press('Control+K');
    await page.fill('input[type="search"]', 'Dragon scimitar');
    await page.click('text=Dragon scimitar');
    await expect(page).toHaveURL(/\/items\/\d+/);
  });
  
  test('shows recent searches', async ({ page }) => {
    // Test localStorage persistence
  });
  
  test('inline search filters table', async ({ page }) => {
    await page.goto('/');
    await page.fill('input[placeholder*="Search"]', 'dragon');
    await expect(page.locator('table tr')).toContainText('dragon');
  });
});
```

---

## Build & Test Commands

### Local Development Setup

```powershell
# Start backend services
docker-compose up -d postgres redis backend

# Verify backend health
Invoke-WebRequest -Uri http://localhost:8080/health -UseBasicParsing

# Start frontend dev server
cd frontend
npm install
npm run dev

# Open browser to http://localhost:3000
```

### Run Unit Tests

```powershell
cd frontend

# Run all tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm run test SearchModal.test.tsx
```

### Run E2E Tests

```powershell
cd frontend

# Install Playwright browsers (first time only)
npx playwright install

# Run E2E tests
npm run test:e2e

# Run E2E tests in UI mode (interactive)
npm run test:e2e:ui

# Run specific test file
npx playwright test search.spec.ts
```

### Build Production Bundle

```powershell
cd frontend

# Build for production
npm run build

# Preview production build
npm run preview

# Check bundle size
npm run build -- --mode production --report
```

### Lint & Type Check

```powershell
cd frontend

# Run ESLint
npm run lint

# Fix ESLint issues
npm run lint:fix

# Run TypeScript type checking
npx tsc --noEmit
```

---

## Testing with Chrome DevTools

### Manual Testing Checklist

#### Setup
1. Start backend: `docker-compose up -d postgres redis backend`
2. Start frontend: `cd frontend && npm run dev`
3. Open Chrome: `http://localhost:3000`
4. Open DevTools: F12 or Ctrl+Shift+I

#### Search Modal Tests

**Test 1: Open Modal with Keyboard**
- [ ] Press Ctrl+K (or Cmd+K on Mac)
- [ ] Modal appears with backdrop
- [ ] Search input is auto-focused
- [ ] Console: No errors

**Test 2: Search Functionality**
- [ ] Type "dragon" in search input
- [ ] Results appear after 300ms delay
- [ ] Network tab shows API request with `?search=dragon`
- [ ] Results show item icons, names, prices
- [ ] Console: No errors

**Test 3: Keyboard Navigation**
- [ ] Press Arrow Down - first result highlights
- [ ] Press Arrow Down again - second result highlights
- [ ] Press Arrow Up - first result highlights again
- [ ] Press Enter - navigates to item detail page
- [ ] Press Escape - modal closes

**Test 4: Recent Searches**
- [ ] Search for "dragon", click a result
- [ ] Reopen modal (Ctrl+K)
- [ ] See "dragon" in recent searches
- [ ] Application tab → Local Storage → `recent-searches` key exists
- [ ] Close and reopen browser
- [ ] Recent searches persist

**Test 5: Close Modal**
- [ ] Press Escape - modal closes
- [ ] Click backdrop - modal closes
- [ ] Click X button - modal closes

#### Inline Search Tests

**Test 6: Table Search Filtering**
- [ ] Navigate to Dashboard
- [ ] Type "dragon" in table search input
- [ ] Wait 300ms
- [ ] Network tab shows API request or table filters client-side
- [ ] Table shows only items matching "dragon"
- [ ] Item count updates correctly
- [ ] Console: No errors

**Test 7: Search Clear**
- [ ] Type search query
- [ ] Click X (clear) button
- [ ] Search input clears
- [ ] Table shows all items again

**Test 8: Search Persistence**
- [ ] Search for "dragon"
- [ ] Navigate to item detail page
- [ ] Click back button
- [ ] Search query persists in input (or clears, depending on design)

#### DevTools Inspection Points

**Console Tab:**
- No errors or warnings
- React Query logs (if verbose mode)
- API request logs

**Network Tab:**
- `/api/v1/items?search=<query>` requests
- Response times < 200ms
- Correct query parameters

**Application Tab:**
- Local Storage: `recent-searches` array
- Session Storage: Any search state
- Cookies: None required

**Performance Tab:**
- Record search interaction
- Input lag < 100ms
- Render time < 50ms
- No layout thrashing

**Lighthouse Tab:**
- Accessibility score > 95
- Performance score > 90
- Best Practices score > 95

---

## Accessibility Checklist

- [ ] Modal has `role="dialog"` and `aria-modal="true"`
- [ ] Modal has `aria-labelledby` pointing to title
- [ ] Search input has `aria-label="Search items"`
- [ ] Results list has `role="listbox"`
- [ ] Result items have `role="option"`
- [ ] Selected result has `aria-selected="true"`
- [ ] Loading state announces "Loading results"
- [ ] No results announces "No items found"
- [ ] Focus trap within modal (Tab doesn't escape)
- [ ] Focus returns to trigger button on close
- [ ] Keyboard-only navigation works
- [ ] Screen reader announces results count

---

## Dependencies

### Existing (Verify)
- `@headlessui/react` - Modal/Dialog component
- `lucide-react` - Icons (Search, X, ArrowUp, ArrowDown)
- `@tanstack/react-query` - Data fetching (useItems hook)
- `zustand` - State management (UIStore)
- `react-router-dom` - Navigation

### New (If Needed)
- `use-debounce` - Debounce hook (or implement custom)

---

## Design Specifications

### SearchModal Layout
```
┌─────────────────────────────────────────────┐
│ [Backdrop - dark, 50% opacity]              │
│   ┌───────────────────────────────────┐    │
│   │ Search items...           [X]      │    │
│   ├───────────────────────────────────┤    │
│   │ Recent Searches (if empty input)   │    │
│   │ • Dragon scimitar                  │    │
│   │ • Abyssal whip                     │    │
│   ├───────────────────────────────────┤    │
│   │ Results (when typing)              │    │
│   │ [Icon] Dragon scimitar    2.5M     │ ← Selected
│   │ [Icon] Dragon longsword   800K     │    │
│   │ [Icon] Dragon dagger      150K     │    │
│   │ ...                                │    │
│   └───────────────────────────────────┘    │
│                                             │
└─────────────────────────────────────────────┘
```

### Keyboard Shortcuts
- `Ctrl+K` / `Cmd+K` - Open search modal
- `↑` / `↓` - Navigate results
- `Enter` - Select highlighted result
- `Escape` - Close modal
- `Tab` - Cycle through results

---

## Success Criteria

### Functional
- [x] Search modal opens with Ctrl+K
- [x] Search modal shows results as you type
- [x] Keyboard navigation works (arrows, enter, escape)
- [x] Recent searches persist across sessions
- [x] Clicking result navigates to item detail page
- [x] Inline table search filters items correctly
- [x] Search is debounced (300ms)
- [x] No console errors or warnings

### Performance
- [x] Search results appear within 300ms
- [x] No input lag during typing
- [x] Modal opens/closes within 200ms
- [x] No unnecessary re-renders

### Accessibility
- [x] Keyboard-only navigation works
- [x] Screen reader announces all states
- [x] Focus management is correct
- [x] ARIA labels are present
- [x] Color contrast passes WCAG AA

### Browser Compatibility
- [x] Works in Chrome/Edge (Chromium)
- [x] Works in Firefox
- [x] Works in Safari
- [x] Mobile responsive

---

## Rollback Plan

If issues arise:
1. Remove keyboard listener from MainLayout/App
2. Comment out SearchModal import
3. Revert Header button to disabled state
4. Keep inline search fixes (low risk)
5. Document blockers in GitHub Issues

---

## Related Documentation

- [FRONTEND_INSPECTION_FINDINGS.md](../../FRONTEND_INSPECTION_FINDINGS.md) - Original bug report
- [README.md](./README.md) - Implementation plans overview
- [Frontend Testing Guide](../../frontend/TESTING.md)
- [TanStack Query Docs](https://tanstack.com/query/latest)
- [HeadlessUI Dialog](https://headlessui.com/react/dialog)

---

**Last Updated:** January 17, 2026  
**Assignee:** TBD  
**Reviewer:** TBD
