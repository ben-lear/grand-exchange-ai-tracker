/**
 * useChartData - Hook for processing and merging chart data
 * 
 * Handles:
 * - Data transformation for Recharts
 * - SSE real-time data merging
 * - Statistics calculation
 * - Period-based sampling
 */

import { useLiveBufferStore } from '@/stores/liveBufferStore';
import type { PricePoint, TimePeriod } from '@/types';
import { getTimestepForPeriod } from '@/utils/chartTimesteps';
import { useMemo } from 'react';

export interface ChartDataPoint {
    timestamp: number;
    highPrice?: number;
    lowPrice?: number;
    midPrice: number;
    previousPrice: number | null;
    price?: number;
    isLive?: boolean;
}

export interface ChartStats {
    firstPrice: number;
    lastPrice: number;
    minPrice: number;
    maxPrice: number;
    change: number;
    changePercent: number;
    trend: 'up' | 'down' | 'flat';
}

export interface UseChartDataParams {
    rawData: PricePoint[];
    itemId?: number;
    period: TimePeriod;
}

export interface UseChartDataReturn {
    chartData: ChartDataPoint[];
    stats: ChartStats | null;
    hasData: boolean;
}

/**
 * Process raw price data for chart display
 */
export function useChartData({
    rawData,
    itemId,
    period,
}: UseChartDataParams): UseChartDataReturn {
    const { getLiveTip, getConsolidatedPoints } = useLiveBufferStore();
    const timestepConfig = getTimestepForPeriod(period);

    // Process historical data
    const processedData = useMemo(() => {
        if (!rawData || rawData.length === 0) return [];

        return rawData
            .map((point, index) => {
                // Use avgHighPrice/avgLowPrice if available, fallback to highPrice/lowPrice
                const highPriceRaw = point.avgHighPrice ?? point.highPrice ?? null;
                const lowPriceRaw = point.avgLowPrice ?? point.lowPrice ?? null;

                // Convert to numbers (handle null/undefined)
                const highPrice = highPriceRaw !== null && highPriceRaw !== undefined ? Number(highPriceRaw) : null;
                const lowPrice = lowPriceRaw !== null && lowPriceRaw !== undefined ? Number(lowPriceRaw) : null;

                // Calculate midPrice
                let midPrice = 0;
                if (highPrice !== null && lowPrice !== null) {
                    midPrice = (highPrice + lowPrice) / 2;
                } else if (highPrice !== null) {
                    midPrice = highPrice;
                } else if (lowPrice !== null) {
                    midPrice = lowPrice;
                } else if (point.price !== null && point.price !== undefined) {
                    midPrice = Number(point.price);
                }

                return {
                    timestamp: typeof point.timestamp === 'number' ? point.timestamp : new Date(point.timestamp).getTime(),
                    highPrice: highPrice !== null && highPrice > 0 ? highPrice : undefined,
                    lowPrice: lowPrice !== null && lowPrice > 0 ? lowPrice : undefined,
                    midPrice,
                    previousPrice: index > 0 ? (rawData[index - 1].price || 0) : null,
                };
            })
            .filter(point => {
                const hasValidTimestamp = point.timestamp > 0;
                const hasAnyPrice = point.highPrice !== undefined || point.lowPrice !== undefined || point.midPrice > 0;
                return hasValidTimestamp && hasAnyPrice;
            })
            .sort((a, b) => a.timestamp - b.timestamp);
    }, [rawData]);

    // Merge with live SSE data
    const mergedData = useMemo(() => {
        if (!itemId || !timestepConfig) return processedData;

        const liveTip = getLiveTip(itemId);
        const consolidated = getConsolidatedPoints(itemId, timestepConfig.displayTimestepMs);

        const merged: ChartDataPoint[] = [...processedData];

        const now = Date.now();
        const currentBucketStart = Math.floor(now / timestepConfig.displayTimestepMs) * timestepConfig.displayTimestepMs;

        // Add consolidated SSE points (excluding current incomplete bucket)
        for (const cp of consolidated) {
            const cpTime = cp.timestamp.getTime();
            if (cpTime < currentBucketStart) {
                const midPrice = cp.high !== null && cp.low !== null ? (cp.high + cp.low) / 2 : cp.high ?? cp.low ?? 0;
                merged.push({
                    timestamp: cpTime,
                    highPrice: cp.high !== null ? cp.high : undefined,
                    lowPrice: cp.low !== null ? cp.low : undefined,
                    midPrice,
                    previousPrice: merged.length > 0 ? merged[merged.length - 1].midPrice : null,
                    price: midPrice,
                });
            }
        }

        // Add live tip as rightmost point
        if (liveTip) {
            const midPrice = liveTip.high !== null && liveTip.low !== null ? (liveTip.high + liveTip.low) / 2 : liveTip.high ?? liveTip.low ?? 0;
            merged.push({
                timestamp: liveTip.timestamp.getTime(),
                highPrice: liveTip.high !== null ? liveTip.high : undefined,
                lowPrice: liveTip.low !== null ? liveTip.low : undefined,
                midPrice,
                previousPrice: merged.length > 0 ? merged[merged.length - 1].midPrice : null,
                price: midPrice,
                isLive: true,
            });
        }

        return merged.sort((a, b) => a.timestamp - b.timestamp);
    }, [processedData, itemId, getLiveTip, getConsolidatedPoints, timestepConfig]);

    // Calculate statistics
    const stats = useMemo(() => {
        if (mergedData.length === 0) return null;

        const prices = mergedData.map((point: ChartDataPoint) => {
            return point.midPrice || (point.price ?? 0);
        }).filter(p => p > 0);
        if (prices.length === 0) return null;

        const firstPrice = prices[0];
        const lastPrice = prices[prices.length - 1];
        const minPrice = Math.min(...prices);
        const maxPrice = Math.max(...prices);

        const change = lastPrice - firstPrice;
        const changePercent = firstPrice > 0 ? (change / firstPrice) * 100 : 0;

        return {
            firstPrice,
            lastPrice,
            minPrice,
            maxPrice,
            change,
            changePercent,
            trend: change > 0 ? 'up' : change < 0 ? 'down' : 'flat',
        } as ChartStats;
    }, [mergedData]);

    return {
        chartData: mergedData,
        stats,
        hasData: mergedData.length > 0,
    };
}
