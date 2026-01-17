# 006: Table Toolbar UX

**Priority:** High  
**Effort:** S (1-4 hours) for Option A | M (4-8 hours) for Option B  
**Status:** Not Started

## Overview

Fix the mislabeled "Toggle columns" button and improve table toolbar UX.

## Problem

Currently, the "Toggle columns" button opens the FilterPanel instead of toggling column visibility. This is confusing for users.

## Options

### Option A: Rename Button to "Filters" (Quick Fix)
Simply rename the button to match its actual behavior.

### Option B: Implement Column Visibility (Better UX)
Keep filters functionality and add a proper column visibility toggle.

---

## Implementation: Option A (Quick Fix)

### Tasks

#### 6.A.1 Update Button Label and Icon
- **File:** `frontend/src/pages/DashboardPage.tsx`
- **Action:** Locate the "Toggle columns" button and update:
  - Change button text from "Toggle columns" to "Filters"
  - Change icon from `<Columns />` to `<SlidersHorizontal />`
  - Update `aria-label` to "Open filters"
  - Update tooltip text to "Filter items"

#### 6.A.2 Verify Import Statement
- **File:** `frontend/src/pages/DashboardPage.tsx`
- **Action:** Ensure `SlidersHorizontal` is imported from lucide-react:
```tsx
import { SlidersHorizontal } from 'lucide-react';
```

### Build & Test

#### Local Development
```powershell
# Terminal 1: Ensure backend is running
cd backend
docker-compose up -d postgres redis backend

# Terminal 2: Start frontend dev server
cd frontend
npm run dev
```

#### Build Verification
```powershell
cd frontend
npm run build
# Should complete without errors
```

#### Unit Tests
No new unit tests required for Option A (cosmetic change only).

Run existing tests to ensure no regressions:
```powershell
cd frontend
npm run test
```

### Manual Testing with Chrome DevTools

#### Test Steps

1. **Navigate to Dashboard**
   - Open `http://localhost:3000`
   - Verify table loads with items

2. **Inspect Button Label**
   - Open Chrome DevTools (F12)
   - Locate the toolbar above the items table
   - Verify button now shows `SlidersHorizontal` icon
   - Verify button text reads "Filters"

3. **Test Functionality**
   - Click the "Filters" button
   - Verify FilterPanel opens (membership, price range, volume)
   - Verify no console errors

4. **Accessibility Check**
   - Take snapshot: `mcp_io_github_chr_take_snapshot`
   - Verify button has `aria-label="Open filters"`
   - Verify button is keyboard accessible (Tab to focus, Enter to activate)

5. **Responsive Test**
   - Resize viewport: `mcp_io_github_chr_resize_page` to 768x1024 (tablet)
   - Verify button label adjusts appropriately
   - Resize to 375x667 (mobile)
   - Verify button remains functional

### Acceptance Criteria

- [ ] Button label changed to "Filters"
- [ ] Icon changed to `SlidersHorizontal`
- [ ] Button opens FilterPanel correctly
- [ ] No console errors
- [ ] Button is keyboard accessible
- [ ] Tooltip text is accurate
- [ ] No regressions in existing tests

---

## Implementation: Option B (Full Implementation)

### Tasks

#### 6.B.1 Create Column Visibility Store
- **File:** `frontend/src/stores/useColumnVisibilityStore.ts` (new file)
- **Action:** Create Zustand store for column visibility state
```tsx
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface ColumnVisibilityState {
  visibleColumns: string[];
  toggleColumn: (columnId: string) => void;
  showAll: () => void;
  hideAll: () => void;
  resetToDefaults: () => void;
}

const DEFAULT_COLUMNS = ['item', 'highPrice', 'lowPrice', 'avgPrice', 'members', 'buyLimit'];

export const useColumnVisibilityStore = create<ColumnVisibilityState>()(
  persist(
    (set) => ({
      visibleColumns: DEFAULT_COLUMNS,
      toggleColumn: (columnId) =>
        set((state) => ({
          visibleColumns: state.visibleColumns.includes(columnId)
            ? state.visibleColumns.filter((id) => id !== columnId)
            : [...state.visibleColumns, columnId],
        })),
      showAll: () =>
        set({ visibleColumns: [...DEFAULT_COLUMNS, 'volume', 'highAlch', 'lowAlch'] }),
      hideAll: () => set({ visibleColumns: ['item'] }), // Always show item
      resetToDefaults: () => set({ visibleColumns: DEFAULT_COLUMNS }),
    }),
    { name: 'column-visibility' }
  )
);
```

