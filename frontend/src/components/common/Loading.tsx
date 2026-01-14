/**
 * Loading spinner component
 */

import React from 'react';
import { cn } from '../../utils';

export interface LoadingProps {
  /** Size of the spinner */
  size?: 'sm' | 'md' | 'lg' | 'xl';
  /** Optional message to display */
  message?: string;
  /** Whether to show full screen overlay */
  fullScreen?: boolean;
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
 * Loading component with spinner and optional message
 */
export const Loading: React.FC<LoadingProps> = ({
  size = 'md',
  message,
  fullScreen = false,
  className,
}) => {
  const spinner = (
    <div
      className={cn(
        'animate-spin rounded-full border-blue-600 border-t-transparent',
        sizeClasses[size],
        className
      )}
      role="status"
      aria-label="Loading"
    />
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
        <div className="flex flex-col items-center gap-4">
          {spinner}
          {message && (
            <p className="text-sm text-gray-600 dark:text-gray-400">{message}</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center gap-4 p-8">
      {spinner}
      {message && (
        <p className="text-sm text-gray-600 dark:text-gray-400">{message}</p>
      )}
    </div>
  );
};

/**
 * Inline loading spinner (smaller, for inline use)
 */
export const InlineLoading: React.FC<{ className?: string }> = ({ className }) => {
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
