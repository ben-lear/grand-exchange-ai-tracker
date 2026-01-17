# 005: Accessibility Fixes

**Priority:** High  
**Effort:** S (1-4 hours)  
**Status:** Not Started

## Overview

Fix accessibility issues identified in console warnings and inspection. This implementation plan addresses all 6 form field warnings, keyboard navigation issues, and WCAG 2.1 compliance gaps.

## Pre-Implementation Checklist

- [ ] Backend running on port 8080 (`docker-compose up -d`)
- [ ] Frontend dev server running on port 3000 (`cd frontend && npm run dev`)
- [ ] Chrome DevTools open (F12)
- [ ] Console cleared to track new warnings
- [ ] Review [FRONTEND_INSPECTION_FINDINGS.md](../../FRONTEND_INSPECTION_FINDINGS.md) issues #7, #10-12

---

## Tasks

### 5.1 Add IDs to Form Fields (TableToolbar)

**File:** `frontend/src/components/table/TableToolbar.tsx`

**Current Issues:**
- Search input missing `id` and `name` attributes
- Clear button missing accessible name

**Implementation Steps:**

1. **Add ID to search input:**
   ```tsx
   <input
     id="table-search"
     name="search"
     type="text"
     placeholder="Search items..."
     value={searchQuery}
     onChange={(e) => setSearchQuery(e.target.value)}
     className="..."
   />
   ```

2. **Associate label (visually hidden):**
   ```tsx
   <label htmlFor="table-search" className="sr-only">
     Search items by name
   </label>
   ```

3. **Add aria-label to clear button:**
   ```tsx
   <button
     type="button"
     onClick={() => setSearchQuery('')}
     aria-label="Clear search"
     className="..."
   >
     <X className="w-4 h-4" />
   </button>
   ```

4. **Add sr-only utility to index.css** (if not exists):
   ```css
   .sr-only {
     position: absolute;
     width: 1px;
     height: 1px;
     padding: 0;
     margin: -1px;
     overflow: hidden;
     clip: rect(0, 0, 0, 0);
     white-space: nowrap;
     border-width: 0;
   }
   ```

**Unit Tests to Add:**

Create/update `frontend/src/components/table/TableToolbar.test.tsx`:

```typescript
describe('TableToolbar Accessibility', () => {
  it('should have accessible search input with id and name', () => {
    render(<TableToolbar />);
    const input = screen.getByLabelText(/search items/i);
    expect(input).toHaveAttribute('id', 'table-search');
    expect(input).toHaveAttribute('name', 'search');
  });

  it('should have accessible clear button', () => {
    render(<TableToolbar />);
    const input = screen.getByLabelText(/search items/i);
    fireEvent.change(input, { target: { value: 'dragon' } });
    
    const clearButton = screen.getByLabelText(/clear search/i);
    expect(clearButton).toBeInTheDocument();
  });

  it('should clear search when clear button is clicked', () => {
    render(<TableToolbar />);
    const input = screen.getByLabelText(/search items/i);
    fireEvent.change(input, { target: { value: 'dragon' } });
    
    const clearButton = screen.getByLabelText(/clear search/i);
    fireEvent.click(clearButton);
    
    expect(input).toHaveValue('');
  });
});
```

---

### 5.2 Add IDs to Form Fields (FilterPanel)

**File:** `frontend/src/components/table/FilterPanel.tsx`

**Current Issues:**
- Price min/max inputs missing `id` and `name`
- Volume min/max inputs missing `id` and `name`
- Membership radio buttons missing proper grouping

**Implementation Steps:**

1. **Add IDs to price range inputs:**
   ```tsx
   <div>
     <label htmlFor="filter-price-min" className="text-sm font-medium">
       Min Price
     </label>
     <input
       id="filter-price-min"
       name="priceMin"
       type="number"
       placeholder="0"
       value={priceMin}
       onChange={(e) => setPriceMin(e.target.value)}
       className="..."
     />
   </div>
   
   <div>
     <label htmlFor="filter-price-max" className="text-sm font-medium">
       Max Price
     </label>
     <input
       id="filter-price-max"
       name="priceMax"
       type="number"
       placeholder="Max"
       value={priceMax}
       onChange={(e) => setPriceMax(e.target.value)}
       className="..."
     />
   </div>
   ```

