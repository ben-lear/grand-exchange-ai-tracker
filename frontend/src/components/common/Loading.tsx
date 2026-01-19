/**
 * Loading spinner component with enhanced patterns
 */

import React from 'react';
import { cn } from '../../utils';
import { Skeleton, Stack } from '../ui';

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

const sizeClasses = {
  sm: 'w-4 h-4 border-2',
  md: 'w-8 h-8 border-2',
  lg: 'w-12 h-12 border-3',
  xl: 'w-16 h-16 border-4',
};

const dotSizeClasses = {
  sm: 'w-1 h-1',
  md: 'w-2 h-2',
  lg: 'w-3 h-3',
  xl: 'w-4 h-4',
};

/**
 * Spinner loading animation
 */
const SpinnerLoading: React.FC<{ size: 'sm' | 'md' | 'lg' | 'xl'; className?: string }> = ({
  size,
  className,
}) => (
  <div
    className={cn(
      'loading-spinner',
      sizeClasses[size],
      className
    )}
    role="status"
    aria-label="Loading"
  />
);

/**
 * Dots loading animation
 */
const DotsLoading: React.FC<{ size: 'sm' | 'md' | 'lg' | 'xl'; className?: string }> = ({
  size,
  className,
}) => (
  <div className={cn('loading-dots', className)} role="status" aria-label="Loading">
    <div
      className={cn(
        'loading-dot',
        dotSizeClasses[size]
      )}
      style={{ animationDelay: '0ms' }}
    />
    <div
      className={cn(
        'loading-dot',
        dotSizeClasses[size]
      )}
      style={{ animationDelay: '150ms' }}
    />
    <div
      className={cn(
        'loading-dot',
        dotSizeClasses[size]
      )}
      style={{ animationDelay: '300ms' }}
    />
  </div>
);

/**
 * Pulse loading animation
 */
const PulseLoading: React.FC<{ size: 'sm' | 'md' | 'lg' | 'xl'; className?: string }> = ({
  size,
  className,
}) => (
  <div
    className={cn(
      'loading-pulse',
      sizeClasses[size].replace(/border-\d+/, ''), // Remove border classes
      className
    )}
    role="status"
    aria-label="Loading"
  />
);

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
  const LoadingComponent = {
    spinner: SpinnerLoading,
    dots: DotsLoading,
    pulse: PulseLoading,
  }[variant];

  const loadingElement = <LoadingComponent size={size} className={className} />;

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

/**
 * Inline loading spinner (smaller, for inline use)
 */
export const InlineLoading: React.FC<{
  className?: string;
  variant?: 'spinner' | 'dots' | 'pulse';
}> = ({
  className,
  variant = 'spinner'
}) => {
    const LoadingComponent = {
      spinner: () => (
        <div
          className={cn(
            'inline-block w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin',
            className
          )}
          role="status"
          aria-label="Loading"
        />
      ),
      dots: () => <DotsLoading size="sm" className={className} />,
      pulse: () => <PulseLoading size="sm" className={className} />,
    }[variant];

    return <LoadingComponent />;
  };

/**
 * Loading states for specific UI patterns
 */

/**
 * Table loading state with skeleton rows
 */
export interface TableLoadingProps {
  /** Number of rows to show */
  rows?: number;
  /** Number of columns per row */
  columns?: number;
  /** Additional className */
  className?: string;
}

export const TableLoading: React.FC<TableLoadingProps> = ({
  rows = 5,
  columns = 4,
  className,
}) => {
  return (
    <div className={cn('space-y-3', className)}>
      {Array.from({ length: rows }, (_, index) => (
        <Stack key={index} direction="row" align="center" gap={4} className="py-3">
          {Array.from({ length: columns }, (_, colIndex) => (
            <div key={colIndex} className="flex-1">
              <Skeleton width={`${Math.floor(Math.random() * 30 + 70)}%`} />
            </div>
          ))}
        </Stack>
      ))}
    </div>
  );
};

/**
 * Card grid loading state
 */
export interface CardGridLoadingProps {
  /** Number of cards to show */
  count?: number;
  /** Additional className */
  className?: string;
}

export const CardGridLoading: React.FC<CardGridLoadingProps> = ({
  count = 6,
  className,
}) => {
  return (
    <div className={cn('grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4', className)}>
      {Array.from({ length: count }, (_, index) => (
        <div
          key={index}
          className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 space-y-4"
        >
          <Stack direction="row" align="center" gap={3}>
            <Skeleton variant="circular" width="40px" height="40px" />
            <div className="flex-1">
              <Skeleton width="70%" />
              <Skeleton width="50%" size="sm" className="mt-1" />
            </div>
          </Stack>
          <div className="space-y-2">
            <Skeleton lines={3} randomWidth />
          </div>
        </div>
      ))}
    </div>
  );
};
