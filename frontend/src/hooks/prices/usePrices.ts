/**
 * TanStack Query hooks for price-related data fetching
 */

import { useMutation, useQuery, useQueryClient, type UseQueryOptions } from '@tanstack/react-query';
import {
  fetchAllCurrentPrices,
  fetchBatchCurrentPrices,
  fetchCurrentPrice,
  fetchPriceHistory,
  syncCurrentPrices,
} from '@/api';
import type {
  ApiError,
  BatchPriceResponse,
  CurrentPrice,
  PriceHistory,
  TimePeriod,
} from '@/types';

/**
 * Query keys for prices
 */
export const priceKeys = {
  all: ['prices'] as const,
  current: () => [...priceKeys.all, 'current'] as const,
  currentAll: () => [...priceKeys.current(), 'all'] as const,
  currentOne: (itemId: number) => [...priceKeys.current(), itemId] as const,
  currentBatch: (itemIds: number[]) => [...priceKeys.current(), 'batch', itemIds] as const,
  history: () => [...priceKeys.all, 'history'] as const,
  historyOne: (itemId: number, period: TimePeriod, sample?: number) =>
    [...priceKeys.history(), itemId, period, sample] as const,
};

/**
 * Hook to fetch all current prices with auto-refresh
 */
export const useAllCurrentPrices = (
  options?: Omit<UseQueryOptions<CurrentPrice[], ApiError>, 'queryKey' | 'queryFn'>
) => {
  return useQuery<CurrentPrice[], ApiError>({
    queryKey: priceKeys.currentAll(),
    queryFn: fetchAllCurrentPrices,
    staleTime: 50 * 1000, // 50 seconds
    refetchInterval: 60 * 1000, // Auto-refetch every 1 minute
    refetchIntervalInBackground: true, // Keep refetching even when tab is not active
    ...options,
  });
};

/**
 * Hook to fetch current price for a single item
 */
export const useCurrentPrice = (
  itemId: number,
  options?: Omit<UseQueryOptions<CurrentPrice, ApiError>, 'queryKey' | 'queryFn'>
) => {
  return useQuery<CurrentPrice, ApiError>({
    queryKey: priceKeys.currentOne(itemId),
    queryFn: () => fetchCurrentPrice(itemId),
    staleTime: 50 * 1000, // 50 seconds
    refetchInterval: 60 * 1000, // Auto-refetch every 1 minute
    enabled: itemId > 0,
    ...options,
  });
};

/**
 * Hook to fetch current prices for multiple items (batch)
 */
export const useBatchCurrentPrices = (
  itemIds: number[],
  options?: Omit<UseQueryOptions<BatchPriceResponse, ApiError>, 'queryKey' | 'queryFn'>
) => {
  return useQuery<BatchPriceResponse, ApiError>({
    queryKey: priceKeys.currentBatch(itemIds),
    queryFn: () => fetchBatchCurrentPrices(itemIds),
    staleTime: 50 * 1000,
    refetchInterval: 60 * 1000,
    enabled: itemIds.length > 0 && itemIds.length <= 100,
    ...options,
  });
};

/**
 * Hook to fetch historical price data for an item
 */
export const usePriceHistory = (
  itemId: number,
  period: TimePeriod = '7d',
  sample?: number,
  options?: Omit<UseQueryOptions<PriceHistory, ApiError>, 'queryKey' | 'queryFn'>
) => {
  return useQuery<PriceHistory, ApiError>({
    queryKey: priceKeys.historyOne(itemId, period, sample),
    queryFn: () => fetchPriceHistory(itemId, period, sample),
    staleTime: 10 * 60 * 1000, // 10 minutes - historical data doesn't change frequently
    enabled: itemId > 0,
    ...options,
  });
};

/**
 * Hook to manually sync current prices (admin)
 */
export const useSyncCurrentPrices = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: syncCurrentPrices,
    onSuccess: () => {
      // Invalidate all current price queries
      queryClient.invalidateQueries({ queryKey: priceKeys.current() });
    },
  });
};

/**
 * Hook to prefetch price history (useful for chart loading preparation)
 */
export const usePrefetchPriceHistory = () => {
  const queryClient = useQueryClient();

  return (itemId: number, period: TimePeriod = '7d', sample?: number) => {
    queryClient.prefetchQuery({
      queryKey: priceKeys.historyOne(itemId, period, sample),
      queryFn: () => fetchPriceHistory(itemId, period, sample),
      staleTime: 10 * 60 * 1000,
    });
  };
};
