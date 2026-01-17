/**
 * Recent search item component for the dropdown
 * Displays recent item with clock icon and remove button
 */

import { Clock, X } from 'lucide-react';
import type { RecentItem } from '../../hooks/useRecentSearches';

export interface RecentSearchItemProps {
    /** The recent item to display */
    item: RecentItem;
    /** Called when remove button is clicked */
    onRemove: (itemId: number) => void;
}

/**
 * Renders a recent search entry with remove button
 *
 * @example
 * ```tsx
 * <DropdownItem ...>
 *   <RecentSearchItem item={recentItem} onRemove={handleRemove} />
 * </DropdownItem>
 * ```
 */
export function RecentSearchItem({ item, onRemove }: RecentSearchItemProps) {
    return (
        <>
            <div className="flex items-center gap-2 min-w-0">
                <Clock className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <span className="text-gray-900 dark:text-white truncate">
                    {item.name}
                </span>
            </div>
            <button
                type="button"
                onClick={(e) => {
                    e.stopPropagation();
                    onRemove(item.itemId);
                }}
                className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-white flex-shrink-0 rounded-sm"
                aria-label={`Remove ${item.name} from recent`}
                tabIndex={-1}
            >
                <X className="w-3 h-3" />
            </button>
        </>
    );
}
