/**
 * ItemMetadata - Displays item metadata like buy limit, membership, and alchemy values
 * Used in ItemDetailPage to show additional item information
 */

import type { Item } from '@/types';
import { formatGold } from '@/utils';
import React from 'react';

export interface ItemMetadataProps {
    /** The item whose metadata to display */
    item: Item;
    /** Optional className for custom styling */
    className?: string;
}

/**
 * ItemMetadata component
 * Displays buy limit, membership status, high/low alchemy values in a responsive grid
 */
export const ItemMetadata: React.FC<ItemMetadataProps> = ({ item, className = '' }) => {
    return (
        <div className={`rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 ${className}`}>
            <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">
                Item Metadata
            </h2>
            <dl className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Buy Limit */}
                <div>
                    <dt className="text-sm font-medium text-gray-600 dark:text-gray-400">
                        Buy Limit
                    </dt>
                    <dd className="mt-1 text-lg font-semibold text-gray-900 dark:text-white">
                        {item.buyLimit > 0 ? (
                            <>
                                {item.buyLimit.toLocaleString()}
                                <span className="text-sm font-normal text-gray-500 ml-1">/ 4h</span>
                            </>
                        ) : (
                            <span className="text-gray-400">Unknown</span>
                        )}
                    </dd>
                </div>

                {/* Membership */}
                <div>
                    <dt className="text-sm font-medium text-gray-600 dark:text-gray-400">
                        Membership
                    </dt>
                    <dd className="mt-1 text-lg font-semibold text-gray-900 dark:text-white">
                        {item.members ? 'Members Only' : 'Free-to-Play'}
                    </dd>
                </div>

                {/* High Alchemy */}
                <div>
                    <dt className="text-sm font-medium text-gray-600 dark:text-gray-400">
                        High Alchemy
                    </dt>
                    <dd className="mt-1 text-lg font-semibold text-gray-900 dark:text-white">
                        {item.highAlch > 0 ? (
                            formatGold(item.highAlch)
                        ) : (
                            <span className="text-gray-400">—</span>
                        )}
                    </dd>
                </div>

                {/* Low Alchemy */}
                <div>
                    <dt className="text-sm font-medium text-gray-600 dark:text-gray-400">
                        Low Alchemy
                    </dt>
                    <dd className="mt-1 text-lg font-semibold text-gray-900 dark:text-white">
                        {item.lowAlch > 0 ? (
                            formatGold(item.lowAlch)
                        ) : (
                            <span className="text-gray-400">—</span>
                        )}
                    </dd>
                </div>
            </dl>
        </div>
    );
};
