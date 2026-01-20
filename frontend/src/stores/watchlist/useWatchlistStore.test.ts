/**
 * Unit tests for watchlist store
 */

import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { DEFAULT_WATCHLIST_ID, WATCHLIST_LIMITS } from '../../types/watchlist';
import { useWatchlistStore } from './useWatchlistStore';

describe('useWatchlistStore', () => {
    beforeEach(() => {
        // Reset store before each test
        const { result } = renderHook(() => useWatchlistStore());
        act(() => {
            // Clear all non-default watchlists
            const watchlists = result.current.getAllWatchlists();
            watchlists.forEach((w) => {
                if (!w.isDefault) {
                    result.current.deleteWatchlist(w.id);
                }
            });
            // Clear default watchlist items
            result.current.clearWatchlist(DEFAULT_WATCHLIST_ID);
        });
    });

    describe('Watchlist Management', () => {
        it('should create a new watchlist', () => {
            const { result } = renderHook(() => useWatchlistStore());

            act(() => {
                const id = result.current.createWatchlist('My Watchlist');
                expect(id).toBeTruthy();
            });

            const watchlists = result.current.getAllWatchlists();
            expect(watchlists.length).toBeGreaterThan(1);
            expect(watchlists.some((w) => w.name === 'My Watchlist')).toBe(true);
        });

        it('should not create watchlist with duplicate name', () => {
            const { result } = renderHook(() => useWatchlistStore());

            act(() => {
                result.current.createWatchlist('Test List');
                const id = result.current.createWatchlist('Test List');
                expect(id).toBeNull();
            });
        });

        it('should enforce watchlist limit', () => {
            const { result } = renderHook(() => useWatchlistStore());

            act(() => {
                // Create watchlists up to the limit (accounting for default)
                for (let i = 1; i < WATCHLIST_LIMITS.MAX_WATCHLISTS; i++) {
                    result.current.createWatchlist(`Watchlist ${i}`);
                }

                // Try to create one more
                const id = result.current.createWatchlist('Excess Watchlist');
                expect(id).toBeNull();
            });

            expect(result.current.getWatchlistCount()).toBe(WATCHLIST_LIMITS.MAX_WATCHLISTS);
        });

        it('should delete a non-default watchlist', () => {
            const { result } = renderHook(() => useWatchlistStore());

            let watchlistId: string | null = null;
            act(() => {
                watchlistId = result.current.createWatchlist('Delete Me');
            });

            expect(watchlistId).toBeTruthy();

            act(() => {
                const deleted = result.current.deleteWatchlist(watchlistId!);
                expect(deleted).toBe(true);
            });

            const watchlist = result.current.getWatchlist(watchlistId!);
            expect(watchlist).toBeUndefined();
        });

        it('should not delete default watchlist', () => {
            const { result } = renderHook(() => useWatchlistStore());

            act(() => {
                const deleted = result.current.deleteWatchlist(DEFAULT_WATCHLIST_ID);
                expect(deleted).toBe(false);
            });

            const watchlist = result.current.getWatchlist(DEFAULT_WATCHLIST_ID);
            expect(watchlist).toBeDefined();
        });

        it('should rename a watchlist', () => {
            const { result } = renderHook(() => useWatchlistStore());

            let watchlistId: string | null = null;
            act(() => {
                watchlistId = result.current.createWatchlist('Old Name');
            });

            act(() => {
                const renamed = result.current.renameWatchlist(watchlistId!, 'New Name');
                expect(renamed).toBe(true);
            });

            const watchlist = result.current.getWatchlist(watchlistId!);
            expect(watchlist?.name).toBe('New Name');
        });

        it('should not rename default watchlist', () => {
            const { result } = renderHook(() => useWatchlistStore());

            act(() => {
                const renamed = result.current.renameWatchlist(DEFAULT_WATCHLIST_ID, 'New Name');
                expect(renamed).toBe(false);
            });

            const watchlist = result.current.getWatchlist(DEFAULT_WATCHLIST_ID);
            expect(watchlist?.name).toBe('Favorites');
        });
    });

    describe('Item Management', () => {
        it('should add item to watchlist', () => {
            const { result } = renderHook(() => useWatchlistStore());

            const item = {
                itemId: 4151,
                name: 'Abyssal whip',
                iconUrl: 'https://example.com/whip.png',
            };

            act(() => {
                const added = result.current.addItemToWatchlist(DEFAULT_WATCHLIST_ID, item);
                expect(added).toBe(true);
            });

            const watchlist = result.current.getWatchlist(DEFAULT_WATCHLIST_ID);
            expect(watchlist?.items.length).toBe(1);
            expect(watchlist?.items[0].itemId).toBe(4151);
        });

        it('should not add duplicate item to watchlist', () => {
            const { result } = renderHook(() => useWatchlistStore());

            const item = {
                itemId: 4151,
                name: 'Abyssal whip',
                iconUrl: 'https://example.com/whip.png',
            };

            act(() => {
                result.current.addItemToWatchlist(DEFAULT_WATCHLIST_ID, item);
                const added = result.current.addItemToWatchlist(DEFAULT_WATCHLIST_ID, item);
                expect(added).toBe(false);
            });

            const watchlist = result.current.getWatchlist(DEFAULT_WATCHLIST_ID);
            expect(watchlist?.items.length).toBe(1);
        });

        it('should remove item from watchlist', () => {
            const { result } = renderHook(() => useWatchlistStore());

            const item = {
                itemId: 4151,
                name: 'Abyssal whip',
                iconUrl: 'https://example.com/whip.png',
            };

            act(() => {
                result.current.addItemToWatchlist(DEFAULT_WATCHLIST_ID, item);
                result.current.removeItemFromWatchlist(DEFAULT_WATCHLIST_ID, 4151);
            });

            const watchlist = result.current.getWatchlist(DEFAULT_WATCHLIST_ID);
            expect(watchlist?.items.length).toBe(0);
        });

        it('should move item between watchlists', () => {
            const { result } = renderHook(() => useWatchlistStore());

            let secondListId: string | null = null;
            const item = {
                itemId: 4151,
                name: 'Abyssal whip',
                iconUrl: 'https://example.com/whip.png',
            };

            act(() => {
                secondListId = result.current.createWatchlist('Second List');
                result.current.addItemToWatchlist(DEFAULT_WATCHLIST_ID, item);
                const moved = result.current.moveItemBetweenWatchlists(
                    DEFAULT_WATCHLIST_ID,
                    secondListId!,
                    4151
                );
                expect(moved).toBe(true);
            });

            const defaultList = result.current.getWatchlist(DEFAULT_WATCHLIST_ID);
            const secondList = result.current.getWatchlist(secondListId!);

            expect(defaultList?.items.length).toBe(0);
            expect(secondList?.items.length).toBe(1);
            expect(secondList?.items[0].itemId).toBe(4151);
        });

        it('should check if item is in watchlist', () => {
            const { result } = renderHook(() => useWatchlistStore());

            const item = {
                itemId: 4151,
                name: 'Abyssal whip',
                iconUrl: 'https://example.com/whip.png',
            };

            act(() => {
                result.current.addItemToWatchlist(DEFAULT_WATCHLIST_ID, item);
            });

            expect(result.current.isItemInWatchlist(DEFAULT_WATCHLIST_ID, 4151)).toBe(true);
            expect(result.current.isItemInWatchlist(DEFAULT_WATCHLIST_ID, 9999)).toBe(false);
        });

        it('should get all watchlists containing an item', () => {
            const { result } = renderHook(() => useWatchlistStore());

            let secondListId: string | null = null;
            const item = {
                itemId: 4151,
                name: 'Abyssal whip',
                iconUrl: 'https://example.com/whip.png',
            };

            act(() => {
                secondListId = result.current.createWatchlist('Second List');
                result.current.addItemToWatchlist(DEFAULT_WATCHLIST_ID, item);
                result.current.addItemToWatchlist(secondListId!, item);
            });

            const watchlists = result.current.getItemWatchlists(4151);
            expect(watchlists.length).toBe(2);
        });

        it('should update item notes', () => {
            const { result } = renderHook(() => useWatchlistStore());

            const item = {
                itemId: 4151,
                name: 'Abyssal whip',
                iconUrl: 'https://example.com/whip.png',
            };

            act(() => {
                result.current.addItemToWatchlist(DEFAULT_WATCHLIST_ID, item);
                const updated = result.current.updateItemNotes(
                    DEFAULT_WATCHLIST_ID,
                    4151,
                    'Good for melee training'
                );
                expect(updated).toBe(true);
            });

            const watchlist = result.current.getWatchlist(DEFAULT_WATCHLIST_ID);
            expect(watchlist?.items[0].notes).toBe('Good for melee training');
        });
    });

    describe('Import/Export', () => {
        it('should export a watchlist', () => {
            const { result } = renderHook(() => useWatchlistStore());

            const item = {
                itemId: 4151,
                name: 'Abyssal whip',
                iconUrl: 'https://example.com/whip.png',
            };

            act(() => {
                result.current.addItemToWatchlist(DEFAULT_WATCHLIST_ID, item);
            });

            const exported = result.current.exportWatchlist(DEFAULT_WATCHLIST_ID);
            expect(exported).toBeDefined();
            expect(exported?.items.length).toBe(1);
            expect(exported?.items[0].itemId).toBe(4151);
        });

        it('should import a watchlist', () => {
            const { result } = renderHook(() => useWatchlistStore());

            const watchlist = {
                id: 'temp-id',
                name: 'Imported List',
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

            let importedId: string | null = null;
            act(() => {
                importedId = result.current.importWatchlist(watchlist);
            });

            expect(importedId).toBeTruthy();
            const imported = result.current.getWatchlist(importedId!);
            expect(imported?.name).toBe('Imported List');
            expect(imported?.items.length).toBe(1);
        });

        it('should export all watchlists', () => {
            const { result } = renderHook(() => useWatchlistStore());

            act(() => {
                result.current.createWatchlist('Test 1');
                result.current.createWatchlist('Test 2');
            });

            const exported = result.current.exportAllWatchlists();
            expect(exported.length).toBeGreaterThanOrEqual(3); // Default + 2 created
        });
    });

    describe('Bulk Operations', () => {
        it('should clear all items from watchlist', () => {
            const { result } = renderHook(() => useWatchlistStore());

            act(() => {
                result.current.addItemToWatchlist(DEFAULT_WATCHLIST_ID, {
                    itemId: 1,
                    name: 'Item 1',
                    iconUrl: 'https://example.com/1.png',
                });
                result.current.addItemToWatchlist(DEFAULT_WATCHLIST_ID, {
                    itemId: 2,
                    name: 'Item 2',
                    iconUrl: 'https://example.com/2.png',
                });
                result.current.clearWatchlist(DEFAULT_WATCHLIST_ID);
            });

            const watchlist = result.current.getWatchlist(DEFAULT_WATCHLIST_ID);
            expect(watchlist?.items.length).toBe(0);
        });
    });
});
