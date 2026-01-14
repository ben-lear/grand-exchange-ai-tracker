/**
 * Error display component
 */

import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { cn } from '../../utils';
import type { ApiError } from '../../types';

export interface ErrorDisplayProps {
  /** Error object or message */
  error?: ApiError | Error | string | null;
  /** Title for the error */
  title?: string;
  /** Optional retry callback */
  onRetry?: () => void;
  /** Custom className */
  className?: string;
  /** Show as compact inline error */
  inline?: boolean;
}

/**
 * ErrorDisplay component for showing errors to users
 */
export const ErrorDisplay: React.FC<ErrorDisplayProps> = ({
  error,
  title = 'Error',
  onRetry,
  className,
  inline = false,
}) => {
  if (!error) return null;

  // Extract error message
  let errorMessage = 'An unknown error occurred';
  let statusCode: number | undefined;

  if (typeof error === 'string') {
    errorMessage = error;
  } else if ('error' in error && typeof error.error === 'string') {
    errorMessage = error.error;
    statusCode = error.status;
  } else if ('message' in error) {
    errorMessage = error.message;
  }

  if (inline) {
    return (
      <div className={cn('flex items-center gap-2 text-sm text-red-600 dark:text-red-400', className)}>
        <AlertCircle className="w-4 h-4" />
        <span>{errorMessage}</span>
        {onRetry && (
          <button
            onClick={onRetry}
            className="underline hover:no-underline"
            type="button"
          >
            Retry
          </button>
        )}
      </div>
    );
  }

  return (
    <div
      className={cn(
        'rounded-lg border border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950 p-4',
        className
      )}
      role="alert"
    >
      <div className="flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-red-900 dark:text-red-100 mb-1">
            {title}
            {statusCode && ` (${statusCode})`}
          </h3>
          <p className="text-sm text-red-800 dark:text-red-200">
            {errorMessage}
          </p>
        </div>
        {onRetry && (
          <button
            onClick={onRetry}
            className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-red-700 dark:text-red-300 bg-red-100 dark:bg-red-900 hover:bg-red-200 dark:hover:bg-red-800 rounded-md transition-colors"
            type="button"
          >
            <RefreshCw className="w-4 h-4" />
            Retry
          </button>
        )}
      </div>
    </div>
  );
};

/**
 * Empty state component
 */
export interface EmptyStateProps {
  /** Title for empty state */
  title: string;
  /** Description text */
  description?: string;
  /** Icon component */
  icon?: React.ReactNode;
  /** Action button */
  action?: {
    label: string;
    onClick: () => void;
  };
  /** Custom className */
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  icon,
  action,
  className,
}) => {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center py-12 px-4 text-center',
        className
      )}
    >
      {icon && (
        <div className="mb-4 text-gray-400 dark:text-gray-600">
          {icon}
        </div>
      )}
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
        {title}
      </h3>
      {description && (
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 max-w-sm">
          {description}
        </p>
      )}
      {action && (
        <button
          onClick={action.onClick}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium transition-colors"
          type="button"
        >
          {action.label}
        </button>
      )}
    </div>
  );
};
