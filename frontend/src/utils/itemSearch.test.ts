/**
 * Unit tests for itemSearch utility
 * Tests fuzzy search functionality using fuse.js
 */

import { describe, expect, it } from 'vitest';
import type { Item } from '../types';
import {
    createItemSearchIndex,
    filterItemIds,
    filterItemIdsByRelevance,
    filterItems,
    searchItems,
} from './itemSearch';

// Mock item data
const mockItems: Item[] = [
    {
        itemId: 1,
        name: 'Dragon scimitar',
        description: 'A powerful scimitar',
        iconUrl: 'https://example.com/dragon-scim.png',
        members: true,
        tradeable: true,
        equipable: true,
    },
    {
        itemId: 2,
        name: 'Dragon longsword',
        description: 'A sharp longsword',
        iconUrl: 'https://example.com/dragon-long.png',
        members: true,
        tradeable: true,
        equipable: true,
    },
    {
        itemId: 3,
        name: 'Abyssal whip',
        description: 'A demonic whip',
        iconUrl: 'https://example.com/whip.png',
        members: true,
        tradeable: true,
        equipable: true,
    },
    {
        itemId: 4,
        name: 'Rune arrow',
        description: 'An arrow tipped with rune',
        iconUrl: 'https://example.com/rune-arrow.png',
        members: false,
        tradeable: true,
        equipable: false,
    },
    {
        itemId: 5,
        name: 'Rune platebody',
        description: 'Heavy armor',
        iconUrl: 'https://example.com/rune-plate.png',
        members: false,
        tradeable: true,
        equipable: true,
    },
    {
        itemId: 6,
        name: 'Dragon bones',
        description: 'Bones from a dragon',
        iconUrl: 'https://example.com/d-bones.png',
        members: false,
        tradeable: true,
        equipable: false,
    },
];

