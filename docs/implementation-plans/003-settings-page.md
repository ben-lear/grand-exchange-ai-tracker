# 003: Settings Page

**Priority:** Critical  
**Effort:** M (4-8 hours)  
**Status:** Not Started  
**Related Issues:** FRONTEND_INSPECTION_FINDINGS.md #1 (Settings Page Returns 404)

## Overview

Create a Settings page to fulfill the existing header link and provide user customization options. This fixes a critical bug where the header Settings link returns a 404 error.

---

## Phase 1: Store & Types Setup

### 3.1 Create/Update Preferences Store
**File:** `frontend/src/stores/usePreferencesStore.ts`

**Actions:**
1. Check if store exists, if not create it
2. Define TypeScript interfaces:
   ```typescript
   interface PreferencesState {
     // Appearance
     theme: 'light' | 'dark' | 'system';
     
     // Table preferences
     defaultPageSize: 50 | 100 | 200 | 500;
     
     // Data preferences
     autoRefreshInterval: number; // seconds (0 = disabled)
     
     // Actions
     setTheme: (theme: PreferencesState['theme']) => void;
     setDefaultPageSize: (size: PreferencesState['defaultPageSize']) => void;
     setAutoRefreshInterval: (interval: number) => void;
     resetToDefaults: () => void;
   }
   ```
3. Implement Zustand store with localStorage persistence
4. Set defaults:
   - theme: 'system'
   - defaultPageSize: 100
   - autoRefreshInterval: 60

**Acceptance Criteria:**
- [ ] Store persists to localStorage
- [ ] Store loads from localStorage on mount
- [ ] resetToDefaults() restores initial values
- [ ] TypeScript types are exported

---

## Phase 2: Settings Page Component

### 3.2 Create SettingsPage Component
**File:** `frontend/src/pages/SettingsPage.tsx`

**Structure:**
```tsx
// Main container with back button and title
<div className="container mx-auto px-4 py-8">
  <header>
    <Link to="/" /> {/* Back to Dashboard */}
    <h1>Settings</h1>
  </header>
  
  <div className="max-w-4xl mx-auto space-y-6">
    {/* Appearance Section */}
    <SettingCard title="Appearance">
      <ThemeToggle />
    </SettingCard>
    
    {/* Table Preferences Section */}
    <SettingCard title="Table Preferences">
      <PageSizeSelector />
    </SettingCard>
    
    {/* Data Preferences Section */}
    <SettingCard title="Data Preferences">
      <RefreshIntervalSelector />
    </SettingCard>
    
    {/* Actions */}
    <ResetButton />
  </div>
</div>
```

**Actions:**
1. Create main SettingsPage component
2. Add responsive layout with max-width constraint
3. Add back navigation button (← Dashboard)
4. Add page title "Settings"
5. Create three setting sections as cards
6. Add "Reset to Defaults" button at bottom

**Acceptance Criteria:**
- [ ] Page renders without errors
- [ ] Back button navigates to `/`
- [ ] Layout is responsive (mobile, tablet, desktop)
- [ ] All sections visible and accessible

### 3.3 Create SettingCard Component
**File:** `frontend/src/components/settings/SettingCard.tsx`

**Props:**
```typescript
interface SettingCardProps {
  title: string;
  description?: string;
  children: React.ReactNode;
}
```

**Actions:**
1. Create reusable card component with:
   - Title (h2)
   - Optional description
   - Children slot for content
   - TailwindCSS styling (border, shadow, padding)

**Acceptance Criteria:**
- [ ] Card displays title and description
- [ ] Children render correctly
- [ ] Consistent spacing and styling

### 3.4 Create ThemeToggle Component
**File:** `frontend/src/components/settings/ThemeToggle.tsx`

**Actions:**
1. Create radio group with three options:
   - Light
   - Dark
   - System (follow OS preference)
2. Connect to `usePreferencesStore.theme`
3. Add icons for each theme option
4. Implement theme application (add class to `<html>` element)
5. Detect system preference with `window.matchMedia('(prefers-color-scheme: dark)')`

**Acceptance Criteria:**
- [ ] Current theme is pre-selected
- [ ] Clicking option updates store
- [ ] Theme changes apply immediately to page
- [ ] System theme follows OS preference

### 3.5 Create PageSizeSelector Component
**File:** `frontend/src/components/settings/PageSizeSelector.tsx`

