/**
 * Search result item component for the dropdown
 * Displays item icon, name, members badge, and prices
 */

import { Stack, Text } from '@/components/ui';
import type { CurrentPrice, Item } from '@/types';
import { formatCompact } from '@/utils';

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
            <Stack direction="row" align="center" gap={2} className="min-w-0">
                {item.iconUrl && (
                    <img
                        src={item.iconUrl}
                        alt=""
                        className="w-6 h-6 object-contain flex-shrink-0"
                        loading="lazy"
                    />
                )}
                <Text className="truncate">
                    {item.name}
                </Text>
                {item.members && (
                    <span className="px-1.5 py-0.5 text-xs bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-400 rounded flex-shrink-0">
                        P2P
                    </span>
                )}
            </Stack>
            {hasPrice && (
                <Stack direction="row" align="center" gap={3} className="text-sm flex-shrink-0">
                    {price.highPrice && (
                        <Text variant="success">
                            {formatCompact(price.highPrice)}
                        </Text>
                    )}
                    {price.lowPrice && (
                        <Text variant="error">
                            {formatCompact(price.lowPrice)}
                        </Text>
                    )}
                </Stack>
            )}
        </>
    );
}
