/**
 * Pin Cell Component
 * Renders a pin toggle button for table rows
 */

import { usePinnedItemsStore } from '@/stores';
import { Pin } from 'lucide-react';

interface PinCellProps {
    itemId: number;
}

export function PinCell({ itemId }: PinCellProps) {
    const { togglePin, isPinned } = usePinnedItemsStore();
    const pinned = isPinned(itemId);

    return (
        <button
            onClick={() => togglePin(itemId)}
            className="rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors block mx-auto"
            title={pinned ? 'Unpin item' : 'Pin item to top'}
            aria-label={pinned ? 'Unpin item' : 'Pin item to top'}
        >
            <Pin
                className={`w-4 h-4 ${pinned
                        ? 'fill-blue-600 text-blue-600 dark:fill-blue-400 dark:text-blue-400'
                        : 'text-gray-400 dark:text-gray-500'
                    }`}
            />
        </button>
    );
}
