/**
 * Unit tests for formatters utilities
 */

import { describe, it, expect } from 'vitest';
import {
  formatGP,
  formatNumber,
  formatPercentage,
  formatPriceChange,
  parseGP,
  abbreviateNumber,
} from './formatters';

describe('formatGP', () => {
  it('formats zero correctly', () => {
    expect(formatGP(0)).toBe('0');
  });

  it('formats numbers less than 10K with commas', () => {
    expect(formatGP(123)).toBe('123');
    expect(formatGP(1234)).toBe('1,234');
    expect(formatGP(9999)).toBe('9,999');
  });

  it('formats numbers in thousands with K suffix', () => {
    expect(formatGP(10000)).toBe('10.0K');
    expect(formatGP(50000)).toBe('50.0K');
    expect(formatGP(999999)).toBe('1000.0K');
  });

  it('formats numbers in millions with M suffix', () => {
    expect(formatGP(1000000)).toBe('1.0M');
    expect(formatGP(1500000)).toBe('1.5M');
    expect(formatGP(999999999)).toBe('1000.0M');
  });

  it('formats numbers in billions with B suffix', () => {
    expect(formatGP(1000000000)).toBe('1.0B');
    expect(formatGP(5500000000)).toBe('5.5B');
  });

  it('handles negative numbers', () => {
    expect(formatGP(-1234567)).toBe('-1.2M');
    expect(formatGP(-500)).toBe('-500');
  });

  it('respects decimal places parameter', () => {
    expect(formatGP(1234567, 0)).toBe('1M');
    expect(formatGP(1234567, 2)).toBe('1.23M');
  });
});

describe('formatNumber', () => {
  it('formats numbers with thousand separators', () => {
    expect(formatNumber(1234)).toBe('1,234');
    expect(formatNumber(1234567)).toBe('1,234,567');
    expect(formatNumber(123)).toBe('123');
  });
});

describe('formatPercentage', () => {
  it('formats positive percentages with + sign', () => {
    expect(formatPercentage(5.123)).toBe('+5.12%');
    expect(formatPercentage(10.5)).toBe('+10.50%');
  });

  it('formats negative percentages', () => {
    expect(formatPercentage(-2.5)).toBe('-2.50%');
    expect(formatPercentage(-10.123)).toBe('-10.12%');
  });

  it('formats zero correctly', () => {
    expect(formatPercentage(0)).toBe('0.00%');
  });

  it('respects decimal places parameter', () => {
    expect(formatPercentage(5.12345, 3)).toBe('+5.123%');
    expect(formatPercentage(5.12345, 0)).toBe('+5%');
  });
});

describe('formatPriceChange', () => {
  it('formats positive changes with + sign', () => {
    expect(formatPriceChange(1234567)).toBe('+1.2M');
    expect(formatPriceChange(500)).toBe('+500');
  });

  it('formats negative changes', () => {
    expect(formatPriceChange(-1234567)).toBe('-1.2M');
    expect(formatPriceChange(-500)).toBe('-500');
  });

  it('formats zero correctly', () => {
    expect(formatPriceChange(0)).toBe('0');
  });
});

describe('parseGP', () => {
  it('parses K suffix correctly', () => {
    expect(parseGP('500K')).toBe(500000);
    expect(parseGP('1.5K')).toBe(1500);
  });

  it('parses M suffix correctly', () => {
    expect(parseGP('1M')).toBe(1000000);
    expect(parseGP('2.5M')).toBe(2500000);
  });

  it('parses B suffix correctly', () => {
    expect(parseGP('1B')).toBe(1000000000);
    expect(parseGP('3.2B')).toBe(3200000000);
  });

  it('parses numbers without suffix', () => {
    expect(parseGP('123')).toBe(123);
    expect(parseGP('1000')).toBe(1000);
  });

  it('handles negative numbers', () => {
    expect(parseGP('-500K')).toBe(-500000);
    expect(parseGP('-1.5M')).toBe(-1500000);
  });

  it('returns 0 for invalid input', () => {
    expect(parseGP('invalid')).toBe(0);
    expect(parseGP('')).toBe(0);
  });
});

describe('abbreviateNumber', () => {
  it('abbreviates large numbers', () => {
    expect(abbreviateNumber(1234567)).toBe('1.23M');
    expect(abbreviateNumber(123)).toBe('123');
  });
});
