/**
 * Unit tests for useRecentSearches hook
 */

import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { useRecentSearches, type RecentItem } from './useRecentSearches';

const STORAGE_KEY = 'osrs-recent-searches';

describe('useRecentSearches', () => {
    beforeEach(() => {
        // Clear localStorage before each test
        localStorage.clear();
    });

    afterEach(() => {
        localStorage.clear();
    });

    it('initializes with empty array', () => {
        const { result } = renderHook(() => useRecentSearches());
        expect(result.current.recentItems).toEqual([]);
    });

    it('loads recent items from localStorage', () => {
        const mockItems: RecentItem[] = [
            { itemId: 1, name: 'Dragon scimitar' },
            { itemId: 2, name: 'Abyssal whip', icon: 'https://example.com/whip.png' },
        ];

        localStorage.setItem(STORAGE_KEY, JSON.stringify(mockItems));

        const { result } = renderHook(() => useRecentSearches());
        expect(result.current.recentItems).toEqual(mockItems);
    });

    it('adds new item to recent items', () => {
        const { result } = renderHook(() => useRecentSearches());

        act(() => {
            result.current.addRecentItem({ itemId: 1, name: 'Dragon scimitar' });
        });

        expect(result.current.recentItems).toHaveLength(1);
        expect(result.current.recentItems[0]).toMatchObject({
            itemId: 1,
            name: 'Dragon scimitar',
        });
    });

    it('adds item to the front of the list', () => {
        const { result } = renderHook(() => useRecentSearches());

        act(() => {
            result.current.addRecentItem({ itemId: 1, name: 'First item' });
            result.current.addRecentItem({ itemId: 2, name: 'Second item' });
        });

        expect(result.current.recentItems[0].name).toBe('Second item');
        expect(result.current.recentItems[1].name).toBe('First item');
    });

    it('removes duplicate items by itemId and moves to front', () => {
        const { result } = renderHook(() => useRecentSearches());

        act(() => {
            result.current.addRecentItem({ itemId: 1, name: 'Dragon scimitar' });
            result.current.addRecentItem({ itemId: 2, name: 'Abyssal whip' });
            result.current.addRecentItem({ itemId: 1, name: 'Dragon scimitar' }); // Duplicate
        });

        expect(result.current.recentItems).toHaveLength(2);
        expect(result.current.recentItems[0].itemId).toBe(1); // Most recent
        expect(result.current.recentItems[1].itemId).toBe(2);
    });

    it('limits recent items to 5 items', () => {
        const { result } = renderHook(() => useRecentSearches());

        act(() => {
            for (let i = 1; i <= 7; i++) {
                result.current.addRecentItem({ itemId: i, name: `Item ${i}` });
            }
        });

        expect(result.current.recentItems).toHaveLength(5);
        expect(result.current.recentItems[0].itemId).toBe(7); // Most recent
        expect(result.current.recentItems[4].itemId).toBe(3); // Oldest kept
    });

    it('removes specific item by itemId', () => {
        const { result } = renderHook(() => useRecentSearches());

        act(() => {
            result.current.addRecentItem({ itemId: 1, name: 'First item' });
            result.current.addRecentItem({ itemId: 2, name: 'Second item' });
            result.current.addRecentItem({ itemId: 3, name: 'Third item' });
        });

        act(() => {
            result.current.removeRecentItem(2);
        });

        expect(result.current.recentItems).toHaveLength(2);
        expect(result.current.recentItems.find((s) => s.itemId === 2)).toBeUndefined();
    });

    it('clears all recent items', () => {
        const { result } = renderHook(() => useRecentSearches());

        act(() => {
            result.current.addRecentItem({ itemId: 1, name: 'First item' });
            result.current.addRecentItem({ itemId: 2, name: 'Second item' });
        });

        expect(result.current.recentItems).toHaveLength(2);

        act(() => {
            result.current.clearRecent();
        });

        expect(result.current.recentItems).toHaveLength(0);
    });

    it('persists items to localStorage', () => {
        const { result } = renderHook(() => useRecentSearches());

        act(() => {
            result.current.addRecentItem({ itemId: 1, name: 'Dragon scimitar' });
        });

        const stored = localStorage.getItem(STORAGE_KEY);
        expect(stored).toBeTruthy();

        const parsed = JSON.parse(stored!);
        expect(parsed).toHaveLength(1);
        expect(parsed[0].itemId).toBe(1);
        expect(parsed[0].name).toBe('Dragon scimitar');
    });

    it('persists items across sessions', () => {
        // First render - add items
        const { result: result1 } = renderHook(() => useRecentSearches());

        act(() => {
            result1.current.addRecentItem({ itemId: 1, name: 'Dragon scimitar' });
            result1.current.addRecentItem({ itemId: 2, name: 'Abyssal whip' });
        });

        // Second render (simulating new session) - should load from localStorage
        const { result: result2 } = renderHook(() => useRecentSearches());

        expect(result2.current.recentItems).toHaveLength(2);
        expect(result2.current.recentItems[0].itemId).toBe(2);
        expect(result2.current.recentItems[1].itemId).toBe(1);
    });

    it('handles corrupted localStorage data gracefully', () => {
        localStorage.setItem(STORAGE_KEY, 'invalid json');

        const { result } = renderHook(() => useRecentSearches());

        // Should initialize with empty array on error
        expect(result.current.recentItems).toEqual([]);
    });

    it('handles non-array localStorage data gracefully', () => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ notAnArray: true }));

        const { result } = renderHook(() => useRecentSearches());

        expect(result.current.recentItems).toEqual([]);
    });

    it('filters out invalid items from localStorage', () => {
        const mixedData = [
            { itemId: 1, name: 'Valid item' },
            { itemId: 'not-a-number', name: 'Invalid ID' },
            { itemId: 2 }, // Missing name
            null,
            'just a string',
            { itemId: 3, name: 'Another valid' },
        ];

        localStorage.setItem(STORAGE_KEY, JSON.stringify(mixedData));

        const { result } = renderHook(() => useRecentSearches());

        expect(result.current.recentItems).toHaveLength(2);
        expect(result.current.recentItems[0].itemId).toBe(1);
        expect(result.current.recentItems[1].itemId).toBe(3);
    });

    it('preserves optional icon field', () => {
        const { result } = renderHook(() => useRecentSearches());

        act(() => {
            result.current.addRecentItem({
                itemId: 1,
                name: 'Dragon scimitar',
                icon: 'https://example.com/icon.png',
            });
        });

        expect(result.current.recentItems[0].icon).toBe('https://example.com/icon.png');
    });

    it('works without icon field', () => {
        const { result } = renderHook(() => useRecentSearches());

        act(() => {
            result.current.addRecentItem({ itemId: 1, name: 'Dragon scimitar' });
        });

        expect(result.current.recentItems[0].icon).toBeUndefined();
    });
});
