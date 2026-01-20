/**
 * WatchlistDropdown - Multi-select dropdown for assigning items to watchlists
 */

import { Menu, Portal, Transition } from '@headlessui/react';
import { Check, ListPlus, Star } from 'lucide-react';
import React, { Fragment, KeyboardEvent, useRef, useState } from 'react';
import { useWatchlistStore } from '@/stores';
import type { Watchlist } from '@/types/watchlist';
import { WATCHLIST_LIMITS } from '@/types/watchlist';
import { Icon, Input, Stack, Text } from '@/components/ui';

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
        getItemWatchlists,
        createWatchlist,
        getWatchlistCount,
    } = useWatchlistStore();

    const [newWatchlistName, setNewWatchlistName] = useState('');
    const [createError, setCreateError] = useState<string | null>(null);
    const buttonRef = useRef<HTMLButtonElement>(null);

    const watchlists = getAllWatchlists();
    const itemWatchlists = getItemWatchlists(itemId);
    const watchlistCount = getWatchlistCount();

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

    const handleCreateWatchlist = () => {
        const trimmedName = newWatchlistName.trim();

        // Reset error
        setCreateError(null);

        // Validate name length
        if (trimmedName.length < WATCHLIST_LIMITS.MIN_NAME_LENGTH) {
            setCreateError('Name is required');
            return;
        }
        if (trimmedName.length > WATCHLIST_LIMITS.MAX_NAME_LENGTH) {
            setCreateError(`Name must be ${WATCHLIST_LIMITS.MAX_NAME_LENGTH} characters or less`);
            return;
        }

        // Check watchlist limit
        if (watchlistCount >= WATCHLIST_LIMITS.MAX_WATCHLISTS) {
            setCreateError(`Maximum ${WATCHLIST_LIMITS.MAX_WATCHLISTS} watchlists allowed`);
            return;
        }

        // Check for duplicate name
        const existingNames = watchlists.map(w => w.name.toLowerCase());
        if (existingNames.includes(trimmedName.toLowerCase())) {
            setCreateError('A watchlist with this name already exists');
            return;
        }

        // Create watchlist
        const newWatchlistId = createWatchlist(trimmedName);

        if (newWatchlistId) {
            // Auto-add current item to the new watchlist
            addItemToWatchlist(newWatchlistId, {
                itemId,
                name: itemName,
                iconUrl: itemIconUrl,
            });

            // Clear input and error
            setNewWatchlistName('');
            setCreateError(null);

            // Notify parent of changes
            if (onChange) {
                const updatedWatchlists = getItemWatchlists(itemId);
                onChange(updatedWatchlists.map(w => w.id));
            }
        } else {
            setCreateError('Failed to create watchlist');
        }
    };

    const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
        // Stop event propagation to prevent Menu keyboard navigation interference
        e.stopPropagation();

        if (e.key === 'Enter') {
            e.preventDefault();
            handleCreateWatchlist();
        }
    };

    return (
        <Menu as="div" className="relative inline-block text-left">
            {({ open }) => (
                <>
                    <Menu.Button ref={buttonRef} className={buttonClassName}>
                        {buttonContent || <Icon as={ListPlus} size="sm" />}
                    </Menu.Button>

                    <Portal>
                        <Transition
                            show={open}
                            as={Fragment}
                            enter="transition ease-out duration-100"
                            enterFrom="transform opacity-0 scale-95"
                            enterTo="transform opacity-100 scale-100"
                            leave="transition ease-in duration-75"
                            leaveFrom="transform opacity-100 scale-100"
                            leaveTo="transform opacity-0 scale-95"
                        >
                            <Menu.Items
                                className="fixed z-50 w-56 mt-2 origin-top-right rounded-lg bg-white dark:bg-gray-800 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none"
                                style={{
                                    top: buttonRef.current
                                        ? `${buttonRef.current.getBoundingClientRect().bottom + 8}px`
                                        : undefined,
                                    left: buttonRef.current
                                        ? `${buttonRef.current.getBoundingClientRect().right - 224}px`
                                        : undefined,
                                }}
                            >
                                <div className="p-2">
                                    {/* Quick Create Input */}
                                    <div className="px-2 py-2 border-b border-gray-200 dark:border-gray-700 mb-1">
                                        <Input
                                            type="text"
                                            placeholder="Create new watchlist..."
                                            value={newWatchlistName}
                                            onChange={(e) => setNewWatchlistName(e.target.value)}
                                            onKeyDown={handleKeyDown}
                                            size="sm"
                                            maxLength={WATCHLIST_LIMITS.MAX_NAME_LENGTH}
                                        />
                                        {createError && (
                                            <Text variant="error" size="xs" className="mt-1">
                                                {createError}
                                            </Text>
                                        )}
                                    </div>

                                    {/* Watchlist Options */}
                                    <div className="space-y-0.5">
                                        {watchlists.map((watchlist) => {
                                            const isInWatchlist = isItemInWatchlist(watchlist.id, itemId);

                                            return (
                                                <button
                                                    key={watchlist.id}
                                                    type="button"
                                                    onClick={() => handleToggleWatchlist(watchlist)}
                                                    className={`
                                            w-full flex items-center justify-between px-2 py-2 rounded-md text-sm
                                            hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors
                                            ${isInWatchlist ? 'text-blue-600 dark:text-blue-400' : 'text-gray-700 dark:text-gray-300'}
                                        `}
                                                >
                                                    <Stack direction="row" align="center" gap={2}>
                                                        {watchlist.isDefault && (
                                                            <Icon as={Star} size="xs" className="text-yellow-500 fill-yellow-500" />
                                                        )}
                                                        <Text className="truncate">{watchlist.name}</Text>
                                                        <Text variant="muted" size="xs">
                                                            ({watchlist.items.length})
                                                        </Text>
                                                    </Stack>
                                                    {isInWatchlist && (
                                                        <Icon as={Check} size="sm" data-testid="check-icon" />
                                                    )}
                                                </button>
                                            );
                                        })}
                                    </div>

                                    {/* Empty State */}
                                    {watchlists.length === 0 && (
                                        <div className="px-2 py-8 text-center">
                                            <Text variant="muted" size="sm">
                                                No watchlists yet
                                            </Text>
                                        </div>
                                    )}

                                    {/* Currently In Watchlists (if any) */}
                                    {itemWatchlists.length > 0 && (
                                        <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                                            <div className="px-2 py-1">
                                                <Text variant="muted" size="xs">
                                                    In {itemWatchlists.length} watchlist{itemWatchlists.length !== 1 ? 's' : ''}
                                                </Text>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </Menu.Items>
                        </Transition>
                    </Portal>
                </>
            )}
        </Menu>
    );
}
