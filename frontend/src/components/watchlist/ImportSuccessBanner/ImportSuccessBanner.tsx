/**
 * ImportSuccessBanner - Banner shown after successful import
 * Used in SharedWatchlistPage to show import confirmation
 */

import { StatusBanner } from '@/components/ui';
import { ListPlus } from 'lucide-react';
import React from 'react';
import { Link } from 'react-router-dom';

export interface ImportSuccessBannerProps {
    /** Name of the imported watchlist */
    watchlistName: string;
    /** Optional className for custom styling */
    className?: string;
}

/**
 * ImportSuccessBanner component
 * Shows success message with link to watchlists page
 */
export const ImportSuccessBanner: React.FC<ImportSuccessBannerProps> = ({
    watchlistName,
    className = '',
}) => {
    const description = (
        <>
            You can now find "{watchlistName} (Imported)" in your{' '}
            <Link
                to="/watchlists"
                className="underline hover:no-underline text-green-700 dark:text-green-300"
            >
                watchlists
            </Link>.
        </>
    );

    return (
        <StatusBanner
            variant="success"
            title="Watchlist imported successfully!"
            description={description}
            icon={ListPlus}
            className={className}
        />
    );
};