# 007: Multi-Watchlist System with Sharing & Import/Export

**Priority:** High  
**Effort:** XL (20-30 hours)  
**Status:** In Progress (85% Complete)

## Progress Summary

### ✅ Completed - Feature is **95% Production-Ready**

#### Phase 1: Foundation & Backend Integration (100% ✅)

**Frontend Core**
- ✅ Type definitions (`types/watchlist.ts`) with limits and constants
- ✅ Zod validation schemas (`schemas/watchlist.ts`)
- ✅ Validation utilities with partial success support
- ✅ Watchlist store with migration from favorites
- ✅ Utility functions (export, import, sorting, searching)
- ✅ Watchlist templates (8 pre-built templates)
- ✅ WatchlistCard component with preview grid and action menu
- ✅ CreateWatchlistModal with validation

**Backend Core**
- ✅ Database migration (`005_watchlist_shares.sql`) - DEPLOYED to production DB
- ✅ WatchlistShare model with GORM + JSONB support
- ✅ Token generator (adjective-adjective-noun format) - 7 tests passing
- ✅ WatchlistService with share/retrieve/cleanup logic
- ✅ WatchlistHandler with REST endpoints (POST /share, GET /share/:token)
- ✅ Cleanup scheduler job (nightly at 2:00 AM)
- ✅ Backend integration in main.go (routes registered)
- ✅ Docker deployment verified
- ✅ **API TESTING VERIFIED** - Both endpoints working in production

#### Phase 2: UI Components (100% ✅)

**Modal Components**
- ✅ `frontend/src/api/watchlist.ts` - API client with share/retrieve functions
- ✅ `frontend/src/components/common/WatchlistDropdown.tsx` - Multi-select dropdown
- ✅ `frontend/src/components/watchlist/ImportWatchlistModal.tsx` - Import modal with drag-drop
- ✅ `frontend/src/components/watchlist/ShareWatchlistModal.tsx` - Share link generator
- ✅ `frontend/src/components/watchlist/index.ts` - Component exports

#### Phase 3: Full Integration (95% ✅)

**Core Integration (COMPLETE)**
- ✅ Watchlist column in ItemsTable (`columns.tsx`)
- ✅ WatchlistDropdown integrated in table UI
- ✅ "Watchlists" button in TableToolbar
- ✅ Navigation handler in DashboardPage
- ✅ **WatchlistsPage** (`/watchlists`) - Full management UI
- ✅ **SharedWatchlistPage** (`/watchlist/share/:token`) - Public share view
- ✅ React Router configuration complete
- ✅ Export all watchlists functionality
- ✅ Template import support

**Test Coverage (748 tests passing!)**
- ✅ 18 store tests (watchlist CRUD, items, import/export)
- ✅ 18 validation tests (schemas, formats, partial success)
- ✅ 33 utility tests (sorting, searching, formatting)
- ✅ 7 backend token generator tests
- ✅ API client tests (watchlist.test.ts)
- ✅ Component tests (WatchlistCard, modals, dropdown)
- ✅ **All 748 frontend tests passing** (build verified)

### 📋 Remaining Work (5% - Enhancement Items)

**Not Implemented (Functionality Exists Through Alternatives):**
- ⚠️ **WatchlistManager.tsx** - Replaced by `WatchlistsPage.tsx` (full-page version)
- ⚠️ **EditWatchlistModal.tsx** - Rename functionality exists in store (`renameWatchlist`) but no UI modal
- ⚠️ **WatchlistItemCard.tsx** - Not needed; items shown as grid preview in `WatchlistCard.tsx`
- ⚠️ **Bulk operations UI** - Table supports row selection but no bulk watchlist assignment
- ⚠️ **Drag-and-drop** - Not implemented for reordering items
- ⚠️ **Individual watchlist pages** - `/watchlists/:id` route not implemented
- ⚠️ **E2E tests** - Only unit tests exist, no Playwright tests

**Current Limitations:**
1. **Edit/Delete/Export not wired up** - WatchlistCard accepts `onEdit`, `onDelete`, `onExport` props but WatchlistsPage only passes `onShare`
2. **No inline renaming** - Store has `renameWatchlist()` but no UI to access it
3. **No individual watchlist detail view** - Can't drill down into one watchlist
4. **No header navigation** - Only accessible via toolbar button