2. **Add IDs to volume inputs:**
   ```tsx
   <input
     id="filter-volume-min"
     name="volumeMin"
     type="number"
     // ... rest
   />
   
   <input
     id="filter-volume-max"
     name="volumeMax"
     type="number"
     // ... rest
   />
   ```

3. **Add proper fieldset for membership radio group:**
   ```tsx
   <fieldset>
     <legend className="text-sm font-medium mb-2">Membership</legend>
     <div className="space-y-2">
       <label className="flex items-center gap-2">
         <input
           id="membership-all"
           type="radio"
           name="membership"
           value="all"
           checked={membershipFilter === 'all'}
           onChange={() => setMembershipFilter('all')}
         />
         <span>All Items</span>
       </label>
       {/* Repeat for members/free */}
     </div>
   </fieldset>
   ```

**Unit Tests to Add:**

Create/update `frontend/src/components/table/FilterPanel.test.tsx`:

```typescript
describe('FilterPanel Accessibility', () => {
  it('should have accessible price range inputs', () => {
    render(<FilterPanel />);
    expect(screen.getByLabelText(/min price/i)).toHaveAttribute('id', 'filter-price-min');
    expect(screen.getByLabelText(/max price/i)).toHaveAttribute('id', 'filter-price-max');
  });

  it('should have accessible volume inputs', () => {
    render(<FilterPanel />);
    expect(screen.getByLabelText(/min volume/i)).toHaveAttribute('id', 'filter-volume-min');
    expect(screen.getByLabelText(/max volume/i)).toHaveAttribute('id', 'filter-volume-max');
  });

  it('should have properly grouped membership radio buttons', () => {
    render(<FilterPanel />);
    const radioButtons = screen.getAllByRole('radio', { name: /membership/i });
    expect(radioButtons).toHaveLength(3);
    radioButtons.forEach(radio => {
      expect(radio).toHaveAttribute('name', 'membership');
    });
  });

  it('should update filters when inputs change', () => {
    render(<FilterPanel />);
    const minPriceInput = screen.getByLabelText(/min price/i);
    fireEvent.change(minPriceInput, { target: { value: '1000' } });
    expect(minPriceInput).toHaveValue(1000);
  });
});
```

---

### 5.3 Add IDs to Form Fields (TablePagination)

**File:** `frontend/src/components/table/TablePagination.tsx`

**Current Issues:**
- Page size select missing `id` and `name`

**Implementation Steps:**

1. **Add ID to page size select:**
   ```tsx
   <div className="flex items-center gap-2">
     <label htmlFor="page-size-select" className="text-sm">
       Rows per page:
     </label>
     <select
       id="page-size-select"
       name="pageSize"
       value={pageSize}
       onChange={(e) => setPageSize(Number(e.target.value))}
       className="..."
     >
       <option value={50}>50</option>
       <option value={100}>100</option>
       <option value={200}>200</option>
     </select>
   </div>
   ```

**Unit Tests to Add:**

Create/update `frontend/src/components/table/TablePagination.test.tsx`:

```typescript
describe('TablePagination Accessibility', () => {
  it('should have accessible page size select', () => {
    render(<TablePagination />);
    const select = screen.getByLabelText(/rows per page/i);
    expect(select).toHaveAttribute('id', 'page-size-select');
    expect(select).toHaveAttribute('name', 'pageSize');
  });

  it('should update page size when select changes', () => {
    const mockSetPageSize = vi.fn();
    render(<TablePagination setPageSize={mockSetPageSize} />);
    
    const select = screen.getByLabelText(/rows per page/i);
    fireEvent.change(select, { target: { value: '100' } });
    
    expect(mockSetPageSize).toHaveBeenCalledWith(100);
  });

  it('should have accessible navigation buttons', () => {
    render(<TablePagination />);
    expect(screen.getByLabelText(/first page/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/previous page/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/next page/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/last page/i)).toBeInTheDocument();
  });
});
```

