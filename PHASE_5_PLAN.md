# Phase 5: Frontend Features - Detailed Implementation Plan

**Phase Duration:** 4-5 days  
**Current Status:** Not Started  
**Priority:** HIGHEST - No user interface exists yet

---

## 🎯 Phase Overview

Phase 5 focuses on building the **user-facing components** that allow users to view, search, filter, and analyze OSRS Grand Exchange data. This is the most critical remaining phase as the application currently has no UI.

### What We're Building

1. **ItemsTable** - Main data table displaying all 15,000+ items
2. **Price Charts** - Interactive time-series charts for price visualization
3. **Complete Pages** - Wire up DashboardPage and ItemDetailPage
4. **User Experience** - Loading states, error handling, responsive design

---

## 📅 Day-by-Day Breakdown

### Day 1: Data Table Foundation

**Goal:** Create the basic ItemsTable with TanStack Table

**Files to Create:**
```
frontend/src/components/table/
├── ItemsTable.tsx           # Main table component
├── columns.tsx              # Column definitions
└── index.ts                 # Exports
```

**Tasks:**
1. **Install TanStack Table Virtual** (if not already)
   ```bash
   npm install @tanstack/react-virtual
   ```

2. **Create Column Definitions** (`columns.tsx`)
   - Name column (with icon)
   - High Price (formatted as gold)
   - Low Price (formatted as gold)
   - Average Price (formatted as gold)
   - High Volume (formatted with commas)
   - Low Volume (formatted with commas)
   - Members (icon/badge)
   - Buy Limit (number)
   - Actions (link to detail page)

3. **Build ItemsTable Component** (`ItemsTable.tsx`)
   - Set up TanStack Table with useReactTable
   - Implement column sorting
   - Add column resizing
   - Implement virtual scrolling for performance
   - Add loading skeleton
   - Add empty state
   - Add error state

**Acceptance Criteria:**
- [ ] Table renders with all columns
- [ ] Data loads from useItems hook
- [ ] Columns are sortable
- [ ] Table scrolls smoothly with 15K+ rows
- [ ] Loading state shows skeleton
- [ ] Empty state shows helpful message

---

### Day 2: Filters, Search, and Toolbar

**Goal:** Add filtering, searching, and table controls

**Files to Create:**
```
frontend/src/components/table/
├── FilterPanel.tsx          # Advanced filters
├── TableToolbar.tsx         # Search bar and controls
├── TablePagination.tsx      # Pagination controls
└── ExportButton.tsx         # Export to CSV/JSON
```

**Tasks:**
1. **Build TableToolbar** (`TableToolbar.tsx`)
   - Search input with debounce
   - View options (compact/comfortable/spacious)
   - Column visibility toggle
   - Export button
   - Refresh button

2. **Create FilterPanel** (`FilterPanel.tsx`)
   - Price range slider (min/max)
   - Volume range slider
   - Members filter (all/members/f2p)
   - Category filter (if available)
   - Clear filters button
   - Filter count badge

3. **Build Pagination** (`TablePagination.tsx`)
   - Page size selector (50/100/200)
   - Page navigation (first/prev/next/last)
   - Current page indicator
   - Total items count

4. **Implement Export** (`ExportButton.tsx`)
   - Export visible columns to CSV
   - Export all data to JSON
   - Download file to user's computer

**Acceptance Criteria:**
- [ ] Search filters items by name
- [ ] Price/volume filters work correctly
- [ ] Filters can be combined
- [ ] Pagination changes page size
- [ ] Export creates valid CSV/JSON

---

### Day 3: Price Charts

**Goal:** Build interactive price charts for item detail page

**Files to Create:**
```
frontend/src/components/charts/
├── PriceChart.tsx           # Main chart component
├── TimePeriodSelector.tsx   # Time range buttons
├── ChartTooltip.tsx         # Custom tooltip
└── index.ts                 # Exports
```

