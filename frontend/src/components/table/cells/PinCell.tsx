/**
 * Pin Cell Component
 * Renders a pin toggle button for table rows
 */

import { ToggleButton } from '@/components/ui';
import { usePinnedItemsStore } from '@/stores';
import { Pin } from 'lucide-react';

interface PinCellProps {
    itemId: number;
}

export function PinCell({ itemId }: PinCellProps) {
    const { togglePin, isPinned } = usePinnedItemsStore();
    const pinned = isPinned(itemId);

    return (
        <ToggleButton
            icon={Pin}
            isActive={pinned}
            onToggle={() => togglePin(itemId)}
            activeColor="blue"
            size="sm"
            label={pinned ? 'Unpin item' : 'Pin item to top'}
            tooltip={pinned ? 'Unpin item' : 'Pin item to top'}
        />
    );
}
