/**
 * Unit tests for watchlist utility functions
 */

import { describe, expect, it } from 'vitest';
import type { Watchlist, WatchlistItem } from '@/types/watchlist';
import {
    duplicateWatchlist,
    formatItemCount,
    formatWatchlistExport,
    generateExportFilename,
    getRelativeTime,
    getTotalItemCount,
    getUniqueItems,
    getWatchlistStats,
    isValidWatchlistName,
    mergeWatchlists,
    searchWatchlistItems,
    sortWatchlistItems,
} from './watchlist-utils';

describe('Watchlist Utilities', () => {
    const mockItem1: WatchlistItem = {
        itemId: 4151,
        name: 'Abyssal whip',
        iconUrl: 'https://example.com/whip.png',
        addedAt: Date.now(),
    };

    const mockItem2: WatchlistItem = {
        itemId: 6585,
        name: 'Amulet of fury',
        iconUrl: 'https://example.com/fury.png',
        addedAt: Date.now() - 1000,
    };

    const mockWatchlist: Watchlist = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'Test Watchlist',
        items: [mockItem1, mockItem2],
        createdAt: Date.now(),
        updatedAt: Date.now(),
        isDefault: false,
    };

    describe('formatWatchlistExport', () => {
        it('should format watchlist for export', () => {
            const exported = formatWatchlistExport([mockWatchlist]);

            expect(exported.version).toBe('1.0.0');
            expect(exported.metadata.source).toBe('osrs-ge-tracker');
            expect(exported.metadata.exportedAt).toBeDefined();
            expect(exported.watchlists.length).toBe(1);
            expect(exported.watchlists[0]).toEqual(mockWatchlist);
        });

        it('should handle multiple watchlists', () => {
            const exported = formatWatchlistExport([mockWatchlist, mockWatchlist]);
            expect(exported.watchlists.length).toBe(2);
        });
    });

    describe('generateExportFilename', () => {
        it('should generate filename with watchlist name', () => {
            const filename = generateExportFilename('My List');
            expect(filename).toMatch(/^osrs-watchlist-my-list-\d{4}-\d{2}-\d{2}\.json$/);
        });

        it('should generate filename without watchlist name', () => {
            const filename = generateExportFilename();
            expect(filename).toMatch(/^osrs-watchlist-\d{4}-\d{2}-\d{2}\.json$/);
        });

        it('should replace spaces with hyphens', () => {
            const filename = generateExportFilename('My Test List');
            expect(filename).toContain('my-test-list');
        });
    });

    describe('getTotalItemCount', () => {
        it('should count total items across watchlists', () => {
            const count = getTotalItemCount([mockWatchlist, mockWatchlist]);
            expect(count).toBe(4);
        });

        it('should return 0 for empty watchlists', () => {
            const count = getTotalItemCount([]);
            expect(count).toBe(0);
        });
    });

    describe('getUniqueItems', () => {
        it('should deduplicate items by itemId', () => {
            const unique = getUniqueItems([mockWatchlist, mockWatchlist]);
            expect(unique.length).toBe(2);
            expect(unique.map((i) => i.itemId)).toContain(4151);
            expect(unique.map((i) => i.itemId)).toContain(6585);
        });

        it('should return all items if no duplicates', () => {
            const unique = getUniqueItems([mockWatchlist]);
            expect(unique.length).toBe(2);
        });
    });

    describe('sortWatchlistItems', () => {
        const items = [mockItem2, mockItem1]; // Out of order

        it('should sort by name', () => {
            const sorted = sortWatchlistItems(items, 'name');
            expect(sorted[0].name).toBe('Abyssal whip');
            expect(sorted[1].name).toBe('Amulet of fury');
        });

        it('should sort by addedAt (newest first)', () => {
            const sorted = sortWatchlistItems(items, 'addedAt');
            expect(sorted[0].itemId).toBe(4151); // Most recent
        });

        it('should sort by itemId', () => {
            const sorted = sortWatchlistItems(items, 'itemId');
            expect(sorted[0].itemId).toBe(4151);
            expect(sorted[1].itemId).toBe(6585);
        });
    });

    describe('searchWatchlistItems', () => {
        const items = [mockItem1, mockItem2];

        it('should find items by name', () => {
            const results = searchWatchlistItems(items, 'whip');
            expect(results.length).toBe(1);
            expect(results[0].name).toBe('Abyssal whip');
        });

        it('should be case insensitive', () => {
            const results = searchWatchlistItems(items, 'WHIP');
            expect(results.length).toBe(1);
        });

        it('should return all items for empty query', () => {
            const results = searchWatchlistItems(items, '');
            expect(results.length).toBe(2);
        });

        it('should search in notes', () => {
            const itemWithNotes = { ...mockItem1, notes: 'Good for PvM' };
            const results = searchWatchlistItems([itemWithNotes], 'pvm');
            expect(results.length).toBe(1);
        });
    });

    describe('getWatchlistStats', () => {
        it('should calculate watchlist statistics', () => {
            const stats = getWatchlistStats(mockWatchlist);

            expect(stats.itemCount).toBe(2);
            expect(stats.lastUpdated).toBeDefined();
            expect(stats.hasNotes).toBe(0);
        });

        it('should count items with notes', () => {
            const watchlistWithNotes = {
                ...mockWatchlist,
                items: [
                    { ...mockItem1, notes: 'Note 1' },
                    mockItem2,
                ],
            };

            const stats = getWatchlistStats(watchlistWithNotes);
            expect(stats.hasNotes).toBe(1);
        });
    });

    describe('isValidWatchlistName', () => {
        it('should validate correct name', () => {
            const result = isValidWatchlistName('My Watchlist', []);
            expect(result.valid).toBe(true);
        });

        it('should reject empty name', () => {
            const result = isValidWatchlistName('', []);
            expect(result.valid).toBe(false);
            expect(result.error).toContain('empty');
        });

        it('should reject name that is too long', () => {
            const longName = 'a'.repeat(51);
            const result = isValidWatchlistName(longName, []);
            expect(result.valid).toBe(false);
            expect(result.error).toContain('50 characters');
        });

        it('should reject duplicate name', () => {
            const result = isValidWatchlistName('Test', ['Test', 'Other']);
            expect(result.valid).toBe(false);
            expect(result.error).toContain('already exists');
        });

        it('should be case insensitive for duplicates', () => {
            const result = isValidWatchlistName('test', ['Test', 'Other']);
            expect(result.valid).toBe(false);
        });
    });

    describe('mergeWatchlists', () => {
        it('should merge multiple watchlists', () => {
            const merged = mergeWatchlists([mockWatchlist, mockWatchlist], 'Merged List');

            expect(merged.name).toBe('Merged List');
            expect(merged.items.length).toBe(2); // Deduplicated
            expect(merged.isDefault).toBe(false);
        });
    });

    describe('duplicateWatchlist', () => {
        it('should create a duplicate with new name', () => {
            const duplicate = duplicateWatchlist(mockWatchlist, 'Copy');

            expect(duplicate.name).toBe('Copy');
            expect(duplicate.id).not.toBe(mockWatchlist.id);
            expect(duplicate.items.length).toBe(2);
            expect(duplicate.isDefault).toBe(false);
        });
    });

    describe('formatItemCount', () => {
        it('should format zero items', () => {
            expect(formatItemCount(0)).toBe('No items');
        });

        it('should format one item', () => {
            expect(formatItemCount(1)).toBe('1 item');
        });

        it('should format multiple items', () => {
            expect(formatItemCount(5)).toBe('5 items');
        });
    });

    describe('getRelativeTime', () => {
        it('should show "Just now" for recent timestamps', () => {
            const recent = Date.now();
            expect(getRelativeTime(recent)).toBe('Just now');
        });

        it('should show minutes ago', () => {
            const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
            expect(getRelativeTime(fiveMinutesAgo)).toBe('5m ago');
        });

        it('should show hours ago', () => {
            const twoHoursAgo = Date.now() - 2 * 60 * 60 * 1000;
            expect(getRelativeTime(twoHoursAgo)).toBe('2h ago');
        });

        it('should show days ago', () => {
            const threeDaysAgo = Date.now() - 3 * 24 * 60 * 60 * 1000;
            expect(getRelativeTime(threeDaysAgo)).toBe('3d ago');
        });

        it('should show formatted date for older timestamps', () => {
            const weekOld = Date.now() - 8 * 24 * 60 * 60 * 1000;
            const result = getRelativeTime(weekOld);
            expect(result).toMatch(/\d{1,2}\/\d{1,2}\/\d{4}/);
        });
    });
});
