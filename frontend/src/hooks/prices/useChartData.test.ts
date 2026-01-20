/**
 * Tests for useChartData hook
 */

import type { PricePoint } from '@/types';
import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useChartData } from './useChartData';

// Mock the live buffer store
vi.mock('@/stores', () => ({
    useLiveBufferStore: () => ({
        getLiveTip: vi.fn(() => null),
        getConsolidatedPoints: vi.fn(() => []),
    }),
}));

// Mock the timesteps utility
vi.mock('@/utils', () => ({
    getTimestepForPeriod: vi.fn(() => ({
        displayTimestepMs: 60000,
    })),
}));

describe('useChartData', () => {
    const mockData: PricePoint[] = [
        {
            timestamp: 1000000,
            highPrice: 100,
            lowPrice: 90,
            price: 95,
        },
        {
            timestamp: 2000000,
            highPrice: 110,
            lowPrice: 95,
            price: 102,
        },
        {
            timestamp: 3000000,
            highPrice: 105,
            lowPrice: 100,
            price: 103,
        },
    ];

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should process raw data correctly', () => {
        const { result } = renderHook(() =>
            useChartData({
                rawData: mockData,
                period: '24h',
            })
        );

        expect(result.current.chartData).toHaveLength(3);
        expect(result.current.hasData).toBe(true);
    });

    it('should calculate statistics correctly', () => {
        const { result } = renderHook(() =>
            useChartData({
                rawData: mockData,
                period: '24h',
            })
        );

        expect(result.current.stats).not.toBeNull();
        expect(result.current.stats?.firstPrice).toBe(95);
        expect(result.current.stats?.lastPrice).toBeCloseTo(102.5);
        expect(result.current.stats?.trend).toBe('up');
    });

    it('should handle empty data', () => {
        const { result } = renderHook(() =>
            useChartData({
                rawData: [],
                period: '24h',
            })
        );

        expect(result.current.chartData).toHaveLength(0);
        expect(result.current.stats).toBeNull();
        expect(result.current.hasData).toBe(false);
    });

    it('should calculate midPrice correctly', () => {
        const { result } = renderHook(() =>
            useChartData({
                rawData: mockData,
                period: '24h',
            })
        );

        const firstPoint = result.current.chartData[0];
        expect(firstPoint.midPrice).toBe((100 + 90) / 2);
    });

    it('should handle avgHighPrice and avgLowPrice', () => {
        const dataWithAvg: PricePoint[] = [
            {
                timestamp: 1000000,
                avgHighPrice: 150,
                avgLowPrice: 140,
                highPrice: 100,
                lowPrice: 90,
                price: 95,
            },
        ];

        const { result } = renderHook(() =>
            useChartData({
                rawData: dataWithAvg,
                period: '24h',
            })
        );

        const point = result.current.chartData[0];
        expect(point.highPrice).toBe(150);
        expect(point.lowPrice).toBe(140);
    });

    it('should filter out invalid data points', () => {
        const invalidData: PricePoint[] = [
            {
                timestamp: 0,
                price: 100,
            },
            {
                timestamp: 1000000,
                highPrice: 0,
                lowPrice: 0,
                price: 0,
            },
            {
                timestamp: 2000000,
                highPrice: 100,
                lowPrice: 90,
                price: 95,
            },
        ];

        const { result } = renderHook(() =>
            useChartData({
                rawData: invalidData,
                period: '24h',
            })
        );

        expect(result.current.chartData.length).toBeLessThan(invalidData.length);
    });

    it('should sort data by timestamp', () => {
        const unsortedData: PricePoint[] = [
            { timestamp: 3000000, price: 100 },
            { timestamp: 1000000, price: 90 },
            { timestamp: 2000000, price: 95 },
        ];

        const { result } = renderHook(() =>
            useChartData({
                rawData: unsortedData,
                period: '24h',
            })
        );

        const timestamps = result.current.chartData.map(d => d.timestamp);
        expect(timestamps).toEqual([...timestamps].sort((a, b) => a - b));
    });

    it('should detect downward trend', () => {
        const downwardData: PricePoint[] = [
            { timestamp: 1000000, price: 100 },
            { timestamp: 2000000, price: 90 },
            { timestamp: 3000000, price: 80 },
        ];

        const { result } = renderHook(() =>
            useChartData({
                rawData: downwardData,
                period: '24h',
            })
        );

        expect(result.current.stats?.trend).toBe('down');
        expect(result.current.stats?.change).toBeLessThan(0);
    });

    it('should detect flat trend', () => {
        const flatData: PricePoint[] = [
            { timestamp: 1000000, price: 100 },
            { timestamp: 2000000, price: 100 },
            { timestamp: 3000000, price: 100 },
        ];

        const { result } = renderHook(() =>
            useChartData({
                rawData: flatData,
                period: '24h',
            })
        );

        expect(result.current.stats?.trend).toBe('flat');
        expect(result.current.stats?.change).toBe(0);
    });

    it('should calculate changePercent correctly', () => {
        const { result } = renderHook(() =>
            useChartData({
                rawData: mockData,
                period: '24h',
            })
        );

        const expectedChange = ((102.5 - 95) / 95) * 100;
        expect(result.current.stats?.changePercent).toBeCloseTo(expectedChange, 1);
    });
});