**Actions:**
1. Create select dropdown with options: 50, 100, 200, 500
2. Connect to `usePreferencesStore.defaultPageSize`
3. Add label and description: "Default number of items per page"
4. Show current selection

**Acceptance Criteria:**
- [ ] Current page size is pre-selected
- [ ] Changing selection updates store
- [ ] Value persists after page refresh

### 3.6 Create RefreshIntervalSelector Component
**File:** `frontend/src/components/settings/RefreshIntervalSelector.tsx`

**Actions:**
1. Create select dropdown with options:
   - 0 (Disabled)
   - 30 seconds
   - 60 seconds (default)
   - 120 seconds
   - 300 seconds
2. Connect to `usePreferencesStore.autoRefreshInterval`
3. Add label and description: "Auto-refresh data interval"
4. Show "Disabled" for 0 value

**Acceptance Criteria:**
- [ ] Current interval is pre-selected
- [ ] Changing selection updates store
- [ ] Value persists after page refresh
- [ ] 0 value displays as "Disabled"

### 3.7 Add Reset to Defaults Button
**File:** `frontend/src/components/settings/ResetButton.tsx` (or inline in SettingsPage)

**Actions:**
1. Create button with confirmation dialog
2. On confirm, call `usePreferencesStore.resetToDefaults()`
3. Show toast notification: "Settings reset to defaults"
4. Style as secondary/warning button

**Acceptance Criteria:**
- [ ] Button triggers confirmation dialog
- [ ] Confirming resets all settings
- [ ] Toast notification appears
- [ ] Canceling does nothing

---

## Phase 3: Routing & Integration

### 3.8 Add Settings Route
**File:** `frontend/src/App.tsx`

**Actions:**
1. Import SettingsPage component
2. Add route between dashboard and item detail routes:
   ```tsx
   <Route path="/settings" element={<SettingsPage />} />
   ```
3. Ensure route is before catch-all 404 route

**Acceptance Criteria:**
- [ ] `/settings` path navigates to SettingsPage
- [ ] Route doesn't conflict with existing routes
- [ ] 404 page still works for invalid URLs

### 3.9 Export SettingsPage
**File:** `frontend/src/pages/index.ts`

**Actions:**
1. Add export: `export { default as SettingsPage } from './SettingsPage';`

**Acceptance Criteria:**
- [ ] SettingsPage can be imported from `pages/` directory

### 3.10 Update Header Settings Link
**File:** `frontend/src/components/layout/Header.tsx`

**Actions:**
1. Verify Settings link correctly points to `/settings`
2. Ensure link uses React Router `<Link>` component (not `<a>`)
3. Link should already be correct, just verify

**Acceptance Criteria:**
- [ ] Clicking Settings in header navigates to SettingsPage
- [ ] No page reload occurs (SPA navigation)

---

## Phase 4: Apply Preferences Throughout App

### 3.11 Apply Theme Preference
**File:** `frontend/src/App.tsx` or `frontend/src/main.tsx`

**Actions:**
1. Add useEffect to read theme from store on mount
2. Apply theme class to `<html>` element:
   ```typescript
   const theme = usePreferencesStore(state => state.theme);
   
   useEffect(() => {
     const applyTheme = (theme: string) => {
       if (theme === 'system') {
         const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
         document.documentElement.classList.toggle('dark', prefersDark);
       } else {
         document.documentElement.classList.toggle('dark', theme === 'dark');
       }
     };
     
     applyTheme(theme);
   }, [theme]);
   ```
3. Listen for system preference changes

**Acceptance Criteria:**
- [ ] Theme applies on app load
- [ ] Theme updates when changed in settings
- [ ] System theme follows OS preference changes

### 3.12 Apply Default Page Size
**File:** `frontend/src/pages/DashboardPage.tsx`

**Actions:**
1. Read `defaultPageSize` from store
2. Set as initial value for pagination state
3. User can still change page size temporarily per session

**Acceptance Criteria:**
- [ ] New sessions start with user's preferred page size
- [ ] Changing page size in dashboard works as before
- [ ] Preference only sets initial value

### 3.13 Apply Auto-Refresh Interval
**File:** `frontend/src/hooks/useItems.ts` or `frontend/src/pages/DashboardPage.tsx`