---

### 5.4 Fix Escape Key for Dropdowns

**Files:**
- `frontend/src/components/table/ExportButton.tsx`
- Any other components with dropdowns

**Current Issue:**
- Escape key doesn't close open dropdowns

**Implementation Steps:**

1. **Add useEffect with keyboard listener:**
   ```tsx
   useEffect(() => {
     const handleEscape = (e: KeyboardEvent) => {
       if (e.key === 'Escape' && isOpen) {
         setIsOpen(false);
       }
     };

     if (isOpen) {
       document.addEventListener('keydown', handleEscape);
       return () => document.removeEventListener('keydown', handleEscape);
     }
   }, [isOpen]);
   ```

2. **Add cleanup on click outside:**
   ```tsx
   const dropdownRef = useRef<HTMLDivElement>(null);

   useEffect(() => {
     const handleClickOutside = (e: MouseEvent) => {
       if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
         setIsOpen(false);
       }
     };

     if (isOpen) {
       document.addEventListener('mousedown', handleClickOutside);
       return () => document.removeEventListener('mousedown', handleClickOutside);
     }
   }, [isOpen]);
   ```

3. **Add ref to dropdown container:**
   ```tsx
   <div ref={dropdownRef} className="relative">
     {/* Dropdown content */}
   </div>
   ```

**Unit Tests to Add:**

Create/update `frontend/src/components/table/ExportButton.test.tsx`:

```typescript
describe('ExportButton Keyboard Accessibility', () => {
  it('should close dropdown on Escape key', () => {
    render(<ExportButton />);
    const button = screen.getByRole('button', { name: /export/i });
    
    fireEvent.click(button);
    expect(screen.getByText(/export as csv/i)).toBeVisible();
    
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByText(/export as csv/i)).not.toBeInTheDocument();
  });

  it('should close dropdown on click outside', () => {
    render(<ExportButton />);
    const button = screen.getByRole('button', { name: /export/i });
    
    fireEvent.click(button);
    expect(screen.getByText(/export as csv/i)).toBeVisible();
    
    fireEvent.mouseDown(document.body);
    expect(screen.queryByText(/export as csv/i)).not.toBeInTheDocument();
  });

  it('should trap focus within dropdown when open', () => {
    render(<ExportButton />);
    const button = screen.getByRole('button', { name: /export/i });
    
    fireEvent.click(button);
    
    const csvButton = screen.getByText(/export as csv/i);
    const jsonButton = screen.getByText(/export as json/i);
    
    expect(document.activeElement).toBe(csvButton);
    
    fireEvent.keyDown(csvButton, { key: 'Tab' });
    expect(document.activeElement).toBe(jsonButton);
  });
});
```

---

### 5.5 Add Skip to Main Content Link

**File:** `frontend/src/components/layout/MainLayout.tsx`

**Current Issue:**
- No skip link for keyboard users to bypass navigation

**Implementation Steps:**

1. **Add skip link at top of layout:**
   ```tsx
   export default function MainLayout({ children }: MainLayoutProps) {
     return (
       <div className="min-h-screen bg-gray-50">
         {/* Skip to main content link */}
         <a
           href="#main-content"
           className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-blue-600 focus:text-white focus:rounded"
         >
           Skip to main content
         </a>
         
         <Header />
         
         <main id="main-content" className="...">
           {children}
         </main>
         
         <Footer />
       </div>
     );
   }
   ```

2. **Add focus styles for skip link:**
   ```css
   /* In index.css or component styles */
   .focus\:not-sr-only:focus {
     position: absolute;
     width: auto;
     height: auto;
     padding: 0.5rem 1rem;
     margin: 0;
     overflow: visible;
     clip: auto;
     white-space: normal;
   }
   ```

