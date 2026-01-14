/**
 * Unit tests for helper utilities
 */

import { describe, it, expect } from 'vitest';
import {
  calculateTrend,
  getTrendColor,
  getTrendBgColor,
  getTrendIcon,
  calculatePercentageChange,
  isValidItemId,
  filterPrices,
  sortPrices,
} from './helpers';
import type { CurrentPrice } from '../types';

describe('calculateTrend', () => {
  it('returns positive for positive changes', () => {
    expect(calculateTrend(100)).toBe('positive');
    expect(calculateTrend(0.01)).toBe('positive');
  });

  it('returns negative for negative changes', () => {
    expect(calculateTrend(-100)).toBe('negative');
    expect(calculateTrend(-0.01)).toBe('negative');
  });

  it('returns neutral for zero or near-zero changes', () => {
    expect(calculateTrend(0)).toBe('neutral');
  });

  it('respects threshold parameter', () => {
    expect(calculateTrend(5, 10)).toBe('neutral');
    expect(calculateTrend(15, 10)).toBe('positive');
  });
});

describe('getTrendColor', () => {
  it('returns correct color for each trend', () => {
    expect(getTrendColor('positive')).toContain('green');
    expect(getTrendColor('negative')).toContain('red');
    expect(getTrendColor('neutral')).toContain('gray');
  });
});

describe('getTrendBgColor', () => {
  it('returns correct background color for each trend', () => {
    expect(getTrendBgColor('positive')).toContain('bg-green');
    expect(getTrendBgColor('negative')).toContain('bg-red');
    expect(getTrendBgColor('neutral')).toContain('bg-gray');
  });
});

describe('getTrendIcon', () => {
  it('returns correct icon for each trend', () => {
    expect(getTrendIcon('positive')).toBe('trending-up');
    expect(getTrendIcon('negative')).toBe('trending-down');
    expect(getTrendIcon('neutral')).toBe('minus');
  });
});

describe('calculatePercentageChange', () => {
  it('calculates percentage change correctly', () => {
    expect(calculatePercentageChange(100, 150)).toBe(50);
    expect(calculatePercentageChange(100, 50)).toBe(-50);
    expect(calculatePercentageChange(100, 100)).toBe(0);
  });

  it('handles zero old value', () => {
    expect(calculatePercentageChange(0, 100)).toBe(0);
  });

  it('calculates fractional percentages', () => {
    expect(calculatePercentageChange(100, 105)).toBe(5);
    expect(calculatePercentageChange(200, 210)).toBe(5);
  });
});

describe('isValidItemId', () => {
  it('returns true for valid item IDs', () => {
    expect(isValidItemId(1)).toBe(true);
    expect(isValidItemId(1000)).toBe(true);
  });

  it('returns false for invalid item IDs', () => {
    expect(isValidItemId(0)).toBe(false);
    expect(isValidItemId(-1)).toBe(false);
    expect(isValidItemId(1.5)).toBe(false);
  });
});

describe('filterPrices', () => {
  const mockPrices: CurrentPrice[] = [
    {
      id: 1,
      itemId: 1,
      price: 1000,
      highPrice: 1100,
      lowPrice: 900,
      volume: 500,
      priceChange24h: 50,
      priceChangePercent24h: 5,
      trend: 'positive',
      lastUpdated: '2024-01-01',
      createdAt: '2024-01-01',
      updatedAt: '2024-01-01',
    },
    {
      id: 2,
      itemId: 2,
      price: 5000,
      highPrice: 5200,
      lowPrice: 4800,
      volume: 1000,
      priceChange24h: -100,
      priceChangePercent24h: -2,
      trend: 'negative',
      lastUpdated: '2024-01-01',
      createdAt: '2024-01-01',
      updatedAt: '2024-01-01',
    },
    {
      id: 3,
      itemId: 3,
      price: 10000,
      highPrice: 10000,
      lowPrice: 10000,
      volume: 200,
      priceChange24h: 0,
      priceChangePercent24h: 0,
      trend: 'neutral',
      lastUpdated: '2024-01-01',
      createdAt: '2024-01-01',
      updatedAt: '2024-01-01',
    },
  ];

  it('filters by minimum price', () => {
    const filtered = filterPrices(mockPrices, { minPrice: 2000 });
    expect(filtered).toHaveLength(2);
    expect(filtered.every(p => p.price >= 2000)).toBe(true);
  });

  it('filters by maximum price', () => {
    const filtered = filterPrices(mockPrices, { maxPrice: 5000 });
    expect(filtered).toHaveLength(2);
    expect(filtered.every(p => p.price <= 5000)).toBe(true);
  });

  it('filters by minimum volume', () => {
    const filtered = filterPrices(mockPrices, { minVolume: 500 });
    expect(filtered).toHaveLength(2);
    expect(filtered.every(p => p.volume >= 500)).toBe(true);
  });

  it('filters by trend', () => {
    const filtered = filterPrices(mockPrices, { trend: 'positive' });
    expect(filtered).toHaveLength(1);
    expect(filtered[0].trend).toBe('positive');
  });

  it('applies multiple filters', () => {
    const filtered = filterPrices(mockPrices, {
      minPrice: 2000,
      minVolume: 500,
    });
    expect(filtered).toHaveLength(1);
    expect(filtered[0].itemId).toBe(2);
  });
});

describe('sortPrices', () => {
  const mockPrices: CurrentPrice[] = [
    {
      id: 1,
      itemId: 1,
      price: 5000,
      highPrice: 5100,
      lowPrice: 4900,
      volume: 500,
      priceChange24h: 50,
      priceChangePercent24h: 1,
      trend: 'positive',
      lastUpdated: '2024-01-01',
      createdAt: '2024-01-01',
      updatedAt: '2024-01-01',
    },
    {
      id: 2,
      itemId: 2,
      price: 1000,
      highPrice: 1100,
      lowPrice: 900,
      volume: 1000,
      priceChange24h: 10,
      priceChangePercent24h: 1,
      trend: 'positive',
      lastUpdated: '2024-01-01',
      createdAt: '2024-01-01',
      updatedAt: '2024-01-01',
    },
    {
      id: 3,
      itemId: 3,
      price: 10000,
      highPrice: 10100,
      lowPrice: 9900,
      volume: 200,
      priceChange24h: 100,
      priceChangePercent24h: 1,
      trend: 'positive',
      lastUpdated: '2024-01-01',
      createdAt: '2024-01-01',
      updatedAt: '2024-01-01',
    },
  ];

  it('sorts by price ascending', () => {
    const sorted = sortPrices(mockPrices, 'price', 'asc');
    expect(sorted[0].price).toBe(1000);
    expect(sorted[2].price).toBe(10000);
  });

  it('sorts by price descending', () => {
    const sorted = sortPrices(mockPrices, 'price', 'desc');
    expect(sorted[0].price).toBe(10000);
    expect(sorted[2].price).toBe(1000);
  });

  it('sorts by volume', () => {
    const sorted = sortPrices(mockPrices, 'volume', 'desc');
    expect(sorted[0].volume).toBe(1000);
    expect(sorted[2].volume).toBe(200);
  });

  it('does not mutate original array', () => {
    const original = [...mockPrices];
    sortPrices(mockPrices, 'price', 'asc');
    expect(mockPrices).toEqual(original);
  });
});
