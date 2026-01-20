/**
 * WatchlistCard - Card component for displaying a watchlist in the manager grid
 */

import { Menu } from '@headlessui/react';
import { Download, Edit2, MoreVertical, Share2, Star, Trash2 } from 'lucide-react';
import { useState } from 'react';
import type { Watchlist } from '../../types/watchlist';
import { formatItemCount, getRelativeTime } from '../../utils';
import { Icon, Stack } from '../ui';

export interface WatchlistCardProps {
    watchlist: Watchlist;
    onEdit?: () => void;
    onDelete?: () => void;
    onShare?: () => void;
    onExport?: () => void;
    onClick?: () => void;
}

export function WatchlistCard({
    watchlist,
    onEdit,
    onDelete,
    onShare,
    onExport,
    onClick,
}: WatchlistCardProps) {
    const [imageErrors, setImageErrors] = useState<Set<number>>(new Set());

    const handleImageError = (itemId: number) => {
        setImageErrors((prev) => new Set(prev).add(itemId));
    };

    // Show first 8 items as preview
    const previewItems = watchlist.items.slice(0, 8);
    const hasMoreItems = watchlist.items.length > 8;

    return (
        <div
            className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-500 transition-all cursor-pointer"
            onClick={onClick}
        >
            {/* Header */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <Stack direction="row" align="start" justify="between">
                    <Stack direction="row" align="center" gap={2} className="flex-1">
                        {watchlist.isDefault && (
                            <Icon as={Star} size="sm" color="warning" className="fill-yellow-500" />
                        )}
                        <h3 className="font-semibold text-gray-900 dark:text-gray-100 truncate">
                            {watchlist.name}
                        </h3>
                    </Stack>

                    {/* Actions menu */}
                    <Menu as="div" className="relative">
                        <Menu.Button
                            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <Icon as={MoreVertical} size="sm" color="muted" />
                        </Menu.Button>

                        <Menu.Items className="absolute right-0 mt-1 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-10">
                            <div className="py-1">
                                {onEdit && !watchlist.isDefault && (
                                    <Menu.Item>
                                        {({ active }) => (
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onEdit();
                                                }}
                                                className={`${active ? 'bg-gray-100 dark:bg-gray-700' : ''
                                                    } flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300`}
                                            >
                                                <Icon as={Edit2} size="sm" />
                                                Edit
                                            </button>
                                        )}
                                    </Menu.Item>
                                )}

                                {onShare && (
                                    <Menu.Item>
                                        {({ active }) => (
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onShare();
                                                }}
                                                className={`${active ? 'bg-gray-100 dark:bg-gray-700' : ''
                                                    } flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300`}
                                            >
                                                <Share2 className="w-4 h-4" />
                                                Share
                                            </button>
                                        )}
                                    </Menu.Item>
                                )}

                                {onExport && (
                                    <Menu.Item>
                                        {({ active }) => (
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onExport();
                                                }}
                                                className={`${active ? 'bg-gray-100 dark:bg-gray-700' : ''
                                                    } flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300`}
                                            >
                                                <Download className="w-4 h-4" />
                                                Export
                                            </button>
                                        )}
                                    </Menu.Item>
                                )}

                                {onDelete && !watchlist.isDefault && (
                                    <>
                                        <div className="my-1 border-t border-gray-200 dark:border-gray-700" />
                                        <Menu.Item>
                                            {({ active }) => (
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        onDelete();
                                                    }}
                                                    className={`${active ? 'bg-red-50 dark:bg-red-900/20' : ''
                                                        } flex items-center gap-2 w-full px-4 py-2 text-sm text-red-600 dark:text-red-400`}
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                    Delete
                                                </button>
                                            )}
                                        </Menu.Item>
                                    </>
                                )}
                            </div>
                        </Menu.Items>
                    </Menu>
                </Stack>

                {/* Stats */}
                <div className="mt-2 flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                    <span>{formatItemCount(watchlist.items.length)}</span>
                    <span>•</span>
                    <span>{getRelativeTime(watchlist.updatedAt)}</span>
                </div>
            </div>

            {/* Item preview grid */}
            <div className="p-4">
                {watchlist.items.length === 0 ? (
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400 text-sm">
                        No items in this watchlist
                    </div>
                ) : (
                    <div className="grid grid-cols-4 gap-2">
                        {previewItems.map((item) => (
                            <div
                                key={item.itemId}
                                className="aspect-square bg-gray-100 dark:bg-gray-700 rounded border border-gray-200 dark:border-gray-600 overflow-hidden"
                                title={item.name}
                            >
                                {!imageErrors.has(item.itemId) ? (
                                    <img
                                        src={item.iconUrl}
                                        alt={item.name}
                                        className="w-full h-full object-contain"
                                        onError={() => handleImageError(item.itemId)}
                                        loading="lazy"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-xs text-gray-400">
                                        ?
                                    </div>
                                )}
                            </div>
                        ))}

                        {/* Show "more" indicator if there are more items */}
                        {hasMoreItems && (
                            <div className="aspect-square bg-gray-100 dark:bg-gray-700 rounded border border-gray-200 dark:border-gray-600 flex items-center justify-center">
                                <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                                    +{watchlist.items.length - 8}
                                </span>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
