/**
 * Hook to manage recent item selections in localStorage
 * Stores recently selected items for the search dropdown
 */

import { useCallback, useEffect, useState } from 'react';

const STORAGE_KEY = 'osrs-recent-searches';
const MAX_RECENT = 5;

/**
 * Represents a recently selected item in search
 */
export interface RecentItem {
    /** OSRS Item ID (used for navigation and lookups) */
    itemId: number;
    /** Item name */
    name: string;
    /** Optional icon URL */
    icon?: string;
}

/**
 * Load recent items from localStorage
 */
function loadFromStorage(): RecentItem[] {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (!stored) return [];
        const parsed = JSON.parse(stored);
        if (!Array.isArray(parsed)) return [];
        // Validate structure and limit to MAX_RECENT
        return parsed
            .filter((item): item is RecentItem =>
                item !== null &&
                typeof item === 'object' &&
                typeof item.itemId === 'number' &&
                typeof item.name === 'string'
            )
            .slice(0, MAX_RECENT);
    } catch {
        return [];
    }
}

/**
 * Save recent items to localStorage
 */
function saveToStorage(items: RecentItem[]): void {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
        // Storage full or unavailable - silently fail
    }
}

interface UseRecentSearchesReturn {
    /** Array of recently selected items (most recent first) */
    recentItems: RecentItem[];
    /** Add an item to recent selections (moves to front if exists) */
    addRecentItem: (item: RecentItem) => void;
    /** Remove a specific item by itemId */
    removeRecentItem: (itemId: number) => void;
    /** Clear all recent items */
    clearRecent: () => void;
}

/**
 * Hook to manage recent search selections with localStorage persistence
 * 
 * @returns Object with recent items and management functions
 * 
 * @example
 * ```tsx
 * const { recentItems, addRecentItem, removeRecentItem, clearRecent } = useRecentSearches();
 * 
 * // Add a selected item
 * addRecentItem({ itemId: 123, name: 'Dragon scimitar', icon: '...' });
 * 
 * // Display in dropdown
 * {recentItems.map(item => <RecentItem key={item.itemId} item={item} />)}
 * 
 * // Remove single item
 * removeRecentItem(123);
 * 
 * // Clear all
 * clearRecent();
 * ```
 */
export function useRecentSearches(): UseRecentSearchesReturn {
    const [recentItems, setRecentItems] = useState<RecentItem[]>(loadFromStorage);

    // Sync to localStorage whenever items change
    useEffect(() => {
        saveToStorage(recentItems);
    }, [recentItems]);

    const addRecentItem = useCallback((item: RecentItem) => {
        setRecentItems((prev) => {
            // Remove existing entry for same item (if any)
            const filtered = prev.filter((r) => r.itemId !== item.itemId);
            // Add to front, limit to MAX_RECENT
            return [item, ...filtered].slice(0, MAX_RECENT);
        });
    }, []);

    const removeRecentItem = useCallback((itemId: number) => {
        setRecentItems((prev) => prev.filter((r) => r.itemId !== itemId));
    }, []);

    const clearRecent = useCallback(() => {
        setRecentItems([]);
    }, []);

    return { recentItems, addRecentItem, removeRecentItem, clearRecent };
}
