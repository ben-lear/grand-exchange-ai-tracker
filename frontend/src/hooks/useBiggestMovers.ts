import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import { statsAPI } from '../services/api';
import type { BiggestMover, APIResponse } from '../types';
import { AxiosError } from 'axios';

interface UseBiggestMoversParams {
  direction?: 'gainers' | 'losers';
  limit?: number;
}

export const useBiggestMovers = (
  params: UseBiggestMoversParams = { direction: 'gainers', limit: 10 },
  options?: Omit<UseQueryOptions<APIResponse<BiggestMover[]>, AxiosError>, 'queryKey' | 'queryFn'>
) => {
  return useQuery<APIResponse<BiggestMover[]>, AxiosError>({
    queryKey: ['biggestMovers', params],
    queryFn: async () => {
      const response = await statsAPI.biggestMovers(params);
      return response.data;
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
    ...options,
  });
};
