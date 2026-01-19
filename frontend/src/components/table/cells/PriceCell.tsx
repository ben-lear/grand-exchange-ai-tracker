/**
 * Price Cell Component
 * Renders formatted price with color coding
 */

import { formatGold, formatNumber } from '@/utils';

interface PriceCellProps {
    value?: number | null;
    type?: 'high' | 'low' | 'mid';
    label?: string;
}

export function PriceCell({ value, type = 'mid', label }: PriceCellProps) {
    if (!value || value === null) {
        return <span className="text-gray-400">—</span>;
    }

    const colorClass = {
        high: 'text-green-600 dark:text-green-400',
        low: 'text-orange-600 dark:text-orange-400',
        mid: 'text-blue-600 dark:text-blue-400',
    }[type];

    const formattedValue = type === 'mid' ? formatGold(value) : formatNumber(value);

    return (
        <span className={`font-mono ${colorClass}`} title={label}>
            {formattedValue}
        </span>
    );
}
