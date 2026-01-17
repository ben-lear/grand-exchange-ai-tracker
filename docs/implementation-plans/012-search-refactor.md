# 012: Search System Refactor - Client-Side Fuzzy Dropdown

**Priority:** High  
**Effort:** M (4-8 hours)  
**Status:** ✅ FRONTEND COMPLETE (~95% Complete)

**Progress Summary:**
- ✅ Core infrastructure (fuse.js, itemSearch util, itemDataStore, prefetcher, recentSearches)
- ✅ Search UI components (SearchInput, Dropdown, DropdownItem, GlobalSearch, etc.)
- ✅ Header integration with GlobalSearch
- ✅ MainLayout updated (Ctrl+K focus, removed SearchModal, price sync)
- ✅ DashboardPage client-side pagination (complete)
- ✅ TableToolbar inline search update (complete)
- ✅ Frontend cleanup (uiStore, useItems, API client)
- ⏳ Backend cleanup (optional - not started)

## Overview

Replace the modal-based search with a lightweight dropdown using fuse.js for typo-tolerant client-side search. Background-fetch all items on app load into a persistent Zustand store. Both header search and inline table search use the same fuzzy utility. Table switches to client-side pagination.

## Problems Being Solved

1. **Backend API doesn't support search by item name** — Current `/api/v1/items/search` endpoint exists but is unnecessary
2. **Frontend already has item metadata** — No need for API calls to search
3. **Modal design is disruptive** — Covers screen while user is searching
4. **No typo tolerance** — Current search requires exact substring match

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         App Mount                                │
│  ├── useItemPrefetcher() starts background item loading          │
│  └── useAllCurrentPrices() fetches prices → syncs to store       │
│      └── Auto-refetches every 60s → store always updated         │
├─────────────────────────────────────────────────────────────────┤
│                      itemDataStore (Zustand)                     │
│  ├── items: Map<number, Item>                                    │
│  ├── currentPrices: Map<number, CurrentPrice>                    │
│  ├── isFullyLoaded: boolean (items)                              │
│  ├── pricesLoaded: boolean                                       │
│  └── loadError: string | null                                    │
├─────────────────────────────────────────────────────────────────┤
│                        Header                                    │
│  └── SearchDropdown                                              │
│      ├── useRecentSearches() → empty state                       │
│      ├── fuse.js index → fuzzy search                            │
│      └── Results with prices from store                          │
├─────────────────────────────────────────────────────────────────┤
│                     DashboardPage                                │
│  ├── Reads items from store                                      │
│  ├── Client-side pagination (slice array)                        │
│  ├── Client-side filtering (price, members, search)              │
│  └── TableToolbar uses same fuse.js utility                      │
└─────────────────────────────────────────────────────────────────┘
```

---

## Tasks

### 12.1 Install fuse.js ✅ COMPLETED

**Terminal:**
```powershell
cd frontend
npm install fuse.js
npm install -D @types/fuse.js  # Types included in fuse.js, skip if error
```

---

### 12.2 Create Fuzzy Search Utility ✅ COMPLETED

**File:** `frontend/src/utils/itemSearch.ts`

```typescript
import Fuse from 'fuse.js';
import type { Item } from '../types';

const FUSE_OPTIONS: Fuse.IFuseOptions<Item> = {
  keys: ['name'],
  threshold: 0.3,        // 0 = exact, 1 = match anything
  includeScore: true,
  ignoreLocation: true,  // Search anywhere in string
  minMatchCharLength: 2,
};

export function createItemSearchIndex(items: Item[]): Fuse<Item> {
  return new Fuse(items, FUSE_OPTIONS);
}

export function searchItems(fuse: Fuse<Item>, query: string, limit = 12): Item[] {
  if (!query.trim()) return [];
  const results = fuse.search(query, { limit });
  return results.map(r => r.item);
}

export function filterItems(fuse: Fuse<Item>, query: string): Item[] {
  if (!query.trim()) return [];
  const results = fuse.search(query);
  return results.map(r => r.item);
}

export function filterItemIds(fuse: Fuse<Item>, query: string): Set<number> {
  if (!query.trim()) return new Set();
  const results = fuse.search(query);
  return new Set(results.map(r => r.item.id));
}
```

---

### 12.3 Create Item Data Store (Zustand) ✅ COMPLETED

**File:** `frontend/src/stores/itemDataStore.ts`

```typescript
import { create } from 'zustand';
import type { Item, CurrentPrice } from '../types';

interface ItemDataState {
  // State
  items: Map<number, Item>;
  currentPrices: Map<number, CurrentPrice>;
  isFullyLoaded: boolean;      // All item pages fetched
  pricesLoaded: boolean;       // Initial price fetch complete
  loadError: string | null;
  
  // Computed
  getItemsArray: () => Item[];
  getItemById: (id: number) => Item | undefined;
  getPriceById: (id: number) => CurrentPrice | undefined;
  getItemWithPrice: (id: number) => { item: Item; price?: CurrentPrice } | undefined;
  
