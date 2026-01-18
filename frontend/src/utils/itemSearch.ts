/**
 * Fuzzy search utility for items using fuse.js
 * Provides typo-tolerant search across item names
 */

import Fuse, { type IFuseOptions } from 'fuse.js';
import type { Item } from '../types';

/**
 * Fuse.js configuration for item search
 * - threshold: 0.4 allows for ~40% character differences (generous typo tolerance)
 * - distance: 100 allows matches even with characters far apart
 * - ignoreLocation: true searches anywhere in string, not just beginning
 * - minMatchCharLength: 2 prevents single-character matches
 */
const FUSE_OPTIONS: IFuseOptions<Item> = {
    keys: ['name'],
    threshold: 0.4,
    distance: 100,
    includeScore: true,
    ignoreLocation: true,
    minMatchCharLength: 2,
};

/**
 * Creates a Fuse.js search index from an array of items
 * Should be memoized in components to avoid recreation on every render
 * 
 * @param items - Array of items to index
 * @returns Fuse instance ready for searching
 * 
 * @example
 * const fuseIndex = useMemo(() => createItemSearchIndex(items), [items]);
 */
export function createItemSearchIndex(items: Item[]): Fuse<Item> {
    return new Fuse(items, FUSE_OPTIONS);
}

/**
 * Search items using a Fuse index with a result limit
 * Best for dropdown previews where we want top N results
 * 
 * Supports both text search (fuzzy matching) and numeric search (exact ID match).
 * 
 * @param fuse - Fuse instance created with createItemSearchIndex
 * @param query - Search query string (can be item name or numeric item ID)
 * @param limit - Maximum number of results (default: 12)
 * @returns Array of matching items sorted by relevance
 * 
 * @example
 * // Text search with fuzzy matching
 * const results = searchItems(fuseIndex, 'dargon', 10);
 * // Finds "Dragon scimitar", "Dragon bones", etc. despite typo
 * 
 * // Numeric ID search
 * const results = searchItems(fuseIndex, '4151', 10);
 * // Finds "Abyssal whip" (item ID 4151)
 */
export function searchItems(fuse: Fuse<Item>, query: string, limit = 12): Item[] {
    const trimmedQuery = query.trim();
    if (!trimmedQuery) return [];

    // Check if query is a numeric item ID
    const numericQuery = parseInt(trimmedQuery, 10);
    if (!isNaN(numericQuery) && trimmedQuery === numericQuery.toString()) {
        // Direct ID lookup from the fuse index
        const allItems = fuse.getIndex().docs as Item[];
        return allItems.filter(item => item.itemId === numericQuery).slice(0, limit);
    }

    // Otherwise, perform fuzzy search by name
    const results = fuse.search(trimmedQuery, { limit });
    return results.map((result) => result.item);
}

/**
 * Filter items using a Fuse index (returns all matches)
 * Best for table filtering where we want all matching results
 * 
 * @param fuse - Fuse instance created with createItemSearchIndex
 * @param query - Search query string
 * @returns Array of all matching items sorted by relevance
 * 
 * @example
 * const filtered = filterItems(fuseIndex, 'rune');
 * // Returns all items with "rune" in name
 */
export function filterItems(fuse: Fuse<Item>, query: string): Item[] {
    const trimmedQuery = query.trim();
    if (!trimmedQuery) return [];

    const results = fuse.search(trimmedQuery);
    return results.map((result) => result.item);
}

/**
 * Get a Set of item IDs that match the search query
 * Useful for efficient filtering when you need to check membership
 * 
 * @param fuse - Fuse instance created with createItemSearchIndex
 * @param query - Search query string
 * @returns Set of OSRS item IDs (itemId) that match the query
 * 
 * @example
 * const matchIds = filterItemIds(fuseIndex, 'dragon');
 * const filtered = items.filter(item => matchIds.has(item.itemId));
 */
export function filterItemIds(fuse: Fuse<Item>, query: string): Set<number> {
    const trimmedQuery = query.trim();
    if (!trimmedQuery) return new Set();

    const results = fuse.search(trimmedQuery);
    return new Set(results.map((result) => result.item.itemId));
}

/**
 * Get an array of item IDs sorted by relevance score
 * Best for table filtering where you want relevance-based ordering
 * 
 * Supports both text search (fuzzy matching) and numeric search (exact ID match).
 * 
 * @param fuse - Fuse instance created with createItemSearchIndex
 * @param query - Search query string (can be item name or numeric item ID)
 * @returns Array of OSRS item IDs sorted by search relevance (best matches first)
 * 
 * @example
 * // Text search
 * const sortedIds = filterItemIdsByRelevance(fuseIndex, 'rune arrow');
 * // Returns IDs sorted by relevance: [892, 891, 890, ...] (exact matches first)
 * 
 * // Numeric ID search
 * const sortedIds = filterItemIdsByRelevance(fuseIndex, '4151');
 * // Returns [4151] if item exists, [] otherwise
 */
export function filterItemIdsByRelevance(fuse: Fuse<Item>, query: string): number[] {
    const trimmedQuery = query.trim();
    if (!trimmedQuery) return [];

    // Check if query is a numeric item ID
    const numericQuery = parseInt(trimmedQuery, 10);
    if (!isNaN(numericQuery) && trimmedQuery === numericQuery.toString()) {
        // Direct ID lookup from the fuse index
        const allItems = fuse.getIndex().docs as Item[];
        const matchingItem = allItems.find(item => item.itemId === numericQuery);
        return matchingItem ? [matchingItem.itemId] : [];
    }

    // Otherwise, perform fuzzy search by name
    const results = fuse.search(trimmedQuery);
    // Results are already sorted by score (best match = lowest score)
    return results.map((result) => result.item.itemId);
}