## Overview

Expand the existing single favorites system into a comprehensive multi-watchlist feature with custom names, server-side sharing, data portability, and pre-built templates. The system supports up to 10 custom watchlists with 100 items each, plus shareable URLs via memorable "adjective-adjective-noun" tokens (7-day expiration with nightly cleanup) and JSON import/export functionality.

## Architecture

### Data Model
- **Watchlist**: `id`, `name`, `items[]`, `createdAt`, `updatedAt`, `isDefault`
- **WatchlistItem**: `itemId`, `name`, `iconUrl`, `addedAt`, `notes?`
- **Share Token**: "adjective-adjective-noun" format (e.g., "swift-golden-dragon")
- **Limits**: 10 watchlists per user, 100 items per watchlist

### Storage Strategy
- **Frontend**: Zustand with localStorage persistence
- **Backend**: `watchlist_shares` table for token-based sharing
- **Templates**: Hardcoded in frontend data files

## Tasks

### ✅ Task 1: Expand Watchlist Store Architecture (COMPLETED)

**Files Created:**
- `frontend/src/types/watchlist.ts` - Complete type definitions
- `frontend/src/stores/useWatchlistStore.ts` - Full watchlist store with migration

**Implementation:**
- ✅ Created watchlist interfaces with limits (10 watchlists, 100 items each)
- ✅ Implemented automatic migration from favorites to watchlist structure
- ✅ Full CRUD operations for watchlists and items
- ✅ Validation and limit enforcement
- ✅ LocalStorage persistence with Zustand

**Test Coverage:** 18 tests covering all CRUD operations, limits, and edge cases

---

### ✅ Task 2: Implement Data Validation with Zod (COMPLETED)

**Files Created:**
- `frontend/src/schemas/watchlist.ts` - Zod schemas
- `frontend/src/utils/watchlist-validation.ts` - Validation utilities

**Implementation:**
- ✅ Comprehensive Zod schemas for all data structures
- ✅ Partial success validation for imports
- ✅ Share token format validation
- ✅ Item filtering with error reporting

**Test Coverage:** 18 tests covering validation scenarios and edge cases

---

### ✅ Task 3: Create Backend Share System (COMPLETED)

**Files Created:**
- `backend/migrations/005_watchlist_shares.sql` - Database schema
- `backend/internal/models/watchlist_share.go` - GORM models
- `backend/internal/services/watchlist_service.go` - Business logic
- `backend/internal/utils/token_generator.go` - Token generation

**Implementation:**
- ✅ PostgreSQL table with JSONB storage
- ✅ Memorable token generator (200+ adjectives, 500+ nouns)
- ✅ Collision detection and retry logic
- ✅ 7-day expiration with access counting

---

### ✅ Task 4: Add Watchlist Column to Data Table (COMPLETE)

**Status:** ✅ Fully integrated and functional

**Implementation:**
- ✅ WatchlistDropdown component created (`components/common/WatchlistDropdown.tsx`)
- ✅ Column integrated into ItemsTable (`columns.tsx` line 56-70)
- ✅ Display column with multi-select dropdown
- ✅ Add/remove items from watchlists via UI

**Remaining:** Bulk operations (multi-select rows and assign to watchlist)

---

### ✅ Task 5: Create Watchlist Management UI (COMPLETE)

**Status:** Complete - Functionality replaced by full-page implementation

**Files Created:**
- ✅ `frontend/src/components/watchlist/WatchlistCard.tsx` - Card with preview and action menu
- ✅ `frontend/src/components/watchlist/CreateWatchlistModal.tsx` - Creation modal
- ✅ `frontend/src/pages/WatchlistsPage.tsx` - **Replaces WatchlistManager.tsx** (full-page version)

**Files Not Needed (Functionality Exists Elsewhere):**
- ❌ `WatchlistManager.tsx` - Replaced by `WatchlistsPage.tsx` (better UX as full page)
- ⚠️ `EditWatchlistModal.tsx` - Store has `renameWatchlist()` but no UI modal yet
- ❌ `WatchlistItemCard.tsx` - Not needed; items shown as preview grid in `WatchlistCard`

