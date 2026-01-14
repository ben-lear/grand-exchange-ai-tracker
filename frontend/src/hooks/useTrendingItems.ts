import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import { statsAPI } from '../services/api';
import type { TrendingItem, APIResponse } from '../types';
import { AxiosError } from 'axios';

interface UseTrendingItemsParams {
  limit?: number;
  timeframe?: string;
}

export const useTrendingItems = (
  params: UseTrendingItemsParams = { limit: 10, timeframe: '24h' },
  options?: Omit<UseQueryOptions<APIResponse<TrendingItem[]>, AxiosError>, 'queryKey' | 'queryFn'>
) => {
  return useQuery<APIResponse<TrendingItem[]>, AxiosError>({
    queryKey: ['trending', params],
    queryFn: async () => {
      const response = await statsAPI.trending(params);
      return response.data;
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
    ...options,
  });
};
