# Frontend Inspection Findings

**Date:** January 2025  
**Inspector:** GitHub Copilot using Chrome DevTools MCP  
**Environment:** Local development (Vite v6.4.1 on port 3000)

---

## Summary

This document contains findings from a comprehensive frontend inspection of the OSRS Grand Exchange Tracker application. The inspection identified **critical bugs**, **broken components**, **accessibility issues**, **UX problems**, and **enhancement opportunities**.

### Quick Stats
- **Critical Issues:** 4
- **High Priority Issues:** 5
- **Medium Priority Issues:** 4
- **Enhancement Opportunities:** 8

---

## 🔴 Critical Issues

### 1. Settings Page Returns 404

**Location:** Header → Settings link (`/settings`)  
**File:** [frontend/src/components/layout/Header.tsx](frontend/src/components/layout/Header.tsx#L93-L97)

**Description:**  
The Settings link in the header navigates to `/settings`, but no route is defined for this path in the router configuration.

**Evidence:**
- Header contains: `<Link to="/settings">` with Settings icon
- Router only defines: `/`, `/items/:id`, `/items/:id/:slug`, and `*` (catch-all 404)
- Clicking Settings shows the 404 NotFoundPage

**Impact:** Users cannot access settings functionality; misleading UI element.

**Fix Location:** [frontend/src/App.tsx](frontend/src/App.tsx)

---

### 2. Header Search Button Does Not Work

**Location:** Header → Search button ("Search items... Ctrl K")  
**File:** [frontend/src/components/layout/Header.tsx](frontend/src/components/layout/Header.tsx#L57-L70)

**Description:**  
The search button in the header calls `setSearchModalOpen(true)` but no search modal component exists in the application. The state is set but nothing renders.

**Evidence:**
- Button onClick: `onClick={() => setSearchModalOpen(true)}`
- UIStore has `searchModalOpen` state but no modal component subscribes to it
- Ctrl+K keyboard shortcut also non-functional (no global keyboard listener)

**Impact:** Advertised keyboard shortcut (Ctrl+K) doesn't work; prominent search button is non-functional.

**Fix Required:** 
1. Create SearchModal component
2. Add global keyboard listener for Ctrl+K
3. Wire modal to UIStore's searchModalOpen state

---

### 3. API Status Link Returns Error

**Location:** Footer → Resources → "API Status"  
**File:** [frontend/src/components/layout/Footer.tsx](frontend/src/components/layout/Footer.tsx#L63-L67)

**Description:**  
The API Status link points to `/api/health` but the actual backend health endpoint is at `/health` (without `/api` prefix).

**Evidence:**
- Footer link: `href="/api/health"` 
- Actual backend endpoint: `GET /health` (verified working)
- Clicking link returns JSON error or fails to load

**Impact:** Users cannot check API health status; broken resource link.

**Fix:** Change href from `/api/health` to `http://localhost:8080/health` (or appropriate backend URL)

---

### 4. Notifications Button Non-Functional

**Location:** Header → Bell icon button  
**File:** [frontend/src/components/layout/Header.tsx](frontend/src/components/layout/Header.tsx#L82-L87)

**Description:**  
The notifications button has no onClick handler and displays a fake "unread" badge.

**Evidence:**
```tsx
<button
  className="..."
  aria-label="Notifications"
>
  <Bell className="w-5 h-5" />
  <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
</button>
```
- No onClick handler defined
- Red dot badge is hardcoded (not data-driven)

**Impact:** Misleading UI element suggesting notifications exist when feature isn't implemented.

**Fix Required:**
1. Either implement notifications system, or
2. Remove the button/badge until feature is ready

---

## 🟠 High Priority Issues

### 5. "Toggle columns" Button Mislabeled

**Location:** Dashboard → Table Toolbar → "Toggle columns" button  
**File:** [frontend/src/pages/DashboardPage.tsx](frontend/src/pages/DashboardPage.tsx)

**Description:**  
The button labeled "Toggle columns" actually opens the FilterPanel (membership, price range, volume filters) instead of toggling column visibility.

**Evidence:**
- Button has Columns icon and "Toggle columns" tooltip
- Clicking opens FilterPanel with Membership radios, Price Range inputs
- Expected: Column visibility checkboxes

**Impact:** Confusing UX - users expect to hide/show columns but get filters instead.

**Fix:** 
1. Rename button to "Filters" or add proper column visibility toggle, or
2. Implement actual column visibility toggle and separate filters button

---

### 6. React Router v7 Deprecation Warnings

**Location:** Console  
**File:** [frontend/src/App.tsx](frontend/src/App.tsx)

**Description:**  
Two React Router warnings appear in console about upcoming v7 changes.

**Console Messages:**
```
⚠️ React Router Future Flag Warning: React Router will begin wrapping state updates in `React.startTransition` in v7. You can use the `v7_startTransition` future flag to opt-in early.

⚠️ React Router Future Flag Warning: Relative route resolution within Splat routes is changing in v7. You can use the `v7_relativeSplatPath` future flag to opt-in early.
```

**Impact:** Application will break or behave unexpectedly when upgrading to React Router v7.

**Fix:** Add future flags to BrowserRouter:
```tsx
<BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
```

---

### 7. Form Field Accessibility Warnings

**Location:** Console (multiple occurrences)  
**Count:** 6 warnings

**Description:**  
Form field elements (inputs, selects) are missing id or name attributes.

**Console Message:**
```
A form field element should have an id or name attribute (count: 6)
```

**Affected Elements (likely):**
- Table search input
- Filters panel inputs (price min/max, volume)
- Page size select
- Export dropdown

**Impact:** 
- Screen readers cannot properly announce form fields
- Labels may not be properly associated
- Form submission/validation issues

**Fix:** Add unique id/name attributes to all form inputs.

---

### 8. Table Search Not Working in Real-Time

**Location:** Dashboard → Table Toolbar → Search input

**Description:**  
Typing in the inline table search does not filter items in real-time. After typing "dragon", the table still shows "3rd age amulet" as the first item.

**Evidence:**
- Typed "dragon" in search field
- Table still displays items starting with "3rd age amulet"
- No visible filtering occurred

**Root Cause Analysis:**
- Search has 300ms debounce (expected)
- But filtering appears to be server-side only via API call
- API might not be receiving search parameter correctly

**Impact:** Users cannot quickly filter items by name; poor search UX.

---

### 9. GitHub Link Incomplete

**Location:** Footer → Project → "View on GitHub"  
**File:** [frontend/src/components/layout/Footer.tsx](frontend/src/components/layout/Footer.tsx#L83-L90)

**Description:**  
The GitHub link points to `https://github.com` instead of the actual repository URL.

**Evidence:**
```tsx
<a href="https://github.com" target="_blank" ...>
  View on GitHub
</a>
```

**Impact:** Users cannot find the actual project repository.

**Fix:** Update to correct repository URL.

---

## 🟡 Medium Priority Issues

### 10. No Keyboard Shortcut Implementation

**Location:** Global app level

**Description:**  
The UI advertises a "Ctrl+K" keyboard shortcut for search, but no global keyboard listener exists.

**Evidence:**
- Header shows `Ctrl K` badge next to search button
- Pressing Ctrl+K does nothing

**Fix Required:** Add useEffect with keyboard event listener in App or MainLayout.

---

### 11. Clear Search Button Missing Accessible Name

**Location:** Dashboard → Table Toolbar → Search clear button  

**Description:**  
The clear (X) button inside the search input has no accessible name/label.

**Evidence:**
- Button appears when search has value
- Snapshot shows: `uid=15_14 button` (no label)

**Impact:** Screen reader users cannot identify the button's purpose.

**Fix:** Add `aria-label="Clear search"` to the button.

---

### 12. Export Dropdown Doesn't Close on Escape

**Location:** Dashboard → Export button dropdown

**Description:**  
After opening the Export dropdown, pressing Escape key doesn't close it.

**Evidence:**
- Clicked Export button, dropdown appeared
- Pressed Escape key
- Dropdown remained visible in next snapshot

**Impact:** Poor keyboard navigation UX.

**Fix:** Add keydown listener for Escape in dropdown component.

---

### 13. Health Endpoint Documentation Mismatch

**Location:** Documentation vs Implementation

**Description:**  
The copilot-instructions.md documents `/api/v1/health` as the health endpoint, but the actual endpoint is `/health`.

**Evidence:**
- Documentation: `GET /health - Health check`
- Actual working endpoint: `http://localhost:8080/health`

**Impact:** Developer confusion; incorrect API integration attempts.

---

## 🟢 Enhancement Opportunities

### E1. Add Settings Page

**Description:**  
Implement a Settings page with user preferences:
- Theme toggle (dark/light mode)
- Default page size
- Default currency display
- Notification preferences
- Data refresh interval

**Benefit:** Completes the existing UI promise; better user customization.

---

### E2. Implement Notifications System

**Description:**  
Add real-time price alerts and notifications:
- Price drop/rise alerts for watched items
- New item additions
- API status changes
- System announcements

**Benefit:** Key feature for traders; increases user engagement.

---

### E3. Add Search Modal with Recent/Popular Items

**Description:**  
Create a command-palette style search modal (like VS Code's Ctrl+P):
- Full-screen modal
- Recent searches
- Popular items
- Category filters
- Instant results as you type

**Benefit:** Better search UX; modern application feel.

---

### E4. Implement Favorites/Watchlist Feature

**Description:**  
The stores include a `useFavoritesStore` that could power:
- Star/favorite items
- Watchlist sidebar
- Quick access to tracked items
- Price change notifications for favorites

**Benefit:** Core feature for traders tracking specific items.

---

### E5. Add Column Visibility Toggle

**Description:**  
Implement actual column visibility controls:
- Checkbox list of available columns
- Remember preferences in local storage
- Quick toggle for mobile view

**Benefit:** Better table customization for different screen sizes.

---

### E6. Add Price Change Indicators

**Description:**  
Enhance item rows with price movement indicators:
- Green/red arrows for price direction
- Percentage change since last update
- Mini sparkline charts in table rows

**Benefit:** Traders can quickly spot opportunities.

---

### E7. Add Mobile-Responsive Improvements

**Description:**  
The mobile menu toggle exists but the mobile navigation isn't visible:
- Implement mobile navigation drawer
- Optimize table for mobile viewing
- Add swipe gestures for pagination

**Benefit:** Better mobile user experience.

---

### E8. Add Loading States & Error Boundaries

**Description:**  
Improve loading and error handling:
- Skeleton loaders for table
- Error boundary components
- Retry buttons on failures
- Toast notifications for background errors

**Benefit:** Better perceived performance and error recovery.

---

## Console Messages Summary

| Type | Count | Message |
|------|-------|---------|
| warn | 2 | React Router v7 future flag warnings |
| issue | 6 | Form field missing id/name attribute |
| log | Multiple | API request/response logging (expected) |

---

## Working Components ✅

The following components are functioning correctly:

1. **Dashboard Page** - Loads and displays 4,501 items
2. **Items Table** - Virtual scrolling, pagination working
3. **Item Detail Page** - Price chart and metadata display
4. **Pagination Controls** - Page size selector, next/previous/first/last
5. **Export Functionality** - CSV and JSON export options work
6. **External Links** - OSRS Wiki and Official GE Database links work
7. **Item Navigation** - Clicking items navigates to detail page
8. **Filters Panel** - Opens and shows filter options
9. **Refresh Button** - Triggers data refresh
10. **Real-time Price Updates** - Prices update via API polling

---

## Recommendations Priority Order

### Immediate (Before Launch)
1. Fix Settings page 404 (add route or remove link)
2. Fix API Status link URL
3. Fix/remove non-functional search button
4. Fix/remove non-functional notifications button
5. Fix "Toggle columns" mislabeling

### Short-term (Next Sprint)
1. Add React Router v7 future flags
2. Fix form field accessibility warnings
3. Implement Ctrl+K keyboard shortcut
4. Fix table search filtering
5. Update GitHub repository link

### Medium-term (Backlog)
1. Implement Settings page
2. Add Search modal
3. Implement Notifications system
4. Add Column visibility toggle
5. Add price change indicators

---

## Testing Notes

- **Browser:** Chrome (via Chrome DevTools MCP)
- **Backend:** Running on port 8080 (Docker)
- **Frontend:** Running on port 3000 (Vite dev server)
- **Data:** 4,501 items loaded successfully
- **API Calls:** Items and prices endpoints responding correctly

---

*Document generated during frontend inspection. Do not implement changes without user approval.*
