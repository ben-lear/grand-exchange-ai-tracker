import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import { pricesAPI } from '../services/api';
import type { PriceGraphData, APIResponse } from '../types';
import { AxiosError } from 'axios';

export const usePriceGraph = (
  itemId: number | undefined,
  range: '7d' | '30d' | '90d' | '180d' = '30d',
  options?: Omit<UseQueryOptions<APIResponse<PriceGraphData>, AxiosError>, 'queryKey' | 'queryFn'>
) => {
  return useQuery<APIResponse<PriceGraphData>, AxiosError>({
    queryKey: ['priceGraph', itemId, range],
    queryFn: async () => {
      if (!itemId) throw new Error('Item ID is required');
      const response = await pricesAPI.getGraph(itemId, range);
      return response.data;
    },
    enabled: !!itemId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    ...options,
  });
};
