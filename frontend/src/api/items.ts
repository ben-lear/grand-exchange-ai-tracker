/**
 * API functions for item-related endpoints
 */

import type {
  Item,
  ItemCountResponse,
  ItemFilters,
  ItemListResponse,
  PaginationParams,
  SortParams,
} from '@/types';
import apiClient from './client';

/**
 * Fetch a paginated list of items with optional filters
 */
export const fetchItems = async (
  params?: PaginationParams & SortParams & ItemFilters
): Promise<ItemListResponse> => {
  // Map frontend param names to backend expected names
  const apiParams = params ? {
    page: params.page,
    limit: params.pageSize, // Backend uses 'limit' not 'pageSize'
    sort_by: params.sortBy,
    order: params.sortOrder,
    members: params.members,
  } : undefined;

  const response = await apiClient.get<ItemListResponse>('/items', { params: apiParams });
  return response.data;
};

/**
 * Fetch a single item by ID
 * Backend returns: { data: { ...item, currentPrice: {...} } }
 */
export const fetchItemById = async (id: number): Promise<Item> => {
  const response = await apiClient.get<{ data: Item }>(`/items/${id}`);
  return response.data.data;
};

/**
 * Get the total count of items with optional filters
 */
export const fetchItemCount = async (
  filters?: ItemFilters
): Promise<ItemCountResponse> => {
  const response = await apiClient.get<ItemCountResponse>('/items/count', {
    params: filters,
  });
  return response.data;
};

/**
 * Fetch multiple items by their IDs
 */
export const fetchItemsByIds = async (ids: number[]): Promise<Item[]> => {
  // This endpoint might not exist yet, but we can implement it when needed
  // For now, we'll fetch them individually
  const promises = ids.map((id) => fetchItemById(id));
  return Promise.all(promises);
};
