import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import { pricesAPI } from '../services/api';
import type { PriceHistory, APIResponse } from '../types';
import { AxiosError } from 'axios';

export const usePriceHistory = (
  itemId: number | undefined,
  range: '7d' | '30d' | '90d' | '180d' = '30d',
  options?: Omit<UseQueryOptions<APIResponse<PriceHistory[]>, AxiosError>, 'queryKey' | 'queryFn'>
) => {
  return useQuery<APIResponse<PriceHistory[]>, AxiosError>({
    queryKey: ['priceHistory', itemId, range],
    queryFn: async () => {
      if (!itemId) throw new Error('Item ID is required');
      const response = await pricesAPI.getHistory(itemId, range);
      return response.data;
    },
    enabled: !!itemId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    ...options,
  });
};
