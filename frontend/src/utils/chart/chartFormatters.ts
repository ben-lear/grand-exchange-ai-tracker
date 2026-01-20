/**
 * Chart Formatters - Utility functions for formatting chart data
 * 
 * Used by PriceChart for:
 * - X-axis tick formatting (timestamps)
 * - Y-axis tick formatting (prices)
 * - Tooltip value formatting
 */

import type { TimePeriod } from '@/types';
import { formatGold } from '@/utils/formatters';
import { format } from 'date-fns';

/**
 * Format X-axis timestamp based on time period
 */
export function formatXAxisTick(timestamp: number, period: TimePeriod): string {
    const date = new Date(timestamp);

    switch (period) {
        case '1h':
        case '12h':
        case '24h':
            return format(date, 'HH:mm');
        case '3d':
        case '7d':
        case '30d':
            return format(date, 'MMM d');
        case '90d':
        case '1y':
            return format(date, 'MMM d');
        case 'all':
            return format(date, 'MMM yyyy');
        default:
            return format(date, 'MMM d');
    }
}

/**
 * Format Y-axis price values
 */
export function formatYAxisTick(value: number): string {
    return formatGold(value, 0);
}

/**
 * Format tooltip values
 */
export function formatTooltipValue(value: number): string {
    return formatGold(value);
}

/**
 * Format tooltip timestamp labels
 */
export function formatTooltipLabel(timestamp: number): string {
    return format(new Date(timestamp), 'MMM d, yyyy HH:mm');
}
