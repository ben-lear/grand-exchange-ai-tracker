/**
 * Centralized store for item and price data
 * Persists across route changes and provides shared state for search and table components
 */

import { create } from 'zustand';
import type { CurrentPrice, Item } from '../../types';

export interface ItemDataState {
    // State
    items: Map<number, Item>;
    currentPrices: Map<number, CurrentPrice>;
    isFullyLoaded: boolean;      // All item pages fetched
    pricesLoaded: boolean;       // Initial price fetch complete
    isPrefetching: boolean;      // Prefetch in progress
    loadError: string | null;

    // Computed getters
    getItemsArray: () => Item[];
    getItemById: (id: number) => Item | undefined;
    getPriceById: (id: number) => CurrentPrice | undefined;
    getItemWithPrice: (id: number) => { item: Item; price?: CurrentPrice } | undefined;
    getItemCount: () => number;

    // Actions
    addItems: (items: Item[]) => void;
    setPrices: (prices: CurrentPrice[]) => void;
    setFullyLoaded: () => void;
    setPricesLoaded: () => void;
    setPrefetching: (isPrefetching: boolean) => void;
    setLoadError: (error: string | null) => void;
    reset: () => void;
}

/**
 * Zustand store for item data
 * 
 * Usage:
 * ```tsx
 * const { getItemsArray, getPriceById, isFullyLoaded } = useItemDataStore();
 * const items = getItemsArray();
 * ```
 */
export const useItemDataStore = create<ItemDataState>((set, get) => ({
    // Initial state
    items: new Map(),
    currentPrices: new Map(),
    isFullyLoaded: false,
    pricesLoaded: false,
    isPrefetching: false,
    loadError: null,

    // Computed getters
    getItemsArray: () => Array.from(get().items.values()),

    getItemById: (id) => get().items.get(id),

    getPriceById: (id) => get().currentPrices.get(id),

    getItemWithPrice: (id) => {
        const item = get().items.get(id);
        if (!item) return undefined;
        return { item, price: get().currentPrices.get(id) };
    },

    getItemCount: () => get().items.size,

    // Actions
    addItems: (items) => set((state) => {
        const newMap = new Map(state.items);
        // Key by itemId (OSRS item ID) to match price lookups
        items.forEach((item) => newMap.set(item.itemId, item));
        return { items: newMap };
    }),

    setPrices: (prices) => set(() => {
        const priceMap = new Map<number, CurrentPrice>();
        prices.forEach((price) => priceMap.set(price.itemId, price));
        return { currentPrices: priceMap, pricesLoaded: true };
    }),

    setFullyLoaded: () => set({ isFullyLoaded: true }),

    setPricesLoaded: () => set({ pricesLoaded: true }),

    setPrefetching: (isPrefetching) => set({ isPrefetching }),

    setLoadError: (error) => set({ loadError: error }),

    reset: () => set({
        items: new Map(),
        currentPrices: new Map(),
        isFullyLoaded: false,
        pricesLoaded: false,
        isPrefetching: false,
        loadError: null,
    }),
}));