  // Actions
  addItems: (items: Item[]) => void;
  setPrices: (prices: CurrentPrice[]) => void;  // Called on every refetch
  setFullyLoaded: () => void;
  setPricesLoaded: () => void;
  setLoadError: (error: string | null) => void;
  reset: () => void;
}

export const useItemDataStore = create<ItemDataState>((set, get) => ({
  items: new Map(),
  currentPrices: new Map(),
  isFullyLoaded: false,
  pricesLoaded: false,
  loadError: null,

  getItemsArray: () => Array.from(get().items.values()),
  
  getItemById: (id) => get().items.get(id),
  
  getPriceById: (id) => get().currentPrices.get(id),
  
  getItemWithPrice: (id) => {
    const item = get().items.get(id);
    if (!item) return undefined;
    return { item, price: get().currentPrices.get(id) };
  },

  addItems: (items) => set((state) => {
    const newMap = new Map(state.items);
    items.forEach(item => newMap.set(item.id, item));
    return { items: newMap };
  }),

  setPrices: (prices) => set(() => {
    const priceMap = new Map<number, CurrentPrice>();
    prices.forEach(p => priceMap.set(p.itemId, p));
    return { currentPrices: priceMap, pricesLoaded: true };
  }),

  setFullyLoaded: () => set({ isFullyLoaded: true }),
  
  setPricesLoaded: () => set({ pricesLoaded: true }),
  
  setLoadError: (error) => set({ loadError: error }),
  
  reset: () => set({
    items: new Map(),
    currentPrices: new Map(),
    isFullyLoaded: false,
    pricesLoaded: false,
    loadError: null,
  }),
}));
```

---

### 12.4 Create Item Prefetcher Hook with Retry Logic ✅ COMPLETED

**File:** `frontend/src/hooks/useItemPrefetcher.ts`

```typescript
import { useEffect, useRef, useState } from 'react';
import { useItemDataStore } from '../stores/itemDataStore';
import { fetchItems } from '../api/client';

const MAX_RETRIES = 3;
const PAGE_SIZE = 200;

function getBackoffDelay(attempt: number): number {
  return Math.pow(2, attempt) * 1000; // 1s, 2s, 4s
}

async function fetchWithRetry(
  page: number,
  signal: AbortSignal
): Promise<{ items: Item[]; hasMore: boolean }> {
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const response = await fetchItems({ page, limit: PAGE_SIZE }, signal);
      return {
        items: response.data,
        hasMore: response.data.length === PAGE_SIZE,
      };
    } catch (error) {
      if (signal.aborted) throw error;
      lastError = error as Error;
      
      if (attempt < MAX_RETRIES - 1) {
        await new Promise(resolve => 
          setTimeout(resolve, getBackoffDelay(attempt))
        );
      }
    }
  }
  
  throw lastError;
}

interface PrefetcherState {
  isLoading: boolean;
  hasFirstPage: boolean;
  totalFetched: number;
  error: string | null;
}

export function useItemPrefetcher(): PrefetcherState {
  const { items, isFullyLoaded, addItems, setFullyLoaded, setLoadError } = useItemDataStore();
  const [state, setState] = useState<PrefetcherState>({
    isLoading: !isFullyLoaded,
    hasFirstPage: items.size > 0,
    totalFetched: items.size,
    error: null,
  });
  const fetchingRef = useRef(false);

  useEffect(() => {
    if (isFullyLoaded || fetchingRef.current) return;
    fetchingRef.current = true;

    const controller = new AbortController();
    
    async function prefetchAll() {
      let page = 1;
      let hasMore = true;
      const errors: string[] = [];

      while (hasMore) {
        try {
          const result = await fetchWithRetry(page, controller.signal);
          
          addItems(result.items);
          setState(s => ({
            ...s,
            hasFirstPage: true,
            totalFetched: s.totalFetched + result.items.length,
          }));
          
          hasMore = result.hasMore;
          page++;
        } catch (error) {
          if (controller.signal.aborted) return;
          
          // Log error but continue to next page
          const errMsg = `Page ${page} failed after ${MAX_RETRIES} retries`;
          errors.push(errMsg);
          console.error(errMsg, error);
          page++;
          
          // Stop if too many consecutive errors
          if (errors.length > 5) {
            hasMore = false;
          }
        }
      }

      setFullyLoaded();
      if (errors.length > 0) {
        setLoadError(`Some pages failed to load: ${errors.length} errors`);
      }
      setState(s => ({ ...s, isLoading: false, error: errors[0] || null }));
    }

    prefetchAll();

    return () => controller.abort();
  }, [isFullyLoaded, addItems, setFullyLoaded, setLoadError]);

  return state;
}
```

**Note:** Update import path for `fetchItems` and `Item` type based on actual locations.

---

### 12.5 Update useRecentSearches Hook ✅ COMPLETED

**File:** `frontend/src/hooks/useRecentSearches.ts`

**Implementation Notes:**
- Uses storage key `osrs-recent-searches` instead of `recent-searches`
- Added null check in filter predicate for localStorage validation
- Tests updated to match new API (`recentItems`, `addRecentItem`, `removeRecentItem`, `clearRecent`)

**Replace entire file:**

```typescript
import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'osrs-recent-searches';
const MAX_RECENT = 5;

