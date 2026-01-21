/**
 * ImportSuccessBanner - Banner shown after successful import
 * Used in SharedWatchlistPage to show import confirmation
 */

import { Link, StatusBanner } from '@/components/ui';
import { ListPlus } from 'lucide-react';
import React from 'react';

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
                variant="success"
                underline="always"
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