import type { TrendDirection } from '../../types';
import { cn } from '../../utils';

interface TrendIndicatorProps {
  trend: TrendDirection;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export const TrendIndicator = ({ trend, size = 'md', showLabel = false }: TrendIndicatorProps) => {
  const sizeClasses = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-6 h-6',
  };

  const getTrendInfo = () => {
    switch (trend) {
      case 'positive':
        return {
          icon: '↑',
          color: 'text-green-500',
          bg: 'bg-green-500/20',
          label: 'Rising',
        };
      case 'negative':
        return {
          icon: '↓',
          color: 'text-red-500',
          bg: 'bg-red-500/20',
          label: 'Falling',
        };
      case 'neutral':
      default:
        return {
          icon: '→',
          color: 'text-gray-500',
          bg: 'bg-gray-500/20',
          label: 'Stable',
        };
    }
  };

  const trendInfo = getTrendInfo();

  if (showLabel) {
    return (
      <span className={cn('inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium', trendInfo.bg, trendInfo.color)}>
        <span className={cn('font-bold', sizeClasses[size])}>{trendInfo.icon}</span>
        {trendInfo.label}
      </span>
    );
  }

  return (
    <span className={cn('inline-flex items-center justify-center font-bold', trendInfo.color, sizeClasses[size])}>
      {trendInfo.icon}
    </span>
  );
};
