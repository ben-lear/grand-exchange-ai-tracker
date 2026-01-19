/**
 * Tests for chart formatter utilities
 */

import { describe, expect, it } from 'vitest';
import {
    formatTooltipLabel,
    formatTooltipValue,
    formatXAxisTick,
    formatYAxisTick,
} from './chartFormatters';

describe('chartFormatters', () => {
    describe('formatXAxisTick', () => {
        const testTimestamp = new Date('2024-03-15T14:30:00Z').getTime();

        it('should format 1h period with HH:mm', () => {
            const result = formatXAxisTick(testTimestamp, '1h');
            expect(result).toMatch(/\d{2}:\d{2}/);
        });

        it('should format 12h period with HH:mm', () => {
            const result = formatXAxisTick(testTimestamp, '12h');
            expect(result).toMatch(/\d{2}:\d{2}/);
        });

        it('should format 24h period with HH:mm', () => {
            const result = formatXAxisTick(testTimestamp, '24h');
            expect(result).toMatch(/\d{2}:\d{2}/);
        });

        it('should format 3d period with MMM d', () => {
            const result = formatXAxisTick(testTimestamp, '3d');
            expect(result).toMatch(/\w+ \d+/);
        });

        it('should format 7d period with MMM d', () => {
            const result = formatXAxisTick(testTimestamp, '7d');
            expect(result).toMatch(/\w+ \d+/);
        });

        it('should format 30d period with MMM d', () => {
            const result = formatXAxisTick(testTimestamp, '30d');
            expect(result).toMatch(/\w+ \d+/);
        });

        it('should format 90d period with MMM d', () => {
            const result = formatXAxisTick(testTimestamp, '90d');
            expect(result).toMatch(/\w+ \d+/);
        });

        it('should format 1y period with MMM d', () => {
            const result = formatXAxisTick(testTimestamp, '1y');
            expect(result).toMatch(/\w+ \d+/);
        });

        it('should format all period with MMM yyyy', () => {
            const result = formatXAxisTick(testTimestamp, 'all');
            expect(result).toMatch(/\w+ \d{4}/);
        });

        it('should handle invalid timestamps', () => {
            expect(() => formatXAxisTick(0, '24h')).not.toThrow();
            expect(() => formatXAxisTick(-1, '24h')).not.toThrow();
        });
    });

    describe('formatYAxisTick', () => {
        it('should format small values', () => {
            expect(formatYAxisTick(100)).toBe('100');
        });

        it('should format large values with K notation', () => {
            const result = formatYAxisTick(15000);
            expect(result).toContain('K');
        });

        it('should format million values with M notation', () => {
            const result = formatYAxisTick(5000000);
            expect(result).toContain('M');
        });

        it('should handle zero', () => {
            expect(formatYAxisTick(0)).toBe('0');
        });

        it('should handle negative values', () => {
            const result = formatYAxisTick(-1000);
            expect(result).toContain('-');
        });
    });

    describe('formatTooltipValue', () => {
        it('should format price values', () => {
            expect(formatTooltipValue(15000)).toBe('15.0K');
        });

        it('should format large values', () => {
            expect(formatTooltipValue(1500000)).toBe('1.5M');
        });

        it('should handle zero', () => {
            expect(formatTooltipValue(0)).toBe('0');
        });
    });

    describe('formatTooltipLabel', () => {
        it('should format timestamp with date and time', () => {
            const timestamp = new Date('2024-03-15T14:30:00Z').getTime();
            const result = formatTooltipLabel(timestamp);

            expect(result).toMatch(/\w+ \d+, \d{4} \d{2}:\d{2}/);
        });

        it('should handle edge case timestamps', () => {
            expect(() => formatTooltipLabel(0)).not.toThrow();
            expect(() => formatTooltipLabel(Date.now())).not.toThrow();
        });
    });
});
