import { formatPrice } from '../../utils';
import { TrendIndicator } from './TrendIndicator';
import type { TrendDirection } from '../../types';

interface PriceDisplayProps {
  price: number;
  trend?: TrendDirection;
  change?: number;
  changePercent?: number;
  showTrend?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const PriceDisplay = ({ 
  price, 
  trend, 
  change, 
  changePercent,
  showTrend = true,
  size = 'md' 
}: PriceDisplayProps) => {
  const sizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-xl',
  };

  return (
    <div className="flex items-center gap-2">
      <span className={`font-bold text-osrs-gold ${sizeClasses[size]}`}>
        {formatPrice(price)}
      </span>
      {showTrend && trend && (
        <TrendIndicator trend={trend} size={size === 'lg' ? 'md' : 'sm'} />
      )}
      {(change !== undefined || changePercent !== undefined) && (
        <span className={`text-xs ${change && change > 0 ? 'text-green-500' : change && change < 0 ? 'text-red-500' : 'text-gray-500'}`}>
          {changePercent !== undefined && `${changePercent > 0 ? '+' : ''}${changePercent.toFixed(2)}%`}
          {change !== undefined && ` (${change > 0 ? '+' : ''}${formatPrice(change)})`}
        </span>
      )}
    </div>
  );
};
