/**
 * WatchlistDropdown - Multi-select dropdown for assigning items to watchlists
 */

import { Menu, Transition } from '@headlessui/react';
import { Check, ListPlus, Star } from 'lucide-react';
import { Fragment } from 'react';
import { useWatchlistStore } from '../../stores/useWatchlistStore';
import type { Watchlist } from '../../types/watchlist';

export interface WatchlistDropdownProps {
    /** Item ID to manage */
    itemId: number;
    /** Item name for display */
    itemName: string;
    /** Item icon URL */
    itemIconUrl: string;
    /** Optional callback when watchlist membership changes */
    onChange?: (watchlistIds: string[]) => void;
    /** Custom button content (defaults to ListPlus icon) */
    buttonContent?: React.ReactNode;
    /** Button className override */
    buttonClassName?: string;
}

export function WatchlistDropdown({
    itemId,
    itemName,
    itemIconUrl,
    onChange,
    buttonContent,
    buttonClassName = 'p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors',
}: WatchlistDropdownProps) {
    const {
        getAllWatchlists,
        isItemInWatchlist,
        addItemToWatchlist,
        removeItemFromWatchlist,
        getItemWatchlists
    } = useWatchlistStore();

    const watchlists = getAllWatchlists();
    const itemWatchlists = getItemWatchlists(itemId);

    const handleToggleWatchlist = (watchlist: Watchlist) => {
        const isInWatchlist = isItemInWatchlist(watchlist.id, itemId);

        if (isInWatchlist) {
            removeItemFromWatchlist(watchlist.id, itemId);
        } else {
            addItemToWatchlist(watchlist.id, {
                itemId,
                name: itemName,
                iconUrl: itemIconUrl,
            });
        }

        // Notify parent of changes
        if (onChange) {
            const updatedWatchlists = getItemWatchlists(itemId);
            onChange(updatedWatchlists.map(w => w.id));
        }
    };

    return (
        <Menu as="div" className="relative inline-block text-left">
            <Menu.Button className={buttonClassName}>
                {buttonContent || <ListPlus className="w-4 h-4" />}
            </Menu.Button>

            <Transition
                as={Fragment}
                enter="transition ease-out duration-100"
                enterFrom="transform opacity-0 scale-95"
                enterTo="transform opacity-100 scale-100"
                leave="transition ease-in duration-75"
                leaveFrom="transform opacity-100 scale-100"
                leaveTo="transform opacity-0 scale-95"
            >
                <Menu.Items className="absolute right-0 z-50 mt-2 w-56 origin-top-right rounded-lg bg-white dark:bg-gray-800 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                    <div className="p-2">
                        {/* Header */}
                        <div className="px-2 py-1.5 text-xs font-medium text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700 mb-1">
                            Add to Watchlist
                        </div>

                        {/* Watchlist Options */}
                        <div className="space-y-0.5">
                            {watchlists.map((watchlist) => {
                                const isInWatchlist = isItemInWatchlist(watchlist.id, itemId);

                                return (
                                    <Menu.Item key={watchlist.id}>
                                        {({ active }) => (
                                            <button
                                                type="button"
                                                onClick={() => handleToggleWatchlist(watchlist)}
                                                className={`
                                                    w-full flex items-center justify-between px-2 py-2 rounded-md text-sm
                                                    ${active ? 'bg-gray-100 dark:bg-gray-700' : ''}
                                                    ${isInWatchlist ? 'text-blue-600 dark:text-blue-400' : 'text-gray-700 dark:text-gray-300'}
                                                `}
                                            >
                                                <div className="flex items-center gap-2">
                                                    {watchlist.isDefault && (
                                                        <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" />
                                                    )}
                                                    <span className="truncate">{watchlist.name}</span>
                                                    <span className="text-xs text-gray-400">
                                                        ({watchlist.items.length})
                                                    </span>
                                                </div>
                                                {isInWatchlist && (
                                                    <Check className="w-4 h-4 flex-shrink-0" data-testid="check-icon" />
                                                )}
                                            </button>
                                        )}
                                    </Menu.Item>
                                );
                            })}
                        </div>

                        {/* Empty State */}
                        {watchlists.length === 0 && (
                            <div className="px-2 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
                                No watchlists yet
                            </div>
                        )}

                        {/* Currently In Watchlists (if any) */}
                        {itemWatchlists.length > 0 && (
                            <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                                <div className="px-2 py-1 text-xs text-gray-500 dark:text-gray-400">
                                    In {itemWatchlists.length} watchlist{itemWatchlists.length !== 1 ? 's' : ''}
                                </div>
                            </div>
                        )}
                    </div>
                </Menu.Items>
            </Transition>
        </Menu>
    );
}
