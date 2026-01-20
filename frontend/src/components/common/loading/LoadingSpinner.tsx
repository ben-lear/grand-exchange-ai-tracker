/**
 * Spinner loading animation component
 */

import React from 'react';
import { cn } from '@/utils';

export interface LoadingSpinnerProps {
    /** Size of the spinner */
    size?: 'sm' | 'md' | 'lg' | 'xl';
    /** Optional message to display */
    message?: string;
    /** Custom className */
    className?: string;
}

const sizeClasses = {
    sm: 'w-4 h-4 border-2',
    md: 'w-8 h-8 border-2',
    lg: 'w-12 h-12 border-3',
    xl: 'w-16 h-16 border-4',
};

/**
 * Spinner loading animation
 */
export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
    size = 'md',
    message,
    className,
}) => (
    <div className="flex flex-col items-center justify-center gap-4">
        <div
            className={cn('loading-spinner', sizeClasses[size], className)}
            role="status"
            aria-label="Loading"
        />
        {message && (
            <p className="text-sm text-gray-600 dark:text-gray-400">{message}</p>
        )}
    </div>
);
