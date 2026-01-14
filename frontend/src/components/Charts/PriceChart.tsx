import { useState } from 'react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import type { TimeRange } from '../../types';
import { formatPrice, formatDate } from '../../utils';

interface PriceDataPoint {
  timestamp: number;
  price: number;
  volume?: number;
}

interface PriceChartProps {
  data: PriceDataPoint[];
  variant?: 'line' | 'area';
  showVolume?: boolean;
  timeRange?: TimeRange;
  onTimeRangeChange?: (range: TimeRange) => void;
  isLoading?: boolean;
}

export const PriceChart = ({
  data,
  variant = 'line',
  showVolume = false,
  timeRange = '30d',
  onTimeRangeChange,
  isLoading = false,
}: PriceChartProps) => {
  const [chartType, setChartType] = useState<'line' | 'area'>(variant);

  const timeRanges: { value: TimeRange; label: string }[] = [
    { value: '7d', label: '7D' },
    { value: '30d', label: '30D' },
    { value: '90d', label: '90D' },
    { value: '180d', label: '180D' },
  ];

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-gray-800 border border-gray-700 rounded p-3 shadow-lg">
          <p className="text-sm text-gray-400">
            {formatDate(payload[0].payload.timestamp)}
          </p>
          <p className="text-base font-bold text-osrs-gold">
            {formatPrice(payload[0].value)} gp
          </p>
          {showVolume && payload[1] && (
            <p className="text-sm text-gray-400">
              Volume: {payload[1].value.toLocaleString()}
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  if (isLoading) {
    return (
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <div className="flex items-center justify-center h-80">
          <div className="text-center">
            <svg className="animate-spin h-8 w-8 text-osrs-gold mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <p className="mt-2 text-gray-400">Loading chart...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <div className="flex items-center justify-center h-80 text-gray-400">
          No price data available
        </div>
      </div>
    );
  }

  const ChartComponent = chartType === 'area' ? AreaChart : LineChart;

  return (
    <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
      {/* Chart Controls */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div className="flex gap-2">
          {timeRanges.map((range) => (
            <button
              key={range.value}
              onClick={() => onTimeRangeChange?.(range.value)}
              className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                timeRange === range.value
                  ? 'bg-osrs-gold text-gray-900'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              {range.label}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setChartType('line')}
            className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
              chartType === 'line'
                ? 'bg-osrs-gold text-gray-900'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            Line
          </button>
          <button
            onClick={() => setChartType('area')}
            className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
              chartType === 'area'
                ? 'bg-osrs-gold text-gray-900'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            Area
          </button>
        </div>
      </div>

      {/* Chart */}
      <ResponsiveContainer width="100%" height={400}>
        <ChartComponent data={data} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis
            dataKey="timestamp"
            tickFormatter={(ts) => {
              const date = new Date(ts * 1000);
              return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            }}
            stroke="#9CA3AF"
            style={{ fontSize: '12px' }}
          />
          <YAxis
            tickFormatter={(value) => formatPrice(value)}
            stroke="#9CA3AF"
            style={{ fontSize: '12px' }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          {chartType === 'area' ? (
            <Area
              type="monotone"
              dataKey="price"
              stroke="#FFD700"
              fill="#FFD700"
              fillOpacity={0.3}
              strokeWidth={2}
              name="Price"
              dot={false}
              activeDot={{ r: 6 }}
            />
          ) : (
            <Line
              type="monotone"
              dataKey="price"
              stroke="#FFD700"
              strokeWidth={2}
              name="Price"
              dot={false}
              activeDot={{ r: 6 }}
            />
          )}
          {showVolume && chartType === 'area' && (
            <Area
              type="monotone"
              dataKey="volume"
              stroke="#60A5FA"
              fill="#60A5FA"
              fillOpacity={0.2}
              strokeWidth={2}
              name="Volume"
              dot={false}
            />
          )}
          {showVolume && chartType === 'line' && (
            <Line
              type="monotone"
              dataKey="volume"
              stroke="#60A5FA"
              strokeWidth={2}
              name="Volume"
              dot={false}
            />
          )}
        </ChartComponent>
      </ResponsiveContainer>
    </div>
  );
};
