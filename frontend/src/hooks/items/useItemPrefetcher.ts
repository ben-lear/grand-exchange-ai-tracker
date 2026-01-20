/**
 * Hook to prefetch all items in the background on app mount
 * Fetches pages sequentially without delay, with exponential backoff retry on failure
 */

import { useEffect, useRef, useState } from 'react';
import { fetchItems } from '../../api';
import { useItemDataStore } from '../../stores';
import type { Item } from '../../types';

const MAX_RETRIES = 3;
const PAGE_SIZE = 200;

/**
 * Calculate exponential backoff delay
 * @param attempt - Current retry attempt (0-indexed)
 * @returns Delay in milliseconds (1s, 2s, 4s)
 */
function getBackoffDelay(attempt: number): number {
    return Math.pow(2, attempt) * 1000;
}

/**
 * Fetch a single page with retry logic
 */
async function fetchPageWithRetry(
    page: number,
    signal: AbortSignal
): Promise<{ items: Item[]; hasMore: boolean; total: number }> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
        try {
            const response = await fetchItems({ page, pageSize: PAGE_SIZE });

            // Check if aborted during fetch
            if (signal.aborted) {
                throw new Error('Aborted');
            }

            const total = response.meta?.total ?? 0;
            const totalPages = response.meta?.total_pages ?? 1;

            return {
                items: response.data,
                hasMore: page < totalPages,
                total,
            };
        } catch (error) {
            if (signal.aborted) throw error;
            lastError = error as Error;

            // Wait before retrying (except on last attempt)
            if (attempt < MAX_RETRIES - 1) {
                await new Promise((resolve) =>
                    setTimeout(resolve, getBackoffDelay(attempt))
                );
            }
        }
    }

    throw lastError || new Error('Failed to fetch page');
}

export interface PrefetcherState {
    /** Whether prefetching is currently in progress */
    isLoading: boolean;
    /** Whether at least one page has been loaded */
    hasFirstPage: boolean;
    /** Total number of items fetched so far */
    totalFetched: number;
    /** Expected total number of items (from API pagination) */
    totalExpected: number;
    /** Error message if prefetching failed */
    error: string | null;
}

/**
 * Hook that prefetches all items on mount
 * 
 * - Skips if already fully loaded
 * - Fetches pages sequentially without delay
 * - Retries failed pages with exponential backoff
 * - Continues to next page if a page fails after max retries
 * 
 * @returns Prefetcher state for UI feedback
 * 
 * @example
 * ```tsx
 * const { isLoading, hasFirstPage, totalFetched, totalExpected } = useItemPrefetcher();
 * 
 * if (!hasFirstPage) {
 *   return <LoadingSpinner />;
 * }
 * ```
 */
export function useItemPrefetcher(): PrefetcherState {
    const {
        items,
        isFullyLoaded,
        isPrefetching,
        addItems,
        setFullyLoaded,
        setPrefetching,
        setLoadError
    } = useItemDataStore();

    const [state, setState] = useState<PrefetcherState>({
        isLoading: !isFullyLoaded,
        hasFirstPage: items.size > 0,
        totalFetched: items.size,
        totalExpected: 0,
        error: null,
    });

    // Prevent multiple concurrent fetch runs
    const fetchingRef = useRef(false);

    useEffect(() => {
        // Skip if already loaded or currently fetching
        if (isFullyLoaded || isPrefetching || fetchingRef.current) return;
        fetchingRef.current = true;
        setPrefetching(true);

        const controller = new AbortController();

        async function prefetchAll() {
            let page = 1;
            let hasMore = true;
            let totalExpected = 0;
            const errors: string[] = [];
            try {
                while (hasMore) {
                    try {
                        const result = await fetchPageWithRetry(page, controller.signal);

                        // Update store with new items
                        addItems(result.items);

                        // Update expected total from first successful response
                        if (result.total > 0) {
                            totalExpected = result.total;
                        }

                        // Update state for UI feedback
                        setState((prev) => ({
                            ...prev,
                            hasFirstPage: true,
                            totalFetched: prev.totalFetched + result.items.length,
                            totalExpected,
                        }));

                        hasMore = result.hasMore;
                        page++;
                    } catch (error) {
                        // Stop if aborted
                        if (controller.signal.aborted) return;

                        // Log error but continue to next page
                        const errMsg = `Page ${page} failed after ${MAX_RETRIES} retries`;
                        errors.push(errMsg);
                        console.error('[useItemPrefetcher]', errMsg, error);

                        page++;

                        // Stop if too many consecutive errors (5+ pages failed)
                        if (errors.length > 5) {
                            console.error('[useItemPrefetcher] Too many errors, stopping prefetch');
                            hasMore = false;
                        }
                    }
                }

                // Mark as fully loaded
                setFullyLoaded();

                // Set error state if there were failures
                if (errors.length > 0) {
                    const errorMsg = `Some pages failed to load: ${errors.length} errors`;
                    setLoadError(errorMsg);
                    setState((prev) => ({ ...prev, isLoading: false, error: errorMsg }));
                } else {
                    setState((prev) => ({ ...prev, isLoading: false }));
                }
            } finally {
                fetchingRef.current = false;
                setPrefetching(false);
            }
        }

        prefetchAll();

        // Cleanup: abort any in-flight requests on unmount
        return () => {
            controller.abort();
            fetchingRef.current = false;
        };
    }, [isFullyLoaded, addItems, setFullyLoaded, setPrefetching, setLoadError]);

    return state;
}
