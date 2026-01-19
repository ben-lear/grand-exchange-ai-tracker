/**
 * PriceDisplay component for consistent price formatting and display
 */

import { cva, type VariantProps } from 'class-variance-authority';
import React from 'react';
import { cn } from '../../utils';
import { formatGold } from '../../utils/formatters';

const priceDisplayVariants = cva(
    'font-mono font-medium',
    {
        variants: {
            type: {
                high: 'text-emerald-600 dark:text-emerald-400',
                low: 'text-rose-600 dark:text-rose-400',
                mid: 'text-blue-600 dark:text-blue-400',
                margin: 'text-purple-600 dark:text-purple-400',
            },
            size: {
                sm: 'text-sm',
                md: 'text-base',
                lg: 'text-lg',
            },
        },
        defaultVariants: {
            type: 'mid',
            size: 'md',
        },
    }
);

export interface PriceDisplayProps extends VariantProps<typeof priceDisplayVariants> {
    /** The price value to display */
    value: number;
    /** The type of price (affects color) */
    type: 'high' | 'low' | 'mid' | 'margin';
    /** Size variant */
    size?: 'sm' | 'md' | 'lg';
    /** Whether to show a label prefix */
    showLabel?: boolean;
    /** Custom label text (defaults based on type) */
    label?: string;
    /** Custom className */
    className?: string;
}

const DEFAULT_LABELS: Record<string, string> = {
    high: 'High',
    low: 'Low',
    mid: 'Mid',
    margin: 'Margin',
};

/**
 * PriceDisplay component for consistent price formatting
 * 
 * Usage:
 * <PriceDisplay value={1500000} type="high" />
 * <PriceDisplay value={1200000} type="low" showLabel />
 */
export const PriceDisplay: React.FC<PriceDisplayProps> = ({
    value,
    type,
    size = 'md',
    showLabel = false,
    label,
    className,
}) => {
    const displayLabel = label || DEFAULT_LABELS[type];
    const formattedValue = formatGold(value);

    return (
        <span
            className={cn(priceDisplayVariants({ type, size }), className)}
            aria-label={showLabel ? `${displayLabel} price: ${formattedValue}` : `Price: ${formattedValue}`}
        >
            {showLabel && (
                <span className="text-gray-600 dark:text-gray-400 font-sans font-normal mr-1">
                    {displayLabel}:
                </span>
            )}
            {formattedValue}
        </span>
    );
};
