/**
 * TanStack Query hooks for item-related data fetching
 */

import { useQuery, useQueryClient, type UseQueryOptions } from '@tanstack/react-query';
import {
  fetchItemById,
  fetchItemCount,
  fetchItems,
} from '@/api';
import type {
  ApiError,
  Item,
  ItemCountResponse,
  ItemFilters,
  ItemListResponse,
  PaginationParams,
  SortParams,
} from '@/types';

/**
 * Query keys for items
 */
export const itemKeys = {
  all: ['items'] as const,
  lists: () => [...itemKeys.all, 'list'] as const,
  list: (params?: PaginationParams & SortParams & ItemFilters) =>
    [...itemKeys.lists(), params] as const,
  details: () => [...itemKeys.all, 'detail'] as const,
  detail: (id: number) => [...itemKeys.details(), id] as const,
  count: (filters?: ItemFilters) => [...itemKeys.all, 'count', filters] as const,
};

/**
 * Hook to fetch paginated items with filters
 */
export const useItems = (
  params?: PaginationParams & SortParams & ItemFilters,
  options?: Omit<UseQueryOptions<ItemListResponse, ApiError>, 'queryKey' | 'queryFn'>
) => {
  return useQuery<ItemListResponse, ApiError>({
    queryKey: itemKeys.list(params),
    queryFn: () => fetchItems(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
    ...options,
  });
};

/**
 * Hook to fetch a single item by ID
 */
export const useItem = (
  id: number,
  options?: Omit<UseQueryOptions<Item, ApiError>, 'queryKey' | 'queryFn'>
) => {
  return useQuery<Item, ApiError>({
    queryKey: itemKeys.detail(id),
    queryFn: () => fetchItemById(id),
    staleTime: 10 * 60 * 1000, // 10 minutes - item data doesn't change often
    enabled: id > 0, // Only run if we have a valid ID
    ...options,
  });
};

/**
 * Hook to fetch item count with filters
 */
export const useItemCount = (
  filters?: ItemFilters,
  options?: Omit<UseQueryOptions<ItemCountResponse, ApiError>, 'queryKey' | 'queryFn'>
) => {
  return useQuery<ItemCountResponse, ApiError>({
    queryKey: itemKeys.count(filters),
    queryFn: () => fetchItemCount(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
    ...options,
  });
};

/**
 * Hook to prefetch an item (useful for hover or navigation preparation)
 */
export const usePrefetchItem = () => {
  const queryClient = useQueryClient();

  return (id: number) => {
    queryClient.prefetchQuery({
      queryKey: itemKeys.detail(id),
      queryFn: () => fetchItemById(id),
      staleTime: 10 * 60 * 1000,
    });
  };
};
