/**
 * useItemFiltering - Custom hook for filtering and searching items
 * Extracted from DashboardPage to handle item filtering logic
 */

import type Fuse from 'fuse.js';
import { useMemo } from 'react';
import type { FilterState } from '@/components/table';
import type { CurrentPrice, Item } from '@/types';
import { createItemSearchIndex, filterItemIdsByRelevance } from '@/utils/search';

export interface UseItemFilteringParams {
    /** All items to filter */
    items: Item[];
    /** Current filter state */
    filters: FilterState;
    /** Search query string */
    searchQuery: string;
    /** Set of pinned item IDs */
    pinnedIds: Set<number>;
    /** Current prices map */
    currentPrices: Map<number, CurrentPrice>;
}

export interface UseItemFilteringReturn {
    /** Filtered items array */
    filteredItems: Item[];
    /** Search index for fuzzy search */
    fuseIndex: Fuse<Item> | null;
}

/**
 * Custom hook for filtering items based on search query and filters
 * Handles fuzzy search, price filters, membership filters, and pinned items ordering
 */
export function useItemFiltering({
    items,
    filters,
    searchQuery,
    pinnedIds,
    currentPrices,
}: UseItemFilteringParams): UseItemFilteringReturn {
    // Build fuse.js search index when items change
    const fuseIndex = useMemo(() => {
        if (items.length === 0) return null;
        return createItemSearchIndex(items);
    }, [items]);

    // Get matching item IDs from search query (sorted by relevance)
    // Supports both name search (fuzzy matching) and ID search (exact match)
    const searchMatchIds = useMemo(() => {
        if (!fuseIndex || !searchQuery.trim()) return null;
        return filterItemIdsByRelevance(fuseIndex, searchQuery);
    }, [fuseIndex, searchQuery]);

    // Filter items based on search and filters
    const filteredItems = useMemo(() => {
        let results = items;

        // Separate pinned and non-pinned items
        const pinnedItems = results.filter(item => pinnedIds.has(item.itemId));
        const nonPinnedItems = results.filter(item => !pinnedIds.has(item.itemId));

        // Apply non-search filters only to non-pinned items
        const filteredNonPinned = nonPinnedItems.filter(item => {
            // Members filter
            if (filters.members === 'members' && !item.members) return false;
            if (filters.members === 'f2p' && item.members) return false;

            // Price filters
            const price = currentPrices.get(item.itemId);
            const highPrice = price?.highPrice;
            if (filters.priceMin && (!highPrice || highPrice < filters.priceMin)) return false;
            if (filters.priceMax && (!highPrice || highPrice > filters.priceMax)) return false;

            return true;
        });

        // Apply search filter with relevance ordering to non-pinned items
        let searchFilteredNonPinned = filteredNonPinned;
        if (searchMatchIds !== null) {
            if (searchMatchIds.length === 0) {
                searchFilteredNonPinned = [];
            } else {
                // Create a map for O(1) lookup and preserve relevance order
                const idToIndex = new Map(searchMatchIds.map((id, index) => [id, index]));

                // Filter and sort by relevance
                searchFilteredNonPinned = filteredNonPinned
                    .filter(item => idToIndex.has(item.itemId))
                    .sort((a, b) => {
                        const indexA = idToIndex.get(a.itemId) ?? Infinity;
                        const indexB = idToIndex.get(b.itemId) ?? Infinity;
                        return indexA - indexB;
                    });
            }
        }

        // Combine: pinned items first (preserving order), then filtered non-pinned items
        return [...pinnedItems, ...searchFilteredNonPinned];
    }, [items, pinnedIds, searchMatchIds, filters, currentPrices]);

    return {
        filteredItems,
        fuseIndex,
    };
}