#### 6.B.2 Create ColumnToggle Component
- **File:** `frontend/src/components/table/ColumnToggle.tsx` (new file)
- **Action:** Build dropdown component for column visibility
```tsx
import { useState } from 'react';
import { Columns, Check } from 'lucide-react';
import { useColumnVisibilityStore } from '@/stores/useColumnVisibilityStore';

interface Column {
  id: string;
  label: string;
  required?: boolean;
}

const AVAILABLE_COLUMNS: Column[] = [
  { id: 'item', label: 'Item', required: true },
  { id: 'highPrice', label: 'High Price' },
  { id: 'lowPrice', label: 'Low Price' },
  { id: 'avgPrice', label: 'Average Price' },
  { id: 'members', label: 'Members' },
  { id: 'buyLimit', label: 'Buy Limit' },
  { id: 'volume', label: 'Volume' },
  { id: 'highAlch', label: 'High Alch' },
  { id: 'lowAlch', label: 'Low Alch' },
];

export function ColumnToggle() {
  const [isOpen, setIsOpen] = useState(false);
  const { visibleColumns, toggleColumn, showAll, resetToDefaults } = useColumnVisibilityStore();

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 text-sm border rounded-lg hover:bg-gray-50"
        aria-label="Toggle column visibility"
      >
        <Columns className="w-4 h-4" />
        Columns
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-white border rounded-lg shadow-lg z-50">
          <div className="p-2">
            <div className="text-xs font-medium text-gray-500 mb-2">Toggle Columns</div>
            {AVAILABLE_COLUMNS.map((column) => (
              <label
                key={column.id}
                className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-gray-50 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={visibleColumns.includes(column.id)}
                  onChange={() => toggleColumn(column.id)}
                  disabled={column.required}
                  className="rounded"
                />
                <span className="text-sm">{column.label}</span>
                {visibleColumns.includes(column.id) && (
                  <Check className="w-4 h-4 ml-auto text-blue-600" />
                )}
              </label>
            ))}
            <div className="border-t mt-2 pt-2 flex gap-2">
              <button
                onClick={showAll}
                className="flex-1 text-xs px-2 py-1 border rounded hover:bg-gray-50"
              >
                Show All
              </button>
              <button
                onClick={resetToDefaults}
                className="flex-1 text-xs px-2 py-1 border rounded hover:bg-gray-50"
              >
                Reset
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
```

#### 6.B.3 Update DashboardPage Toolbar
- **File:** `frontend/src/pages/DashboardPage.tsx`
- **Action:** 
  1. Rename existing "Toggle columns" button to "Filters" (with `SlidersHorizontal` icon)
  2. Add `<ColumnToggle />` component next to Filters button
  3. Import `ColumnToggle` component

#### 6.B.4 Update ItemsTable Column Rendering
- **File:** `frontend/src/components/table/ItemsTable.tsx`
- **Action:** Conditionally render columns based on `visibleColumns` state
```tsx
import { useColumnVisibilityStore } from '@/stores/useColumnVisibilityStore';

// Inside component:
const { visibleColumns } = useColumnVisibilityStore();

// Update column definitions:
const columns = useMemo(() => {
  const allColumns = [
    { id: 'item', header: 'Item', /* ... */ },
    { id: 'highPrice', header: 'High Price', /* ... */ },
    // ... other columns
  ];
  
  return allColumns.filter(col => visibleColumns.includes(col.id));
}, [visibleColumns]);
```

#### 6.B.5 Add Close on Outside Click
- **File:** `frontend/src/components/table/ColumnToggle.tsx`
- **Action:** Add `useOnClickOutside` hook to close dropdown when clicking outside

#### 6.B.6 Add Keyboard Shortcuts
- **File:** `frontend/src/components/table/ColumnToggle.tsx`
- **Action:** Add Escape key handler to close dropdown

### Build & Test

#### Local Development
```powershell
# Terminal 1: Backend
cd backend
docker-compose up -d postgres redis backend

# Terminal 2: Frontend with HMR
cd frontend
npm run dev
```

#### Build Verification
```powershell
cd frontend
npm run build
# Should complete without TypeScript errors
npm run preview  # Test production build
```