export interface RecentItem {
  id: number;
  name: string;
  icon?: string;
}

interface UseRecentSearchesReturn {
  recentItems: RecentItem[];
  addRecentItem: (item: RecentItem) => void;
  removeRecentItem: (id: number) => void;
  clearRecent: () => void;
}

function loadFromStorage(): RecentItem[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    const parsed = JSON.parse(stored);
    if (!Array.isArray(parsed)) return [];
    return parsed.slice(0, MAX_RECENT);
  } catch {
    return [];
  }
}

function saveToStorage(items: RecentItem[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    // Storage full or unavailable
  }
}

export function useRecentSearches(): UseRecentSearchesReturn {
  const [recentItems, setRecentItems] = useState<RecentItem[]>(loadFromStorage);

  // Sync to storage on change
  useEffect(() => {
    saveToStorage(recentItems);
  }, [recentItems]);

  const addRecentItem = useCallback((item: RecentItem) => {
    setRecentItems(prev => {
      // Remove existing entry for same item
      const filtered = prev.filter(r => r.id !== item.id);
      // Add to front, limit to MAX_RECENT
      return [item, ...filtered].slice(0, MAX_RECENT);
    });
  }, []);

  const removeRecentItem = useCallback((id: number) => {
    setRecentItems(prev => prev.filter(r => r.id !== id));
  }, []);

  const clearRecent = useCallback(() => {
    setRecentItems([]);
  }, []);

  return { recentItems, addRecentItem, removeRecentItem, clearRecent };
}
```

---

### 12.6 Build Search Components (Modular Architecture) ✅ COMPLETED

Break the search UI into reusable components:

```
frontend/src/components/common/
├── SearchInput.tsx          # Reusable search input (header + table)
├── Dropdown.tsx             # Generic dropdown container
└── DropdownItem.tsx         # Generic selectable dropdown item

frontend/src/components/search/
├── GlobalSearch.tsx         # Orchestrates search logic for header
├── SearchResultItem.tsx     # Item result with icon, name, price
└── RecentSearchItem.tsx     # Recent search with remove button
```

---

#### 12.6.1 Create SearchInput Component ✅ COMPLETED

**File:** `frontend/src/components/common/SearchInput.tsx`

Reusable input with search icon, clear button, and keyboard handling.

```typescript
import { forwardRef, useCallback } from 'react';
import { Search, X } from 'lucide-react';

export interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  onFocus?: () => void;
  onBlur?: () => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  placeholder?: string;
  id?: string;
  name?: string;
  className?: string;
  inputClassName?: string;
  showShortcut?: boolean;        // Show "(Ctrl+K)" hint
  'aria-expanded'?: boolean;
  'aria-haspopup'?: 'listbox' | 'menu' | 'dialog' | boolean;
}

export const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(
  (
    {
      value,
      onChange,
      onFocus,
      onBlur,
      onKeyDown,
      placeholder = 'Search...',
      id,
      name,
      className = '',
      inputClassName = '',
      showShortcut = false,
      'aria-expanded': ariaExpanded,
      'aria-haspopup': ariaHaspopup,
    },
    ref
  ) => {
    const handleClear = useCallback(() => {
      onChange('');
    }, [onChange]);

    const displayPlaceholder = showShortcut
      ? `${placeholder} (Ctrl+K)`
      : placeholder;

    return (
      <div className={`relative ${className}`}>
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        <input
          ref={ref}
          id={id}
          name={name}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={onFocus}
          onBlur={onBlur}
          onKeyDown={onKeyDown}
          placeholder={displayPlaceholder}
          className={`w-full pl-9 pr-8 py-2 text-sm bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${inputClassName}`}
          aria-label={placeholder}
          aria-expanded={ariaExpanded}
          aria-haspopup={ariaHaspopup}
          role={ariaHaspopup === 'listbox' ? 'combobox' : undefined}
        />
        {value && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-white"
            aria-label="Clear search"
            tabIndex={-1}
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    );
  }
);

SearchInput.displayName = 'SearchInput';
```

---

#### 12.6.2 Create Dropdown Component ✅ COMPLETED

**File:** `frontend/src/components/common/Dropdown.tsx`

Generic dropdown container with positioning, click-outside, and loading footer.

```typescript
import { useRef, useEffect, type ReactNode } from 'react';

export interface DropdownProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
  maxHeight?: string;
}

