/**
 * PriceChart - Interactive price chart for OSRS items
 * Features:
 * - Dual-line time-series chart showing high and low prices
 * - Spread area visualization between lines
 * - Responsive design
 * - Custom tooltip
 * - Price trend indicators
 * - Real-time SSE price updates with live indicator
 */

import { ErrorDisplay, LoadingSpinner } from '@/components/common';
import { useChartData, usePriceStream } from '@/hooks';
import { useLiveBufferStore } from '@/stores';
import type { PricePoint, TimePeriod } from '@/types';
import { formatXAxisTick, formatYAxisTick, getTimestepForPeriod } from '@/utils';
import { useEffect } from 'react';
import {
  CartesianGrid,
  ComposedChart,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { ChartStatistics } from '../ChartStatistics/ChartStatistics';
import { ChartTooltip } from '../ChartTooltip/ChartTooltip';
import { CustomChartDot } from '../CustomChartDot/CustomChartDot';

export interface PriceChartProps {
  data: PricePoint[];
  isLoading?: boolean;
  error?: Error | null;
  period: TimePeriod;
  itemId?: number; // Required for SSE integration
  itemName?: string;
  height?: number;
  showDualLines?: boolean; // Toggle between dual-line and single-line mode
}

export function PriceChart({
  data,
  isLoading = false,
  error = null,
  period,
  itemId,
  itemName,
  height = 400,
  showDualLines = true, // Default to dual-line mode
}: PriceChartProps) {
  // SSE integration for real-time updates
  const { lastUpdate } = usePriceStream({
    itemIds: itemId ? [itemId] : [],
    enabled: !!itemId,
  });

  const { addPoint, clearBuffer } = useLiveBufferStore();
  const timestepConfig = getTimestepForPeriod(period);

  // Add SSE updates to buffer
  useEffect(() => {
    if (lastUpdate && itemId && lastUpdate.item_id === itemId) {
      addPoint(itemId, {
        timestamp: new Date(lastUpdate.timestamp),
        high: lastUpdate.high !== null ? Number(lastUpdate.high) : null,
        low: lastUpdate.low !== null ? Number(lastUpdate.low) : null,
        isLive: true,
      });
    }
  }, [lastUpdate, itemId, addPoint]);

  // Clear buffer when item or period changes
  useEffect(() => {
    if (itemId) {
      clearBuffer(itemId);
    }
  }, [itemId, period, clearBuffer]);

  // Use the extracted hook for data processing
  const { chartData, stats, hasData } = useChartData({
    rawData: data,
    itemId,
    period,
  });

  // Guard against undefined timestepConfig (shouldn't happen with fixed config)
  if (!timestepConfig) {
    return (
      <ErrorDisplay
        error={`Invalid time period: ${period}`}
        title="Chart Configuration Error"
      />
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center" style={{ height }}>
        <LoadingSpinner size="lg" message="Loading chart..." />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="p-4" style={{ height }}>
        <ErrorDisplay
          title="Failed to load chart data"
          error={error}
          onRetry={() => window.location.reload()}
        />
      </div>
    );
  }

  // Empty state
  if (!hasData) {
    return (
      <div
        className="flex flex-col items-center justify-center text-center"
        style={{ height }}
      >
        <div className="text-gray-400 dark:text-gray-500 mb-2">
          <svg
            className="w-16 h-16 mx-auto mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
            />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">
          No price data available
        </h3>
        <p className="text-gray-500 dark:text-gray-400">
          Try selecting a different time period
        </p>
      </div>
    );
  }

  const lineColor = stats?.trend === 'up' ? '#10b981' : stats?.trend === 'down' ? '#ef4444' : '#6b7280';

  return (
    <div className="space-y-4">
      {/* Chart Header with Stats */}
      {stats && <ChartStatistics stats={stats} itemName={itemName} />}

      {/* Chart */}
      <div style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={chartData}
            margin={{
              top: 5,
              right: 30,
              left: 20,
              bottom: 5,
            }}
          >
            {/* Grid */}
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#374151"
              opacity={0.3}
            />

            {/* Axes */}
            <XAxis
              dataKey="timestamp"
              type="number"
              scale="time"
              domain={['dataMin', 'dataMax']}
              tickFormatter={(timestamp) => formatXAxisTick(timestamp, period)}
              stroke="#6b7280"
              fontSize={12}
            />
            <YAxis
              tickFormatter={formatYAxisTick}
              stroke="#6b7280"
              fontSize={12}
              domain={[(dataMin: number) => dataMin * 0.95, (dataMax: number) => dataMax * 1.05]}
            />

            {/* Tooltip - positioned at the midpoint between high and low */}
            <Tooltip
              content={<ChartTooltip />}
              animationDuration={150}
              animationEasing="ease-out"
              wrapperStyle={{
                outline: 'none',
                transition: 'all 0.15s ease-out',
              }}
            />

            {/* Current price reference line */}
            {stats && (
              <ReferenceLine
                y={stats.lastPrice}
                stroke={lineColor}
                strokeDasharray="5 5"
                opacity={0.5}
              />
            )}

            {/* High price line (buy price) */}
            {showDualLines && (
              <Line
                type="monotone"
                dataKey="highPrice"
                stroke="#10b981"
                strokeWidth={2}
                name="High Price"
                dot={<CustomChartDot fill="#10b981" />}
                activeDot={{
                  r: 6,
                  fill: '#10b981',
                  stroke: '#fff',
                  strokeWidth: 2,
                }}
                connectNulls
              />
            )}

            {/* Low price line (sell price) */}
            {showDualLines && (
              <Line
                type="monotone"
                dataKey="lowPrice"
                stroke="#f97316"
                strokeWidth={2}
                name="Low Price"
                dot={<CustomChartDot fill="#f97316" />}
                activeDot={{
                  r: 6,
                  fill: '#f97316',
                  stroke: '#fff',
                  strokeWidth: 2,
                }}
                connectNulls
              />
            )}

            {/* Single mid-price line (fallback mode) */}
            {!showDualLines && (
              <Line
                type="monotone"
                dataKey="midPrice"
                stroke={lineColor}
                strokeWidth={2}
                name="Price"
                dot={<CustomChartDot fill={lineColor} />}
                activeDot={{
                  r: 6,
                  fill: lineColor,
                  stroke: '#fff',
                  strokeWidth: 2,
                }}
                connectNulls
              />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}