#### Unit Tests

**Create test file:** `frontend/src/stores/__tests__/useColumnVisibilityStore.test.ts`

```tsx
import { renderHook, act } from '@testing-library/react';
import { useColumnVisibilityStore } from '../useColumnVisibilityStore';

describe('useColumnVisibilityStore', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('should initialize with default columns', () => {
    const { result } = renderHook(() => useColumnVisibilityStore());
    expect(result.current.visibleColumns).toContain('item');
    expect(result.current.visibleColumns).toContain('highPrice');
  });

  it('should toggle column visibility', () => {
    const { result } = renderHook(() => useColumnVisibilityStore());
    
    act(() => {
      result.current.toggleColumn('volume');
    });
    
    expect(result.current.visibleColumns).toContain('volume');
    
    act(() => {
      result.current.toggleColumn('volume');
    });
    
    expect(result.current.visibleColumns).not.toContain('volume');
  });

  it('should show all columns', () => {
    const { result } = renderHook(() => useColumnVisibilityStore());
    
    act(() => {
      result.current.showAll();
    });
    
    expect(result.current.visibleColumns).toContain('volume');
    expect(result.current.visibleColumns).toContain('highAlch');
    expect(result.current.visibleColumns).toContain('lowAlch');
  });

  it('should reset to defaults', () => {
    const { result } = renderHook(() => useColumnVisibilityStore());
    
    act(() => {
      result.current.showAll();
      result.current.resetToDefaults();
    });
    
    expect(result.current.visibleColumns).not.toContain('volume');
  });

  it('should persist to localStorage', () => {
    const { result } = renderHook(() => useColumnVisibilityStore());
    
    act(() => {
      result.current.toggleColumn('volume');
    });
    
    const stored = JSON.parse(localStorage.getItem('column-visibility') || '{}');
    expect(stored.state.visibleColumns).toContain('volume');
  });
});
```

**Create test file:** `frontend/src/components/table/__tests__/ColumnToggle.test.tsx`

```tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { ColumnToggle } from '../ColumnToggle';
import { useColumnVisibilityStore } from '@/stores/useColumnVisibilityStore';

jest.mock('@/stores/useColumnVisibilityStore');

describe('ColumnToggle', () => {
  const mockToggleColumn = jest.fn();
  const mockShowAll = jest.fn();
  const mockResetToDefaults = jest.fn();

  beforeEach(() => {
    (useColumnVisibilityStore as jest.Mock).mockReturnValue({
      visibleColumns: ['item', 'highPrice', 'lowPrice'],
      toggleColumn: mockToggleColumn,
      showAll: mockShowAll,
      resetToDefaults: mockResetToDefaults,
    });
  });

  it('should render Columns button', () => {
    render(<ColumnToggle />);
    expect(screen.getByLabelText('Toggle column visibility')).toBeInTheDocument();
  });

  it('should open dropdown on click', () => {
    render(<ColumnToggle />);
    fireEvent.click(screen.getByLabelText('Toggle column visibility'));
    expect(screen.getByText('Toggle Columns')).toBeInTheDocument();
  });

  it('should show checked columns', () => {
    render(<ColumnToggle />);
    fireEvent.click(screen.getByLabelText('Toggle column visibility'));
    
    const highPriceCheckbox = screen.getByLabelText('High Price');
    expect(highPriceCheckbox).toBeChecked();
  });

  it('should call toggleColumn when checkbox clicked', () => {
    render(<ColumnToggle />);
    fireEvent.click(screen.getByLabelText('Toggle column visibility'));
    
    const volumeCheckbox = screen.getByLabelText('Volume');
    fireEvent.click(volumeCheckbox);
    
    expect(mockToggleColumn).toHaveBeenCalledWith('volume');
  });

  it('should call showAll when Show All clicked', () => {
    render(<ColumnToggle />);
    fireEvent.click(screen.getByLabelText('Toggle column visibility'));
    
    fireEvent.click(screen.getByText('Show All'));
    expect(mockShowAll).toHaveBeenCalled();
  });

  it('should call resetToDefaults when Reset clicked', () => {
    render(<ColumnToggle />);
    fireEvent.click(screen.getByLabelText('Toggle column visibility'));
    
    fireEvent.click(screen.getByText('Reset'));
    expect(mockResetToDefaults).toHaveBeenCalled();
  });

  it('should disable required columns', () => {
    render(<ColumnToggle />);
    fireEvent.click(screen.getByLabelText('Toggle column visibility'));
    
    const itemCheckbox = screen.getByLabelText('Item');
    expect(itemCheckbox).toBeDisabled();
  });
});
```

