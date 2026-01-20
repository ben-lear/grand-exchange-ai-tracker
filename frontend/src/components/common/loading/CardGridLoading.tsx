/**
 * Card grid loading state with skeleton cards
 */

import React from 'react';
import { cn } from '@/utils';
import { Skeleton, Stack } from '@/components/ui';

export interface CardGridLoadingProps {
    /** Number of cards to show */
    count?: number;
    /** Number of columns in grid (responsive by default) */
    columns?: 1 | 2 | 3 | 4;
    /** Additional className */
    className?: string;
}

const columnClasses = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
};

/**
 * Card grid loading skeleton
 */
export const CardGridLoading: React.FC<CardGridLoadingProps> = ({
    count = 6,
    columns = 3,
    className,
}) => {
    return (
        <div className={cn('grid gap-4', columnClasses[columns], className)}>
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
