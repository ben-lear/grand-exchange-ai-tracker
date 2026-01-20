/**
 * Validation utilities for watchlist data
 */

import {
    ShareTokenSchema,
    WatchlistItemSchema,
    WatchlistSchema,
} from '../../schemas/watchlist';
import type {
    Watchlist,
    WatchlistItem,
    WatchlistValidationResult,
} from '@/types/watchlist';

/**
 * Validate a watchlist with detailed error reporting
 */
export function validateWatchlist(data: unknown): WatchlistValidationResult {
    const result = WatchlistSchema.safeParse(data);

    if (result.success) {
        return {
            valid: true,
            watchlist: result.data,
            errors: [],
            warnings: [],
        };
    }

    return {
        valid: false,
        errors: result.error.errors.map((err) => `${err.path.join('.')}: ${err.message}`),
        warnings: [],
    };
}

/**
 * Validate watchlist import with partial success support
 * Returns valid items even if some are invalid
 */
export function validateWatchlistImport(data: unknown): WatchlistValidationResult {
    // Check basic structure without validating individual watchlists yet
    if (typeof data !== 'object' || data === null) {
        return {
            valid: false,
            errors: ['Invalid export format: missing required fields or invalid structure'],
            warnings: [],
        };
    }

    const exportCandidate = data as Record<string, unknown>;
    const watchlistsValue = exportCandidate.watchlists;
    if (!('version' in exportCandidate) || !('metadata' in exportCandidate) || !Array.isArray(watchlistsValue)) {
        return {
            valid: false,
            errors: ['Invalid export format: missing required fields or invalid structure'],
            warnings: [],
        };
    }

    const exportData = { watchlists: watchlistsValue } as { watchlists: unknown[] };
    const validWatchlists: Watchlist[] = [];
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate each watchlist individually
    for (let i = 0; i < exportData.watchlists.length; i++) {
        const watchlist = exportData.watchlists[i];
        const watchlistResult = WatchlistSchema.safeParse(watchlist);

        if (watchlistResult.success) {
            validWatchlists.push(watchlistResult.data);
        } else {
            // Use the watchlist name if available, otherwise use index
            const watchlistIdentifier =
                typeof watchlist === 'object' && watchlist !== null && 'name' in watchlist && typeof (watchlist as Record<string, unknown>).name === 'string'
                    ? String((watchlist as Record<string, unknown>).name)
                    : `#${i + 1}`;
            warnings.push(`Watchlist "${watchlistIdentifier}" has validation errors and was skipped`);
            watchlistResult.error.errors.forEach((err) => {
                errors.push(`Watchlist ${watchlistIdentifier} - ${err.path.join('.')}: ${err.message}`);
            });
        }
    }

    if (validWatchlists.length === 0) {
        return {
            valid: false,
            errors: ['No valid watchlists found in import', ...errors],
            warnings,
        };
    }

    return {
        valid: true,
        watchlist: validWatchlists.length === 1 ? validWatchlists[0] : undefined,
        errors,
        warnings,
    };
}

/**
 * Validate watchlist export format
 * Returns the validated export data with any valid watchlists
 */
export function validateWatchlistExport(data: unknown): {
    valid: boolean;
    export?: { version: string; metadata: { exportedAt: string; source: string }; watchlists: Watchlist[] };
    errors: string[];
    warnings: string[];
} {
    // Use validateWatchlistImport for the actual validation
    const result = validateWatchlistImport(data);

    if (!result.valid) {
        return {
            valid: false,
            errors: result.errors,
            warnings: result.warnings,
        };
    }

    // Reconstruct the export format
    const exportData = data as { version: string; metadata: { exportedAt: string; source: string }; watchlists: unknown[] };

    return {
        valid: true,
        export: {
            version: exportData.version,
            metadata: exportData.metadata,
            watchlists: result.watchlist ? [result.watchlist] : [],
        },
        errors: result.errors,
        warnings: result.warnings,
    };
}

/**
 * Validate individual watchlist item
 */
export function validateWatchlistItem(data: unknown): {
    valid: boolean;
    item?: WatchlistItem;
    error?: string;
} {
    const result = WatchlistItemSchema.safeParse(data);

    if (result.success) {
        return {
            valid: true,
            item: result.data,
        };
    }

    return {
        valid: false,
        error: result.error.errors[0]?.message || 'Invalid item data',
    };
}

/**
 * Validate share token format
 */
export function validateShareToken(token: string): boolean {
    const result = ShareTokenSchema.safeParse(token);
    return result.success;
}

/**
 * Sanitize watchlist name
 */
export function sanitizeWatchlistName(name: string): string {
    return name.trim().slice(0, 50);
}

/**
 * Check if a watchlist import contains malformed JSON
 */
export function parseWatchlistJSON(jsonString: string): {
    success: boolean;
    data?: unknown;
    error?: string;
} {
    try {
        const data = JSON.parse(jsonString);
        return { success: true, data };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Invalid JSON',
        };
    }
}

/**
 * Filter out invalid items from an array, returning valid items and warnings
 */
export function filterValidItems(items: unknown[]): {
    validItems: WatchlistItem[];
    invalidCount: number;
    warnings: string[];
} {
    const validItems: WatchlistItem[] = [];
    const warnings: string[] = [];
    let invalidCount = 0;

    items.forEach((item, index) => {
        const result = validateWatchlistItem(item);
        if (result.valid && result.item) {
            validItems.push(result.item);
        } else {
            invalidCount++;
            warnings.push(`Item #${index + 1}: ${result.error || 'Invalid item'}`);
        }
    });

    return { validItems, invalidCount, warnings };
}
