/**
 * ConfirmDeleteModal - Confirmation dialog before deleting a watchlist
 */

import { Button, Stack, StandardModal, Text } from '@/components/ui';
import { AlertTriangle } from 'lucide-react';
import type { Watchlist } from '../../types/watchlist';

export interface ConfirmDeleteModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    watchlist: Watchlist;
}

export function ConfirmDeleteModal({
    isOpen,
    onClose,
    onConfirm,
    watchlist,
}: ConfirmDeleteModalProps) {
    const handleConfirm = () => {
        onConfirm();
        onClose();
    };

    return (
        <StandardModal
            isOpen={isOpen}
            onClose={onClose}
            title="Delete Watchlist"
            icon={AlertTriangle}
            iconColor="error"
            footer={
                <Stack direction="row" align="center" justify="end" gap={3}>
                    <Button
                        type="button"
                        variant="secondary"
                        size="default"
                        onClick={onClose}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="button"
                        variant="destructive"
                        size="default"
                        onClick={handleConfirm}
                    >
                        Delete Watchlist
                    </Button>
                </Stack>
            }
        >
            <Stack direction="col" gap={2}>
                <Text variant="body">
                    Are you sure you want to delete{' '}
                    <Text as="span" weight="semibold">
                        "{watchlist.name}"
                    </Text>
                    ?
                </Text>
                <Text variant="muted" size="sm">
                    This watchlist contains {watchlist.items.length} item
                    {watchlist.items.length !== 1 ? 's' : ''}. This action cannot be undone.
                </Text>
            </Stack>
        </StandardModal>
    );
}