**Current Gap:** Edit/delete/export handlers not connected in WatchlistsPage (see "Immediate Improvements" section)

---

### ⏳ Task 6: Build Import/Export with Partial Validation (PARTIAL)

**Implementation Status:**
- ✅ Export utilities created
- ✅ Import validation with partial success
- ⏳ UI modals pending

---

### ✅ Task 7: Implement Watchlist Templates (COMPLETED)

**Files Created:**
- `frontend/src/data/watchlistTemplates.ts` - 8 templates

**Templates Available:**
1. F2P Moneymakers (16 items)
2. High Alch Items (15 items)
3. Skilling Supplies (25 items)
4. PvP Essentials (20 items)ARTIAL)

**Status:** Navigation exists via toolbar, not in header

**Current:**
- ✅ TableToolbar has "Watchlists" button
- ✅ DashboardPage navigates to `/watchlists`

**Not Implemented:**
- ❌ Watchlist icon in Header.tsx
- ❌ Badge showing watchlist count
- ❌ ✅ Task 9: Create Dedicated Watchlist Pages (MOSTLY COMPLETE)

**Status:** 2 of 3 routes implemented

**Implemented Routes:**
- ✅ `/watchlists` - Full management page (`WatchlistsPage.tsx`)
  - Grid view of all watchlists
  - Create, import, export all
  - Share functionality
- ✅ `/watchlist/share/:token` - Public share view (`SharedWatchlistPage.tsx`)
  - Read-only watchlist display
  - Import to user's watchlists
  - Export as JSON

**Not Implemented:**
- ❌ `/watchlists/:id` - Individual watchlist detail page
  - Would show full item table for one watchlist
  - In-place editing of name and items
  - Could be added as enhancement
### ⏳ Task 8: Integrate Header Navigation (PENDING)

**Status:** Not started - dependencies on watchlist pages

---

### ⏳ Task 9: Create Dedicated Watchlist Pages (PENDING)

**Routes to Implement:**
- `/watchlists` - Grid view of all watchlists
- `/watchlists/:id` - Individual watchlist detail
- `/watchlist/share/:token` - Shared watchlist view

---

## Tasks

### Task 1: Expand Watchlist Store Architecture

**Files:**
- `frontend/src/stores/useWatchlistStore.ts` (migrate from useFavoritesStore.ts)
- `frontend/src/types/watchlist.ts`

**Actions:**
1. **Create watchlist interfaces**
   - Define `Watchlist`, `WatchlistItem`, `WatchlistState` interfaces
   - Add limits: `MAX_WATCHLISTS = 10`, `MAX_ITEMS_PER_WATCHLIST = 100`
   - Include default "Favorites" watchlist with `isDefault: true`

2. **Migrate existing favorites store**
   - Rename `useFavoritesStore` to `useWatchlistStore`
   - Transform single favorites list to multi-watchlist structure
   - Preserve existing localStorage data during migration

3. **Implement watchlist CRUD operations**
   - `createWatchlist(name: string): string` - Returns new watchlist ID
   - `deleteWatchlist(id: string): void` - Cannot delete default
   - `renameWatchlist(id: string, name: string): void`
   - `addItemToWatchlist(watchlistId: string, item: WatchlistItem): boolean`
   - `removeItemFromWatchlist(watchlistId: string, itemId: number): void`
   - `moveItemBetweenWatchlists(fromId: string, toId: string, itemId: number): void`

4. **Add validation and limits**
   - Enforce 10 watchlist limit in `createWatchlist`
   - Enforce 100 item limit in `addItemToWatchlist`
   - Validate watchlist names (1-50 characters, no duplicates)

### Task 2: Implement Data Validation with Zod

**Files:**
- `frontend/src/schemas/watchlist.ts`
- `frontend/src/utils/watchlist-validation.ts`

