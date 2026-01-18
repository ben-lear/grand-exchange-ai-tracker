/**
 * ConfirmDeleteModal - Confirmation dialog before deleting a watchlist
 */

import { Button } from '@/components/ui';
import { AlertTriangle, X } from 'lucide-react';
import type { Watchlist } from '../../types/watchlist';

export interface ConfirmDeleteModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    watchlist: Watchlist;
}

export function ConfirmDeleteModal({
    isOpen,
    onClose,
    onConfirm,
    watchlist,
}: ConfirmDeleteModalProps) {
    const handleConfirm = () => {
        onConfirm();
        onClose();
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Escape') {
            onClose();
        } else if (e.key === 'Enter') {
            handleConfirm();
        }
    };

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
            onClick={onClose}
        >
            <div
                className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md mx-4"
                onClick={(e) => e.stopPropagation()}
                onKeyDown={handleKeyDown}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-red-100 dark:bg-red-900/20 rounded-full">
                            <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
                        </div>
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                            Delete Watchlist
                        </h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                        aria-label="Close"
                    >
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6">
                    <p className="text-gray-700 dark:text-gray-300 mb-2">
                        Are you sure you want to delete{' '}
                        <span className="font-semibold">"{watchlist.name}"</span>?
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        This watchlist contains {watchlist.items.length} item
                        {watchlist.items.length !== 1 ? 's' : ''}. This action cannot be undone.
                    </p>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
                    <Button
                        type="button"
                        variant="secondary"
                        size="default"
                        onClick={onClose}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="button"
                        variant="destructive"
                        size="default"
                        onClick={handleConfirm}
                    >
                        Delete Watchlist
                    </Button>
                </div>
            </div>
        </div>
    );
}