export function Dropdown({
  isOpen,
  onClose,
  children,
  footer,
  className = '',
  maxHeight = 'max-h-80',
}: DropdownProps) {
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close on click outside
  useEffect(() => {
    if (!isOpen) return;

    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        onClose();
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      ref={dropdownRef}
      className={`absolute top-full left-0 right-0 mt-1 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-50 overflow-hidden ${className}`}
    >
      <ul role="listbox" className={`${maxHeight} overflow-y-auto`}>
        {children}
      </ul>
      {footer}
    </div>
  );
}
```

---

#### 12.6.3 Create DropdownItem Component ✅ COMPLETED

**File:** `frontend/src/components/common/DropdownItem.tsx`

Generic selectable item with hover/selected states.

```typescript
import { type ReactNode } from 'react';

export interface DropdownItemProps {
  isSelected: boolean;
  onClick: () => void;
  onMouseEnter: () => void;
  children: ReactNode;
  className?: string;
}

export function DropdownItem({
  isSelected,
  onClick,
  onMouseEnter,
  children,
  className = '',
}: DropdownItemProps) {
  return (
    <li
      role="option"
      aria-selected={isSelected}
      className={`flex items-center justify-between px-3 py-2 cursor-pointer transition-colors ${
        isSelected ? 'bg-gray-700' : 'hover:bg-gray-750'
      } ${className}`}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
    >
      {children}
    </li>
  );
}
```

---

#### 12.6.4 Create SearchResultItem Component ✅ COMPLETED

**File:** `frontend/src/components/search/SearchResultItem.tsx`

Displays item with icon, name, members badge, and prices.

```typescript
import type { Item, CurrentPrice } from '../../types';
import { formatCompactPrice } from '../../utils/formatters';

export interface SearchResultItemProps {
  item: Item;
  price?: CurrentPrice;
}

export function SearchResultItem({ item, price }: SearchResultItemProps) {
  const hasPrice = price && (price.highPrice || price.lowPrice);

  return (
    <>
      <div className="flex items-center gap-2 min-w-0">
        {item.icon && (
          <img
            src={item.icon}
            alt=""
            className="w-6 h-6 object-contain flex-shrink-0"
            loading="lazy"
          />
        )}
        <span className="text-white truncate">{item.name}</span>
        {item.members && (
          <span className="px-1.5 py-0.5 text-xs bg-amber-900/50 text-amber-400 rounded flex-shrink-0">
            P2P
          </span>
        )}
      </div>
      {hasPrice && (
        <div className="flex items-center gap-3 text-sm flex-shrink-0">
          {price.highPrice && (
            <span className="text-green-400">{formatCompactPrice(price.highPrice)}</span>
          )}
          {price.lowPrice && (
            <span className="text-red-400">{formatCompactPrice(price.lowPrice)}</span>
          )}
        </div>
      )}
    </>
  );
}
```

---

#### 12.6.5 Create RecentSearchItem Component ✅ COMPLETED

**File:** `frontend/src/components/search/RecentSearchItem.tsx`

Displays recent search with clock icon and remove button.

```typescript
import { Clock, X } from 'lucide-react';
import type { RecentItem } from '../../hooks/useRecentSearches';

export interface RecentSearchItemProps {
  item: RecentItem;
  onRemove: (id: number) => void;
}

export function RecentSearchItem({ item, onRemove }: RecentSearchItemProps) {
  return (
    <>
      <div className="flex items-center gap-2 min-w-0">
        <Clock className="w-4 h-4 text-gray-500 flex-shrink-0" />
        <span className="text-white truncate">{item.name}</span>
      </div>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onRemove(item.id);
        }}
        className="p-1 text-gray-500 hover:text-white flex-shrink-0"
        aria-label={`Remove ${item.name} from recent`}
        tabIndex={-1}
      >
        <X className="w-3 h-3" />
      </button>
    </>
  );
}
```

---

#### 12.6.6 Create GlobalSearch Component (Orchestrator) ✅ COMPLETED

**File:** `frontend/src/components/search/GlobalSearch.tsx`

**Implementation Notes:**
- Changed `query.trim()` to `query.trim().length > 0` to ensure boolean types for dropdown visibility
- `aria-expanded` uses conditional `showDropdown ? true : undefined` for proper accessibility
- Exports `GlobalSearchHandle` type for parent ref usage

Combines all components, manages state, handles keyboard navigation.

```typescript
import { useState, useRef, useEffect, useMemo, forwardRef, useImperativeHandle, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useItemDataStore } from '../../stores/itemDataStore';
import { useRecentSearches, type RecentItem } from '../../hooks/useRecentSearches';
import { useDebouncedValue } from '../../hooks/useDebouncedValue';
import { createItemSearchIndex, searchItems } from '../../utils/itemSearch';
import { SearchInput } from '../common/SearchInput';
import { Dropdown } from '../common/Dropdown';
import { DropdownItem } from '../common/DropdownItem';
import { SearchResultItem } from './SearchResultItem';
import { RecentSearchItem } from './RecentSearchItem';
import type { Item } from '../../types';

