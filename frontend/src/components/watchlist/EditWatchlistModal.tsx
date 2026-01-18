/**
 * EditWatchlistModal - Modal for renaming a watchlist
 */

import { Button } from '@/components/ui';
import { WatchlistSchema } from '@/schemas/watchlist';
import { useWatchlistStore } from '@/stores/useWatchlistStore';
import { X } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { Watchlist } from '../../types/watchlist';

export interface EditWatchlistModalProps {
    isOpen: boolean;
    onClose: () => void;
    watchlist: Watchlist;
}

export function EditWatchlistModal({
    isOpen,
    onClose,
    watchlist,
}: EditWatchlistModalProps) {
    const { renameWatchlist } = useWatchlistStore();
    const [name, setName] = useState(watchlist.name);
    const [error, setError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Reset form when modal opens
    useEffect(() => {
        if (isOpen) {
            setName(watchlist.name);
            setError(null);
        }
    }, [isOpen, watchlist.name]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsSubmitting(true);

        const trimmedName = name.trim();

        // Validate name length
        if (trimmedName.length < 1) {
            setError('Name cannot be empty');
            setIsSubmitting(false);
            return;
        }

        if (trimmedName.length > 50) {
            setError('Name must be 50 characters or less');
            setIsSubmitting(false);
            return;
        }

        // Validate with Zod schema
        const result = WatchlistSchema.shape.name.safeParse(trimmedName);
        if (!result.success) {
            setError(result.error.errors[0]?.message || 'Invalid name');
            setIsSubmitting(false);
            return;
        }

        // Check if name is unchanged
        if (trimmedName === watchlist.name) {
            setIsSubmitting(false);
            onClose();
            return;
        }

        // Rename watchlist
        const success = renameWatchlist(watchlist.id, trimmedName);

        setIsSubmitting(false);

        if (success) {
            onClose();
        } else {
            setError('Failed to rename watchlist. Name may already exist or watchlist is default.');
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Escape') {
            onClose();
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
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                        Rename Watchlist
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                        aria-label="Close"
                    >
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit}>
                    <div className="p-6">
                        <label
                            htmlFor="watchlist-name"
                            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                        >
                            Watchlist Name
                        </label>
                        <input
                            id="watchlist-name"
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Enter watchlist name"
                            maxLength={50}
                            autoFocus
                            disabled={isSubmitting}
                        />
                        {error && (
                            <p className="mt-2 text-sm text-red-600 dark:text-red-400">
                                {error}
                            </p>
                        )}
                        <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                            {name.length}/50 characters
                        </p>
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
                        <Button
                            type="button"
                            variant="secondary"
                            size="default"
                            onClick={onClose}
                            disabled={isSubmitting}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            variant="primary"
                            size="default"
                            disabled={isSubmitting || !name.trim()}
                        >
                            {isSubmitting ? 'Saving...' : 'Save'}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
