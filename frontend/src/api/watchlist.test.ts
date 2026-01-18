/**
 * Unit tests for watchlist API functions
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Watchlist } from '../types/watchlist';
import apiClient from './client';
import {
    createWatchlistShare,
    isValidShareToken,
    retrieveWatchlistShare,
} from './watchlist';

// Mock axios client
vi.mock('./client', () => ({
    default: {
        get: vi.fn(),
        post: vi.fn(),
    },
}));

describe('Watchlist API', () => {
    const mockWatchlist: Watchlist = {
        id: 'test-id',
        name: 'Test Watchlist',
        items: [
            {
                itemId: 1,
                name: 'Item 1',
                iconUrl: 'https://example.com/icon1.png',
                addedAt: Date.now(),
            },
        ],
        createdAt: Date.now(),
        updatedAt: Date.now(),
        isDefault: false,
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('createWatchlistShare', () => {
        it('creates a share and returns share data', async () => {
            const mockResponse = {
                data: {
                    token: 'swift-golden-dragon',
                    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
                },
            };

            vi.mocked(apiClient.post).mockResolvedValue(mockResponse);

            const result = await createWatchlistShare(mockWatchlist);

            expect(apiClient.post).toHaveBeenCalledWith('/watchlists/share', {
                watchlist: mockWatchlist,
            });

            expect(result).toEqual({
                token: 'swift-golden-dragon',
                watchlist: mockWatchlist,
                expiresAt: expect.any(Number),
                accessCount: 0,
            });
        });

        it('converts ISO string to timestamp for expiresAt', async () => {
            const expirationDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
            const mockResponse = {
                data: {
                    token: 'test-token',
                    expiresAt: expirationDate.toISOString(),
                },
            };

            vi.mocked(apiClient.post).mockResolvedValue(mockResponse);

            const result = await createWatchlistShare(mockWatchlist);

            expect(result.expiresAt).toBe(expirationDate.getTime());
        });

        it('throws error on API failure', async () => {
            vi.mocked(apiClient.post).mockRejectedValue(new Error('Network error'));

            await expect(createWatchlistShare(mockWatchlist)).rejects.toThrow('Network error');
        });

        it('includes the original watchlist in response', async () => {
            const mockResponse = {
                data: {
                    token: 'test-token',
                    expiresAt: new Date().toISOString(),
                },
            };

            vi.mocked(apiClient.post).mockResolvedValue(mockResponse);

            const result = await createWatchlistShare(mockWatchlist);

            expect(result.watchlist).toEqual(mockWatchlist);
        });

        it('sets accessCount to 0 for new shares', async () => {
            const mockResponse = {
                data: {
                    token: 'test-token',
                    expiresAt: new Date().toISOString(),
                },
            };

            vi.mocked(apiClient.post).mockResolvedValue(mockResponse);

            const result = await createWatchlistShare(mockWatchlist);

            expect(result.accessCount).toBe(0);
        });
    });

    describe('retrieveWatchlistShare', () => {
        it('retrieves a shared watchlist by token', async () => {
            const mockResponse = {
                data: {
                    watchlist: mockWatchlist,
                    accessCount: 5,
                    expiresAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
                },
            };

            vi.mocked(apiClient.get).mockResolvedValue(mockResponse);

            const result = await retrieveWatchlistShare('swift-golden-dragon');

            expect(apiClient.get).toHaveBeenCalledWith('/watchlists/share/swift-golden-dragon');

            expect(result).toEqual({
                token: 'swift-golden-dragon',
                watchlist: mockWatchlist,
                expiresAt: expect.any(Number),
                accessCount: 5,
            });
        });

        it('converts ISO string to timestamp for expiresAt', async () => {
            const expirationDate = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000);
            const mockResponse = {
                data: {
                    watchlist: mockWatchlist,
                    accessCount: 3,
                    expiresAt: expirationDate.toISOString(),
                },
            };

            vi.mocked(apiClient.get).mockResolvedValue(mockResponse);

            const result = await retrieveWatchlistShare('test-token');

            expect(result.expiresAt).toBe(expirationDate.getTime());
        });

        it('includes access count from server', async () => {
            const mockResponse = {
                data: {
                    watchlist: mockWatchlist,
                    accessCount: 42,
                    expiresAt: new Date().toISOString(),
                },
            };

            vi.mocked(apiClient.get).mockResolvedValue(mockResponse);

            const result = await retrieveWatchlistShare('test-token');

            expect(result.accessCount).toBe(42);
        });

        it('throws error for invalid token', async () => {
            vi.mocked(apiClient.get).mockRejectedValue(new Error('Token not found'));

            await expect(retrieveWatchlistShare('invalid-token')).rejects.toThrow('Token not found');
        });

        it('throws error for expired token', async () => {
            vi.mocked(apiClient.get).mockRejectedValue(new Error('Token expired'));

            await expect(retrieveWatchlistShare('expired-token')).rejects.toThrow('Token expired');
        });

        it('includes the token in the response', async () => {
            const mockResponse = {
                data: {
                    watchlist: mockWatchlist,
                    accessCount: 1,
                    expiresAt: new Date().toISOString(),
                },
            };

            vi.mocked(apiClient.get).mockResolvedValue(mockResponse);

            const result = await retrieveWatchlistShare('my-token');

            expect(result.token).toBe('my-token');
        });
    });

    describe('isValidShareToken', () => {
        it('validates correct token format (adjective-adjective-noun)', () => {
            expect(isValidShareToken('swift-golden-dragon')).toBe(true);
            expect(isValidShareToken('happy-tiny-cat')).toBe(true);
            expect(isValidShareToken('brave-loud-lion')).toBe(true);
        });

        it('rejects tokens with uppercase letters', () => {
            expect(isValidShareToken('Swift-Golden-Dragon')).toBe(false);
            expect(isValidShareToken('SWIFT-GOLDEN-DRAGON')).toBe(false);
        });

        it('rejects tokens with numbers', () => {
            expect(isValidShareToken('swift-golden-dragon123')).toBe(false);
            expect(isValidShareToken('123-456-789')).toBe(false);
        });

        it('rejects tokens with wrong number of parts', () => {
            expect(isValidShareToken('swift-golden')).toBe(false); // Only 2 parts
            expect(isValidShareToken('swift-golden-dragon-extra')).toBe(false); // 4 parts
            expect(isValidShareToken('swift')).toBe(false); // Only 1 part
        });

        it('rejects tokens with special characters', () => {
            expect(isValidShareToken('swift_golden_dragon')).toBe(false);
            expect(isValidShareToken('swift.golden.dragon')).toBe(false);
            expect(isValidShareToken('swift golden dragon')).toBe(false);
        });

        it('rejects empty or null tokens', () => {
            expect(isValidShareToken('')).toBe(false);
            expect(isValidShareToken('  ')).toBe(false);
        });

        it('rejects tokens with leading/trailing hyphens', () => {
            expect(isValidShareToken('-swift-golden-dragon')).toBe(false);
            expect(isValidShareToken('swift-golden-dragon-')).toBe(false);
        });

        it('accepts single-letter words in token', () => {
            expect(isValidShareToken('a-b-c')).toBe(true);
        });

        it('rejects tokens with empty parts', () => {
            expect(isValidShareToken('swift--dragon')).toBe(false);
            expect(isValidShareToken('-golden-dragon')).toBe(false);
            expect(isValidShareToken('swift-golden-')).toBe(false);
        });
    });
});
