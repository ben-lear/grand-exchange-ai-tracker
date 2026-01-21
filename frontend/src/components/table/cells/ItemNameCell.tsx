/**
 * Item Name Cell Component
 * Renders item icon, name, and ID with link
 */

import { Link } from '@/components/ui';
import type { Item } from '@/types';
import { getItemUrl } from '@/utils';

interface ItemNameCellProps {
    item: Item;
}

export function ItemNameCell({ item }: ItemNameCellProps) {
    const itemUrl = getItemUrl(item.itemId, item.name);

    return (
        <div className="flex items-center gap-3 min-w-[200px]">
            {item.iconUrl && (
                <img
                    src={item.iconUrl}
                    alt={item.name}
                    className="w-8 h-8 flex-shrink-0"
                    loading="lazy"
                />
            )}
            <div className="flex items-center gap-2">
                <Link
                    to={itemUrl}
                    variant="primary"
                    className="font-medium"
                >
                    {item.name}
                </Link>
                <span className="text-xs text-gray-400 dark:text-gray-500">
                    #{item.itemId}
                </span>
            </div>
        </div>
    );
}
