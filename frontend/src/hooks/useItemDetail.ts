import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import { itemsAPI } from '../services/api';
import type { ItemDetail, APIResponse } from '../types';
import { AxiosError } from 'axios';

export const useItemDetail = (
  itemId: number | undefined,
  options?: Omit<UseQueryOptions<APIResponse<ItemDetail>, AxiosError>, 'queryKey' | 'queryFn'>
) => {
  return useQuery<APIResponse<ItemDetail>, AxiosError>({
    queryKey: ['item', itemId],
    queryFn: async () => {
      if (!itemId) throw new Error('Item ID is required');
      const response = await itemsAPI.getById(itemId);
      return response.data;
    },
    enabled: !!itemId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    ...options,
  });
};