**Actions:**
1. **Create Zod schemas**
   ```typescript
   const WatchlistItemSchema = z.object({
     itemId: z.number().positive(),
     name: z.string().min(1).max(100),
     iconUrl: z.string().url(),
     addedAt: z.number(),
     notes: z.string().max(500).optional(),
   });

   const WatchlistSchema = z.object({
     id: z.string().uuid(),
     name: z.string().min(1).max(50),
     items: z.array(WatchlistItemSchema).max(100),
     createdAt: z.number(),
     updatedAt: z.number(),
     isDefault: z.boolean(),
   });
   ```

2. **Implement import validation with partial success**
   - `validateWatchlistImport(data: unknown)` - Returns valid items and error list
   - Handle malformed JSON gracefully
   - Filter out invalid items, return warnings for user notification

3. **Add share token validation**
   - Client-side format check: `/^[a-z]+-[a-z]+-[a-z]+$/`
   - Basic sanity validation before API calls

### Task 3: Create Backend Share System

**Files:**
- `backend/migrations/005_watchlist_shares.sql`
- `backend/internal/models/watchlist_share.go`
- `backend/internal/handlers/watchlist_handler.go`
- `backend/internal/services/watchlist_service.go`
- `backend/internal/utils/token_generator.go`

**Actions:**
1. **Create database schema**
   ```sql
   CREATE TABLE watchlist_shares (
     token VARCHAR(50) PRIMARY KEY,
     watchlist_data JSONB NOT NULL,
     created_at TIMESTAMP DEFAULT NOW(),
     expires_at TIMESTAMP NOT NULL,
     access_count INTEGER DEFAULT 0
   );
   
   CREATE INDEX idx_watchlist_shares_expires_at ON watchlist_shares(expires_at);
   ```

2. **Implement token generation**
   - Create word lists: 200+ adjectives, 500+ nouns
   - `generateShareToken()` with collision retry (max 5 attempts)
   - Format: "adjective-adjective-noun"

3. **Add API endpoints**
   - `POST /api/v1/watchlists/share` - Create share token
   - `GET /api/v1/watchlists/share/:token` - Retrieve watchlist
   - Include 7-day expiration logic

4. **Implement cleanup job**
   - Add to `backend/internal/scheduler/jobs.go`
   - Run nightly at 2:00 AM: `DELETE FROM watchlist_shares WHERE expires_at < NOW()`

### Task 4: Add Watchlist Column to Data Table

**Files:**
- `frontend/src/components/table/ItemsTable.tsx`
- `frontend/src/components/table/WatchlistCell.tsx`
- `frontend/src/components/common/WatchlistDropdown.tsx`

**Actions:**
1. **Create watchlist cell component**
   - Star icon for default "Favorites" watchlist
   - Dropdown menu for multi-watchlist assignment
   - Show current watchlist membership with colored indicators

2. **Add column to table definition**
   ```typescript
   columnHelper.display({
     id: 'watchlist',
     header: 'Watchlist',
     size: 100,
     cell: ({ row }) => <WatchlistCell item={row.original} />
   })
   ```

3. **Implement bulk watchlist operations**
   - Select multiple rows and assign to watchlist
   - Bulk remove from watchlists
   - Keyboard shortcut support (Shift+W for watchlist menu)

### Task 5: Create Watchlist Management UI

**Files:**
- `frontend/src/components/watchlist/WatchlistManager.tsx`
- `frontend/src/components/watchlist/WatchlistCard.tsx`
- `frontend/src/components/watchlist/CreateWatchlistModal.tsx`
- `frontend/src/components/watchlist/EditWatchlistModal.tsx`
- `frontend/src/components/watchlist/WatchlistItemCard.tsx`

**Actions:**
1. **Build watchlist manager interface**
   - Grid layout showing all watchlists as cards
   - Create new watchlist button with template options
   - Search and filter watchlists

2. **Implement watchlist cards**
   - Show watchlist name, item count, last updated
   - Quick actions: rename, delete, share, export
   - Preview first few items with thumbnails

3. **Add drag-and-drop support**
   - Reorder items within watchlists
   - Move items between watchlists
   - Visual feedback during drag operations

4. **Create modal interfaces**
   - Watchlist creation with name validation
   - Watchlist editing with item management
   - Template selection during creation