**Unit Tests to Add:**

Create/update `frontend/src/components/layout/MainLayout.test.tsx`:

```typescript
describe('MainLayout Accessibility', () => {
  it('should have skip to main content link', () => {
    render(<MainLayout><div>Content</div></MainLayout>);
    const skipLink = screen.getByText(/skip to main content/i);
    expect(skipLink).toHaveAttribute('href', '#main-content');
  });

  it('should focus main content when skip link is clicked', () => {
    render(<MainLayout><div>Content</div></MainLayout>);
    const skipLink = screen.getByText(/skip to main content/i);
    const mainContent = document.getElementById('main-content');
    
    fireEvent.click(skipLink);
    expect(mainContent).toHaveFocus();
  });

  it('should have proper landmark regions', () => {
    render(<MainLayout><div>Content</div></MainLayout>);
    expect(screen.getByRole('banner')).toBeInTheDocument(); // Header
    expect(screen.getByRole('main')).toBeInTheDocument();
    expect(screen.getByRole('contentinfo')).toBeInTheDocument(); // Footer
  });
});
```

---

## Build & Testing Procedures

### Local Development Setup

1. **Start backend services:**
   ```powershell
   # From project root
   docker-compose up -d postgres redis backend
   
   # Verify backend is running
   Invoke-WebRequest -Uri http://localhost:8080/health -UseBasicParsing | Select-Object StatusCode
   # Should return: StatusCode: 200
   ```

2. **Start frontend dev server:**
   ```powershell
   cd frontend
   npm run dev
   
   # Should start on: http://localhost:3000
   ```

3. **Open Chrome DevTools:**
   - Press `F12` or `Ctrl+Shift+I`
   - Navigate to **Console** tab
   - Clear console (`Ctrl+L`)
   - Refresh page (`Ctrl+R`)

### Manual Testing Checklist

#### Form Fields (Console Warnings)

- [ ] **Clear console warnings**
  1. Open Console tab in DevTools
  2. Look for: "A form field element should have an id or name attribute"
  3. Should show **0 warnings** (was 6)

- [ ] **Test search input**
  1. Open Elements tab
  2. Find search input (Ctrl+F → "table-search")
  3. Verify `id="table-search"` attribute exists
  4. Verify `name="search"` attribute exists
  5. Type in search box
  6. Clear button should have `aria-label="Clear search"`

- [ ] **Test filter inputs**
  1. Click "Toggle columns" button to open FilterPanel
  2. Inspect price min/max inputs
  3. Verify each has unique `id` and `name`
  4. Verify labels are properly associated (`htmlFor` matches `id`)

- [ ] **Test page size select**
  1. Scroll to bottom of page
  2. Find "Rows per page" select
  3. Verify `id="page-size-select"` exists
  4. Verify `name="pageSize"` exists

#### Keyboard Navigation

- [ ] **Tab order test**
  1. Click browser address bar
  2. Press `Tab` repeatedly
  3. Verify focus order: Skip link → Search → Filters → Table → Pagination
  4. Verify focus indicators are visible

- [ ] **Escape key test**
  1. Click "Export" button to open dropdown
  2. Press `Escape` key
  3. Dropdown should close
  4. Repeat for FilterPanel and any other dropdowns

- [ ] **Skip link test**
  1. Refresh page
  2. Press `Tab` once
  3. Verify "Skip to main content" link appears
  4. Press `Enter`
  5. Focus should jump to main content area

#### Screen Reader Testing (Optional but Recommended)

- [ ] **Windows Narrator test**
  1. Press `Windows + Ctrl + Enter` to start Narrator
  2. Navigate through form fields with `Tab`
  3. Verify each field announces its label
  4. Press `Windows + Ctrl + Enter` to stop Narrator

