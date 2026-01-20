/**
 * Zustand store for watchlists
 * Supports multiple named watchlists with items
 * Migrates from legacy favorites store
 */

import { v4 as uuidv4 } from 'uuid';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Watchlist, WatchlistItem } from '../../types/watchlist';
import { DEFAULT_WATCHLIST_ID, WATCHLIST_LIMITS } from '../../types/watchlist';
import type { FavoriteItem } from '../user/useFavoritesStore';

/**
 * Watchlist store state
 */
interface WatchlistState {
    /** Map of watchlist ID to watchlist */
    watchlists: Record<string, Watchlist>;
    /** Currently active watchlist ID (for UI) */
    activeWatchlistId: string;
    /** Migration flag */
    migrated: boolean;
}

/**
 * Watchlist store actions
 */
interface WatchlistActions {
    // Watchlist management
    createWatchlist: (name: string) => string | null;
    deleteWatchlist: (id: string) => boolean;
    renameWatchlist: (id: string, name: string) => boolean;
    getWatchlist: (id: string) => Watchlist | undefined;
    getAllWatchlists: () => Watchlist[];
    getWatchlistCount: () => number;
    setActiveWatchlist: (id: string) => void;

    // Item management
    addItemToWatchlist: (watchlistId: string, item: Omit<WatchlistItem, 'addedAt'>) => boolean;
    removeItemFromWatchlist: (watchlistId: string, itemId: number) => void;
    moveItemBetweenWatchlists: (fromId: string, toId: string, itemId: number) => boolean;
    isItemInWatchlist: (watchlistId: string, itemId: number) => boolean;
    getItemWatchlists: (itemId: number) => Watchlist[];
    updateItemNotes: (watchlistId: string, itemId: number, notes: string) => boolean;

    // Bulk operations
    clearWatchlist: (id: string) => void;
    importWatchlist: (watchlist: Watchlist) => string | null;
    exportWatchlist: (id: string) => Watchlist | undefined;
    exportAllWatchlists: () => Watchlist[];

    // Migration
    migrateFromFavorites: (favorites: Record<number, FavoriteItem>) => void;
}

/**
 * Create default "Favorites" watchlist
 */
function createDefaultWatchlist(): Watchlist {
    return {
        id: DEFAULT_WATCHLIST_ID,
        name: 'Favorites',
        items: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
        isDefault: true,
    };
}

/**
 * Watchlist store with persistence
 */
