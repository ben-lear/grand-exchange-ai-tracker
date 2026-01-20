/**
 * ShareInfoBanner - Banner showing share token information
 * Used in SharedWatchlistPage to display share details
 */

import { StatusBanner } from '@/components/ui';
import { Share2 } from 'lucide-react';
import React from 'react';

export interface ShareInfoBannerProps {
    /** Share token to display */
    token: string;
    /** Expiration text (e.g., "3 days") */
    expirationText: string;
    /** Number of times accessed */
    accessCount: number;
    /** Optional className for custom styling */
    className?: string;
}

/**
 * ShareInfoBanner component
 * Displays share token, expiration, and access count information
 */
export const ShareInfoBanner: React.FC<ShareInfoBannerProps> = ({
    token,
    expirationText,
    accessCount,
    className = '',
}) => {
    const description = (
        <>
            Share token: <code className="font-mono bg-blue-100 dark:bg-blue-900/40 px-1 rounded">{token}</code>
            {' • '}
            Expires in {expirationText}
            {' • '}
            Accessed {accessCount + 1} time{accessCount !== 0 ? 's' : ''}
        </>
    );

    return (
        <StatusBanner
            variant="info"
            title="This is a shared watchlist"
            description={description}
            icon={Share2}
            className={className}
        />
    );
};