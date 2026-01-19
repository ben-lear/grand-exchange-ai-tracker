/**
 * Unit tests for useItemPrefetcher hook
 * Tests background item loading with retry logic
 */

import { renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as api from '../api';
import { useItemDataStore } from '../stores/itemDataStore';
import type { Item } from '../types';
import { useItemPrefetcher } from './useItemPrefetcher';

// Mock the API
vi.mock('../api', () => ({
    fetchItems: vi.fn(),
}));

// Suppress console.error during tests to reduce noise from expected errors
const originalConsoleError = console.error;
beforeEach(() => {
    console.error = vi.fn();
});
afterEach(() => {
    console.error = originalConsoleError;
});

describe('useItemPrefetcher', () => {
    const mockItem1: Item = {
        id: 1,
        itemId: 1,
        name: 'Dragon scimitar',
        description: 'A powerful scimitar',
        iconUrl: 'https://example.com/dragon-scim.png',
        members: true,
        buyLimit: 70,
        highAlch: 72000,
        lowAlch: 48000,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
    };

    const mockItem2: Item = {
        id: 2,
        itemId: 2,
        name: 'Abyssal whip',
        description: 'A demonic whip',
        iconUrl: 'https://example.com/whip.png',
        members: true,
        buyLimit: 70,
        highAlch: 72000,
        lowAlch: 48000,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
    };

    beforeEach(() => {
        // Reset store before each test
        useItemDataStore.getState().reset();
        vi.clearAllMocks();
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    it('initializes with correct default state', () => {
        const { result } = renderHook(() => useItemPrefetcher());

        expect(result.current.isLoading).toBe(true);
        expect(result.current.hasFirstPage).toBe(false);
        expect(result.current.totalFetched).toBe(0);
        expect(result.current.totalExpected).toBe(0);
        expect(result.current.error).toBe(null);
    });

    it('fetches first page successfully', async () => {
        const mockResponse = {
            data: [mockItem1, mockItem2],
            meta: {
                page: 1,
                limit: 200,
                total: 2,
                total_pages: 1,
            },
        };

        vi.mocked(api.fetchItems).mockResolvedValueOnce(mockResponse);

        const { result } = renderHook(() => useItemPrefetcher());

        await waitFor(() => {
            expect(result.current.hasFirstPage).toBe(true);
        });

        expect(result.current.totalFetched).toBe(2);
        expect(result.current.isLoading).toBe(false);
        expect(useItemDataStore.getState().isFullyLoaded).toBe(true);
    });

    it('fetches multiple pages', async () => {
        const page1Response = {
            data: [mockItem1],
            meta: {
                page: 1,
                limit: 1,
                total: 2,
                total_pages: 2,
            },
        };

        const page2Response = {
            data: [mockItem2],
            meta: {
                page: 2,
                limit: 1,
                total: 2,
                total_pages: 2,
            },
        };

        vi.mocked(api.fetchItems)
            .mockResolvedValueOnce(page1Response)
            .mockResolvedValueOnce(page2Response);

        const { result } = renderHook(() => useItemPrefetcher());

        await waitFor(() => {
            expect(result.current.isLoading).toBe(false);
        });

        expect(result.current.hasFirstPage).toBe(true);
        expect(result.current.totalFetched).toBe(2);
        expect(result.current.totalExpected).toBe(2);
        expect(useItemDataStore.getState().getItemCount()).toBe(2);
    });

    it('retries on failure', async () => {
        const errorMessage = 'Network error';
        const successResponse = {
            data: [mockItem1],
            meta: {
                page: 1,
                limit: 200,
                total: 1,
                total_pages: 1,
            },
        };

        // Fail once, then succeed
        vi.mocked(api.fetchItems)
            .mockRejectedValueOnce(new Error(errorMessage))
            .mockResolvedValueOnce(successResponse);

        renderHook(() => useItemPrefetcher());

        // Just verify retry happened
        await waitFor(
            () => {
                expect(api.fetchItems).toHaveBeenCalledTimes(2);
            },
            { timeout: 3000 }
        );
    });

    it('skips fetching if already fully loaded', () => {
        // Pre-populate store and mark as loaded
        useItemDataStore.getState().addItems([mockItem1]);
        useItemDataStore.getState().setFullyLoaded();

        renderHook(() => useItemPrefetcher());

        // Should not call API
        expect(api.fetchItems).not.toHaveBeenCalled();
    });

    it('does not start multiple fetches on re-render', async () => {
        const mockResponse = {
            data: [mockItem1],
            meta: {
                page: 1,
                limit: 200,
                total: 1,
                total_pages: 1,
            },
        };

        vi.mocked(api.fetchItems).mockResolvedValueOnce(mockResponse);

        const { rerender } = renderHook(() => useItemPrefetcher());

        // Wait for initial fetch (may be called twice in strict mode)
        await waitFor(() => {
            expect(api.fetchItems).toHaveBeenCalled();
        });

        const initialCallCount = vi.mocked(api.fetchItems).mock.calls.length;

        // Trigger re-renders
        rerender();
        rerender();
        rerender();

        // Give time for any duplicate fetches to happen
        await new Promise(resolve => setTimeout(resolve, 50));

        // Should not have called again after re-renders
        expect(api.fetchItems).toHaveBeenCalledTimes(initialCallCount);
    });

    it('adds items to store as pages load', async () => {
        const page1Response = {
            data: [mockItem1],
            meta: {
                page: 1,
                limit: 1,
                total: 2,
                total_pages: 2,
            },
        };

        const page2Response = {
            data: [mockItem2],
            meta: {
                page: 2,
                limit: 1,
                total: 2,
                total_pages: 2,
            },
        };

        vi.mocked(api.fetchItems)
            .mockResolvedValueOnce(page1Response)
            .mockResolvedValueOnce(page2Response);

        renderHook(() => useItemPrefetcher());

        // Wait for both pages to load
        await waitFor(() => {
            expect(useItemDataStore.getState().getItemCount()).toBe(2);
        }, { timeout: 1000 });

        const items = useItemDataStore.getState().getItemsArray();
        expect(items).toContainEqual(mockItem1);
        expect(items).toContainEqual(mockItem2);
    });

    it('updates totalExpected based on API metadata', async () => {
        const mockResponse = {
            data: [mockItem1],
            meta: {
                page: 1,
                limit: 1,
                total: 500,
                total_pages: 500,
            },
        };

        // Mock to only return one page then stop
        vi.mocked(api.fetchItems)
            .mockResolvedValueOnce(mockResponse)
            .mockResolvedValue({
                data: [],
                meta: { page: 2, limit: 1, total: 500, total_pages: 500 },
            });

        const { result } = renderHook(() => useItemPrefetcher());

        await waitFor(() => {
            expect(result.current.hasFirstPage).toBe(true);
        }, { timeout: 1000 });

        // Check that totalExpected was updated from first response
        await waitFor(() => {
            expect(result.current.totalExpected).toBe(500);
        }, { timeout: 1000 });
    });

    it('handles abort/cleanup on unmount', async () => {
        const mockResponse = {
            data: [mockItem1],
            meta: {
                page: 1,
                limit: 200,
                total: 1000,
                total_pages: 5,
            },
        };

        // Slow response to test abort
        vi.mocked(api.fetchItems).mockImplementation(
            () => new Promise((resolve) => setTimeout(() => resolve(mockResponse), 5000))
        );

        const { unmount } = renderHook(() => useItemPrefetcher());

        // Unmount before fetch completes
        unmount();

        // Wait a bit to ensure no errors thrown
        await new Promise((resolve) => setTimeout(resolve, 100));

        // Should not have updated store
        expect(useItemDataStore.getState().getItemCount()).toBe(0);
    });

    it('handles empty API response', async () => {
        const emptyResponse = {
            data: [],
            meta: {
                page: 1,
                limit: 200,
                total: 0,
                total_pages: 0,
            },
        };

        vi.mocked(api.fetchItems).mockResolvedValueOnce(emptyResponse);

        const { result } = renderHook(() => useItemPrefetcher());

        await waitFor(() => {
            expect(result.current.isLoading).toBe(false);
        });

        expect(result.current.hasFirstPage).toBe(true); // Has "first" page even if empty
        expect(result.current.totalFetched).toBe(0);
        expect(useItemDataStore.getState().isFullyLoaded).toBe(true);
    });
});
