/**
 * TableContainer Component
 * Standard layout wrapper for data tables with toolbar, pagination, and actions
 */

import { Card } from '@/components/ui';
import React from 'react';

interface TableContainerProps {
    /** Toolbar section (filters, search, etc.) */
    toolbar?: React.ReactNode;
    /** The table component */
    table: React.ReactNode;
    /** Pagination controls */
    pagination?: React.ReactNode;
    /** Action buttons or additional controls */
    actions?: React.ReactNode;
    /** Additional CSS classes */
    className?: string;
}

export function TableContainer({
    toolbar,
    table,
    pagination,
    actions,
    className = '',
}: TableContainerProps) {
    return (
        <Card className={className}>
            {/* Toolbar Section */}
            {toolbar && (
                <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                    {toolbar}
                </div>
            )}

            {/* Table Section */}
            <div className="p-4">
                {table}
            </div>

            {/* Footer Section (Pagination & Actions) */}
            {(pagination || actions) && (
                <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between">
                        <div className="flex-1">
                            {pagination}
                        </div>
                        {actions && (
                            <div className="ml-4">
                                {actions}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </Card>
    );
}
