/**
 * Unit tests for itemDataStore
 * Tests Zustand store for item and price data
 */

import { beforeEach, describe, expect, it } from 'vitest';
import type { CurrentPrice, Item } from '../types';
import { useItemDataStore } from './itemDataStore';

describe('itemDataStore', () => {
    beforeEach(() => {
        // Reset store to initial state before each test
        useItemDataStore.getState().reset();
    });

    const mockItem1: Item = {
        itemId: 1,
        name: 'Dragon scimitar',
        description: 'A powerful scimitar',
        iconUrl: 'https://example.com/dragon-scim.png',
        members: true,
        tradeable: true,
        equipable: true,
    };

    const mockItem2: Item = {
        itemId: 2,
        name: 'Abyssal whip',
        description: 'A demonic whip',
        iconUrl: 'https://example.com/whip.png',
        members: true,
        tradeable: true,
        equipable: true,
    };

    const mockPrice1: CurrentPrice = {
        itemId: 1,
        highPrice: 100000,
        lowPrice: 95000,
        highPriceVolume: 500,
        lowPriceVolume: 600,
        timestamp: Date.now(),
    };

    const mockPrice2: CurrentPrice = {
        itemId: 2,
        highPrice: 2500000,
        lowPrice: 2400000,
        highPriceVolume: 200,
        lowPriceVolume: 250,
        timestamp: Date.now(),
    };

    describe('Initial State', () => {
        it('starts with empty items and prices', () => {
            const state = useItemDataStore.getState();

            expect(state.items.size).toBe(0);
            expect(state.currentPrices.size).toBe(0);
            expect(state.isFullyLoaded).toBe(false);
            expect(state.pricesLoaded).toBe(false);
            expect(state.loadError).toBe(null);
        });

        it('has working getter functions', () => {
            const state = useItemDataStore.getState();

            expect(state.getItemsArray()).toEqual([]);
            expect(state.getItemById(1)).toBeUndefined();
            expect(state.getPriceById(1)).toBeUndefined();
            expect(state.getItemWithPrice(1)).toBeUndefined();
            expect(state.getItemCount()).toBe(0);
        });
    });

    describe('addItems', () => {
        it('adds items to the store', () => {
            const { addItems, getItemsArray } = useItemDataStore.getState();

            addItems([mockItem1]);

            const items = getItemsArray();
            expect(items).toHaveLength(1);
            expect(items[0]).toEqual(mockItem1);
        });

        it('adds multiple items', () => {
            const { addItems, getItemsArray } = useItemDataStore.getState();

            addItems([mockItem1, mockItem2]);

            const items = getItemsArray();
            expect(items).toHaveLength(2);
            expect(items).toContainEqual(mockItem1);
            expect(items).toContainEqual(mockItem2);
        });

        it('keys items by itemId', () => {
            const { addItems, getItemById } = useItemDataStore.getState();

            addItems([mockItem1, mockItem2]);

            expect(getItemById(1)).toEqual(mockItem1);
            expect(getItemById(2)).toEqual(mockItem2);
        });

        it('merges items on subsequent calls', () => {
            const { addItems, getItemCount } = useItemDataStore.getState();

            addItems([mockItem1]);
            expect(getItemCount()).toBe(1);

            addItems([mockItem2]);
            expect(getItemCount()).toBe(2);
        });

        it('updates existing items', () => {
            const { addItems, getItemById } = useItemDataStore.getState();

            addItems([mockItem1]);

            const updatedItem: Item = { ...mockItem1, name: 'Updated name' };
            addItems([updatedItem]);

            const result = getItemById(1);
            expect(result?.name).toBe('Updated name');
            expect(useItemDataStore.getState().getItemCount()).toBe(1);
        });

        it('handles empty array', () => {
            const { addItems, getItemCount } = useItemDataStore.getState();

            addItems([]);
            expect(getItemCount()).toBe(0);
        });
    });

    describe('setPrices', () => {
        it('sets current prices', () => {
            const { setPrices, getPriceById } = useItemDataStore.getState();

            setPrices([mockPrice1]);

            const price = getPriceById(1);
            expect(price).toEqual(mockPrice1);
        });

        it('sets multiple prices', () => {
            const { setPrices, getPriceById } = useItemDataStore.getState();

            setPrices([mockPrice1, mockPrice2]);

            expect(getPriceById(1)).toEqual(mockPrice1);
            expect(getPriceById(2)).toEqual(mockPrice2);
        });

        it('sets pricesLoaded to true', () => {
            const { setPrices } = useItemDataStore.getState();

            expect(useItemDataStore.getState().pricesLoaded).toBe(false);

            setPrices([mockPrice1]);

            expect(useItemDataStore.getState().pricesLoaded).toBe(true);
        });

        it('replaces previous prices (not merge)', () => {
            const { setPrices, getPriceById } = useItemDataStore.getState();

            setPrices([mockPrice1, mockPrice2]);
            expect(useItemDataStore.getState().currentPrices.size).toBe(2);

            // Set only price1 again
            setPrices([mockPrice1]);
            expect(useItemDataStore.getState().currentPrices.size).toBe(1);
            expect(getPriceById(1)).toEqual(mockPrice1);
            expect(getPriceById(2)).toBeUndefined();
        });

        it('handles empty array', () => {
            const { setPrices } = useItemDataStore.getState();

            setPrices([]);

            expect(useItemDataStore.getState().currentPrices.size).toBe(0);
            expect(useItemDataStore.getState().pricesLoaded).toBe(true);
        });
    });

    describe('getItemsArray', () => {
        it('returns array of all items', () => {
            const { addItems, getItemsArray } = useItemDataStore.getState();

            addItems([mockItem1, mockItem2]);

            const items = getItemsArray();
            expect(items).toHaveLength(2);
            expect(items).toContainEqual(mockItem1);
            expect(items).toContainEqual(mockItem2);
        });

        it('returns empty array when no items', () => {
            const { getItemsArray } = useItemDataStore.getState();
            expect(getItemsArray()).toEqual([]);
        });
    });

    describe('getItemById', () => {
        it('returns item by ID', () => {
            const { addItems, getItemById } = useItemDataStore.getState();

            addItems([mockItem1, mockItem2]);

            expect(getItemById(1)).toEqual(mockItem1);
            expect(getItemById(2)).toEqual(mockItem2);
        });

        it('returns undefined for non-existent ID', () => {
            const { getItemById } = useItemDataStore.getState();
            expect(getItemById(999)).toBeUndefined();
        });
    });

    describe('getPriceById', () => {
        it('returns price by item ID', () => {
            const { setPrices, getPriceById } = useItemDataStore.getState();

            setPrices([mockPrice1, mockPrice2]);

            expect(getPriceById(1)).toEqual(mockPrice1);
            expect(getPriceById(2)).toEqual(mockPrice2);
        });

        it('returns undefined for non-existent ID', () => {
            const { getPriceById } = useItemDataStore.getState();
            expect(getPriceById(999)).toBeUndefined();
        });
    });

    describe('getItemWithPrice', () => {
        it('returns item with price when both exist', () => {
            const { addItems, setPrices, getItemWithPrice } = useItemDataStore.getState();

            addItems([mockItem1]);
            setPrices([mockPrice1]);

            const result = getItemWithPrice(1);
            expect(result).toEqual({
                item: mockItem1,
                price: mockPrice1,
            });
        });

        it('returns item without price when price missing', () => {
            const { addItems, getItemWithPrice } = useItemDataStore.getState();

            addItems([mockItem1]);

            const result = getItemWithPrice(1);
            expect(result).toEqual({
                item: mockItem1,
                price: undefined,
            });
        });

        it('returns undefined when item does not exist', () => {
            const { setPrices, getItemWithPrice } = useItemDataStore.getState();

            // Price exists but no item
            setPrices([mockPrice1]);

            expect(getItemWithPrice(1)).toBeUndefined();
        });

        it('returns undefined for non-existent ID', () => {
            const { getItemWithPrice } = useItemDataStore.getState();
            expect(getItemWithPrice(999)).toBeUndefined();
        });
    });

    describe('getItemCount', () => {
        it('returns count of items', () => {
            const { addItems, getItemCount } = useItemDataStore.getState();

            expect(getItemCount()).toBe(0);

            addItems([mockItem1]);
            expect(getItemCount()).toBe(1);

            addItems([mockItem2]);
            expect(getItemCount()).toBe(2);
        });
    });

    describe('setFullyLoaded', () => {
        it('sets isFullyLoaded to true', () => {
            const { setFullyLoaded } = useItemDataStore.getState();

            expect(useItemDataStore.getState().isFullyLoaded).toBe(false);

            setFullyLoaded();

            expect(useItemDataStore.getState().isFullyLoaded).toBe(true);
        });
    });

    describe('setPricesLoaded', () => {
        it('sets pricesLoaded to true', () => {
            const { setPricesLoaded } = useItemDataStore.getState();

            expect(useItemDataStore.getState().pricesLoaded).toBe(false);

            setPricesLoaded();

            expect(useItemDataStore.getState().pricesLoaded).toBe(true);
        });
    });

    describe('setLoadError', () => {
        it('sets error message', () => {
            const { setLoadError } = useItemDataStore.getState();

            setLoadError('Test error');

            expect(useItemDataStore.getState().loadError).toBe('Test error');
        });

        it('clears error when passed null', () => {
            const { setLoadError } = useItemDataStore.getState();

            setLoadError('Test error');
            expect(useItemDataStore.getState().loadError).toBe('Test error');

            setLoadError(null);
            expect(useItemDataStore.getState().loadError).toBe(null);
        });
    });

    describe('reset', () => {
        it('resets store to initial state', () => {
            const { addItems, setPrices, setFullyLoaded, setLoadError, reset } = useItemDataStore.getState();

            // Populate store
            addItems([mockItem1, mockItem2]);
            setPrices([mockPrice1, mockPrice2]);
            setFullyLoaded();
            setLoadError('Test error');

            // Verify populated
            expect(useItemDataStore.getState().items.size).toBe(2);
            expect(useItemDataStore.getState().currentPrices.size).toBe(2);
            expect(useItemDataStore.getState().isFullyLoaded).toBe(true);
            expect(useItemDataStore.getState().pricesLoaded).toBe(true);
            expect(useItemDataStore.getState().loadError).toBe('Test error');

            // Reset
            reset();

            // Verify reset
            const state = useItemDataStore.getState();
            expect(state.items.size).toBe(0);
            expect(state.currentPrices.size).toBe(0);
            expect(state.isFullyLoaded).toBe(false);
            expect(state.pricesLoaded).toBe(false);
            expect(state.loadError).toBe(null);
        });
    });

    describe('Integration scenarios', () => {
        it('handles typical app lifecycle', () => {
            const {
                addItems,
                setPrices,
                setFullyLoaded,
                getItemsArray,
                getPriceById,
                getItemWithPrice,
            } = useItemDataStore.getState();

            // 1. First page of items loads
            addItems([mockItem1]);
            expect(getItemsArray()).toHaveLength(1);

            // 2. Prices load
            setPrices([mockPrice1]);
            expect(getPriceById(1)).toEqual(mockPrice1);

            // 3. Second page of items loads
            addItems([mockItem2]);
            expect(getItemsArray()).toHaveLength(2);

            // 4. All items loaded
            setFullyLoaded();
            expect(useItemDataStore.getState().isFullyLoaded).toBe(true);

            // 5. Prices update (refetch)
            const updatedPrice = { ...mockPrice1, highPrice: 105000 };
            setPrices([updatedPrice, mockPrice2]);

            expect(getPriceById(1)?.highPrice).toBe(105000);

            // 6. Can retrieve combined data
            const combined = getItemWithPrice(1);
            expect(combined?.item).toEqual(mockItem1);
            expect(combined?.price.highPrice).toBe(105000);
        });

        it('handles price updates without losing items', () => {
            const { addItems, setPrices, getItemById, getPriceById } = useItemDataStore.getState();

            addItems([mockItem1, mockItem2]);
            setPrices([mockPrice1]);

            // Initial state
            expect(getItemById(1)).toBeDefined();
            expect(getItemById(2)).toBeDefined();
            expect(getPriceById(1)).toBeDefined();
            expect(getPriceById(2)).toBeUndefined();

            // Price update (full replacement)
            setPrices([mockPrice1, mockPrice2]);

            // Items unchanged, prices updated
            expect(getItemById(1)).toBeDefined();
            expect(getItemById(2)).toBeDefined();
            expect(getPriceById(1)).toBeDefined();
            expect(getPriceById(2)).toBeDefined();
        });
    });
});
