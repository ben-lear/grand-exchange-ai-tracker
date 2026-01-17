# 007: Favorites & Watchlist

**Priority:** Medium  
**Effort:** M (4-8 hours)  
**Status:** Not Started

## Overview

Implement a favorites/watchlist feature allowing users to track specific items. The `useFavoritesStore` already exists but isn't connected to UI.

## Features

- Star/favorite items from table or detail page
- Dedicated watchlist view/sidebar
- Quick access to favorited items
- Persist favorites in localStorage

## Tasks

### 7.1 Audit Existing FavoritesStore
- **File:** `frontend/src/stores/useFavoritesStore.ts`
- **Check:** What methods/state already exist
- **Update:** Add any missing functionality

### 7.2 Add Favorite Button to Item Rows
- **File:** `frontend/src/components/table/ItemsTable.tsx`
- **Change:** Add star icon button to each row
- **Behavior:** Toggle favorite on click

### 7.3 Add Favorite Button to Item Detail
- **File:** `frontend/src/pages/ItemDetailPage.tsx`
- **Change:** Add prominent favorite button near item title

### 7.4 Create Watchlist Sidebar/Panel
- **Location:** `frontend/src/components/common/WatchlistPanel.tsx`
- **Features:**
  - List of favorited items with current prices
  - Click to navigate to item
  - Remove from watchlist option

### 7.5 Add Watchlist Toggle to Header
- **File:** `frontend/src/components/layout/Header.tsx`
- **Change:** Add button to open/close watchlist panel

### 7.6 Filter Table by Favorites
- **File:** `frontend/src/pages/DashboardPage.tsx`
- **Change:** Add "Show favorites only" filter option

## Components to Create

```
frontend/src/components/common/
├── WatchlistPanel.tsx
├── FavoriteButton.tsx
└── index.ts (update)
```

## Testing

- [ ] Can add/remove favorites from table
- [ ] Can add/remove favorites from detail page
- [ ] Watchlist panel shows all favorites
- [ ] Favorites persist after refresh
- [ ] Filter by favorites works

## Dependencies

- useFavoritesStore (exists)
- localStorage (for persistence)

## Design Notes

- Use star icon (filled when favorited)
- Yellow/gold color for favorite state
- Show count of favorites in header button
