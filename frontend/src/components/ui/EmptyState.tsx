/**
 * EmptyState component for displaying when there's no data to show
 */

import React from 'react';
import { cn } from '../../utils';
import { Button, Text } from '../ui';

export interface EmptyStateProps {
    /** Icon component to display */
    icon?: React.ComponentType<{ className?: string }>;
    /** Title for the empty state */
    title: string;
    /** Optional description text */
    description?: string;
    /** Optional action button */
    action?: {
        label: string;
        onClick: () => void;
    };
    /** Custom className */
    className?: string;
}

/**
 * EmptyState component for consistent empty state UI
 * 
 * Usage:
 * <EmptyState
 *   icon={Package}
 *   title="No items found"
 *   description="Try adjusting your filters"
 *   action={{ label: "Clear Filters", onClick: handleClear }}
 * />
 */
export const EmptyState: React.FC<EmptyStateProps> = ({
    icon: IconComponent,
    title,
    description,
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
            {IconComponent && (
                <div className="mb-4 text-gray-400 dark:text-gray-600">
                    <IconComponent className="w-16 h-16" />
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
