/**
 * Unit tests for helper utilities
 */

import { describe, expect, it } from 'vitest';
import type { CurrentPrice } from '@/types';
import {
  calculatePercentageChange,
  calculateTrend,
  filterPrices,
  getTrendBgColor,
  getTrendColor,
  getTrendIcon,
  isValidItemId,
  sortPrices,
} from './helpers';

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
      itemId: 1,
      highPrice: 1100,
      lowPrice: 900,
      highPriceTime: '2024-01-01T10:00:00Z',
      lowPriceTime: '2024-01-01T09:55:00Z',
      updatedAt: '2024-01-01T10:00:00Z',
    },
    {
      itemId: 2,
      highPrice: 5200,
      lowPrice: 4800,
      highPriceTime: '2024-01-01T10:00:00Z',
      lowPriceTime: '2024-01-01T09:55:00Z',
      updatedAt: '2024-01-01T10:00:00Z',
    },
    {
      itemId: 3,
      highPrice: 10000,
      lowPrice: 10000,
      highPriceTime: '2024-01-01T10:00:00Z',
      lowPriceTime: '2024-01-01T09:55:00Z',
      updatedAt: '2024-01-01T10:00:00Z',
    },
  ];

  it('filters by minimum price', () => {
    const filtered = filterPrices(mockPrices, { minPrice: 2000 });
    expect(filtered).toHaveLength(2);
    expect(filtered.every(p => (p.highPrice ?? p.lowPrice ?? 0) >= 2000)).toBe(true);
  });

  it('filters by maximum price', () => {
    const filtered = filterPrices(mockPrices, { maxPrice: 5000 });
    // Only item 1 (highPrice: 1100) and item 2 (highPrice: 5200) match, but 5200 > 5000
    // So only item 1 should pass
    expect(filtered).toHaveLength(1);
    expect(filtered.every(p => (p.highPrice ?? p.lowPrice ?? 0) <= 5000)).toBe(true);
  });

});

describe('sortPrices', () => {
  const mockPrices: CurrentPrice[] = [
    {
      itemId: 1,
      highPrice: 5100,
      lowPrice: 4900,
      highPriceTime: '2024-01-01T10:00:00Z',
      lowPriceTime: '2024-01-01T09:55:00Z',
      updatedAt: '2024-01-01T10:00:00Z',
    },
    {
      itemId: 2,
      highPrice: 1100,
      lowPrice: 900,
      highPriceTime: '2024-01-01T10:00:00Z',
      lowPriceTime: '2024-01-01T09:55:00Z',
      updatedAt: '2024-01-01T10:00:00Z',
    },
    {
      itemId: 3,
      highPrice: 10100,
      lowPrice: 9900,
      highPriceTime: '2024-01-01T10:00:00Z',
      lowPriceTime: '2024-01-01T09:55:00Z',
      updatedAt: '2024-01-01T10:00:00Z',
    },
  ];

  it('sorts by highPrice ascending', () => {
    const sorted = sortPrices(mockPrices, 'highPrice', 'asc');
    expect(sorted[0].highPrice).toBe(1100);
    expect(sorted[2].highPrice).toBe(10100);
  });

  it('sorts by highPrice descending', () => {
    const sorted = sortPrices(mockPrices, 'highPrice', 'desc');
    expect(sorted[0].highPrice).toBe(10100);
    expect(sorted[2].highPrice).toBe(1100);
  });

  it('sorts by lowPrice descending', () => {
    const sorted = sortPrices(mockPrices, 'lowPrice', 'desc');
    expect(sorted[0].lowPrice).toBe(9900);
    expect(sorted[2].lowPrice).toBe(900);
  });

  it('does not mutate original array', () => {
    const original = [...mockPrices];
    sortPrices(mockPrices, 'highPrice', 'asc');
    expect(mockPrices).toEqual(original);
  });
});
