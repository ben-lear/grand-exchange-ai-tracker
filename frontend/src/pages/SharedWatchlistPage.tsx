/**
 * SharedWatchlistPage - Public page for viewing shared watchlists via token
 * Features:
 * - Read-only view of shared watchlist
 * - Import to user's watchlists option
 * - Item grid with names and icons
 * - Expiration and share info
 */

import { retrieveWatchlistShare } from '@/api/watchlist';
import { Button } from '@/components/ui';
import { useWatchlistStore } from '@/stores/useWatchlistStore';
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
                            <Link
                                to="/"
                                className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 transition-colors"
                            >
                                <ArrowLeft className="w-4 h-4" />
                                <span>Back to Items</span>
                            </Link>
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
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                    <div className="flex items-center gap-3">
                        <Share2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        <div className="flex-1">
                            <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                                This is a shared watchlist
                            </p>
                            <p className="text-sm text-blue-700 dark:text-blue-300">
                                Share token: <code className="font-mono bg-blue-100 dark:bg-blue-900/40 px-1 rounded">{token}</code>
                                {' • '}
                                Expires in {getExpirationText()}
                                {' • '}
                                Accessed {shareData.accessCount + 1} time{shareData.accessCount !== 0 ? 's' : ''}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
                {imported && (
                    <div className="mb-6 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-green-100 dark:bg-green-900/40 rounded-full flex items-center justify-center">
                                <ListPlus className="w-4 h-4 text-green-600 dark:text-green-400" />
                            </div>
                            <div>
                                <p className="font-medium text-green-900 dark:text-green-100">
                                    Watchlist imported successfully!
                                </p>
                                <p className="text-sm text-green-700 dark:text-green-300">
                                    You can now find "{watchlist.name} (Imported)" in your{' '}
                                    <Link to="/watchlists" className="underline hover:no-underline">
                                        watchlists
                                    </Link>.
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {watchlist.items.length === 0 ? (
                    <div className="text-center py-12">
                        <div className="mx-auto w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
                            <ListPlus className="w-8 h-8 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                            Empty Watchlist
                        </h3>
                        <p className="text-gray-500 dark:text-gray-400">
                            This watchlist doesn't contain any items yet.
                        </p>
                    </div>
                ) : (
                    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                            Items ({watchlist.items.length})
                        </h2>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                            {watchlist.items.map((item) => (
                                <div
                                    key={item.itemId}
                                    className="flex flex-col items-center p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 transition-colors"
                                >
                                    <img
                                        src={item.iconUrl}
                                        alt={item.name}
                                        className="w-8 h-8 mb-2"
                                        loading="lazy"
                                    />
                                    <span className="text-xs text-center text-gray-700 dark:text-gray-300 leading-tight">
                                        {item.name}
                                    </span>
                                    <span className="text-xs text-gray-400 mt-1">#{item.itemId}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}