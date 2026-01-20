/**
 * Zod schemas for watchlist data validation
 */

import { z } from 'zod';
import { WATCHLIST_LIMITS } from '@/types/watchlist';

/**
 * Schema for validating watchlist items
 */
export const WatchlistItemSchema = z.object({
    itemId: z.number().positive().int(),
    name: z.string().min(1).max(100),
    iconUrl: z.string().url(),
    addedAt: z.number().positive(),
    notes: z.string().max(WATCHLIST_LIMITS.MAX_NOTE_LENGTH).optional(),
});

/**
 * Schema for validating complete watchlists
 */
export const WatchlistSchema = z.object({
    id: z.string().uuid(),
    name: z
        .string()
        .min(WATCHLIST_LIMITS.MIN_NAME_LENGTH)
        .max(WATCHLIST_LIMITS.MAX_NAME_LENGTH),
    items: z.array(WatchlistItemSchema).max(WATCHLIST_LIMITS.MAX_ITEMS_PER_WATCHLIST),
    createdAt: z.number().positive(),
    updatedAt: z.number().positive(),
    isDefault: z.boolean(),
});

/**
 * Schema for watchlist export format
 */
export const WatchlistExportSchema = z.object({
    version: z.string(),
    metadata: z.object({
        exportedAt: z.string(),
        source: z.string(),
    }),
    watchlists: z.array(WatchlistSchema),
});

/**
 * Schema for share token format
 */
export const ShareTokenSchema = z.string().regex(
    /^[a-z]+-[a-z]+-[a-z]+$/,
    'Share token must be in format: adjective-adjective-noun'
);

/**
 * Schema for watchlist share data
 */
export const WatchlistShareSchema = z.object({
    token: ShareTokenSchema,
    watchlist: WatchlistSchema,
    expiresAt: z.number().positive(),
    accessCount: z.number().nonnegative().int(),
});

/**
 * Type exports from schemas
 */
export type WatchlistItemInput = z.input<typeof WatchlistItemSchema>;
export type WatchlistInput = z.input<typeof WatchlistSchema>;
export type WatchlistExportInput = z.input<typeof WatchlistExportSchema>;
export type ShareTokenInput = z.input<typeof ShareTokenSchema>;
