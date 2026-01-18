/**
 * Watchlist API functions for sharing watchlists
 */

import type { Watchlist, WatchlistShare } from '../types/watchlist';
import apiClient from './client';

/**
 * API response for share creation
 */
interface ShareWatchlistResponse {
    token: string;
    expiresAt: string;
}

/**
 * API response for share retrieval
 */
interface RetrieveShareResponse {
    watchlist: Watchlist;
    accessCount: number;
    expiresAt: string;
}

/**
 * Create a shareable link for a watchlist
 * POST /api/v1/watchlists/share
 * 
 * @param watchlist - Watchlist to share
 * @returns Share token and expiration info
 */
export async function createWatchlistShare(watchlist: Watchlist): Promise<WatchlistShare> {
    const response = await apiClient.post<ShareWatchlistResponse>(
        '/watchlists/share',
        { watchlist }
    );

    return {
        token: response.data.token,
        watchlist,
        expiresAt: new Date(response.data.expiresAt).getTime(),
        accessCount: 0,
    };
}

/**
 * Retrieve a shared watchlist by token
 * GET /api/v1/watchlists/share/:token
 * 
 * @param token - Share token (adjective-adjective-noun format)
 * @returns Watchlist data and share metadata
 */
export async function retrieveWatchlistShare(token: string): Promise<WatchlistShare> {
    const response = await apiClient.get<RetrieveShareResponse>(
        `/watchlists/share/${token}`
    );

    return {
        token,
        watchlist: response.data.watchlist,
        expiresAt: new Date(response.data.expiresAt).getTime(),
        accessCount: response.data.accessCount,
    };
}

/**
 * Validate share token format
 * Format: adjective-adjective-noun (e.g., "swift-golden-dragon")
 * 
 * @param token - Token to validate
 * @returns True if token format is valid
 */
export function isValidShareToken(token: string): boolean {
    const tokenPattern = /^[a-z]+-[a-z]+-[a-z]+$/;
    return tokenPattern.test(token);
}
