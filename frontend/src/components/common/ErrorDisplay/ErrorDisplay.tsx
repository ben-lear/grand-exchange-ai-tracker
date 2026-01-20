/**
 * Error display component
 */

import { RefreshCw } from 'lucide-react';
import React from 'react';
import type { ApiError } from '@/types';
import { cn } from '@/utils';
import { Alert, Button, Card, CardContent, Icon, Text } from '@/components/ui';

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
      <Alert
        variant="error"
        title={errorMessage}
        showIcon
        className={className}
        onClose={onRetry ? undefined : undefined}
      >
        {onRetry && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onRetry}
            className="underline hover:no-underline mt-2"
          >
            Retry
          </Button>
        )}
      </Alert>
    );
  }

  return (
    <Card variant="error" className={className}>
      <CardContent>
        <Alert
          variant="error"
          title={`${title}${statusCode ? ` (${statusCode})` : ''}`}
          description={errorMessage}
          showIcon
          onClose={onRetry ? undefined : undefined}
        >
          {onRetry && (
            <div className="mt-3">
              <Button
                variant="error"
                size="sm"
                onClick={onRetry}
                leftIcon={<Icon as={RefreshCw} size="sm" />}
              >
                Retry
              </Button>
            </div>
          )}
        </Alert>
      </CardContent>
    </Card>
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
      <Text as="h3" variant="heading" size="lg" className="mb-2">
        {title}
      </Text>
      {description && (
        <Text variant="muted" size="sm" className="mb-4 max-w-sm">
          {description}
        </Text>
      )}
      {action && (
        <Button
          onClick={action.onClick}
          variant="primary"
          size="default"
        >
          {action.label}
        </Button>
      )}
    </div>
  );
};