export interface GlobalSearchHandle {
  focus: () => void;
}

interface GlobalSearchProps {
  className?: string;
}

export const GlobalSearch = forwardRef<GlobalSearchHandle, GlobalSearchProps>(
  ({ className = '' }, ref) => {
    const navigate = useNavigate();
    const inputRef = useRef<HTMLInputElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    const [query, setQuery] = useState('');
    const [isOpen, setIsOpen] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(0);

    const debouncedQuery = useDebouncedValue(query, 150);

    const { getItemsArray, getPriceById, isFullyLoaded } = useItemDataStore();
    const { recentItems, addRecentItem, removeRecentItem } = useRecentSearches();

    const items = getItemsArray();

    // Build fuse index when items change
    const fuseIndex = useMemo(() => {
      if (items.length === 0) return null;
      return createItemSearchIndex(items);
    }, [items]);

    // Search results
    const searchResults = useMemo(() => {
      if (!fuseIndex || !debouncedQuery.trim()) return [];
      return searchItems(fuseIndex, debouncedQuery, 12);
    }, [fuseIndex, debouncedQuery]);

    // Determine what to show
    const showRecent = isOpen && !query.trim() && recentItems.length > 0;
    const showResults = isOpen && query.trim() && searchResults.length > 0;
    const showNoResults = isOpen && query.trim() && searchResults.length === 0 && items.length > 0;
    const showDropdown = showRecent || showResults || showNoResults;

    const currentItems = showRecent ? recentItems : searchResults;
    const itemCount = currentItems.length;

    // Expose focus method
    useImperativeHandle(ref, () => ({
      focus: () => inputRef.current?.focus(),
    }));

    // Reset selection when results change
    useEffect(() => {
      setSelectedIndex(0);
    }, [searchResults, recentItems, showRecent]);

    // Selection handler
    const selectItem = useCallback(
      (item: Item | RecentItem) => {
        const recentEntry: RecentItem = {
          id: item.id,
          name: item.name,
          icon: 'icon' in item ? item.icon : undefined,
        };
        addRecentItem(recentEntry);
        setQuery('');
        setIsOpen(false);
        navigate(`/items/${item.id}`);
      },
      [addRecentItem, navigate]
    );

    // Keyboard navigation
    const handleKeyDown = useCallback(
      (e: React.KeyboardEvent<HTMLInputElement>) => {
        switch (e.key) {
          case 'ArrowDown':
            e.preventDefault();
            setSelectedIndex((i) => (i + 1) % Math.max(itemCount, 1));
            break;
          case 'ArrowUp':
            e.preventDefault();
            setSelectedIndex((i) => (i - 1 + itemCount) % Math.max(itemCount, 1));
            break;
          case 'Enter':
            e.preventDefault();
            if (currentItems[selectedIndex]) {
              selectItem(currentItems[selectedIndex]);
            }
            break;
          case 'Escape':
            e.preventDefault();
            setIsOpen(false);
            inputRef.current?.blur();
            break;
        }
      },
      [itemCount, currentItems, selectedIndex, selectItem]
    );

    const handleClose = useCallback(() => setIsOpen(false), []);

    // Loading footer
    const loadingFooter = !isFullyLoaded ? (
      <div className="px-3 py-2 text-xs text-gray-500 border-t border-gray-700 flex items-center gap-2">
        <div className="w-3 h-3 border-2 border-gray-600 border-t-blue-500 rounded-full animate-spin" />
        Searching {items.length.toLocaleString()} items...
      </div>
    ) : null;

    return (
      <div ref={containerRef} className={`relative ${className}`}>
        <SearchInput
          ref={inputRef}
          value={query}
          onChange={setQuery}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder="Search items..."
          showShortcut
          aria-expanded={showDropdown}
          aria-haspopup="listbox"
        />

        <Dropdown isOpen={showDropdown} onClose={handleClose} footer={loadingFooter}>
          {/* Recent Searches */}
          {showRecent && (
            <>
              <li className="px-3 py-2 text-xs font-medium text-gray-400 bg-gray-750">
                Recent Searches
              </li>
              {recentItems.map((item, index) => (
                <DropdownItem
                  key={item.id}
                  isSelected={selectedIndex === index}
                  onClick={() => selectItem(item)}
                  onMouseEnter={() => setSelectedIndex(index)}
                >
                  <RecentSearchItem item={item} onRemove={removeRecentItem} />
                </DropdownItem>
              ))}
            </>
          )}

          {/* Search Results */}
          {showResults &&
            searchResults.map((item, index) => (
              <DropdownItem
                key={item.id}
                isSelected={selectedIndex === index}
                onClick={() => selectItem(item)}
                onMouseEnter={() => setSelectedIndex(index)}
              >
                <SearchResultItem item={item} price={getPriceById(item.id)} />
              </DropdownItem>
            ))}

          {/* No Results */}
          {showNoResults && (
            <li className="px-3 py-4 text-center text-gray-400">
              No items found for "{query}"
            </li>
          )}
        </Dropdown>
      </div>
    );
  }
);

