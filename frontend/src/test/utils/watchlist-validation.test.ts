/**
 * Unit tests for watchlist validation utilities
 */

import { describe, expect, it } from 'vitest';
import {
    filterValidItems,
    parseWatchlistJSON,
    sanitizeWatchlistName,
    validateShareToken,
    validateWatchlist,
    validateWatchlistImport,
    validateWatchlistItem,
} from '../../utils/watchlist-validation';

describe('Watchlist Validation', () => {
    describe('validateWatchlist', () => {
        it('should validate a valid watchlist', () => {
            const watchlist = {
                id: '123e4567-e89b-12d3-a456-426614174000',
                name: 'My Watchlist',
                items: [
                    {
                        itemId: 4151,
                        name: 'Abyssal whip',
                        iconUrl: 'https://example.com/whip.png',
                        addedAt: Date.now(),
                    },
                ],
                createdAt: Date.now(),
                updatedAt: Date.now(),
                isDefault: false,
            };

            const result = validateWatchlist(watchlist);
            expect(result.valid).toBe(true);
            expect(result.errors.length).toBe(0);
        });

        it('should reject invalid watchlist', () => {
            const watchlist = {
                id: 'invalid-id',
                name: '',
                items: [],
                createdAt: Date.now(),
                updatedAt: Date.now(),
                isDefault: false,
            };

            const result = validateWatchlist(watchlist);
            expect(result.valid).toBe(false);
            expect(result.errors.length).toBeGreaterThan(0);
        });

        it('should reject watchlist with invalid items', () => {
            const watchlist = {
                id: '123e4567-e89b-12d3-a456-426614174000',
                name: 'My Watchlist',
                items: [
                    {
                        itemId: -1, // Invalid
                        name: 'Test',
                        iconUrl: 'not-a-url',
                        addedAt: Date.now(),
                    },
                ],
                createdAt: Date.now(),
                updatedAt: Date.now(),
                isDefault: false,
            };

            const result = validateWatchlist(watchlist);
            expect(result.valid).toBe(false);
        });
    });

    describe('validateWatchlistImport', () => {
        it('should validate a valid export', () => {
            const exportData = {
                version: '1.0.0',
                metadata: {
                    exportedAt: new Date().toISOString(),
                    source: 'osrs-ge-tracker',
                },
                watchlists: [
                    {
                        id: '123e4567-e89b-12d3-a456-426614174000',
                        name: 'Test List',
                        items: [],
                        createdAt: Date.now(),
                        updatedAt: Date.now(),
                        isDefault: false,
                    },
                ],
            };

            const result = validateWatchlistImport(exportData);
            expect(result.valid).toBe(true);
        });

        it('should handle partial success with warnings', () => {
            const exportData = {
                version: '1.0.0',
                metadata: {
                    exportedAt: new Date().toISOString(),
                    source: 'osrs-ge-tracker',
                },
                watchlists: [
                    {
                        id: '123e4567-e89b-12d3-a456-426614174000',
                        name: 'Valid List',
                        items: [],
                        createdAt: Date.now(),
                        updatedAt: Date.now(),
                        isDefault: false,
                    },
                    {
                        id: 'invalid-id',
                        name: '',
                        items: [],
                        createdAt: Date.now(),
                        updatedAt: Date.now(),
                        isDefault: false,
                    },
                ],
            };

            const result = validateWatchlistImport(exportData);
            expect(result.valid).toBe(true);
            expect(result.warnings.length).toBeGreaterThan(0);
            expect(result.errors.length).toBeGreaterThan(0);
        });

        it('should reject invalid export format', () => {
            const result = validateWatchlistImport({ invalid: 'data' });
            expect(result.valid).toBe(false);
            expect(result.errors.length).toBeGreaterThan(0);
        });
    });

    describe('validateWatchlistItem', () => {
        it('should validate a valid item', () => {
            const item = {
                itemId: 4151,
                name: 'Abyssal whip',
                iconUrl: 'https://example.com/whip.png',
                addedAt: Date.now(),
            };

            const result = validateWatchlistItem(item);
            expect(result.valid).toBe(true);
            expect(result.item).toBeDefined();
        });

        it('should reject invalid item', () => {
            const item = {
                itemId: -1,
                name: '',
                iconUrl: 'not-a-url',
                addedAt: Date.now(),
            };

            const result = validateWatchlistItem(item);
            expect(result.valid).toBe(false);
            expect(result.error).toBeDefined();
        });

        it('should validate item with notes', () => {
            const item = {
                itemId: 4151,
                name: 'Abyssal whip',
                iconUrl: 'https://example.com/whip.png',
                addedAt: Date.now(),
                notes: 'Good for training',
            };

            const result = validateWatchlistItem(item);
            expect(result.valid).toBe(true);
            expect(result.item?.notes).toBe('Good for training');
        });
    });

    describe('validateShareToken', () => {
        it('should validate correct token format', () => {
            expect(validateShareToken('swift-golden-dragon')).toBe(true);
            expect(validateShareToken('brave-calm-phoenix')).toBe(true);
        });

        it('should reject incorrect token format', () => {
            expect(validateShareToken('invalid')).toBe(false);
            expect(validateShareToken('too-many-parts-here')).toBe(false);
            expect(validateShareToken('Swift-Golden-Dragon')).toBe(false); // Uppercase
            expect(validateShareToken('swift_golden_dragon')).toBe(false); // Underscores
        });
    });

    describe('sanitizeWatchlistName', () => {
        it('should trim whitespace', () => {
            expect(sanitizeWatchlistName('  Test  ')).toBe('Test');
        });

        it('should enforce max length', () => {
            const longName = 'a'.repeat(100);
            expect(sanitizeWatchlistName(longName).length).toBe(50);
        });

        it('should handle empty string', () => {
            expect(sanitizeWatchlistName('   ')).toBe('');
        });
    });

    describe('parseWatchlistJSON', () => {
        it('should parse valid JSON', () => {
            const json = JSON.stringify({ test: 'data' });
            const result = parseWatchlistJSON(json);
            expect(result.success).toBe(true);
            expect(result.data).toEqual({ test: 'data' });
        });

        it('should handle invalid JSON', () => {
            const result = parseWatchlistJSON('{ invalid json }');
            expect(result.success).toBe(false);
            expect(result.error).toBeDefined();
        });
    });

    describe('filterValidItems', () => {
        it('should filter out invalid items', () => {
            const items = [
                {
                    itemId: 4151,
                    name: 'Valid Item',
                    iconUrl: 'https://example.com/valid.png',
                    addedAt: Date.now(),
                },
                {
                    itemId: -1, // Invalid
                    name: 'Invalid Item',
                    iconUrl: 'not-a-url',
                    addedAt: Date.now(),
                },
                {
                    itemId: 6585,
                    name: 'Another Valid',
                    iconUrl: 'https://example.com/valid2.png',
                    addedAt: Date.now(),
                },
            ];

            const result = filterValidItems(items);
            expect(result.validItems.length).toBe(2);
            expect(result.invalidCount).toBe(1);
            expect(result.warnings.length).toBe(1);
        });

        it('should handle all valid items', () => {
            const items = [
                {
                    itemId: 4151,
                    name: 'Item 1',
                    iconUrl: 'https://example.com/1.png',
                    addedAt: Date.now(),
                },
                {
                    itemId: 6585,
                    name: 'Item 2',
                    iconUrl: 'https://example.com/2.png',
                    addedAt: Date.now(),
                },
            ];

            const result = filterValidItems(items);
            expect(result.validItems.length).toBe(2);
            expect(result.invalidCount).toBe(0);
            expect(result.warnings.length).toBe(0);
        });
    });
});
