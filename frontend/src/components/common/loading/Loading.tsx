/**
 * Main Loading component with fullscreen support
 */

import React from 'react';
import { DotsLoading } from './DotsLoading';
import { LoadingSpinner } from './LoadingSpinner';
import { PulseLoading } from './PulseLoading';

export interface LoadingProps {
    /** Size of the spinner */
    size?: 'sm' | 'md' | 'lg' | 'xl';
    /** Variant of loading animation */
    variant?: 'spinner' | 'dots' | 'pulse';
    /** Optional message to display */
    message?: string;
    /** Whether to show full screen overlay */
    fullScreen?: boolean;
    /** Custom className */
    className?: string;
}

/**
 * Loading component with spinner and optional message
 */
export const Loading: React.FC<LoadingProps> = ({
    size = 'md',
    variant = 'spinner',
    message,
    fullScreen = false,
    className,
}) => {
    const loadingElement = (() => {
        switch (variant) {
            case 'dots':
                return <DotsLoading size={size} className={className} />;
            case 'pulse':
                return <PulseLoading size={size} className={className} />;
            default:
                return <LoadingSpinner size={size} className={className} />;
        }
    })();

    if (fullScreen) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
                <div className="flex flex-col items-center gap-4">
                    {loadingElement}
                    {message && (
                        <p className="text-sm text-gray-600 dark:text-gray-400">{message}</p>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center justify-center gap-4 p-8">
            {loadingElement}
            {message && (
                <p className="text-sm text-gray-600 dark:text-gray-400">{message}</p>
            )}
        </div>
    );
};
