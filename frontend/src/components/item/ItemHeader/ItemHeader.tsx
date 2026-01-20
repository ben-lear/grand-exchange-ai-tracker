/**
 * ItemHeader - Displays item icon, name, badges, and description
 * Used in ItemDetailPage to show the main item information header
 */

import { ItemIcon } from '@/components/common';
import type { Item } from '@/types';
import React from 'react';

export interface ItemHeaderProps {
    /** The item to display */
    item: Item;
    /** Optional className for custom styling */
    className?: string;
}

/**
 * ItemHeader component
 * Displays item icon, name, membership badge, ID, and description
 */
export const ItemHeader: React.FC<ItemHeaderProps> = ({ item, className = '' }) => {
    return (
        <div className={`rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 ${className}`}>
            <div className="flex items-start gap-6">
                {/* Item Icon */}
                <div className="flex-shrink-0">
                    <ItemIcon
                        src={item.iconUrl || ''}
                        alt={item.name}
                        size="xl"
                        className="border-2 border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 p-2"
                    />
                </div>

                {/* Item Info */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                            <div className="flex items-center gap-3 flex-wrap">
                                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                                    {item.name}
                                </h1>
                                {item.members && (
                                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200">
                                        Members
                                    </span>
                                )}
                            </div>
                            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                                Item ID: <span className="font-mono font-semibold">{item.itemId}</span>
                            </p>
                            {item.description && (
                                <p className="mt-3 text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                                    {item.description}
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
