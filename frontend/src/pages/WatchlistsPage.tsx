/**
 * WatchlistsPage - Main page for managing all watchlists
 * Features:
 * - Grid view of all watchlists
 * - Create new watchlist button
 * - Import/export watchlists
 * - Template browser
 */

import { Button } from '@/components/ui';
import { useWatchlistStore } from '@/stores';
import { ArrowLeft, FileDown, FileUp, ListPlus } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ConfirmDeleteModal } from '../components/watchlist/ConfirmDeleteModal';
import { CreateWatchlistModal } from '../components/watchlist/CreateWatchlistModal';
import { EditWatchlistModal } from '../components/watchlist/EditWatchlistModal';
import { ImportWatchlistModal } from '../components/watchlist/ImportWatchlistModal';
import { ShareWatchlistModal } from '../components/watchlist/ShareWatchlistModal';
import { WatchlistCard } from '../components/watchlist/WatchlistCard';
import type { Watchlist } from '../types/watchlist';

export function WatchlistsPage() {
    const { getAllWatchlists, deleteWatchlist } = useWatchlistStore();
    const watchlists = getAllWatchlists();

    // Modal states
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showImportModal, setShowImportModal] = useState(false);
    const [shareWatchlist, setShareWatchlist] = useState<Watchlist | null>(null);
    const [editWatchlist, setEditWatchlist] = useState<Watchlist | null>(null);
    const [deleteWatchlistConfirm, setDeleteWatchlistConfirm] = useState<Watchlist | null>(null);

    const handleExportAll = () => {
        // Export all watchlists as JSON
        const data = {
            version: '1.0.0',
            metadata: {
                exportedAt: new Date().toISOString(),
                source: 'osrs-ge-tracker',
            },
            watchlists,
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], {
            type: 'application/json',
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `watchlists-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const handleExportWatchlist = (watchlist: Watchlist) => {
        // Export single watchlist as JSON
        const data = {
            version: '1.0.0',
            metadata: {
                exportedAt: new Date().toISOString(),
                source: 'osrs-ge-tracker',
            },
            watchlists: [watchlist],
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], {
            type: 'application/json',
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const filename = watchlist.name.toLowerCase().replace(/\s+/g, '-');
        a.download = `watchlist-${filename}-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const handleDeleteWatchlist = (watchlist: Watchlist) => {
        const success = deleteWatchlist(watchlist.id);
        if (!success) {
            console.error('Failed to delete watchlist');
        }
    };

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
                            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                                My Watchlists
                            </h1>
                        </div>

                        <div className="flex items-center gap-3">
                            <Button
                                variant="secondary"
                                size="default"
                                onClick={handleExportAll}
                                leftIcon={<FileDown className="w-4 h-4" />}
                                disabled={watchlists.length === 0}
                            >
                                Export All
                            </Button>
                            <Button
                                variant="secondary"
                                size="default"
                                onClick={() => setShowImportModal(true)}
                                leftIcon={<FileUp className="w-4 h-4" />}
                            >
                                Import
                            </Button>
                            <Button
                                variant="primary"
                                size="default"
                                onClick={() => setShowCreateModal(true)}
                                leftIcon={<ListPlus className="w-4 h-4" />}
                            >
                                New Watchlist
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {watchlists.length === 0 ? (
                    // Empty state
                    <div className="text-center py-12">
                        <div className="mx-auto w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
                            <ListPlus className="w-12 h-12 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                            No watchlists yet
                        </h3>
                        <p className="text-gray-500 dark:text-gray-400 mb-6">
                            Create your first watchlist to start tracking items
                        </p>
                        <Button
                            variant="primary"
                            size="default"
                            onClick={() => setShowCreateModal(true)}
                            leftIcon={<ListPlus className="w-4 h-4" />}
                        >
                            Create Watchlist
                        </Button>
                    </div>
                ) : (
                    // Watchlists grid
                    <div>
                        <div className="mb-6">
                            <p className="text-gray-600 dark:text-gray-400">
                                {watchlists.length} watchlist{watchlists.length !== 1 ? 's' : ''}
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {watchlists.map((watchlist) => (
                                <WatchlistCard
                                    key={watchlist.id}
                                    watchlist={watchlist}
                                    onEdit={() => setEditWatchlist(watchlist)}
                                    onDelete={() => setDeleteWatchlistConfirm(watchlist)}
                                    onShare={() => setShareWatchlist(watchlist)}
                                    onExport={() => handleExportWatchlist(watchlist)}
                                />
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Modals */}
            <CreateWatchlistModal
                isOpen={showCreateModal}
                onClose={() => setShowCreateModal(false)}
            />

            <ImportWatchlistModal
                isOpen={showImportModal}
                onClose={() => setShowImportModal(false)}
            />

            {shareWatchlist && (
                <ShareWatchlistModal
                    isOpen={!!shareWatchlist}
                    onClose={() => setShareWatchlist(null)}
                    watchlist={shareWatchlist}
                />
            )}

            {editWatchlist && (
                <EditWatchlistModal
                    isOpen={!!editWatchlist}
                    onClose={() => setEditWatchlist(null)}
                    watchlist={editWatchlist}
                />
            )}

            {deleteWatchlistConfirm && (
                <ConfirmDeleteModal
                    isOpen={!!deleteWatchlistConfirm}
                    onClose={() => setDeleteWatchlistConfirm(null)}
                    onConfirm={() => handleDeleteWatchlist(deleteWatchlistConfirm)}
                    watchlist={deleteWatchlistConfirm}
                />
            )}
        </div>
    );
}
