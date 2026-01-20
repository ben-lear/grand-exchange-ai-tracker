/**
 * Pulse loading animation component
 */

import React from 'react';
import { cn } from '@/utils';

export interface PulseLoadingProps {
    /** Size of the pulse */
    size?: 'sm' | 'md' | 'lg' | 'xl';
    /** Custom className */
    className?: string;
}

const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16',
};

/**
 * Pulse loading animation
 */
export const PulseLoading: React.FC<PulseLoadingProps> = ({
    size = 'md',
    className,
}) => (
    <div
        className={cn('loading-pulse', sizeClasses[size], className)}
        role="status"
        aria-label="Loading"
    />
);