**Actions:**
1. Read `autoRefreshInterval` from store
2. Update TanStack Query `refetchInterval` based on preference:
   ```typescript
   const interval = usePreferencesStore(state => state.autoRefreshInterval);
   
   const { data } = useQuery({
     queryKey: ['items'],
     queryFn: fetchItems,
     refetchInterval: interval > 0 ? interval * 1000 : false,
   });
   ```

**Acceptance Criteria:**
- [ ] Data refreshes at user's preferred interval
- [ ] Interval of 0 disables auto-refresh
- [ ] Changing interval in settings updates refresh behavior

---

## Phase 5: Testing

### 3.14 Unit Tests - Preferences Store
**File:** `frontend/src/stores/__tests__/usePreferencesStore.test.ts`

**Test Cases:**
```typescript
describe('usePreferencesStore', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('initializes with default values', () => { ... });
  
  it('persists theme to localStorage', () => { ... });
  
  it('persists defaultPageSize to localStorage', () => { ... });
  
  it('persists autoRefreshInterval to localStorage', () => { ... });
  
  it('loads persisted values on mount', () => { ... });
  
  it('resets to defaults', () => { ... });
  
  it('updates individual settings independently', () => { ... });
});
```

**Acceptance Criteria:**
- [ ] All 7 test cases pass
- [ ] Coverage > 90% for store file

### 3.15 Unit Tests - Settings Components
**File:** `frontend/src/components/settings/__tests__/SettingCard.test.tsx`

**Test Cases:**
```typescript
describe('SettingCard', () => {
  it('renders title and description', () => { ... });
  it('renders children', () => { ... });
});
```

**File:** `frontend/src/components/settings/__tests__/ThemeToggle.test.tsx`

**Test Cases:**
```typescript
describe('ThemeToggle', () => {
  it('displays current theme selection', () => { ... });
  it('updates store when theme is changed', () => { ... });
  it('applies theme to document', () => { ... });
});
```

**File:** `frontend/src/components/settings/__tests__/PageSizeSelector.test.tsx`

**Test Cases:**
```typescript
describe('PageSizeSelector', () => {
  it('displays current page size', () => { ... });
  it('updates store when size is changed', () => { ... });
});
```

**File:** `frontend/src/components/settings/__tests__/RefreshIntervalSelector.test.tsx`

**Test Cases:**
```typescript
describe('RefreshIntervalSelector', () => {
  it('displays current interval', () => { ... });
  it('shows "Disabled" for 0 value', () => { ... });
  it('updates store when interval is changed', () => { ... });
});
```

**Acceptance Criteria:**
- [ ] All component tests pass
- [ ] Components are rendered with @testing-library/react
- [ ] User interactions are tested with fireEvent or userEvent

### 3.16 Unit Tests - SettingsPage
**File:** `frontend/src/pages/__tests__/SettingsPage.test.tsx`

**Test Cases:**
```typescript
describe('SettingsPage', () => {
  it('renders all setting sections', () => { ... });
  
  it('renders back to dashboard link', () => { ... });
  
  it('renders reset to defaults button', () => { ... });
  
  it('shows confirmation dialog on reset', () => { ... });
  
  it('resets settings when confirmed', () => { ... });
});
```

**Acceptance Criteria:**
- [ ] All 5 test cases pass
- [ ] React Router navigation is mocked

### 3.17 Integration Test - Settings Persistence
**File:** `frontend/src/test/integration/settings-persistence.test.tsx`

**Test Flow:**
1. Navigate to /settings
2. Change theme to 'dark'
3. Change page size to 200
4. Change refresh interval to 30
5. Navigate away
6. Navigate back to /settings
7. Verify all settings persisted

**Acceptance Criteria:**
- [ ] Test passes
- [ ] localStorage persistence verified

### 3.18 Run All Tests
**Command:** `npm run test`

**Actions:**
1. Run all unit tests
2. Verify coverage report
3. Fix any failing tests
4. Ensure coverage > 80% for new files

**Acceptance Criteria:**
- [ ] All tests pass
- [ ] No test warnings
- [ ] Coverage thresholds met

---

## Phase 6: Build & Local Testing

### 3.19 Type Check
**Command:** `npm run type-check` (or `npx tsc --noEmit`)

**Actions:**
1. Run TypeScript compiler in check mode
2. Fix any type errors
3. Ensure strict mode compliance