### Task 6: Build Import/Export with Partial Validation

**Files:**
- `frontend/src/components/common/ExportButton.tsx` (extend existing)
- `frontend/src/components/watchlist/ImportWatchlistModal.tsx`
- `frontend/src/utils/watchlist-io.ts`

**Actions:**
1. **Extend existing export functionality**
   - Add watchlist export to existing ExportButton
   - Support individual watchlist or all watchlists export
   - Include metadata: version, export timestamp, source

2. **Implement import with partial success**
   - File upload with drag-and-drop support
   - JSON validation with detailed error reporting
   - Import valid items, show warnings for invalid/skipped items

3. **Add export format**
   ```typescript
   interface WatchlistExport {
     version: string;
     metadata: {
       exportedAt: string;
       source: 'osrs-ge-tracker';
     };
     watchlists: Watchlist[];
   }
   ```

### Task 7: Implement Watchlist Templates

**Files:**
- `frontend/src/data/watchlistTemplates.ts`
- `frontend/src/components/watchlist/TemplateSelector.tsx`
- `frontend/src/hooks/useWatchlistTemplates.ts`

**Actions:**
1. **Create template definitions**
   - "F2P Moneymakers": Common profitable items for F2P players
   - "High Alch Items": Items with good high alch margins
   - "Skilling Supplies": Common training materials
   - "PvP Essentials": Items used in player vs player combat
   - "Quest Items": Commonly needed quest materials

2. **Build template selector UI**
   - Grid layout with template previews
   - Show template description and item count
   - One-click template import to new watchlist

3. **Implement template system**
   - Static templates defined in TypeScript
   - Template validation using Zod schemas
   - Template to watchlist conversion utility

### Task 8: Integrate Header Navigation

**Files:**
- `frontend/src/components/layout/Header.tsx`
- `frontend/src/components/layout/WatchlistMenu.tsx`

**Actions:**
1. **Add watchlist icon to header**
   - Position next to notifications icon
   - Show badge with total watchlist count
   - Active state when watchlist menu is open

2. **Create watchlist dropdown menu**
   - List all watchlists with item counts
   - Quick access to watchlist management
   - Template browser shortcut

3. **Add keyboard shortcuts**
   - Ctrl+W: Open watchlist menu
   - Ctrl+Shift+W: Create new watchlist
   - Register shortcuts in existing keyboard handler

### Task 9: Create Dedicated Watchlist Pages

**Files:**
- `frontend/src/pages/WatchlistPage.tsx`
- `frontend/src/pages/SharedWatchlistPage.tsx`
- `frontend/src/components/watchlist/WatchlistView.tsx`

**Actions:**
1. **Build main watchlist page**
   - Route: `/watchlists`
   - Grid view of all user watchlists
   - Create, import, and template buttons

2. **Implement individual watchlist view**
   - Route: `/watchlists/:id`
   - Full item table with watchlist-specific actions
   - Share, export, and edit watchlist options

3. **Create shared watchlist page**
   - Route: `/watchlist/share/:token`
   - Read-only view of shared watchlist
   - Import to user's watchlists option
   - Generic error handling for expired tokens

4. **Add routing integration**
   - Update React Router configuration
   - Add navigation breadcrumbs
   - Handle 404s for invalid watchlist IDs

## Testing Checklist

### Core Functionality
- [ ] Create watchlist (max 10 limit enforced)
- [ ] Add items to watchlist (max 100 per watchlist)
- [ ] Remove items from watchlist
- [ ] Delete watchlist (cannot delete default)
- [ ] Rename watchlist with validation

### Data Persistence
- [ ] Watchlists persist after browser refresh
- [ ] Migration from old favorites system works
- [ ] Import/export maintains data integrity

### Sharing System
- [ ] Generate memorable share tokens
- [ ] Share tokens expire after 7 days
- [ ] Shared watchlists display correctly
- [ ] Expired tokens show appropriate error

### Import/Export
- [ ] Export watchlist as valid JSON
- [ ] Import valid watchlist data
- [ ] Partial import shows warnings for invalid items
- [ ] File upload validation works

