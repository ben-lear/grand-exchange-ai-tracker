/**
 * Mock Zustand stores for testing
 */

import { vi } from 'vitest';

/**
 * Mock watchlist store for testing watchlist-related components
 */
export const mockWatchlistStore = {
    watchlists: [],
    activeWatchlistId: null,
    setActiveWatchlist: vi.fn(),
    addToWatchlist: vi.fn(),
    removeFromWatchlist: vi.fn(),
    createWatchlist: vi.fn(),
    deleteWatchlist: vi.fn(),
    updateWatchlist: vi.fn(),
    isInWatchlist: vi.fn(() => false),
    getWatchlistById: vi.fn(() => undefined),
    getActiveWatchlist: vi.fn(() => undefined),
    reset: vi.fn(),
};

/**
 * Mock pinned items store for testing pin-related components
 */
export const mockPinnedStore = {
    pinnedIds: [] as number[],
    togglePin: vi.fn(),
    isPinned: vi.fn(() => false),
    clearPinned: vi.fn(),
    getPinnedCount: vi.fn(() => 0),
};

/**
 * Mock favorites store for testing favorite-related components
 */
export const mockFavoritesStore = {
    favoriteIds: [] as number[],
    toggleFavorite: vi.fn(),
    isFavorite: vi.fn(() => false),
    clearFavorites: vi.fn(),
    getFavoriteCount: vi.fn(() => 0),
};

/**
 * Mock item data store for testing data-related components
 */
export const mockItemDataStore = {
    items: {},
    prices: {},
    isFullyLoaded: false,
    pricesLoaded: false,
    loadError: null,
    addItems: vi.fn(),
    setPrices: vi.fn(),
    getItemsArray: vi.fn(() => []),
    getItemById: vi.fn(() => undefined),
    getPriceById: vi.fn(() => undefined),
    getItemWithPrice: vi.fn(() => undefined),
    getItemCount: vi.fn(() => 0),
    setFullyLoaded: vi.fn(),
    setPricesLoaded: vi.fn(),
    setLoadError: vi.fn(),
    reset: vi.fn(),
};

/**
 * Reset all mock stores to their initial state
 */
export function resetAllMockStores(): void {
    // Reset all mock functions
    Object.values(mockWatchlistStore).forEach(value => {
        if (typeof value === 'function' && 'mockReset' in value) {
            value.mockReset();
        }
    });
    Object.values(mockPinnedStore).forEach(value => {
        if (typeof value === 'function' && 'mockReset' in value) {
            value.mockReset();
        }
    });
    Object.values(mockFavoritesStore).forEach(value => {
        if (typeof value === 'function' && 'mockReset' in value) {
            value.mockReset();
        }
    });
    Object.values(mockItemDataStore).forEach(value => {
        if (typeof value === 'function' && 'mockReset' in value) {
            value.mockReset();
        }
    });

    // Reset default return values
    mockWatchlistStore.isInWatchlist.mockReturnValue(false);
    mockWatchlistStore.getWatchlistById.mockReturnValue(undefined);
    mockWatchlistStore.getActiveWatchlist.mockReturnValue(undefined);

    mockPinnedStore.isPinned.mockReturnValue(false);
    mockPinnedStore.getPinnedCount.mockReturnValue(0);

    mockFavoritesStore.isFavorite.mockReturnValue(false);
    mockFavoritesStore.getFavoriteCount.mockReturnValue(0);

    mockItemDataStore.getItemsArray.mockReturnValue([]);
    mockItemDataStore.getItemById.mockReturnValue(undefined);
    mockItemDataStore.getPriceById.mockReturnValue(undefined);
    mockItemDataStore.getItemWithPrice.mockReturnValue(undefined);
    mockItemDataStore.getItemCount.mockReturnValue(0);
}