GlobalSearch.displayName = 'GlobalSearch';
```

---

#### 12.6.7 Add formatCompactPrice Utility ✅ ALREADY EXISTS

**File:** `frontend/src/utils/formatters.ts`

**Note:** The `formatCompactPrice` function already existed in the codebase, no changes needed.

```typescript
export function formatCompactPrice(value: number | undefined | null): string {
  if (value === undefined || value === null) return '';
  if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1)}B`;
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return value.toLocaleString();
}
```

---

### 12.7 Update Header Component ✅ COMPLETED

**File:** `frontend/src/components/layout/Header.tsx`

**Implementation Notes:**
- Uses `forwardRef` pattern with `HeaderHandle` interface exposing `focusSearch()`
- GlobalSearch ref forwarded through Header to MainLayout
- Removed unused `React` default import (only named imports needed)
- Search icon in nav still visible on mobile for accessibility

**Changes:**
1. Import `GlobalSearch` and `useRef`
2. Replace search button with `GlobalSearch` component
3. Export ref for Ctrl+K focus

**Find and update the search button section:**

```tsx
// Add imports
import { useRef } from 'react';
import { GlobalSearch, type GlobalSearchHandle } from '../search/GlobalSearch';

// Add ref
const searchRef = useRef<GlobalSearchHandle>(null);

// Expose for parent to focus
export { searchRef };

// Replace search button with:
<GlobalSearch ref={searchRef} className="w-64 lg:w-80" />
```

**Note:** Exact changes depend on current Header implementation. Review file first.

---

### 12.8 Update MainLayout Component ✅ PARTIALLY COMPLETED

**File:** `frontend/src/components/layout/MainLayout.tsx`

**Completed:**
- ✅ Ctrl+K handler updated to call `headerRef.current?.focusSearch()`
- ✅ SearchModal import and rendering removed
- ✅ Uses `HeaderHandle` ref to communicate with Header/GlobalSearch

**Not Yet Implemented:**
- ⏳ `useItemPrefetcher()` initialization (will be added in Step 12.9)
- ⏳ `useAllCurrentPrices()` with store sync (will be added in Step 12.9)

**Changes:**
1. Initialize `useItemPrefetcher()` for background item loading
2. Initialize `useAllCurrentPrices()` with auto-refetch, sync to store on every update
3. Update Ctrl+K to focus search input via ref
4. Remove modal rendering

```tsx
// Add imports
import { useEffect } from 'react';
import { useItemPrefetcher } from '../../hooks/useItemPrefetcher';
import { useAllCurrentPrices } from '../../hooks/usePrices';
import { useItemDataStore } from '../../stores/itemDataStore';

// Inside component:
const { setPrices } = useItemDataStore();
const prefetchState = useItemPrefetcher();

// Fetch prices on mount, auto-refetch every 60s, sync to store on EVERY update
const { data: prices } = useAllCurrentPrices({
  refetchInterval: 60_000,  // Refetch every 60 seconds
  staleTime: 50_000,        // Consider stale after 50s
});

// Sync prices to store whenever they update (initial + refetches)
useEffect(() => {
  if (prices) {
    setPrices(prices);  // Store's pricesLoaded set to true automatically
  }
}, [prices, setPrices]);

// Update Ctrl+K handler (replace modal open with):
// searchRef.current?.focus();

// Remove <SearchModal /> rendering
```

**Key behavior:**
- Prices fetched immediately on app mount
- Auto-refetches every 60 seconds
- Every refetch (initial or subsequent) syncs to `itemDataStore.currentPrices`
- Dropdown and table always show latest prices without manual refresh

---

### 12.9 Refactor DashboardPage to Client-Side Pagination ✅ COMPLETED

**File:** `frontend/src/pages/DashboardPage.tsx`

**Implementation Notes:**
- ✅ Uses `filterItemIdsByRelevance()` instead of `filterItemIds()` to preserve search relevance order
- ✅ Search results now sorted by fuse.js relevance score (exact matches first)
- ✅ Filter logic refactored: non-search filters applied first, then search with relevance sorting
- ✅ Fixes issue where "rune arrow" search showed 84 unsorted results instead of exact match first

**Major Changes:**
1. Read items from `itemDataStore` instead of `useItems()` API
2. Implement client-side filtering (search, price, members)
3. Implement client-side pagination (slice array)
4. Show spinner until first page loads

