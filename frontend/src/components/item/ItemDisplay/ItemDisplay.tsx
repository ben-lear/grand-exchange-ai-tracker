/**
 * ItemDisplay - Reusable component for displaying item icon + name
 * Used across the application for consistent item representation
 */

import { ItemIcon } from '@/components/common';
import { Link } from '@/components/ui';
import type { Item } from '@/types';
import { getItemUrl } from '@/utils';
import React from 'react';

export interface ItemDisplayProps {
    /** The item to display */
    item: Item;
    /** Size variant */
    size?: 'xs' | 'sm' | 'md' | 'lg';
    /** Show item ID below name */
    showId?: boolean;
    /** Make the display a clickable link */
    showLink?: boolean;
    /** Show membership badge */
    showBadges?: boolean;
    /** Optional className for custom styling */
    className?: string;
}

/**
 * ItemDisplay component
 * Flexible component for displaying item icon and name in various contexts
 */
export const ItemDisplay: React.FC<ItemDisplayProps> = ({
    item,
    size = 'md',
    showId = false,
    showLink = false,
    showBadges = false,
    className = '',
}) => {
    const sizeClasses = {
        xs: {
            icon: 'xs' as const,
            name: 'text-xs',
            id: 'text-[10px]',
            gap: 'gap-1.5',
        },
        sm: {
            icon: 'sm' as const,
            name: 'text-sm',
            id: 'text-xs',
            gap: 'gap-2',
        },
        md: {
            icon: 'md' as const,
            name: 'text-base',
            id: 'text-sm',
            gap: 'gap-3',
        },
        lg: {
            icon: 'lg' as const,
            name: 'text-lg',
            id: 'text-base',
            gap: 'gap-4',
        },
    };

    const sizes = sizeClasses[size];

    const content = (
        <div className={`flex items-center ${sizes.gap} ${className}`}>
            <ItemIcon
                src={item.iconUrl || ''}
                alt={item.name}
                size={sizes.icon}
            />
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                    <span className={`font-medium text-gray-900 dark:text-white truncate ${sizes.name}`}>
                        {item.name}
                    </span>
                    {showBadges && item.members && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200">
                            Members
                        </span>
                    )}
                </div>
                {showId && (
                    <p className={`text-gray-600 dark:text-gray-400 font-mono ${sizes.id}`}>
                        ID: {item.itemId}
                    </p>
                )}
            </div>
        </div>
    );

    if (showLink) {
        return (
            <Link
                to={getItemUrl(item.itemId, item.name)}
                variant="primary"
                underline="none"
                className="hover:opacity-80 transition-opacity"
            >
                {content}
            </Link>
        );
    }

    return content;
};
