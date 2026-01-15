/**
 * TimePeriodSelector - Time range selector for price charts
 * Features:
 * - Preset time periods (24h, 7d, 30d, 90d, 1y, All)
 * - Highlight active period
 * - Disable periods with no data
 */

import { TimePeriod } from '@/types';

export interface TimePeriodSelectorProps {
  activePeriod: TimePeriod;
  onPeriodChange: (period: TimePeriod) => void;
  availablePeriods?: TimePeriod[];
  disabled?: boolean;
}

const PERIOD_OPTIONS = [
  { value: '1h' as TimePeriod, label: '1H', description: 'Last hour' },
  { value: '12h' as TimePeriod, label: '12H', description: 'Last 12 hours' },
  { value: '24h' as TimePeriod, label: '24H', description: 'Last 24 hours' },
  { value: '3d' as TimePeriod, label: '3D', description: 'Last 3 days' },
  { value: '7d' as TimePeriod, label: '7D', description: 'Last 7 days' },
  { value: '30d' as TimePeriod, label: '30D', description: 'Last 30 days' },
  { value: '90d' as TimePeriod, label: '90D', description: 'Last 90 days' },
  { value: '1y' as TimePeriod, label: '1Y', description: 'Last year' },
  { value: 'all' as TimePeriod, label: 'ALL', description: 'All time' },
];

export function TimePeriodSelector({
  activePeriod,
  onPeriodChange,
  availablePeriods,
  disabled = false,
}: TimePeriodSelectorProps) {
  const isAvailable = (period: TimePeriod) => {
    return !availablePeriods || availablePeriods.includes(period);
  };

  return (
    <div className="flex items-center gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-lg">
      {PERIOD_OPTIONS.map((option) => {
        const isActive = activePeriod === option.value;
        const available = isAvailable(option.value);

        return (
          <button
            key={option.value}
            onClick={() => !disabled && available && onPeriodChange(option.value)}
            disabled={disabled || !available}
            title={option.description}
            className={`
              px-3 py-1.5 text-sm font-medium rounded-md transition-all duration-200
              ${
                isActive
                  ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }
              ${
                !available || disabled
                  ? 'opacity-50 cursor-not-allowed'
                  : 'hover:bg-white/50 dark:hover:bg-gray-700/50 cursor-pointer'
              }
            `}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}