- [ ] **NVDA test** (if installed)
  1. Start NVDA
  2. Navigate with arrow keys and Tab
  3. Verify form fields announce correctly
  4. Exit NVDA

### Chrome DevTools Accessibility Audit

1. **Run Lighthouse audit:**
   ```
   DevTools → Lighthouse tab
   - Check "Accessibility" only
   - Device: Desktop
   - Click "Analyze page load"
   ```

2. **Expected results:**
   - Accessibility score: **95+** (was ~85)
   - No form field warnings
   - No missing label errors
   - All interactive elements have accessible names

3. **Check Accessibility panel:**
   ```
   DevTools → Elements tab → Accessibility sidebar
   - Select each input element
   - Verify "Name" property is populated
   - Verify "Role" is correct (textbox, combobox, button, etc.)
   ```

### Unit Testing

1. **Run all tests:**
   ```powershell
   cd frontend
   npm test
   ```

2. **Run with coverage:**
   ```powershell
   npm run test:coverage
   ```

3. **Expected coverage targets:**
   - TableToolbar: 90%+
   - FilterPanel: 90%+
   - TablePagination: 90%+
   - ExportButton: 85%+
   - MainLayout: 80%+

4. **View coverage report:**
   ```powershell
   # Open in browser
   Start-Process .\coverage\index.html
   ```

### Build Verification

1. **Production build:**
   ```powershell
   npm run build
   ```

2. **Verify no TypeScript errors:**
   ```powershell
   npm run type-check
   ```

3. **Preview production build:**
   ```powershell
   npm run preview
   # Opens on: http://localhost:4173
   ```

4. **Re-run accessibility audit on preview build**

---

## Testing Checklist

### Before Committing

- [ ] No console warnings for form fields (was 6, now 0)
- [ ] All unit tests pass (`npm test`)
- [ ] Coverage meets targets (90%+ for modified files)
- [ ] TypeScript compiles without errors (`npm run type-check`)
- [ ] Production build succeeds (`npm run build`)
- [ ] Lighthouse accessibility score 95+ (was ~85)

### Manual QA

- [ ] All form inputs have visible or hidden labels
- [ ] Tab order is logical throughout the app
- [ ] Escape key closes all dropdowns
- [ ] Skip link works and is visible on focus
- [ ] No regressions in existing functionality
- [ ] Search, filters, pagination still work correctly

### Browser Compatibility

- [ ] Chrome (primary)
- [ ] Firefox
- [ ] Edge
- [ ] Safari (if available)

### Screen Reader Compatibility (Optional)

- [ ] Windows Narrator
- [ ] NVDA (if installed)
- [ ] JAWS (if available)

---

## Dependencies

None - All changes are isolated to frontend components

---

## Success Criteria

1. **Console warnings eliminated:**
   - Form field warnings: 6 → 0

2. **WCAG 2.1 Level AA compliance:**
   - All form inputs have accessible names (1.3.1, 4.1.2)
   - Keyboard navigation fully functional (2.1.1)
   - Focus indicators visible (2.4.7)
   - Skip links implemented (2.4.1)

3. **Test coverage:**
   - All modified components have 85%+ coverage
   - New accessibility features have unit tests

4. **User experience:**
   - Keyboard users can navigate efficiently
   - Screen reader users can understand all form fields
   - No functionality regressions

---

## Resources

- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [React Accessibility Docs](https://react.dev/reference/react-dom/components#form-components)
- [MDN: ARIA Labels](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Attributes/aria-label)
- [WebAIM: Skip Navigation Links](https://webaim.org/techniques/skipnav/)
- [Chrome DevTools Accessibility Reference](https://developer.chrome.com/docs/devtools/accessibility/reference/)
- [Testing Library: Accessibility Queries](https://testing-library.com/docs/queries/about#priority)

---

## Notes

- All changes maintain backward compatibility
- No breaking changes to existing APIs
- Changes follow project's TypeScript and React patterns
- All new code uses existing UI component library (Tailwind + HeadlessUI)