```tsx
import { useState, useMemo } from 'react';
import { useItemDataStore } from '../stores/itemDataStore';
import { useItemPrefetcher } from '../hooks/useItemPrefetcher';
import { createItemSearchIndex, filterItemIds } from '../utils/itemSearch';

function DashboardPage() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({ priceMin: '', priceMax: '', members: null });
  
  const { getItemsArray, getPriceById, isFullyLoaded } = useItemDataStore();
  const { hasFirstPage } = useItemPrefetcher();
  
  const allItems = getItemsArray();
  
  // Build search index
  const fuseIndex = useMemo(() => {
    if (allItems.length === 0) return null;
    return createItemSearchIndex(allItems);
  }, [allItems]);
  
  // Get matching item IDs from search
  const searchMatchIds = useMemo(() => {
    if (!fuseIndex || !searchQuery.trim()) return null;
    return filterItemIds(fuseIndex, searchQuery);
  }, [fuseIndex, searchQuery]);
  
  // Filter items
  const filteredItems = useMemo(() => {
    return allItems.filter(item => {
      // Search filter
      if (searchMatchIds && !searchMatchIds.has(item.id)) return false;
      
      // Members filter
      if (filters.members !== null && item.members !== filters.members) return false;
      
      // Price filters
      const price = getPriceById(item.id);
      const highPrice = price?.highPrice;
      if (filters.priceMin && (!highPrice || highPrice < Number(filters.priceMin))) return false;
      if (filters.priceMax && (!highPrice || highPrice > Number(filters.priceMax))) return false;
      
      return true;
    });
  }, [allItems, searchMatchIds, filters, getPriceById]);
  
  // Paginate
  const paginatedItems = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredItems.slice(start, start + pageSize);
  }, [filteredItems, page, pageSize]);
  
  const totalPages = Math.ceil(filteredItems.length / pageSize);
  
  // Show spinner until first page loads
  if (!hasFirstPage) {
    return <LoadingSpinner />;
  }
  
  return (
    // ... render table with paginatedItems
  );
}
```

---

### 12.10 Update TableToolbar Inline Search

**File:** `frontend/src/components/table/TableToolbar.tsx`

**Changes:**
1. Replace custom input with shared `SearchInput` component
2. Remove API search dependency
3. Pass search query up to parent for filtering

```tsx
import { SearchInput } from '../common/SearchInput';

interface TableToolbarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  // ... other props
}

// Replace inline input with:
<SearchInput
  id="table-search"
  name="search"
  value={searchQuery}
  onChange={onSearchChange}
  placeholder="Filter items..."
  className="w-64"
/>
```

**Benefits of shared component:**
- Consistent styling between header and table search
- Built-in clear button behavior
- Proper accessibility attributes
- Single source of truth for search input UI

---

### 12.11 Clean Up uiStore

**File:** `frontend/src/stores/uiStore.ts`

**Remove:**
- `searchModalOpen: boolean`
- `setSearchModalOpen: (open: boolean) => void`

---

### 12.12 Clean Up useItems Hook

**File:** `frontend/src/hooks/useItems.ts`

**Remove:**
- `useSearchItems` hook entirely
- Any search-specific query functions

**Keep:**
- `useItems` for paginated fetching (used by prefetcher)
- `useItem` for single item fetch
- `useItemPriceHistory` for charts

---

### 12.13 Clean Up API Client

**File:** `frontend/src/api/client.ts`

**Remove:**
- `searchItems()` function
- `SearchItemsParams` interface
- Any search-related types

---

### 12.14 Delete SearchModal Component ✅ COMPLETED

**File:** `frontend/src/components/common/SearchModal.tsx` (was in common/, not search/)

**Action:** Deleted `SearchModal.tsx` and `SearchModal.test.tsx`, updated `common/index.ts` exports.

---

### 12.15 Remove Backend Search Endpoint

**File:** `backend/internal/handlers/item_handler.go`

**Remove:**
- `SearchItems` handler function
- Route registration for `/api/v1/items/search`

---

### 12.16 Remove Backend Search Service Method

**File:** `backend/internal/services/item_service.go`

**Remove:**
- `SearchItems` method from `ItemService` interface
- `SearchItems` implementation from `itemService` struct

---

### 12.17 Remove Backend Search Repository Method

**File:** `backend/internal/repository/item_repository.go`

**Remove:**
- `Search` method implementation

---

### 12.18 Remove Backend Search Interface

**File:** `backend/internal/repository/interfaces.go`

**Remove:**
- `Search` method from `ItemRepository` interface
- `ItemSearchParams` struct

---

## Testing Checklist

### Manual Testing

- [ ] **Search dropdown appears** when clicking/focusing search input
- [ ] **Recent searches show** when focused with empty query
- [ ] **Fuzzy search works** — typos like "dargon" find "Dragon"
- [ ] **Prices display** next to items in dropdown (hidden if unavailable)
- [ ] **"Searching X items..."** shows while loading, disappears when done
- [ ] **Keyboard navigation** — ↑↓ moves selection, Enter selects, Esc closes
- [ ] **Click outside closes** dropdown
- [ ] **Ctrl+K focuses** search input from anywhere
- [ ] **Selection navigates** to `/items/:id` and adds to recent
- [ ] **Table shows spinner** until first page loads
- [ ] **Table filters work** — inline search, price range, members
- [ ] **Pagination works** — client-side with correct totals
- [ ] **No console errors** or TypeScript warnings