export const useWatchlistStore = create<WatchlistState & WatchlistActions>()(
    persist(
        (set, get) => ({
            watchlists: {
                [DEFAULT_WATCHLIST_ID]: createDefaultWatchlist(),
            },
            activeWatchlistId: DEFAULT_WATCHLIST_ID,
            migrated: false,

            // Watchlist management
            createWatchlist: (name: string) => {
                const state = get();
                const watchlistCount = Object.keys(state.watchlists).length;

                // Check limit
                if (watchlistCount >= WATCHLIST_LIMITS.MAX_WATCHLISTS) {
                    console.warn('Maximum watchlist limit reached');
                    return null;
                }

                // Validate name
                const trimmedName = name.trim();
                if (
                    trimmedName.length < WATCHLIST_LIMITS.MIN_NAME_LENGTH ||
                    trimmedName.length > WATCHLIST_LIMITS.MAX_NAME_LENGTH
                ) {
                    console.warn('Invalid watchlist name length');
                    return null;
                }

                // Check for duplicate names
                const existingNames = Object.values(state.watchlists).map((w) => w.name.toLowerCase());
                if (existingNames.includes(trimmedName.toLowerCase())) {
                    console.warn('Watchlist name already exists');
                    return null;
                }

                const newWatchlist: Watchlist = {
                    id: uuidv4(),
                    name: trimmedName,
                    items: [],
                    createdAt: Date.now(),
                    updatedAt: Date.now(),
                    isDefault: false,
                };

                set((state) => ({
                    watchlists: {
                        ...state.watchlists,
                        [newWatchlist.id]: newWatchlist,
                    },
                }));

                return newWatchlist.id;
            },

            deleteWatchlist: (id: string) => {
                const state = get();
                const watchlist = state.watchlists[id];

                // Cannot delete default watchlist
                if (!watchlist || watchlist.isDefault) {
                    console.warn('Cannot delete default watchlist');
                    return false;
                }

                set((state) => {
                    const newWatchlists = { ...state.watchlists };
                    delete newWatchlists[id];

                    return {
                        watchlists: newWatchlists,
                        activeWatchlistId:
                            state.activeWatchlistId === id ? DEFAULT_WATCHLIST_ID : state.activeWatchlistId,
                    };
                });

                return true;
            },

            renameWatchlist: (id: string, name: string) => {
                const state = get();
                const watchlist = state.watchlists[id];

                if (!watchlist) {
                    return false;
                }

                // Cannot rename default watchlist
                if (watchlist.isDefault) {
                    console.warn('Cannot rename default watchlist');
                    return false;
                }

                // Validate name
                const trimmedName = name.trim();
                if (
                    trimmedName.length < WATCHLIST_LIMITS.MIN_NAME_LENGTH ||
                    trimmedName.length > WATCHLIST_LIMITS.MAX_NAME_LENGTH
                ) {
                    return false;
                }

                // Check for duplicate names (excluding current watchlist)
                const existingNames = Object.values(state.watchlists)
                    .filter((w) => w.id !== id)
                    .map((w) => w.name.toLowerCase());

                if (existingNames.includes(trimmedName.toLowerCase())) {
                    return false;
                }

                set((state) => ({
                    watchlists: {
                        ...state.watchlists,
                        [id]: {
                            ...state.watchlists[id],
                            name: trimmedName,
                            updatedAt: Date.now(),
                        },
                    },
                }));

                return true;
            },

            getWatchlist: (id: string) => {
                const state = get();
                return state.watchlists[id];
            },

            getAllWatchlists: () => {
                const state = get();
                return Object.values(state.watchlists).sort((a, b) => {
                    // Default watchlist first
                    if (a.isDefault) return -1;
                    if (b.isDefault) return 1;
                    // Then by creation date
                    return b.createdAt - a.createdAt;
                });
            },

            getWatchlistCount: () => {
                const state = get();
                return Object.keys(state.watchlists).length;
            },

            setActiveWatchlist: (id: string) => {
                const state = get();
                if (state.watchlists[id]) {
                    set({ activeWatchlistId: id });
                }
            },

            // Item management
            addItemToWatchlist: (watchlistId: string, item: Omit<WatchlistItem, 'addedAt'>) => {
                const state = get();
                const watchlist = state.watchlists[watchlistId];

                if (!watchlist) {
                    return false;
                }

                // Check if item already exists
                if (watchlist.items.some((i) => i.itemId === item.itemId)) {
                    console.warn('Item already in watchlist');
                    return false;
                }

                // Check item limit
                if (watchlist.items.length >= WATCHLIST_LIMITS.MAX_ITEMS_PER_WATCHLIST) {
                    console.warn('Watchlist item limit reached');
                    return false;
                }

                const newItem: WatchlistItem = {
                    ...item,
                    addedAt: Date.now(),
                };

                set((state) => ({
                    watchlists: {
                        ...state.watchlists,
                        [watchlistId]: {
                            ...state.watchlists[watchlistId],
                            items: [...state.watchlists[watchlistId].items, newItem],
                            updatedAt: Date.now(),
                        },
                    },
                }));

                return true;
            },

            removeItemFromWatchlist: (watchlistId: string, itemId: number) => {
                const state = get();
                const watchlist = state.watchlists[watchlistId];

                if (!watchlist) {
                    return;
                }

                set((state) => ({
                    watchlists: {
                        ...state.watchlists,
                        [watchlistId]: {
                            ...state.watchlists[watchlistId],
                            items: state.watchlists[watchlistId].items.filter((i) => i.itemId !== itemId),
                            updatedAt: Date.now(),
                        },
                    },
                }));
            },

            moveItemBetweenWatchlists: (fromId: string, toId: string, itemId: number) => {
                const state = get();
                const fromWatchlist = state.watchlists[fromId];
                const toWatchlist = state.watchlists[toId];

                if (!fromWatchlist || !toWatchlist) {
                    return false;
                }

                // Find the item in source watchlist
                const item = fromWatchlist.items.find((i) => i.itemId === itemId);
                if (!item) {
                    return false;
                }

                // Check if item already in destination
                if (toWatchlist.items.some((i) => i.itemId === itemId)) {
                    return false;
                }

                // Check destination limit
                if (toWatchlist.items.length >= WATCHLIST_LIMITS.MAX_ITEMS_PER_WATCHLIST) {
                    return false;
                }

                set((state) => ({
                    watchlists: {
                        ...state.watchlists,
                        [fromId]: {
                            ...state.watchlists[fromId],
                            items: state.watchlists[fromId].items.filter((i) => i.itemId !== itemId),
                            updatedAt: Date.now(),
                        },
                        [toId]: {
                            ...state.watchlists[toId],
                            items: [...state.watchlists[toId].items, { ...item, addedAt: Date.now() }],
                            updatedAt: Date.now(),
                        },
                    },
                }));

                return true;
            },

            isItemInWatchlist: (watchlistId: string, itemId: number) => {
                const state = get();
                const watchlist = state.watchlists[watchlistId];
                return watchlist ? watchlist.items.some((i) => i.itemId === itemId) : false;
            },

            getItemWatchlists: (itemId: number) => {
                const state = get();
                return Object.values(state.watchlists).filter((watchlist) =>
                    watchlist.items.some((i) => i.itemId === itemId)
                );
            },

            updateItemNotes: (watchlistId: string, itemId: number, notes: string) => {
                const state = get();
                const watchlist = state.watchlists[watchlistId];

                if (!watchlist) {
                    return false;
                }

                const itemIndex = watchlist.items.findIndex((i) => i.itemId === itemId);
                if (itemIndex === -1) {
                    return false;
                }

                // Validate notes length
                if (notes.length > WATCHLIST_LIMITS.MAX_NOTE_LENGTH) {
                    return false;
                }

                set((state) => {
                    const updatedItems = [...state.watchlists[watchlistId].items];
                    updatedItems[itemIndex] = {
                        ...updatedItems[itemIndex],
                        notes: notes.trim() || undefined,
                    };

                    return {
                        watchlists: {
                            ...state.watchlists,
                            [watchlistId]: {
                                ...state.watchlists[watchlistId],
                                items: updatedItems,
                                updatedAt: Date.now(),
                            },
                        },
                    };
                });

                return true;
            },

            // Bulk operations
            clearWatchlist: (id: string) => {
                const state = get();
                const watchlist = state.watchlists[id];

                if (!watchlist) {
                    return;
                }

                set((state) => ({
                    watchlists: {
                        ...state.watchlists,
                        [id]: {
                            ...state.watchlists[id],
                            items: [],
                            updatedAt: Date.now(),
                        },
                    },
                }));
            },

            importWatchlist: (watchlist: Watchlist) => {
                const state = get();
                const watchlistCount = Object.keys(state.watchlists).length;

                // Check limit
                if (watchlistCount >= WATCHLIST_LIMITS.MAX_WATCHLISTS) {
                    console.warn('Maximum watchlist limit reached');
                    return null;
                }

                // Generate new ID to avoid conflicts
                const newId = uuidv4();
                const importedWatchlist: Watchlist = {
                    ...watchlist,
                    id: newId,
                    isDefault: false, // Imported watchlists are never default
                    createdAt: Date.now(),
                    updatedAt: Date.now(),
                };

                set((state) => ({
                    watchlists: {
                        ...state.watchlists,
                        [newId]: importedWatchlist,
                    },
                }));

                return newId;
            },

            exportWatchlist: (id: string) => {
                const state = get();
                return state.watchlists[id];
            },

            exportAllWatchlists: () => {
                const state = get();
                return Object.values(state.watchlists);
            },

            // Migration from favorites
            migrateFromFavorites: (favorites: Record<number, FavoriteItem>) => {
                const state = get();

                // Only migrate once
                if (state.migrated) {
                    return;
                }

                // Convert favorites to watchlist items
                const items: WatchlistItem[] = Object.values(favorites).map((fav) => ({
                    itemId: fav.itemId,
                    name: fav.name,
                    iconUrl: fav.iconUrl,
                    addedAt: fav.addedAt,
                }));

                // Update default watchlist with migrated items
                if (items.length > 0) {
                    set((state) => ({
                        watchlists: {
                            ...state.watchlists,
                            [DEFAULT_WATCHLIST_ID]: {
                                ...state.watchlists[DEFAULT_WATCHLIST_ID],
                                items,
                                updatedAt: Date.now(),
                            },
                        },
                        migrated: true,
                    }));

                    console.log(`Migrated ${items.length} favorites to default watchlist`);
                } else {
                    set({ migrated: true });
                }
            },
        }),
        {
            name: 'osrs-ge-tracker-watchlists',
            version: 1,
        }
    )
);

// Auto-migrate on first load
if (typeof window !== 'undefined') {
    try {
        const favoritesData = localStorage.getItem('osrs-ge-tracker-favorites');
        if (favoritesData) {
            const parsed = JSON.parse(favoritesData);
            if (parsed.state?.favorites) {
                const store = useWatchlistStore.getState();
                if (!store.migrated) {
                    store.migrateFromFavorites(parsed.state.favorites);
                }
            }
        }
    } catch (error) {
        console.error('Failed to migrate favorites:', error);
    }
}
