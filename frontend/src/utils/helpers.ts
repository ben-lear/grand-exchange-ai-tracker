/**
 * Data transformation and validation utilities
 */

import type { CurrentPrice, PriceTrend } from '@/types';

/**
 * Calculate the trend based on price change
 * @param priceChange - The price change value
 * @param threshold - Threshold for neutral (default: 0)
 * @returns Trend indicator
 */
export const calculateTrend = (
  priceChange: number,
  threshold: number = 0
): PriceTrend => {
  if (Math.abs(priceChange) <= threshold) return 'neutral';
  return priceChange > 0 ? 'positive' : 'negative';
};

/**
 * Get color class based on trend
 * @param trend - The trend indicator
 * @returns Tailwind color class
 */
export const getTrendColor = (trend: PriceTrend): string => {
  switch (trend) {
    case 'positive':
      return 'text-green-600 dark:text-green-400';
    case 'negative':
      return 'text-red-600 dark:text-red-400';
    case 'neutral':
      return 'text-gray-600 dark:text-gray-400';
  }
};

/**
 * Get background color class based on trend
 * @param trend - The trend indicator
 * @returns Tailwind background color class
 */
export const getTrendBgColor = (trend: PriceTrend): string => {
  switch (trend) {
    case 'positive':
      return 'bg-green-100 dark:bg-green-900';
    case 'negative':
      return 'bg-red-100 dark:bg-red-900';
    case 'neutral':
      return 'bg-gray-100 dark:bg-gray-800';
  }
};

/**
 * Get trend icon name
 * @param trend - The trend indicator
 * @returns Icon identifier (for use with icon libraries)
 */
export const getTrendIcon = (trend: PriceTrend): string => {
  switch (trend) {
    case 'positive':
      return 'trending-up';
    case 'negative':
      return 'trending-down';
    case 'neutral':
      return 'minus';
  }
};

/**
 * Sort prices by different criteria
 * @param prices - Array of prices to sort
 * @param sortBy - Sort field
 * @param sortOrder - Sort direction
 * @returns Sorted array
 */
export const sortPrices = (
  prices: CurrentPrice[],
  sortBy: keyof CurrentPrice,
  sortOrder: 'asc' | 'desc' = 'asc'
): CurrentPrice[] => {
  return [...prices].sort((a, b) => {
    const aValue = a[sortBy];
    const bValue = b[sortBy];

    // Handle null/undefined values
    if (aValue == null && bValue == null) return 0;
    if (aValue == null) return 1;
    if (bValue == null) return -1;

    if (aValue === bValue) return 0;

    const comparison = aValue < bValue ? -1 : 1;
    return sortOrder === 'asc' ? comparison : -comparison;
  });
};

/**
 * Filter prices by criteria
 * @param prices - Array of prices to filter
 * @param filters - Filter criteria
 * @returns Filtered array
 */
export const filterPrices = (
  prices: CurrentPrice[],
  filters: {
    minPrice?: number;
    maxPrice?: number;
  }
): CurrentPrice[] => {
  return prices.filter((price) => {
    // Use highPrice for filtering, fallback to lowPrice
    const priceValue = price.highPrice ?? price.lowPrice;

    if (filters.minPrice !== undefined && priceValue != null && priceValue < filters.minPrice) {
      return false;
    }
    if (filters.maxPrice !== undefined && priceValue != null && priceValue > filters.maxPrice) {
      return false;
    }
    return true;
  });
};

/**
 * Calculate percentage change
 * @param oldValue - Original value
 * @param newValue - New value
 * @returns Percentage change
 */
export const calculatePercentageChange = (
  oldValue: number,
  newValue: number
): number => {
  if (oldValue === 0) return 0;
  return ((newValue - oldValue) / oldValue) * 100;
};

/**
 * Validate item ID
 * @param id - The ID to validate
 * @returns True if valid
 */
export const isValidItemId = (id: number): boolean => {
  return Number.isInteger(id) && id > 0;
};

/**
 * Debounce a function
 * @param func - Function to debounce
 * @param wait - Wait time in milliseconds
 * @returns Debounced function
 */
export const debounce = <T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: ReturnType<typeof setTimeout> | null = null;

  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

/**
 * Throttle a function
 * @param func - Function to throttle
 * @param limit - Limit time in milliseconds
 * @returns Throttled function
 */
export const throttle = <T extends (...args: unknown[]) => unknown>(
  func: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  let inThrottle: boolean;

  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
};