**Tasks:**
1. **Create TimePeriodSelector** (`TimePeriodSelector.tsx`)
   - Buttons for: 24h, 7d, 30d, 90d, 1y, All
   - Highlight active period
   - Disable periods with no data

2. **Build PriceChart** (`PriceChart.tsx`)
   - Line chart with Recharts
   - X-axis: Time (formatted)
   - Y-axis: Price (formatted as gold)
   - Responsive sizing
   - Loading skeleton
   - Empty state for no data
   - Grid lines and styling

3. **Create ChartTooltip** (`ChartTooltip.tsx`)
   - Show timestamp
   - Show price (formatted)
   - Show volume (if available)
   - Show change from previous

4. **Add Chart Features**
   - Gradient fill under line
   - Price trend color (green up, red down)
   - Min/max markers
   - Current price indicator

**Acceptance Criteria:**
- [ ] Chart displays historical price data
- [ ] Time period selector changes data range
- [ ] Tooltip shows detailed information
- [ ] Chart is responsive on mobile
- [ ] Loading state works correctly

---

### Day 4: Complete Dashboard Page

**Goal:** Wire up ItemsTable to DashboardPage with full functionality

**Files to Update:**
```
frontend/src/pages/
└── DashboardPage.tsx        # Main dashboard view
```

**Tasks:**
1. **Set Up State Management**
   - Search query state
   - Filter state (price range, volume, members)
   - Sort state (column, direction)
   - Pagination state (page, pageSize)
   - View preferences (density, column visibility)

2. **Wire Up Components**
   - Add TableToolbar at top
   - Add FilterPanel in sidebar or expandable
   - Add ItemsTable in main area
   - Add TablePagination at bottom

3. **Implement Data Fetching**
   - Use useItems hook with all filters
   - Handle loading states
   - Handle error states
   - Implement refetch on filter change

4. **Add Polish**
   - Smooth transitions between states
   - Persist preferences to localStorage
   - Add keyboard shortcuts (Ctrl+K for search)
   - Responsive layout for mobile

**Acceptance Criteria:**
- [ ] Dashboard loads with items table
- [ ] All filters work together
- [ ] Search updates URL query params
- [ ] Page state persists on refresh
- [ ] Mobile layout works well

---

### Day 5: Complete Item Detail Page

**Goal:** Build item detail page with charts and metadata

**Files to Update:**
```
frontend/src/pages/
└── ItemDetailPage.tsx       # Item detail view
```

**Tasks:**
1. **Set Up Page Structure**
   - Header with item name and icon
   - Back button to dashboard
   - Favorite button
   - Share button

2. **Display Item Metadata**
   - Item name and ID
   - Members status
   - Buy limit
   - High/Low alch values
   - Current price (large, prominent)
   - 24h change (with percentage)
   - Latest high/low prices
   - Latest volume

3. **Add Price Chart**
   - Integrate PriceChart component
   - Add TimePeriodSelector
   - Fetch data with usePriceHistory hook
   - Handle loading/error states

4. **Additional Features**
   - Price statistics (avg, median, volatility)
   - Volume statistics
   - Historical high/low (all-time)
   - Related items (if available)
   - Notes/description (if available)

5. **Polish**
   - Loading skeleton for entire page
   - Error handling with retry
   - Responsive layout
   - Print-friendly view

**Acceptance Criteria:**
- [ ] Page loads item by ID from URL
- [ ] All metadata displays correctly
- [ ] Price chart shows historical data
- [ ] Time period selector works
- [ ] Back button returns to dashboard
- [ ] 404 handling for invalid item IDs

---

## 🎨 Design Guidelines

### Colors (TailwindCSS)
- **Primary:** `blue-600` for links and actions
- **Success:** `green-600` for positive changes
- **Danger:** `red-600` for negative changes
- **Gray Scale:** `gray-50` to `gray-900` for UI elements
- **Background:** `white` or `gray-50` for light mode