#### Run Tests
```powershell
cd frontend

# Run unit tests
npm run test

# Run with coverage
npm run test -- --coverage

# Watch mode for development
npm run test -- --watch
```

### Manual Testing with Chrome DevTools

#### Setup
```powershell
# Terminal 1: Start backend
cd backend
docker-compose up -d postgres redis backend

# Terminal 2: Start frontend
cd frontend
npm run dev

# Wait for frontend to be ready at http://localhost:3000
```

#### Test Steps

1. **Initial State**
   - Navigate to `http://localhost:3000`
   - Open Chrome DevTools (F12)
   - Take snapshot: Verify "Columns" button exists
   - Take snapshot: Verify "Filters" button exists (separate from Columns)

2. **Open Column Toggle**
   - Click "Columns" button using `mcp_io_github_chr_click` on button uid
   - Take snapshot: Verify dropdown appears with checkbox list
   - Verify default columns are checked (Item, High Price, Low Price, etc.)

3. **Hide Column**
   - Click checkbox for "Volume" using `mcp_io_github_chr_click`
   - Take snapshot: Verify "Volume" column disappears from table
   - Verify table still renders correctly with remaining columns

4. **Show Column**
   - Click "Volume" checkbox again
   - Take snapshot: Verify "Volume" column reappears in table

5. **Show All Columns**
   - Click "Show All" button
   - Take snapshot: Verify all columns visible including "High Alch", "Low Alch"

6. **Reset to Defaults**
   - Click "Reset" button
   - Take snapshot: Verify default columns restored

7. **Persistence Test**
   - Hide "Buy Limit" column
   - Refresh page (Ctrl+R)
   - Take snapshot: Verify "Buy Limit" still hidden after refresh
   - Verify localStorage contains saved state

8. **Close Dropdown**
   - Open column toggle dropdown
   - Press Escape key using `mcp_io_github_chr_press_key` with key="Escape"
   - Take snapshot: Verify dropdown closed

9. **Outside Click**
   - Open column toggle dropdown
   - Click elsewhere on page (e.g., table row)
   - Take snapshot: Verify dropdown closed

10. **Filters Button Still Works**
    - Click "Filters" button
    - Take snapshot: Verify FilterPanel opens (not column toggle)
    - Verify both buttons coexist and work independently

11. **Responsive Test**
    - Resize to tablet: `mcp_io_github_chr_resize_page` width=768 height=1024
    - Verify both buttons render properly
    - Resize to mobile: width=375 height=667
    - Verify buttons stack or collapse appropriately

12. **Accessibility Audit**
    - Take snapshot with verbose=true
    - Verify all checkboxes have proper labels
    - Verify dropdown has proper ARIA attributes
    - Test keyboard navigation (Tab through checkboxes)

13. **Console Check**
    - List console messages: `mcp_io_github_chr_list_console_messages`
    - Verify no errors or warnings related to column toggle
    - Verify no React warnings about keys or state

### Acceptance Criteria

- [ ] ColumnToggle component renders with "Columns" button
- [ ] Separate "Filters" button exists and works
- [ ] Dropdown shows all available columns with checkboxes
- [ ] Toggling checkbox shows/hides column in table
- [ ] "Show All" button reveals all columns
- [ ] "Reset" button restores default columns
- [ ] Item column cannot be unchecked (required)
- [ ] Column preferences persist in localStorage
- [ ] Preferences survive page refresh
- [ ] Dropdown closes on Escape key
- [ ] Dropdown closes on outside click
- [ ] No console errors or warnings
- [ ] All unit tests pass
- [ ] TypeScript build completes without errors
- [ ] Responsive design works on mobile/tablet

---

## Dependencies

### Option A
- None (cosmetic change only)

### Option B
- `zustand` (already installed)
- `zustand/middleware` for persist
- `lucide-react` (already installed)

---

## Recommendation

**Phased Approach:**
1. Implement Option A immediately (quick win)
2. Implement Option B in next sprint (better UX)

This allows users to have correct labeling now while planning for enhanced functionality.
