/**
 * WatchlistCard - Card component for displaying a watchlist in the manager grid
 */

import { Download, Edit2, Share2, Star, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import type { Watchlist } from '@/types/watchlist';
import { formatItemCount, getRelativeTime } from '@/utils';
import { ActionMenu, Icon, Stack } from '@/components/ui';
import type { ActionMenuItem } from '@/components/ui/ActionMenu/ActionMenu';

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

    // Build action menu items based on available handlers and watchlist properties
    const menuItems: ActionMenuItem[] = useMemo(() => {
        const items: ActionMenuItem[] = [];

        // Edit (only for non-default watchlists)
        if (onEdit && !watchlist.isDefault) {
            items.push({
                key: 'edit',
                label: 'Edit',
                icon: Edit2,
                onClick: onEdit,
            });
        }

        // Share
        if (onShare) {
            items.push({
                key: 'share',
                label: 'Share',
                icon: Share2,
                onClick: onShare,
            });
        }

        // Export
        if (onExport) {
            items.push({
                key: 'export',
                label: 'Export',
                icon: Download,
                onClick: onExport,
            });
        }

        // Delete (only for non-default watchlists, with divider)
        if (onDelete && !watchlist.isDefault) {
            items.push({
                key: 'delete',
                label: 'Delete',
                icon: Trash2,
                onClick: onDelete,
                variant: 'destructive',
                dividerBefore: true,
            });
        }

        return items;
    }, [onEdit, onShare, onExport, onDelete, watchlist.isDefault]);

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
                    <ActionMenu items={menuItems} stopPropagation />
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
