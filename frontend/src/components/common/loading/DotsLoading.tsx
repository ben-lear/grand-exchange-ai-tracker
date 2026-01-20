/**
 * Dots loading animation component
 */

import React from 'react';
import { cn } from '../../../utils';

export interface DotsLoadingProps {
    /** Size of the dots */
    size?: 'sm' | 'md' | 'lg' | 'xl';
    /** Custom className */
    className?: string;
}

const dotSizeClasses = {
    sm: 'w-1 h-1',
    md: 'w-2 h-2',
    lg: 'w-3 h-3',
    xl: 'w-4 h-4',
};

/**
 * Dots loading animation
 */
export const DotsLoading: React.FC<DotsLoadingProps> = ({
    size = 'md',
    className,
}) => (
    <div className={cn('loading-dots', className)} role="status" aria-label="Loading">
        <div
            className={cn('loading-dot', dotSizeClasses[size])}
            style={{ animationDelay: '0ms' }}
        />
        <div
            className={cn('loading-dot', dotSizeClasses[size])}
            style={{ animationDelay: '150ms' }}
        />
        <div
            className={cn('loading-dot', dotSizeClasses[size])}
            style={{ animationDelay: '300ms' }}
        />
    </div>
);
