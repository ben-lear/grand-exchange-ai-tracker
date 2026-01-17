/**
 * Search result item component for the dropdown
 * Displays item icon, name, members badge, and prices
 */

import type { CurrentPrice, Item } from '../../types';
import { formatCompact } from '../../utils';

export interface SearchResultItemProps {
    /** The item to display */
    item: Item;
    /** Optional current price data */
    price?: CurrentPrice;
}

/**
 * Renders an item result with icon, name, and prices
 *
 * @example
 * ```tsx
 * <DropdownItem ...>
 *   <SearchResultItem item={item} price={price} />
 * </DropdownItem>
 * ```
 */
export function SearchResultItem({ item, price }: SearchResultItemProps) {
    const hasPrice = price && (price.highPrice || price.lowPrice);

    return (
        <>
            <div className="flex items-center gap-2 min-w-0">
                {item.iconUrl && (
                    <img
                        src={item.iconUrl}
                        alt=""
                        className="w-6 h-6 object-contain flex-shrink-0"
                        loading="lazy"
                    />
                )}
                <span className="text-gray-900 dark:text-white truncate">
                    {item.name}
                </span>
                {item.members && (
                    <span className="px-1.5 py-0.5 text-xs bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-400 rounded flex-shrink-0">
                        P2P
                    </span>
                )}
            </div>
            {hasPrice && (
                <div className="flex items-center gap-3 text-sm flex-shrink-0">
                    {price.highPrice && (
                        <span className="text-green-600 dark:text-green-400">
                            {formatCompact(price.highPrice)}
                        </span>
                    )}
                    {price.lowPrice && (
                        <span className="text-red-600 dark:text-red-400">
                            {formatCompact(price.lowPrice)}
                        </span>
                    )}
                </div>
            )}
        </>
    );
}