describe('itemSearch', () => {
    describe('createItemSearchIndex', () => {
        it('creates a Fuse instance from items', () => {
            const index = createItemSearchIndex(mockItems);
            expect(index).toBeDefined();
            expect(index.search).toBeDefined();
        });

        it('handles empty array', () => {
            const index = createItemSearchIndex([]);
            expect(index).toBeDefined();
            const results = index.search('dragon');
            expect(results).toHaveLength(0);
        });
    });

    describe('searchItems', () => {
        it('finds exact matches', () => {
            const index = createItemSearchIndex(mockItems);
            const results = searchItems(index, 'Dragon scimitar');

            expect(results).toHaveLength(1);
            expect(results[0].name).toBe('Dragon scimitar');
        });

        it('finds partial matches', () => {
            const index = createItemSearchIndex(mockItems);
            const results = searchItems(index, 'dragon');

            expect(results.length).toBeGreaterThan(0);
            const names = results.map(r => r.name);
            expect(names).toContain('Dragon scimitar');
            expect(names).toContain('Dragon longsword');
            expect(names).toContain('Dragon bones');
        });

        it('handles typos (fuzzy matching)', () => {
            const index = createItemSearchIndex(mockItems);

            // Test typo: "dargon" instead of "dragon"
            const results1 = searchItems(index, 'dargon');
            expect(results1.length).toBeGreaterThan(0);
            expect(results1.some(r => r.name.includes('Dragon'))).toBe(true);

            // Test typo: "whp" instead of "whip"
            const results2 = searchItems(index, 'whp');
            expect(results2.length).toBeGreaterThan(0);
            expect(results2.some(r => r.name === 'Abyssal whip')).toBe(true);
        });

        it('respects limit parameter', () => {
            const index = createItemSearchIndex(mockItems);
            const results = searchItems(index, 'rune', 1);

            expect(results).toHaveLength(1);
        });

        it('returns empty array for empty query', () => {
            const index = createItemSearchIndex(mockItems);
            expect(searchItems(index, '')).toEqual([]);
            expect(searchItems(index, '   ')).toEqual([]);
        });

        it('returns empty array for no matches', () => {
            const index = createItemSearchIndex(mockItems);
            const results = searchItems(index, 'xyzabc123nonexistent');
            expect(results).toEqual([]);
        });

        it('is case-insensitive', () => {
            const index = createItemSearchIndex(mockItems);
            const lower = searchItems(index, 'dragon');
            const upper = searchItems(index, 'DRAGON');
            const mixed = searchItems(index, 'DrAgOn');

            expect(lower).toHaveLength(upper.length);
            expect(lower).toHaveLength(mixed.length);
        });

        it('returns default limit of 12 items when not specified', () => {
            // Create more items to test default limit
            const manyItems: Item[] = Array.from({ length: 20 }, (_, i) => ({
                itemId: i + 1,
                name: `Dragon item ${i + 1}`,
                description: 'Test item',
                iconUrl: '',
                members: false,
                tradeable: true,
                equipable: false,
            }));

            const index = createItemSearchIndex(manyItems);
            const results = searchItems(index, 'dragon');

            expect(results.length).toBeLessThanOrEqual(12);
        });
    });

    describe('filterItems', () => {
        it('returns all matching items without limit', () => {
            const index = createItemSearchIndex(mockItems);
            const results = filterItems(index, 'rune');

            expect(results.length).toBeGreaterThan(0);
            const names = results.map(r => r.name);
            expect(names).toContain('Rune arrow');
            expect(names).toContain('Rune platebody');
        });

        it('returns empty array for empty query', () => {
            const index = createItemSearchIndex(mockItems);
            expect(filterItems(index, '')).toEqual([]);
            expect(filterItems(index, '  ')).toEqual([]);
        });

        it('handles typos like searchItems', () => {
            const index = createItemSearchIndex(mockItems);
            const results = filterItems(index, 'dargon');

            expect(results.length).toBeGreaterThan(0);
            expect(results.some(r => r.name.includes('Dragon'))).toBe(true);
        });
    });

    describe('filterItemIds', () => {
        it('returns Set of item IDs that match query', () => {
            const index = createItemSearchIndex(mockItems);
            const ids = filterItemIds(index, 'dragon');

            expect(ids).toBeInstanceOf(Set);
            expect(ids.size).toBeGreaterThan(0);
            expect(ids.has(1)).toBe(true); // Dragon scimitar
            expect(ids.has(2)).toBe(true); // Dragon longsword
            expect(ids.has(6)).toBe(true); // Dragon bones
        });

        it('returns empty Set for empty query', () => {
            const index = createItemSearchIndex(mockItems);
            expect(filterItemIds(index, '').size).toBe(0);
        });

        it('can be used for efficient filtering', () => {
            const index = createItemSearchIndex(mockItems);
            const matchingIds = filterItemIds(index, 'rune');

            const filtered = mockItems.filter(item => matchingIds.has(item.itemId));
            expect(filtered.length).toBe(2);
            expect(filtered.some(i => i.name === 'Rune arrow')).toBe(true);
            expect(filtered.some(i => i.name === 'Rune platebody')).toBe(true);
        });
    });

    describe('filterItemIdsByRelevance', () => {
        it('returns array of item IDs sorted by relevance', () => {
            const index = createItemSearchIndex(mockItems);
            const ids = filterItemIdsByRelevance(index, 'rune arrow');

            expect(Array.isArray(ids)).toBe(true);
            expect(ids.length).toBeGreaterThan(0);

            // Exact match "Rune arrow" should be first
            expect(ids[0]).toBe(4);
        });

        it('preserves relevance order for sorting', () => {
            const index = createItemSearchIndex(mockItems);
            const ids = filterItemIdsByRelevance(index, 'dragon');

            // All dragon items should be included
            expect(ids).toContain(1); // Dragon scimitar
            expect(ids).toContain(2); // Dragon longsword
            expect(ids).toContain(6); // Dragon bones

            // Order should be consistent (better matches first)
            const firstIndex = ids.indexOf(1);
            const lastIndex = ids.indexOf(6);
            expect(firstIndex).toBeLessThan(lastIndex); // "Dragon scimitar" before "Dragon bones"
        });

        it('returns empty array for empty query', () => {
            const index = createItemSearchIndex(mockItems);
            expect(filterItemIdsByRelevance(index, '')).toEqual([]);
        });

        it('maintains order for table relevance sorting', () => {
            const index = createItemSearchIndex(mockItems);
            const sortedIds = filterItemIdsByRelevance(index, 'rune');

            // Create index map
            const idToIndex = new Map(sortedIds.map((id, index) => [id, index]));

            // Sort items by relevance
            const sorted = mockItems
                .filter(item => idToIndex.has(item.itemId))
                .sort((a, b) => {
                    const indexA = idToIndex.get(a.itemId) ?? Infinity;
                    const indexB = idToIndex.get(b.itemId) ?? Infinity;
                    return indexA - indexB;
                });

            expect(sorted.length).toBe(2);
            expect(sorted[0].name).toBe('Rune arrow');
            expect(sorted[1].name).toBe('Rune platebody');
        });
    });

    describe('threshold behavior', () => {
        it('does not match strings with too many differences', () => {
            const index = createItemSearchIndex(mockItems);

            // "xyz" should not match anything (threshold prevents)
            const results = searchItems(index, 'xyz');
            expect(results).toEqual([]);
        });

        it('matches strings within threshold (40% difference)', () => {
            const index = createItemSearchIndex(mockItems);

            // "draon" (2 char diff in 6 chars = 33%) should match "dragon"
            const results = searchItems(index, 'draon');
            expect(results.length).toBeGreaterThan(0);
        });
    });

    describe('minMatchCharLength behavior', () => {
        it('does not match single characters', () => {
            const index = createItemSearchIndex(mockItems);
            const results = searchItems(index, 'd');

            // Should return empty due to minMatchCharLength: 2
            expect(results).toEqual([]);
        });

        it('matches with 2+ characters', () => {
            const index = createItemSearchIndex(mockItems);
            const results = searchItems(index, 'dr');

            expect(results.length).toBeGreaterThan(0);
        });
    });
});
