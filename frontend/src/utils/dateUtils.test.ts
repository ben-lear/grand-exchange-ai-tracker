/**
 * Unit tests for date utilities
 */

import { describe, it, expect } from 'vitest';
import {
  formatDate,
  formatDateTime,
  formatRelativeTime,
  formatTimestamp,
  formatTime,
  formatISODate,
  formatShortDate,
  isRecent,
} from './dateUtils';

describe('formatDate', () => {
  it('formats date correctly with default format', () => {
    const date = new Date('2024-01-15T10:30:00Z');
    const result = formatDate(date);
    expect(result).toContain('Jan');
    expect(result).toContain('15');
    expect(result).toContain('2024');
  });

  it('formats date with custom format string', () => {
    const date = new Date('2024-01-15T10:30:00Z');
    const result = formatDate(date, 'yyyy-MM-dd');
    expect(result).toBe('2024-01-15');
  });

  it('handles ISO string input', () => {
    const result = formatDate('2024-01-15T10:30:00Z');
    expect(result).toContain('Jan');
    expect(result).toContain('15');
  });

  it('handles timestamp input', () => {
    const timestamp = new Date('2024-01-15T10:30:00Z').getTime();
    const result = formatDate(timestamp);
    expect(result).toContain('Jan');
    expect(result).toContain('15');
  });

  it('returns "Invalid date" for invalid input', () => {
    expect(formatDate('invalid-date')).toBe('Invalid date');
  });
});

describe('formatDateTime', () => {
  it('formats date and time correctly', () => {
    const date = new Date('2024-01-15T10:30:00Z');
    const result = formatDateTime(date);
    expect(result).toContain('Jan');
    expect(result).toContain('15');
    expect(result).toContain('2024');
  });
});

describe('formatRelativeTime', () => {
  it('formats recent dates as relative time', () => {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const result = formatRelativeTime(fiveMinutesAgo);
    expect(result).toContain('minute');
    expect(result).toContain('ago');
  });

  it('returns "Invalid date" for invalid input', () => {
    expect(formatRelativeTime('invalid-date')).toBe('Invalid date');
  });
});

describe('formatTimestamp', () => {
  it('formats timestamp correctly', () => {
    const timestamp = new Date('2024-01-15T10:30:00Z').getTime();
    const result = formatTimestamp(timestamp);
    expect(result).toContain('Jan');
    expect(result).toContain('15');
  });
});

describe('formatTime', () => {
  it('formats time only', () => {
    const date = new Date('2024-01-15T10:30:00Z');
    const result = formatTime(date);
    // Result will vary based on timezone, just check it contains time elements
    expect(result).toMatch(/\d{1,2}:\d{2}/);
  });
});

describe('formatISODate', () => {
  it('formats date as ISO string', () => {
    const date = new Date('2024-01-15T10:30:00Z');
    const result = formatISODate(date);
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
  });
});

describe('formatShortDate', () => {
  it('formats date in short format', () => {
    const date = new Date('2024-01-15T10:30:00Z');
    const result = formatShortDate(date);
    expect(result).toMatch(/\d{1,2}\/\d{1,2}\/\d{2}/);
  });
});

describe('isRecent', () => {
  it('returns true for recent dates', () => {
    const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000);
    expect(isRecent(twoMinutesAgo, 5)).toBe(true);
  });

  it('returns false for old dates', () => {
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
    expect(isRecent(tenMinutesAgo, 5)).toBe(false);
  });

  it('returns false for invalid dates', () => {
    expect(isRecent('invalid-date')).toBe(false);
  });

  it('uses default threshold of 5 minutes', () => {
    const fourMinutesAgo = new Date(Date.now() - 4 * 60 * 1000);
    expect(isRecent(fourMinutesAgo)).toBe(true);

    const sixMinutesAgo = new Date(Date.now() - 6 * 60 * 1000);
    expect(isRecent(sixMinutesAgo)).toBe(false);
  });
});
