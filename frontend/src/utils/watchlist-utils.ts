/**
 * Utility functions for watchlist operations
 */

import type { Watchlist, WatchlistExport, WatchlistItem } from '../types/watchlist';

/**
 * Format watchlist for export
 */
export function formatWatchlistExport(watchlists: Watchlist[]): WatchlistExport {
    return {
        version: '1.0.0',
        metadata: {
            exportedAt: new Date().toISOString(),
            source: 'osrs-ge-tracker',
        },
        watchlists,
    };
}

/**
 * Generate filename for watchlist export
 */
export function generateExportFilename(watchlistName?: string): string {
    const timestamp = new Date().toISOString().split('T')[0];
    const name = watchlistName ? `-${watchlistName.toLowerCase().replace(/\s+/g, '-')}` : '';
    return `osrs-watchlist${name}-${timestamp}.json`;
}

/**
 * Download watchlist as JSON file
 */
export function downloadWatchlistJSON(watchlists: Watchlist[], filename?: string): void {
    const exportData = formatWatchlistExport(watchlists);
    const jsonString = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = filename || generateExportFilename();
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

/**
 * Calculate total items across all watchlists
 */
export function getTotalItemCount(watchlists: Watchlist[]): number {
    return watchlists.reduce((total, watchlist) => total + watchlist.items.length, 0);
}

/**
 * Get unique items across all watchlists (deduplicated by itemId)
 */
export function getUniqueItems(watchlists: Watchlist[]): WatchlistItem[] {
    const itemMap = new Map<number, WatchlistItem>();

    watchlists.forEach((watchlist) => {
        watchlist.items.forEach((item) => {
            if (!itemMap.has(item.itemId)) {
                itemMap.set(item.itemId, item);
            }
        });
    });

    return Array.from(itemMap.values());
}

/**
 * Sort watchlist items by various criteria
 */
export function sortWatchlistItems(
    items: WatchlistItem[],
    sortBy: 'name' | 'addedAt' | 'itemId'
): WatchlistItem[] {
    const sorted = [...items];

    switch (sortBy) {
        case 'name':
            return sorted.sort((a, b) => a.name.localeCompare(b.name));
        case 'addedAt':
            return sorted.sort((a, b) => b.addedAt - a.addedAt);
        case 'itemId':
            return sorted.sort((a, b) => a.itemId - b.itemId);
        default:
            return sorted;
    }
}

/**
 * Search items within a watchlist
 */
export function searchWatchlistItems(items: WatchlistItem[], query: string): WatchlistItem[] {
    const lowerQuery = query.toLowerCase().trim();

    if (!lowerQuery) {
        return items;
    }

    return items.filter((item) =>
        item.name.toLowerCase().includes(lowerQuery) ||
        item.notes?.toLowerCase().includes(lowerQuery)
    );
}

/**
 * Get watchlist summary statistics
 */
export function getWatchlistStats(watchlist: Watchlist): {
    itemCount: number;
    lastUpdated: string;
    hasNotes: number;
} {
    return {
        itemCount: watchlist.items.length,
        lastUpdated: new Date(watchlist.updatedAt).toLocaleDateString(),
        hasNotes: watchlist.items.filter((item) => item.notes).length,
    };
}

/**
 * Check if watchlist name is valid
 */
export function isValidWatchlistName(name: string, existingNames: string[]): {
    valid: boolean;
    error?: string;
} {
    const trimmed = name.trim();

    if (trimmed.length === 0) {
        return { valid: false, error: 'Name cannot be empty' };
    }

    if (trimmed.length > 50) {
        return { valid: false, error: 'Name must be 50 characters or less' };
    }

    if (existingNames.some((n) => n.toLowerCase() === trimmed.toLowerCase())) {
        return { valid: false, error: 'A watchlist with this name already exists' };
    }

    return { valid: true };
}

/**
 * Merge multiple watchlists into one
 */
export function mergeWatchlists(watchlists: Watchlist[], newName: string): Watchlist {
    const uniqueItems = getUniqueItems(watchlists);
    const now = Date.now();

    return {
        id: crypto.randomUUID(),
        name: newName,
        items: uniqueItems,
        createdAt: now,
        updatedAt: now,
        isDefault: false,
    };
}

/**
 * Duplicate a watchlist with a new name
 */
export function duplicateWatchlist(watchlist: Watchlist, newName: string): Watchlist {
    const now = Date.now();

    return {
        ...watchlist,
        id: crypto.randomUUID(),
        name: newName,
        createdAt: now,
        updatedAt: now,
        isDefault: false,
    };
}

/**
 * Format item count for display
 */
export function formatItemCount(count: number): string {
    if (count === 0) return 'No items';
    if (count === 1) return '1 item';
    return `${count} items`;
}

/**
 * Get relative time string for last updated
 */
export function getRelativeTime(timestamp: number): string {
    const now = Date.now();
    const diff = now - timestamp;

    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;

    return new Date(timestamp).toLocaleDateString();
}
