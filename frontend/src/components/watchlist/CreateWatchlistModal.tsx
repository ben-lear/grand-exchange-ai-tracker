/**
 * CreateWatchlistModal - Modal for creating a new watchlist
 */

import { Dialog, Transition } from '@headlessui/react';
import { FolderPlus, Loader2, X } from 'lucide-react';
import { Fragment, useState } from 'react';
import { toast } from 'sonner';
import { useWatchlistStore } from '../../stores/useWatchlistStore';
import { WATCHLIST_LIMITS } from '../../types/watchlist';
import { isValidWatchlistName } from '../../utils/watchlist-utils';

export interface CreateWatchlistModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: (watchlistId: string) => void;
}

export function CreateWatchlistModal({
    isOpen,
    onClose,
    onSuccess,
}: CreateWatchlistModalProps) {
    const [name, setName] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const createWatchlist = useWatchlistStore((state) => state.createWatchlist);
    const getAllWatchlists = useWatchlistStore((state) => state.getAllWatchlists);
    const watchlists = getAllWatchlists();
    const existingNames = watchlists.map((w) => w.name);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (isSubmitting) return;

        const validation = isValidWatchlistName(name, existingNames);
        if (!validation.valid) {
            toast.error(validation.error);
            return;
        }

        setIsSubmitting(true);

        try {
            const watchlistId = createWatchlist(name);

            if (!watchlistId) {
                toast.error('Failed to create watchlist. You may have reached the limit.');
                return;
            }

            toast.success(`Watchlist "${name}" created successfully`);
            onSuccess?.(watchlistId);
            handleClose();
        } catch (error) {
            console.error('Error creating watchlist:', error);
            toast.error('An error occurred while creating the watchlist');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleClose = () => {
        if (!isSubmitting) {
            setName('');
            onClose();
        }
    };

    const watchlistCount = watchlists.length;
    const isAtLimit = watchlistCount >= WATCHLIST_LIMITS.MAX_WATCHLISTS;

    return (
        <Transition appear show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={handleClose}>
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-black/50" />
                </Transition.Child>

                <div className="fixed inset-0 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4">
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0 scale-95"
                            enterTo="opacity-100 scale-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100 scale-100"
                            leaveTo="opacity-0 scale-95"
                        >
                            <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-lg bg-white dark:bg-gray-800 p-6 text-left align-middle shadow-xl transition-all">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-2">
                                        <FolderPlus className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                                        <Dialog.Title className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                                            Create New Watchlist
                                        </Dialog.Title>
                                    </div>
                                    <button
                                        onClick={handleClose}
                                        disabled={isSubmitting}
                                        className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors disabled:opacity-50"
                                    >
                                        <X className="w-5 h-5 text-gray-500" />
                                    </button>
                                </div>

                                {isAtLimit ? (
                                    <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                                        <p className="text-sm text-yellow-800 dark:text-yellow-200">
                                            You've reached the maximum of {WATCHLIST_LIMITS.MAX_WATCHLISTS} watchlists.
                                            Delete a watchlist to create a new one.
                                        </p>
                                    </div>
                                ) : (
                                    <form onSubmit={handleSubmit} className="space-y-4">
                                        <div>
                                            <label
                                                htmlFor="watchlist-name"
                                                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                                            >
                                                Watchlist Name
                                            </label>
                                            <input
                                                id="watchlist-name"
                                                type="text"
                                                value={name}
                                                onChange={(e) => setName(e.target.value)}
                                                placeholder="Enter watchlist name..."
                                                maxLength={WATCHLIST_LIMITS.MAX_NAME_LENGTH}
                                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                                                disabled={isSubmitting}
                                                autoFocus
                                            />
                                            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                                {name.length}/{WATCHLIST_LIMITS.MAX_NAME_LENGTH} characters
                                            </p>
                                        </div>

                                        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                                            <p className="text-sm text-gray-700 dark:text-gray-300">
                                                <span className="font-medium">Tip:</span> You can add up to{' '}
                                                {WATCHLIST_LIMITS.MAX_ITEMS_PER_WATCHLIST} items per watchlist.
                                            </p>
                                        </div>

                                        <div className="flex gap-3 pt-2">
                                            <button
                                                type="button"
                                                onClick={handleClose}
                                                disabled={isSubmitting}
                                                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                type="submit"
                                                disabled={isSubmitting || !name.trim()}
                                                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
                                            >
                                                {isSubmitting ? (
                                                    <>
                                                        <Loader2 className="w-4 h-4 animate-spin" />
                                                        Creating...
                                                    </>
                                                ) : (
                                                    'Create Watchlist'
                                                )}
                                            </button>
                                        </div>
                                    </form>
                                )}

                                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                        Watchlists: {watchlistCount} / {WATCHLIST_LIMITS.MAX_WATCHLISTS}
                                    </p>
                                </div>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
}