### Unit Tests Status

| Test File | Status | Notes |
|-----------|--------|-------|
| `useRecentSearches.test.ts` | ✅ Updated | 15 tests passing, new API coverage |
| `itemSearch.ts` | ⏳ Pending | Need fuzzy matching threshold tests |
| `itemDataStore.ts` | ⏳ Pending | Need addItems merging, getters tests |
| `useItemPrefetcher.ts` | ⏳ Pending | Need retry logic tests |
| `SearchInput.tsx` | ⏳ Pending | Need clear button, keyboard tests |
| `Dropdown.tsx` | ⏳ Pending | Need click outside, footer tests |
| `DropdownItem.tsx` | ⏳ Pending | Need selection state tests |
| `GlobalSearch.tsx` | ⏳ Pending | Need keyboard nav, integration tests |

### Build Status

- ✅ TypeScript compiles with no errors
- ✅ All 231 tests pass
- ✅ Production build succeeds

---

## Build Verification

```powershell
cd frontend

# Type check
npm run type-check

# Run tests
npm test

# Build production
npm run build

# Preview build
npm run preview
```

---

## Files Summary

| Action | File | Status |
|--------|------|--------|
| **Install** | `fuse.js` via npm | ✅ Done |
| **Create** | `frontend/src/utils/itemSearch.ts` | ✅ Done |
| **Create** | `frontend/src/utils/formatters.ts` (or add to existing) | ✅ Already existed |
| **Create** | `frontend/src/stores/itemDataStore.ts` | ✅ Done |
| **Create** | `frontend/src/hooks/useItemPrefetcher.ts` | ✅ Done |
| **Create** | `frontend/src/components/common/SearchInput.tsx` | ✅ Done |
| **Create** | `frontend/src/components/common/Dropdown.tsx` | ✅ Done |
| **Create** | `frontend/src/components/common/DropdownItem.tsx` | ✅ Done |
| **Create** | `frontend/src/components/search/GlobalSearch.tsx` | ✅ Done |
| **Create** | `frontend/src/components/search/SearchResultItem.tsx` | ✅ Done |
| **Create** | `frontend/src/components/search/RecentSearchItem.tsx` | ✅ Done |
| **Create** | `frontend/src/components/search/index.ts` | ✅ Done (barrel export) |
| **Rewrite** | `frontend/src/hooks/useRecentSearches.ts` | ✅ Done |
| **Modify** | `frontend/src/components/layout/Header.tsx` | ✅ Done |
| **Modify** | `frontend/src/components/layout/MainLayout.tsx` | ✅ Partial (Ctrl+K, no modal) |
| **Modify** | `frontend/src/pages/DashboardPage.tsx` | ⏳ Not started |
| **Modify** | `frontend/src/components/table/TableToolbar.tsx` | ⏳ Not started |
| **Modify** | `frontend/src/stores/uiStore.ts` | ⏳ Not started |
| **Modify** | `frontend/src/hooks/useItems.ts` | ⏳ Not started |
| **Modify** | `frontend/src/api/client.ts` | ⏳ Not started |
| **Delete** | `frontend/src/components/common/SearchModal.tsx` | ✅ Done |
| **Delete** | `frontend/src/components/common/SearchModal.test.tsx` | ✅ Done |
| **Modify** | `frontend/src/components/common/index.ts` | ✅ Done (removed export) |
| **Modify** | `backend/internal/handlers/item_handler.go` | ⏳ Not started |
| **Modify** | `backend/internal/services/item_service.go` | ⏳ Not started |
| **Modify** | `backend/internal/repository/item_repository.go` | ⏳ Not started |
| **Modify** | `backend/internal/repository/interfaces.go` | ⏳ Not started |

---

## Success Criteria

| Criterion | Status |
|-----------|--------|
| **No modal** — Search is inline dropdown, never covers screen | ✅ Done |
| **Typo tolerance** — Fuse.js finds items despite minor typos | ✅ Done |
| **Prices in dropdown** — Shows high/low prices when available | ✅ Done |
| **Background loading** — All items prefetch on app mount | ⏳ Hook ready, needs integration |
| **Loading indicator** — "Searching X items..." until fully loaded | ✅ Done |
| **Client-side table** — Pagination and filtering work without API calls | ⏳ Not started |
| **Global search** — Available from Header on all pages | ✅ Done |
| **Backend cleanup** — Search endpoint removed, no dead code | ⏳ Not started |

---

## Next Steps

1. **Integrate prefetcher in MainLayout** — Add `useItemPrefetcher()` and price sync to store
2. **Refactor DashboardPage** — Switch to client-side pagination using itemDataStore
3. **Update TableToolbar** — Use shared SearchInput component
4. **Clean up stores/hooks/api** — Remove search modal state, search API functions
5. **Backend cleanup** — Remove search endpoint and related code
6. **Add remaining unit tests** — Cover new components and utilities
