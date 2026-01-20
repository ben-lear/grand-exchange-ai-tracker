/**
 * DashboardHeader - Header component for the dashboard page
 * Displays page title and description
 */

import React from 'react';

export interface DashboardHeaderProps {
    /** Custom title for the page */
    title?: string;
    /** Custom description for the page */
    description?: string;
    /** Optional className for custom styling */
    className?: string;
}

/**
 * DashboardHeader component
 * Simple header with title and description for the dashboard page
 */
export const DashboardHeader: React.FC<DashboardHeaderProps> = ({
    title = 'Grand Exchange Items',
    description = 'Browse and track all OSRS Grand Exchange items and their current prices',
    className = '',
}) => {
    return (
        <div className={`flex items-center justify-between ${className}`}>
            <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                    {title}
                </h1>
                <p className="mt-2 text-gray-600 dark:text-gray-400">
                    {description}
                </p>
            </div>
        </div>
    );
};