### Templates
- [ ] Template selector displays all templates
- [ ] Template import creates new watchlist
- [ ] Templates contain valid item data

### UI/UX
- [ ] Watchlist column shows in data table
- [ ] Bulk operations work on selected items
- [ ] Drag-and-drop between watchlists
- [ ] Keyboard shortcuts function correctly
- [ ] Mobile responsive design

## Dependencies

- **Backend**: PostgreSQL, GORM, Fiber, Cron scheduler
- **Frontend**: React, Zustand, Zod, TanStack Table, React Router
- **External**: OSRS item data, existing export system

---

## Testing Status

### Unit Tests (69 tests, all passing ✅)

**Store Tests (18 tests)**
- Watchlist CRUD operations
- Item management (add, remove, move)
- Import/export functionality
- Bulk operations
- Limits enforcement

**Validation Tests (18 tests)**
- Zod schema validation
- Partial success handling
- Share token format
- JSON parsing

**Utility Tests (33 tests)**
- Export formatting
- Sorting and searching
- Statistics calculation
- Name validation
- Time formatting

**Test Command:**
```bash
npm run test -- src/test/stores/useWatchlistStore.test.ts
npm run test -- src/test/utils/watchlist-validation.test.ts
npm run test -- src/test/utils/watchlist-utils.test.ts
```

---

## Implementation Notes

### Key Design Decisions

1. **Storage Strategy**: Zustand + localStorage for frontend, PostgreSQL with JSONB for shares
2. **Token Format**: Memorable "adjective-adjective-noun" (e.g., "swift-golden-dragon")
3. **Migration**: Automatic one-time migration from favorites to default watchlist
4. **Validation**: Partial success support - import valid items, warn about invalid ones
5. **Limits**: Hard limits enforced at store level (10 watchlists, 100 items each)

### Technical Highlights

- **Type Safety**: Full TypeScript with Zod runtime validation
- **Performance**: Virtual scrolling ready, optimized for large datasets
- **UX**: Drag-and-drop support planned, keyboard shortcuts
- **Backend**: Efficient JSONB storage, nightly cleanup job, collision-free tokens

---

## Next Steps (Priority Order)

### ✅ Phase 2: UI Integration (COMPLETED)
1. ✅ **Watchlist Dropdown** - Multi-select component for table column
2. ✅ **Import/Export Modals** - File upload/download UI
3. ✅ **Share Modal** - Generate and display share links
4. ✅ **API Client** - Frontend integration with backend share endpoints

### 🎯 Next Steps (Priority Order)

#### **Immediate Improvements** (2-3 hours total)
1. **Wire up Edit/Delete/Export handlers in WatchlistsPage** (30 min)
   - Add `handleDelete`, `handleEdit`, `handleExport` functions
   - Pass to `WatchlistCard` components
   - Use store's `deleteWatchlist`, `renameWatchlist`, `exportWatchlist` methods

2. **Create simple EditWatchlistModal** (1 hour)
   - Input field for renaming
   - Call `renameWatchlist` from store
   - Reuse existing modal UI patterns

3. **Add export individual watchlist** (30 min)
   - Implement `handleExport` in WatchlistsPage
   - Download single watchlist as JSON

#### **Nice-to-Have Enhancements** (8-12 hours)
4. **Bulk Operations** (3-4 hours)
   - Multi-select handler in ItemsTable
   - Bulk add/remove from watchlists

5. **Individual Watchlist Detail Page** (2-3 hours)
   - `/watchlists/:id` route
   - Full item table filtered to that watchlist
   - Edit name, manage items

6. **E2E Tests** (4-6 hours)
   - Create/rename/delete watchlist
   - Add/remove items
   - Share and import workflows

7. **Drag-and-Drop** (2-3 hours)
   - Reorder items within watchlists
   - Move items between watchlists

8. **Header Navigation** (1 hour)
   - Add watchlist icon/badge to Header
   - Show count of watchlists

---

## Dependencies

- **Backend**: PostgreSQL, GORM, Fiber, Cron scheduler
- **Frontend**: React, Zustand, Zod, TanStack Table, React Router
- **External**: OSRS item data, existing export system
