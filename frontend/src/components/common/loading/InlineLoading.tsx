/**
 * Inline loading spinner for inline/button use
 */

import React from 'react';
import { cn } from '../../../utils';
import { DotsLoading } from './DotsLoading';
import { PulseLoading } from './PulseLoading';

export interface InlineLoadingProps {
    /** Variant of loading animation */
    variant?: 'spinner' | 'dots' | 'pulse';
    /** Custom className */
    className?: string;
}

/**
 * Inline loading spinner (smaller, for inline use)
 */
export const InlineLoading: React.FC<InlineLoadingProps> = ({
    variant = 'spinner',
    className,
}) => {
    if (variant === 'dots') {
        return <DotsLoading size="sm" className={className} />;
    }

    if (variant === 'pulse') {
        return <PulseLoading size="sm" className={className} />;
    }

    // Default: spinner
    return (
        <div
            className={cn(
                'inline-block w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin',
                className
            )}
            role="status"
            aria-label="Loading"
        />
    );
};