**Acceptance Criteria:**
- [ ] No TypeScript errors
- [ ] No type warnings

### 3.20 Lint Check
**Command:** `npm run lint`

**Actions:**
1. Run ESLint
2. Fix any linting errors
3. Apply auto-fixes where possible

**Acceptance Criteria:**
- [ ] No ESLint errors
- [ ] Code follows project style guide

### 3.21 Build for Production
**Command:** `npm run build`

**Actions:**
1. Run Vite production build
2. Verify build completes without errors
3. Check bundle size (should not increase significantly)

**Acceptance Criteria:**
- [ ] Build succeeds
- [ ] No build warnings
- [ ] Bundle size is reasonable

### 3.22 Run Development Server
**Commands:**
```powershell
# Terminal 1: Start backend services
docker-compose up -d postgres redis backend

# Terminal 2: Start frontend dev server
cd frontend
npm run dev
```

**Actions:**
1. Ensure backend is running on port 8080
2. Ensure frontend is running on port 3000
3. Verify health check: http://localhost:8080/health
4. Open browser to http://localhost:3000

**Acceptance Criteria:**
- [ ] Backend services start successfully
- [ ] Frontend dev server starts successfully
- [ ] Application loads without errors

---

## Phase 7: Manual Testing with Chrome DevTools

### 3.23 Functional Testing Checklist

**Navigation:**
- [ ] Click Settings link in header → navigates to /settings
- [ ] Back button on Settings page → returns to dashboard
- [ ] Direct URL http://localhost:3000/settings → loads correctly

**Theme Toggle:**
- [ ] Initial theme displays correctly
- [ ] Click "Light" → page background becomes light
- [ ] Click "Dark" → page background becomes dark
- [ ] Click "System" → matches OS theme
- [ ] Refresh page → theme persists
- [ ] Open DevTools → Check `<html class="dark">` (or no class for light)

**Page Size Selector:**
- [ ] Current default is pre-selected
- [ ] Change to 200 → saves immediately
- [ ] Navigate to dashboard → pagination shows 200 items
- [ ] Return to settings → 200 still selected

**Refresh Interval Selector:**
- [ ] Current interval is pre-selected
- [ ] Change to 30 seconds → saves immediately
- [ ] Open DevTools Network tab
- [ ] Observe API calls every 30 seconds
- [ ] Change to Disabled (0) → API calls stop
- [ ] Return to settings → Disabled still selected

**Reset to Defaults:**
- [ ] Change all settings to non-default values
- [ ] Click "Reset to Defaults" → confirmation dialog appears
- [ ] Cancel → nothing changes
- [ ] Click "Reset to Defaults" again → confirm
- [ ] All settings return to defaults
- [ ] Toast notification appears

### 3.24 DevTools Console Checks

**Console Tab:**
- [ ] No React errors
- [ ] No unhandled promise rejections
- [ ] No 404 requests for /settings
- [ ] No accessibility warnings (form fields should have id/name)

**Network Tab:**
- [ ] Settings page doesn't make unnecessary API calls
- [ ] Only expected API calls (if any) occur
- [ ] Auto-refresh interval works as configured

**Application Tab → Local Storage:**
- [ ] Check key: `preferences-storage` (or similar)
- [ ] Verify JSON contains:
  ```json
  {
    "state": {
      "theme": "dark",
      "defaultPageSize": 200,
      "autoRefreshInterval": 30
    },
    "version": 0
  }
  ```
- [ ] Manually edit localStorage → reload → settings update

**Lighthouse Audit:**
- [ ] Run Lighthouse on /settings page
- [ ] Performance > 90
- [ ] Accessibility > 95
- [ ] Best Practices > 90

### 3.25 Accessibility Testing

**Keyboard Navigation:**
- [ ] Tab through all form controls
- [ ] Space/Enter activates buttons and radios
- [ ] Escape closes confirmation dialog
- [ ] Focus visible on all interactive elements

**Screen Reader (optional):**
- [ ] All form labels are announced
- [ ] Radio groups have proper names
- [ ] Button purposes are clear