### Typography
- **Headings:** `font-bold` with appropriate text sizes
- **Body:** `font-normal text-gray-700`
- **Mono:** `font-mono` for prices and numbers

### Spacing
- Use Tailwind spacing scale (`p-4`, `m-2`, etc.)
- Consistent padding in cards and panels
- Proper gap between sections

### Responsive Breakpoints
- **Mobile:** `< 640px` - Single column, compact view
- **Tablet:** `640px - 1024px` - Adjusted layout
- **Desktop:** `> 1024px` - Full layout with sidebars

---

## 🧪 Testing Strategy

### Unit Tests
As each component is built, create corresponding test file:

```
ItemsTable.test.tsx
FilterPanel.test.tsx
PriceChart.test.tsx
DashboardPage.test.tsx
ItemDetailPage.test.tsx
```

**Test Coverage Goals:**
- Component renders without crashing
- Props are passed correctly
- User interactions trigger expected behavior
- Loading/error states display correctly
- Data formatting is correct

### Manual Testing Checklist
After completing Phase 5, verify:
- [ ] Can view all items in table
- [ ] Can search for items by name
- [ ] Can filter by price range
- [ ] Can filter by volume
- [ ] Can sort by any column
- [ ] Can change page size
- [ ] Can export data to CSV
- [ ] Can navigate to item detail
- [ ] Can view price chart
- [ ] Can change chart time period
- [ ] All pages are responsive
- [ ] Loading states work
- [ ] Error states work

---

## 📦 Dependencies Verification

Check that all required dependencies are installed:

```json
{
  "@tanstack/react-table": "^8.x",
  "@tanstack/react-virtual": "^3.x",
  "recharts": "^2.x",
  "react-router-dom": "^6.x",
  "@tanstack/react-query": "^5.x",
  "zustand": "^4.x"
}
```

If any are missing:
```bash
npm install @tanstack/react-table @tanstack/react-virtual recharts
```

---

## 🚀 Success Metrics

Phase 5 will be considered complete when:

1. **User Can Browse Items**
   - Table displays all items from API
   - Search and filters work correctly
   - Pagination is functional

2. **User Can View Item Details**
   - Item detail page loads from URL
   - Price chart displays historical data
   - All metadata is visible

3. **Performance is Acceptable**
   - Table scrolls smoothly with 15K+ rows
   - Charts render quickly
   - No console errors or warnings

4. **Code Quality**
   - TypeScript types are correct
   - No 'any' types used
   - Components are well-structured
   - Code follows existing patterns

5. **User Experience**
   - Loading states are clear
   - Error messages are helpful
   - Layout is responsive
   - Navigation is intuitive

---

## 🔗 Related Documentation

- [PROJECT_STATUS.md](PROJECT_STATUS.md) - Full project status report
- [NEXT_STEPS.md](NEXT_STEPS.md) - Quick reference for next actions
- [PHASE_4_COMPLETE.md](PHASE_4_COMPLETE.md) - Foundation that Phase 5 builds on
- [IMPLEMENTATION_PLAN.md](IMPLEMENTATION_PLAN.md) - Original full plan

---

## 💡 Tips for Success

1. **Build Incrementally**
   - Get basic table working first
   - Add features one at a time
   - Test frequently

2. **Use Existing Patterns**
   - Follow patterns from Phase 4
   - Reuse utility functions
   - Keep components small and focused

3. **Handle Edge Cases**
   - Empty states
   - Loading states
   - Error states
   - No data scenarios

4. **Test on Real Data**
   - Use actual OSRS API data
   - Test with large datasets
   - Verify formatting is correct

5. **Keep Performance in Mind**
   - Use virtual scrolling for large lists
   - Debounce search inputs
   - Memoize expensive calculations
   - Lazy load charts

---

**Ready to Start?** Begin with Day 1: Data Table Foundation!
