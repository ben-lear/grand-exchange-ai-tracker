/**
 * API functions for item-related endpoints
 */

import apiClient from './client';
import type {
  Item,
  ItemListResponse,
  ItemCountResponse,
  ItemFilters,
  PaginationParams,
  SortParams,
} from '../types';

/**
 * Fetch a paginated list of items with optional filters
 */
export const fetchItems = async (
  params?: PaginationParams & SortParams & ItemFilters
): Promise<ItemListResponse> => {
  const response = await apiClient.get<ItemListResponse>('/items', { params });
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
 * Search for items by name
 */
export const searchItems = async (query: string): Promise<Item[]> => {
  const response = await apiClient.get<Item[]>('/items/search', {
    params: { q: query },
  });
  return response.data;
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
