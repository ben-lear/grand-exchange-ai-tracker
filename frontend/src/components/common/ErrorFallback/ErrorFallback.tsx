/**
 * ErrorFallback component for displaying error UI when ErrorBoundary catches an error
 */

import { Button, Card, CardContent, Icon, Text } from '@/components/ui';
import { cn } from '@/utils';
import { AlertCircle, RefreshCw } from 'lucide-react';
import React from 'react';
import type { ErrorFallbackProps } from '../ErrorBoundary/ErrorBoundary';

/**
 * ErrorFallback component with different variants for different contexts
 * 
 * Variants:
 * - page: Full page error (404, 500 style)
 * - section: Section/card error (chart, table)
 * - inline: Inline error (small banner)
 */
export const ErrorFallback: React.FC<ErrorFallbackProps> = ({
    error,
    resetErrorBoundary,
    variant = 'section',
}) => {
    if (variant === 'page') {
        return (
            <div className="min-h-screen flex items-center justify-center p-4">
                <div className="max-w-md w-full text-center">
                    <Icon
                        as={AlertCircle}
                        size="xl"
                        className="text-red-500 dark:text-red-400 mx-auto mb-4"
                    />
                    <Text as="h1" variant="heading" size="2xl" className="mb-2">
                        Something went wrong
                    </Text>
                    <Text variant="muted" className="mb-6">
                        {error.message || 'An unexpected error occurred. Please try again.'}
                    </Text>
                    <Button
                        onClick={resetErrorBoundary}
                        variant="primary"
                        leftIcon={<Icon as={RefreshCw} size="sm" />}
                    >
                        Try Again
                    </Button>
                </div>
            </div>
        );
    }

    if (variant === 'inline') {
        return (
            <div
                className={cn(
                    'flex items-center gap-2 p-3 rounded-md',
                    'bg-red-50 dark:bg-red-900/20',
                    'border border-red-200 dark:border-red-800'
                )}
            >
                <Icon
                    as={AlertCircle}
                    size="sm"
                    className="text-red-600 dark:text-red-400 flex-shrink-0"
                />
                <Text size="sm" className="text-red-800 dark:text-red-300 flex-1">
                    {error.message || 'An error occurred'}
                </Text>
                <Button
                    onClick={resetErrorBoundary}
                    variant="ghost"
                    size="sm"
                    className="flex-shrink-0"
                >
                    Retry
                </Button>
            </div>
        );
    }

    // Default: section variant
    return (
        <Card variant="error" className="max-w-2xl mx-auto">
            <CardContent className="text-center py-8">
                <Icon
                    as={AlertCircle}
                    size="lg"
                    className="text-red-500 dark:text-red-400 mx-auto mb-4"
                />
                <Text as="h3" variant="heading" size="lg" className="mb-2">
                    Error Loading Component
                </Text>
                <Text variant="muted" size="sm" className="mb-6 max-w-md mx-auto">
                    {error.message || 'An unexpected error occurred while loading this component.'}
                </Text>
                {import.meta.env.DEV && error.stack && (
                    <details className="text-left mb-6">
                        <summary className="cursor-pointer text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200">
                            Show error details
                        </summary>
                        <pre className="mt-2 p-4 bg-gray-100 dark:bg-gray-800 rounded text-xs overflow-auto">
                            {error.stack}
                        </pre>
                    </details>
                )}
                <Button
                    onClick={resetErrorBoundary}
                    variant="primary"
                    leftIcon={<Icon as={RefreshCw} size="sm" />}
                >
                    Try Again
                </Button>
            </CardContent>
        </Card>
    );
};
