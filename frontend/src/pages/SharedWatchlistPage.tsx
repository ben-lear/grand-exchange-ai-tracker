/**
 * SharedWatchlistPage - Public page for viewing shared watchlists via token
 * Features:
 * - Read-only view of shared watchlist
 * - Import to user's watchlists option
 * - Item grid with names and icons
 * - Expiration and share info
 */

import { retrieveWatchlistShare } from '@/api/watchlist';
import { BackButton } from '@/components/common';
import { Button } from '@/components/ui';
import { ImportSuccessBanner, ItemGrid, ShareInfoBanner } from '@/components/watchlist';
import { useWatchlistStore } from '@/stores';
import { ArrowLeft, Download, ListPlus, Share2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import type { WatchlistShare } from '../types/watchlist';

export function SharedWatchlistPage() {
    const { token } = useParams<{ token: string }>();
    const { createWatchlist, addItemToWatchlist } = useWatchlistStore();

    const [shareData, setShareData] = useState<WatchlistShare | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [imported, setImported] = useState(false);

    useEffect(() => {
        if (!token) {
            setError('Invalid share link');
            setLoading(false);
            return;
        }

        const loadShare = async () => {
            try {
                const data = await retrieveWatchlistShare(token);
                setShareData(data);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to load shared watchlist');
            } finally {
                setLoading(false);
            }
        };

        loadShare();
    }, [token]);

    const handleImport = () => {
        if (!shareData) return;

        // Create new watchlist with imported data
        const newWatchlistId = createWatchlist(`${shareData.watchlist.name} (Imported)`);

        if (newWatchlistId) {
            // Add all items to the new watchlist
            shareData.watchlist.items.forEach(item => {
                addItemToWatchlist(newWatchlistId, item);
            });
        }

        setImported(true);
    };

    const handleExport = () => {
        if (!shareData) return;

        const data = {
            version: '1.0.0',
            metadata: {
                exportedAt: new Date().toISOString(),
                source: 'osrs-ge-tracker',
            },
            watchlists: [shareData.watchlist],
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], {
            type: 'application/json',
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${shareData.watchlist.name.toLowerCase().replace(/\s+/g, '-')}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const getExpirationText = () => {
        if (!shareData) return '';
        const now = Date.now();
        const expiresIn = shareData.expiresAt - now;
        const days = Math.ceil(expiresIn / (1000 * 60 * 60 * 24));
        return days > 0 ? `${days} day${days !== 1 ? 's' : ''}` : 'Expired';
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600 dark:text-gray-400">Loading shared watchlist...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
                <div className="text-center max-w-md">
                    <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Share2 className="w-8 h-8 text-red-600 dark:text-red-400" />
                    </div>
                    <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                        Unable to Load Watchlist
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400 mb-6">{error}</p>
                    <Link
                        to="/"
                        className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back to Items
                    </Link>
                </div>
            </div>
        );
    }

    if (!shareData) {
        return null;
    }

    const watchlist = shareData.watchlist;

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            {/* Header */}
            <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between py-6">
                        <div className="flex items-center gap-4">
                            <BackButton />
                            <div className="h-6 w-px bg-gray-300 dark:bg-gray-600" />
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                                    {watchlist.name}
                                </h1>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                    Shared watchlist • {watchlist.items.length} item{watchlist.items.length !== 1 ? 's' : ''}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <Button
                                variant="secondary"
                                size="default"
                                onClick={handleExport}
                                leftIcon={<Download className="w-4 h-4" />}
                            >
                                Export
                            </Button>
                            <Button
                                variant="primary"
                                size="default"
                                onClick={handleImport}
                                disabled={imported}
                                leftIcon={<ListPlus className="w-4 h-4" />}
                            >
                                {imported ? 'Imported' : 'Import to My Watchlists'}
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Share Info */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                <ShareInfoBanner
                    token={token!}
                    expirationText={getExpirationText()}
                    accessCount={shareData.accessCount}
                />
            </div>

            {/* Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
                {imported && (
                    <ImportSuccessBanner
                        watchlistName={watchlist.name}
                        className="mb-6"
                    />
                )}

                <ItemGrid
                    items={watchlist.items}
                    title="Items"
                />
            </div>
        </div>
    );
}