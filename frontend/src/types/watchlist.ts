/**
 * Watchlist type definitions
 * Supports multiple named watchlists with items and metadata
 */

/**
 * Item within a watchlist
 */
export interface WatchlistItem {
    /** OSRS item ID */
    itemId: number;
    /** Item name (for display) */
    name: string;
    /** Icon URL */
    iconUrl: string;
    /** Timestamp when item was added to watchlist */
    addedAt: number;
    /** Optional user notes about this item */
    notes?: string;
}

/**
 * A watchlist containing multiple items
 */
export interface Watchlist {
    /** Unique watchlist ID (UUID) */
    id: string;
    /** User-defined watchlist name */
    name: string;
    /** Items in this watchlist */
    items: WatchlistItem[];
    /** Timestamp when watchlist was created */
    createdAt: number;
    /** Timestamp when watchlist was last updated */
    updatedAt: number;
    /** Whether this is the default "Favorites" watchlist */
    isDefault: boolean;
}

/**
 * Watchlist export format
 */
export interface WatchlistExport {
    /** Export format version */
    version: string;
    /** Export metadata */
    metadata: {
        /** Timestamp of export */
        exportedAt: string;
        /** Source application identifier */
        source: string;
    };
    /** Array of watchlists */
    watchlists: Watchlist[];
}

/**
 * Share token format
 */
export interface WatchlistShare {
    /** Memorable share token (adjective-adjective-noun) */
    token: string;
    /** Watchlist data */
    watchlist: Watchlist;
    /** Expiration timestamp */
    expiresAt: number;
    /** Number of times accessed */
    accessCount: number;
}

/**
 * Template for pre-built watchlists
 */
export interface WatchlistTemplate {
    /** Template identifier */
    id: string;
    /** Template name */
    name: string;
    /** Template description */
    description: string;
    /** Category for grouping templates */
    category: string;
    /** Array of item IDs to include */
    itemIds: number[];
    /** Icon to display for this template */
    icon: string;
}

/**
 * Validation result for imports
 */
export interface WatchlistValidationResult {
    /** Whether the validation passed */
    valid: boolean;
    /** Valid watchlist data (if any) */
    watchlist?: Watchlist;
    /** Array of validation errors */
    errors: string[];
    /** Array of warnings (partial success) */
    warnings: string[];
}

/**
 * Constants for watchlist limits
 */
export const WATCHLIST_LIMITS = {
    /** Maximum number of watchlists per user */
    MAX_WATCHLISTS: 10,
    /** Maximum items per watchlist */
    MAX_ITEMS_PER_WATCHLIST: 100,
    /** Maximum watchlist name length */
    MAX_NAME_LENGTH: 50,
    /** Minimum watchlist name length */
    MIN_NAME_LENGTH: 1,
    /** Maximum note length */
    MAX_NOTE_LENGTH: 500,
} as const;

/**
 * Default watchlist ID constant
 */
export const DEFAULT_WATCHLIST_ID = 'default-favorites';
