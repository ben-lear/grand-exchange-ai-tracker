/**
 * Column configuration constants
 * Separated from columns.tsx to avoid fast-refresh warnings
 */

/**
 * Default column visibility configuration
 */
export const defaultColumnVisibility = {
    name: true,
    highPrice: true,
    lowPrice: true,
    avgPrice: true,
    highVolume: false,
    lowVolume: false,
    members: true,
    buyLimit: false,
    highAlch: false,
};

/**
 * Column IDs for reference
 */
export const COLUMN_IDS = {
    NAME: 'name',
    HIGH_PRICE: 'highPrice',
    LOW_PRICE: 'lowPrice',
    AVG_PRICE: 'avgPrice',
    HIGH_VOLUME: 'highVolume',
    LOW_VOLUME: 'lowVolume',
    MEMBERS: 'members',
    BUY_LIMIT: 'buyLimit',
    HIGH_ALCH: 'highAlch',
} as const;
