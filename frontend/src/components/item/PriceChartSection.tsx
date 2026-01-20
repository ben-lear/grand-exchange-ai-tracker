/**
 * PriceChartSection - Displays price chart with period selector and live indicator
 * Used in ItemDetailPage to show historical price data
 */

import { LiveIndicator, PriceChart, TimePeriodSelector } from '@/components/charts';
import { usePriceHistory } from '@/hooks';
import type { TimePeriod } from '@/types';
import React from 'react';

export interface PriceChartSectionProps {
    /** Item ID for the chart */
    itemId: number;
    /** Item name for chart labels */
    itemName: string;
    /** Selected time period */
    period: TimePeriod;
    /** Callback when period changes */
    onPeriodChange: (period: TimePeriod) => void;
    /** SSE connection status */
    isConnected?: boolean;
    /** Last heartbeat time for live indicator */
    lastHeartbeatAt?: number | null;
    /** Number of reconnection attempts */
    reconnectCount?: number;
    /** Optional className for custom styling */
    className?: string;
}

/**
 * PriceChartSection component
 * Wraps PriceChart with period selector and live indicator
 */
export const PriceChartSection: React.FC<PriceChartSectionProps> = ({
    itemId,
    itemName,
    period,
    onPeriodChange,
    isConnected = false,
    lastHeartbeatAt = null,
    reconnectCount = 0,
    className = '',
}) => {
    // Fetch price history data
    const {
        data: priceHistoryData,
        isLoading: historyLoading,
        error: historyError,
    } = usePriceHistory(itemId, period);

    // Convert timestamp to Date object for LiveIndicator if needed
    const lastUpdateTime = lastHeartbeatAt ? new Date(lastHeartbeatAt) : null;

    return (
        <div className={`rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 ${className}`}>
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                        Price History
                    </h2>
                    <LiveIndicator
                        isConnected={isConnected}
                        lastUpdateTime={lastUpdateTime}
                        reconnectCount={reconnectCount}
                    />
                </div>
                <TimePeriodSelector
                    activePeriod={period}
                    onPeriodChange={onPeriodChange}
                />
            </div>

            <PriceChart
                data={priceHistoryData?.data || []}
                isLoading={historyLoading}
                error={historyError}
                itemId={itemId}
                itemName={itemName}
                period={period}
                height={400}
            />
        </div>
    );
};
