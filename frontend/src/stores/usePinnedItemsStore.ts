/**
 * Zustand store for pinned items
 * Allows users to pin items to the top of the table
 * Pinned items are immune to filters
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * Maximum number of items that can be pinned
 */
export const MAX_PINNED_ITEMS = 50;

/**
 * Pinned items store state
 */
interface PinnedItemsState {
    /** Set of pinned item IDs */
    pinnedItems: Set<number>;
}

/**
 * Pinned items store actions
 */
interface PinnedItemsActions {
    /** Toggle pin status for an item. Returns false if at limit and trying to pin. */
    togglePin: (itemId: number) => boolean;
    /** Check if an item is pinned */
    isPinned: (itemId: number) => boolean;
    /** Get array of pinned item IDs */
    getPinnedItemIds: () => number[];
    /** Get count of pinned items */
    getPinnedCount: () => number;
    /** Remove all pins (for testing/reset) */
    clearAllPins: () => void;
}

/**
 * Pinned items store with localStorage persistence
 */
export const usePinnedItemsStore = create<PinnedItemsState & PinnedItemsActions>()(
    persist(
        (set, get) => ({
            pinnedItems: new Set<number>(),

            togglePin: (itemId: number) => {
                const state = get();
                const isPinned = state.pinnedItems.has(itemId);

                if (isPinned) {
                    // Unpinning - always allowed
                    set((state) => {
                        const newPinnedItems = new Set(state.pinnedItems);
                        newPinnedItems.delete(itemId);
                        return { pinnedItems: newPinnedItems };
                    });
                    return true;
                } else {
                    // Pinning - check limit
                    if (state.pinnedItems.size >= MAX_PINNED_ITEMS) {
                        // TODO: Show toast notification when this feature is implemented
                        console.warn(`Cannot pin more than ${MAX_PINNED_ITEMS} items`);
                        return false;
                    }

                    set((state) => {
                        const newPinnedItems = new Set(state.pinnedItems);
                        newPinnedItems.add(itemId);
                        return { pinnedItems: newPinnedItems };
                    });
                    return true;
                }
            },

            isPinned: (itemId: number) => {
                return get().pinnedItems.has(itemId);
            },

            getPinnedItemIds: () => {
                return Array.from(get().pinnedItems);
            },

            getPinnedCount: () => {
                return get().pinnedItems.size;
            },

            clearAllPins: () => {
                set({ pinnedItems: new Set<number>() });
            },
        }),
        {
            name: 'osrs-ge-pinned-items',
            // Custom serialization for Set
            storage: {
                getItem: (name) => {
                    const str = localStorage.getItem(name);
                    if (!str) return null;
                    const data = JSON.parse(str);
                    return {
                        state: {
                            ...data.state,
                            pinnedItems: new Set(data.state.pinnedItems || []),
                        },
                    };
                },
                setItem: (name, value) => {
                    const data = {
                        state: {
                            ...value.state,
                            pinnedItems: Array.from(value.state.pinnedItems),
                        },
                    };
                    localStorage.setItem(name, JSON.stringify(data));
                },
                removeItem: (name) => localStorage.removeItem(name),
            },
        }
    )
);