**ARIA Attributes:**
- [ ] Radio groups have `role="radiogroup"`
- [ ] Select elements have associated labels
- [ ] Buttons have descriptive aria-labels (if text isn't sufficient)

### 3.26 Responsive Design Testing

**Mobile (375px):**
- [ ] Settings page is scrollable
- [ ] All sections are readable
- [ ] Buttons are tappable (min 44x44px)
- [ ] No horizontal scroll

**Tablet (768px):**
- [ ] Layout uses available space
- [ ] Cards are not too wide

**Desktop (1920px):**
- [ ] Max-width constraint prevents overly wide cards
- [ ] Content is centered

**DevTools Device Emulation:**
- [ ] Test iPhone 12 Pro
- [ ] Test iPad Pro
- [ ] Test Samsung Galaxy S20

### 3.27 Browser Compatibility Testing

**Chrome (Primary):**
- [ ] All features work

**Firefox:**
- [ ] Theme toggle works
- [ ] LocalStorage persists
- [ ] Styling consistent

**Safari (if available):**
- [ ] No webkit-specific issues

**Edge:**
- [ ] Chromium-based, should match Chrome

---

## Phase 8: Documentation & Completion

### 3.28 Update FRONTEND_INSPECTION_FINDINGS.md
**File:** `FRONTEND_INSPECTION_FINDINGS.md`

**Actions:**
1. Mark issue #1 "Settings Page Returns 404" as **RESOLVED**
2. Add note with PR/commit reference
3. Update Quick Stats (reduce Critical Issues count)

### 3.29 Update Implementation Plan Status
**File:** `docs/implementation-plans/003-settings-page.md`

**Actions:**
1. Change status to **Completed**
2. Add completion date
3. Link to related commits/PRs

### 3.30 Add User Documentation (Optional)
**File:** `frontend/README.md` or create `docs/user-guide/settings.md`

**Actions:**
1. Document available settings
2. Explain what each setting does
3. Note where preferences are stored (localStorage)

---

## Files Created/Modified Summary

### New Files (9)
- `frontend/src/stores/usePreferencesStore.ts`
- `frontend/src/pages/SettingsPage.tsx`
- `frontend/src/components/settings/SettingCard.tsx`
- `frontend/src/components/settings/ThemeToggle.tsx`
- `frontend/src/components/settings/PageSizeSelector.tsx`
- `frontend/src/components/settings/RefreshIntervalSelector.tsx`
- `frontend/src/components/settings/ResetButton.tsx` (or inline)
- `frontend/src/stores/__tests__/usePreferencesStore.test.ts`
- `frontend/src/components/settings/__tests__/` (multiple test files)

### Modified Files (5)
- `frontend/src/App.tsx` (add route)
- `frontend/src/pages/index.ts` (export SettingsPage)
- `frontend/src/pages/DashboardPage.tsx` (apply defaultPageSize)
- `frontend/src/hooks/useItems.ts` (apply autoRefreshInterval)
- `FRONTEND_INSPECTION_FINDINGS.md` (mark resolved)

---

## Dependencies

**Required:**
- Zustand (already installed)
- React Router (already installed)
- TailwindCSS (already installed)
- Sonner (toast notifications, already installed)

**No new dependencies required**

---

## Design References

**Inspiration:**
- GitHub Settings page (simple card-based layout)
- VS Code Settings UI (grouped sections)
- Vercel Dashboard Settings

**Color Scheme:**
- Use existing TailwindCSS theme
- Card background: `bg-white dark:bg-gray-800`
- Border: `border border-gray-200 dark:border-gray-700`

---

## Risk Mitigation

**Risks:**
1. **Theme toggle breaks existing dark mode** → Test thoroughly with DevTools
2. **LocalStorage quota exceeded** → Settings data is tiny (<1KB)
3. **Auto-refresh interval conflicts with manual refresh** → Ensure both work independently

---

## Rollback Plan

If issues arise after deployment:
1. Revert route addition in App.tsx (removes /settings page)
2. Keep store changes (they don't break anything if unused)
3. Header link will 404 again, but app remains functional

---

## Success Criteria

**Must Have:**
- [ ] Settings page loads without errors
- [ ] All 3 setting types (theme, page size, interval) work
- [ ] Settings persist across page refreshes
- [ ] Settings apply to relevant parts of the app
- [ ] All tests pass
- [ ] No console errors
- [ ] Lighthouse accessibility score > 95

**Nice to Have:**
- [ ] Smooth transitions when theme changes
- [ ] Settings export/import functionality (future)
- [ ] Settings sync across devices (future)
