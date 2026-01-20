/**
 * Table loading state with skeleton rows
 */

import React from 'react';
import { cn } from '../../../utils';
import { Skeleton, Stack } from '../../ui';

export interface TableLoadingProps {
    /** Number of rows to show */
    rows?: number;
    /** Number of columns per row */
    columns?: number;
    /** Additional className */
    className?: string;
}

/**
 * Table loading skeleton with configurable rows and columns
 */
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
