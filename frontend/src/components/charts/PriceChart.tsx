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
import { usePriceStream } from '@/hooks/usePriceStream';
import { useLiveBufferStore } from '@/stores/liveBufferStore';
import type { PricePoint, TimePeriod } from '@/types';
import { getTimestepForPeriod } from '@/utils/chartTimesteps';
import { formatGold } from '@/utils/formatters';
import { format } from 'date-fns';
import { Minus, TrendingDown, TrendingUp } from 'lucide-react';
import { useEffect, useMemo } from 'react';
import {
  CartesianGrid,
  ComposedChart,
  Dot,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { ChartTooltip } from './ChartTooltip';

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

  const { addPoint, getLiveTip, getConsolidatedPoints, clearBuffer } = useLiveBufferStore();
  const timestepConfig = getTimestepForPeriod(period);

  // Guard against undefined timestepConfig (shouldn't happen with fixed config)
  if (!timestepConfig) {
    return (
      <ErrorDisplay
        error={`Invalid time period: ${period}`}
        title="Chart Configuration Error"
      />
    );
  }

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

  // Process data for chart
  const chartData = useMemo(() => {
    if (!data || data.length === 0) return [];

    return data
      .map((point, index) => {
        // Use avgHighPrice/avgLowPrice if available, fallback to highPrice/lowPrice
        const highPriceRaw = point.avgHighPrice ?? point.highPrice ?? null;
        const lowPriceRaw = point.avgLowPrice ?? point.lowPrice ?? null;

        // Convert to numbers (handle null/undefined)
        const highPrice = highPriceRaw !== null && highPriceRaw !== undefined ? Number(highPriceRaw) : null;
        const lowPrice = lowPriceRaw !== null && lowPriceRaw !== undefined ? Number(lowPriceRaw) : null;

        // Calculate midPrice: if both exist, average them; otherwise use whichever exists
        // Note: 0 is a valid price, so check for null/undefined explicitly
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
          ...point,
          timestamp: typeof point.timestamp === 'number' ? point.timestamp : new Date(point.timestamp).getTime(),
          // Explicitly set to undefined (not null or 0) so Recharts properly gaps the line
          highPrice: highPrice !== null && highPrice > 0 ? highPrice : undefined,
          lowPrice: lowPrice !== null && lowPrice > 0 ? lowPrice : undefined,
          midPrice,
          previousPrice: index > 0 ? (data[index - 1].price || 0) : null,
        };
      })
      .filter(point => {
        // Only filter out points with invalid timestamps or no price data at all
        const hasValidTimestamp = point.timestamp > 0;
        const hasAnyPrice = point.highPrice !== undefined || point.lowPrice !== undefined || point.midPrice > 0;
        return hasValidTimestamp && hasAnyPrice;
      })
      .sort((a, b) => a.timestamp - b.timestamp);
  }, [data]);

  // Merge historical data with live SSE data
  const mergedChartData = useMemo(() => {
    if (!itemId) return chartData;

    const liveTip = getLiveTip(itemId);
    const consolidated = getConsolidatedPoints(itemId, timestepConfig.displayTimestepMs);

    // Start with historical data
    const merged = [...chartData];

    // Get current timestep bucket start
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

    // Always add live tip as the rightmost point (if it exists)
    if (liveTip) {
      const midPrice = liveTip.high !== null && liveTip.low !== null ? (liveTip.high + liveTip.low) / 2 : liveTip.high ?? liveTip.low ?? 0;
      merged.push({
        timestamp: liveTip.timestamp.getTime(),
        highPrice: liveTip.high !== null ? liveTip.high : undefined,
        lowPrice: liveTip.low !== null ? liveTip.low : undefined,
        midPrice,
        previousPrice: merged.length > 0 ? merged[merged.length - 1].midPrice : null,
        price: midPrice,
      });
    }

    return merged.sort((a, b) => a.timestamp - b.timestamp);
  }, [chartData, itemId, getLiveTip, getConsolidatedPoints, timestepConfig.displayTimestepMs]);

  // Calculate price statistics
  const stats = useMemo(() => {
    if (mergedChartData.length === 0) return null;

    const prices = mergedChartData.map(d => d.midPrice || d.price || 0).filter(p => p > 0);
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
    };
  }, [mergedChartData]);

  // Format X-axis ticks based on period
  const formatXAxisTick = (timestamp: number) => {
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
  };

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
  if (mergedChartData.length === 0) {
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

  // Custom dot renderer to highlight live data points
  const CustomDot = (props: any) => {
    const { cx, cy, payload, fill } = props;
    if (!payload?.isLive) {
      return <Dot {...props} />;
    }
    // Render live points with pulsing animation
    return (
      <g>
        <circle cx={cx} cy={cy} r={6} fill={fill} opacity={0.3}>
          <animate attributeName="r" from="6" to="10" dur="1s" repeatCount="indefinite" />
          <animate attributeName="opacity" from="0.3" to="0" dur="1s" repeatCount="indefinite" />
        </circle>
        <circle cx={cx} cy={cy} r={4} fill={fill} stroke="#fff" strokeWidth={2} />
      </g>
    );
  };

  return (
    <div className="space-y-4">
      {/* Chart Header with Stats */}
      {stats && (
        <div className="flex items-center justify-between">
          <div>
            {itemName && (
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {itemName} Price Chart
              </h3>
            )}
            <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
              <span>Current: {formatGold(stats.lastPrice)}</span>
              <span>High: {formatGold(stats.maxPrice)}</span>
              <span>Low: {formatGold(stats.minPrice)}</span>
            </div>
          </div>

          {/* Price Change */}
          <div className="text-right">
            <div
              className={`flex items-center gap-1 text-lg font-semibold ${stats.trend === 'up'
                  ? 'text-green-600 dark:text-green-400'
                  : stats.trend === 'down'
                    ? 'text-red-600 dark:text-red-400'
                    : 'text-gray-600 dark:text-gray-400'
                }`}
            >
              {stats.trend === 'up' && <TrendingUp className="w-5 h-5" />}
              {stats.trend === 'down' && <TrendingDown className="w-5 h-5" />}
              {stats.trend === 'flat' && <Minus className="w-5 h-5" />}

              <span>
                {stats.change >= 0 ? '+' : ''}{formatGold(stats.change)}
              </span>
            </div>
            <div
              className={`text-sm ${stats.changePercent >= 0
                  ? 'text-green-600 dark:text-green-400'
                  : 'text-red-600 dark:text-red-400'
                }`}
            >
              ({stats.changePercent >= 0 ? '+' : ''}{stats.changePercent.toFixed(2)}%)
            </div>
          </div>
        </div>
      )}

      {/* Chart */}
      <div style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={mergedChartData}
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
              tickFormatter={formatXAxisTick}
              stroke="#6b7280"
              fontSize={12}
            />
            <YAxis
              tickFormatter={(value) => formatGold(value, 0)}
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
                dot={<CustomDot fill="#10b981" />}
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
                dot={<CustomDot fill="#f97316" />}
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
                dot={<CustomDot fill={lineColor} />}
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