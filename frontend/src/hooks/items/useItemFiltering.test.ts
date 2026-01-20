import type { FilterState } from '@/components/table';
import type { CurrentPrice, Item } from '@/types';
import { renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useItemFiltering } from './useItemFiltering';

const mockItems: Item[] = [
  {
    id: 1,
    itemId: 1,
    name: 'Bronze sword',
    description: 'A basic sword',
    iconUrl: '',
    members: false,
    buyLimit: 100,
    highAlch: 10,
    lowAlch: 5,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-02T00:00:00Z',
  },
  {
    id: 2,
    itemId: 2,
    name: 'Abyssal whip',
    description: 'A powerful whip',
    iconUrl: '',
    members: true,
    buyLimit: 70,
    highAlch: 72000,
    lowAlch: 48000,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-02T00:00:00Z',
  },
  {
    id: 3,
    itemId: 3,
    name: 'Dragon scimitar',
    description: 'A curved sword',
    iconUrl: '',
    members: true,
    buyLimit: 100,
    highAlch: 55200,
    lowAlch: 36800,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-02T00:00:00Z',
  },
];

const now = new Date().toISOString();

const mockPrices = new Map<number, CurrentPrice>([
  [1, { itemId: 1, highPrice: 100, lowPrice: 90, highPriceTime: now, lowPriceTime: now, updatedAt: now }],
  [2, { itemId: 2, highPrice: 2000000, lowPrice: 1950000, highPriceTime: now, lowPriceTime: now, updatedAt: now }],
  [3, { itemId: 3, highPrice: 90000, lowPrice: 85000, highPriceTime: now, lowPriceTime: now, updatedAt: now }],
]);

const defaultFilters: FilterState = { members: 'all' };

describe('useItemFiltering', () => {
  describe('Basic filtering', () => {
    it('should return all items when no filters applied', () => {
      const { result } = renderHook(() =>
        useItemFiltering({
          items: mockItems,
          filters: defaultFilters,
          searchQuery: '',
          pinnedIds: new Set(),
          currentPrices: mockPrices,
        })
      );

      expect(result.current.filteredItems).toHaveLength(3);
      expect(result.current.filteredItems.map(item => item.itemId)).toEqual([1, 2, 3]);
    });

    it('should filter by members only', () => {
      const { result } = renderHook(() =>
        useItemFiltering({
          items: mockItems,
          filters: { members: 'members' },
          searchQuery: '',
          pinnedIds: new Set(),
          currentPrices: mockPrices,
        })
      );

      expect(result.current.filteredItems).toHaveLength(2);
      expect(result.current.filteredItems.map(item => item.itemId)).toEqual([2, 3]);
    });

    it('should filter by F2P only', () => {
      const { result } = renderHook(() =>
        useItemFiltering({
          items: mockItems,
          filters: { members: 'f2p' },
          searchQuery: '',
          pinnedIds: new Set(),
          currentPrices: mockPrices,
        })
      );

      expect(result.current.filteredItems).toHaveLength(1);
      expect(result.current.filteredItems.map(item => item.itemId)).toEqual([1]);
    });

    it('should filter by minimum price', () => {
      const { result } = renderHook(() =>
        useItemFiltering({
          items: mockItems,
          filters: { members: 'all', priceMin: 50000 },
          searchQuery: '',
          pinnedIds: new Set(),
          currentPrices: mockPrices,
        })
      );

      expect(result.current.filteredItems).toHaveLength(2);
      expect(result.current.filteredItems.map(item => item.itemId)).toEqual([2, 3]);
    });

    it('should filter by maximum price', () => {
      const { result } = renderHook(() =>
        useItemFiltering({
          items: mockItems,
          filters: { members: 'all', priceMax: 100000 },
          searchQuery: '',
          pinnedIds: new Set(),
          currentPrices: mockPrices,
        })
      );

      expect(result.current.filteredItems).toHaveLength(2);
      expect(result.current.filteredItems.map(item => item.itemId)).toEqual([1, 3]);
    });
  });

  describe('Search functionality', () => {
    it('should filter by search query', () => {
      const { result } = renderHook(() =>
        useItemFiltering({
          items: mockItems,
          filters: defaultFilters,
          searchQuery: 'sword',
          pinnedIds: new Set(),
          currentPrices: mockPrices,
        })
      );

      // Should match "Bronze sword" and "Dragon scimitar" (curved sword)
      expect(result.current.filteredItems.length).toBeGreaterThan(0);
      expect(result.current.filteredItems.some(item => item.name.includes('sword'))).toBe(true);
    });

    it('should handle empty search results', () => {
      const { result } = renderHook(() =>
        useItemFiltering({
          items: mockItems,
          filters: defaultFilters,
          searchQuery: 'nonexistent item',
          pinnedIds: new Set(),
          currentPrices: mockPrices,
        })
      );

      expect(result.current.filteredItems).toHaveLength(0);
    });
  });

  describe('Pinned items ordering', () => {
    it('should place pinned items first', () => {
      const { result } = renderHook(() =>
        useItemFiltering({
          items: mockItems,
          filters: defaultFilters,
          searchQuery: '',
          pinnedIds: new Set([3, 1]), // Pin Dragon scimitar and Bronze sword
          currentPrices: mockPrices,
        })
      );

      const itemIds = result.current.filteredItems.map(item => item.itemId);
      // Pinned items should appear first
      expect(itemIds.slice(0, 2)).toEqual(expect.arrayContaining([3, 1]));
      // Non-pinned item should appear last
      expect(itemIds[2]).toBe(2);
    });

    it('should not filter pinned items even if they dont match filters', () => {
      const { result } = renderHook(() =>
        useItemFiltering({
          items: mockItems,
          filters: { members: 'members' }, // Should filter out Bronze sword
          searchQuery: '',
          pinnedIds: new Set([1]), // But Bronze sword is pinned
          currentPrices: mockPrices,
        })
      );

      const itemIds = result.current.filteredItems.map(item => item.itemId);
      expect(itemIds).toContain(1); // Bronze sword should still appear because it's pinned
      expect(itemIds[0]).toBe(1); // And it should be first
    });
  });

  describe('Search index', () => {
    it('should create search index when items are provided', () => {
      const { result } = renderHook(() =>
        useItemFiltering({
          items: mockItems,
          filters: defaultFilters,
          searchQuery: '',
          pinnedIds: new Set(),
          currentPrices: mockPrices,
        })
      );

      expect(result.current.fuseIndex).toBeTruthy();
    });

    it('should return null search index when no items', () => {
      const { result } = renderHook(() =>
        useItemFiltering({
          items: [],
          filters: defaultFilters,
          searchQuery: '',
          pinnedIds: new Set(),
          currentPrices: new Map(),
        })
      );

      expect(result.current.fuseIndex).toBeNull();
    });
  });

  describe('Combined filters', () => {
    it('should apply multiple filters together', () => {
      const { result } = renderHook(() =>
        useItemFiltering({
          items: mockItems,
          filters: {
            members: 'members',
            priceMin: 80000,
            priceMax: 100000
          },
          searchQuery: '',
          pinnedIds: new Set(),
          currentPrices: mockPrices,
        })
      );

      // Should only match Dragon scimitar (members, price 90k)
      expect(result.current.filteredItems).toHaveLength(1);
      expect(result.current.filteredItems[0].itemId).toBe(3);
    });
  });
});