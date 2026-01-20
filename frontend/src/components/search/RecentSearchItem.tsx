/**
 * Recent search item component for the dropdown
 * Displays recent item with clock icon and remove button
 */

import { Clock, X } from 'lucide-react';
import type { RecentItem } from '../../hooks';
import { Icon, Stack, Text } from '../ui';

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
            <Stack direction="row" align="center" gap={2} className="min-w-0">
                <Icon as={Clock} size="sm" color="muted" />
                <Text className="truncate">
                    {item.name}
                </Text>
            </Stack>
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
                <Icon as={X} size="xs" />
            </button>
        </>
    );
}
