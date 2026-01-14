import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import { itemsAPI } from '../services/api';
import type { Item, PaginatedResponse, APIResponse } from '../types';
import { AxiosError } from 'axios';

interface UseItemsParams {
  page?: number;
  limit?: number;
  search?: string;
  type?: string;
  members?: boolean;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export const useItems = (
  params: UseItemsParams = {},
  options?: Omit<UseQueryOptions<APIResponse<PaginatedResponse<Item>>, AxiosError>, 'queryKey' | 'queryFn'>
) => {
  return useQuery<APIResponse<PaginatedResponse<Item>>, AxiosError>({
    queryKey: ['items', params],
    queryFn: async () => {
      const response = await itemsAPI.list(params);
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    ...options,
  });
};
