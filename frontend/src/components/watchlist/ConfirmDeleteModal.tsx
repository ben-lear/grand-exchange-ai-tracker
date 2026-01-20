/**
 * ConfirmDeleteModal - Confirmation dialog before deleting a watchlist
 */

import { Button, Icon, Stack, Text } from '@/components/ui';
import { AlertTriangle, X } from 'lucide-react';
import React from 'react';
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

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Escape') {
            onClose();
        } else if (e.key === 'Enter') {
            handleConfirm();
        }
    };

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
            onClick={onClose}
        >
            <div
                className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md mx-4"
                onClick={(e) => e.stopPropagation()}
                onKeyDown={handleKeyDown}
            >
                {/* Header */}
                <Stack
                    direction="row"
                    align="center"
                    justify="between"
                    className="p-6 border-b border-gray-200 dark:border-gray-700"
                >
                    <Stack direction="row" align="center" gap={3}>
                        <div className="p-2 bg-red-100 dark:bg-red-900/20 rounded-full">
                            <Icon as={AlertTriangle} size="md" color="error" />
                        </div>
                        <Text as="h2" variant="heading" size="xl">
                            Delete Watchlist
                        </Text>
                    </Stack>
                    <button
                        onClick={onClose}
                        className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                        aria-label="Close"
                    >
                        <Icon as={X} size="md" color="muted" />
                    </button>
                </Stack>

                {/* Content */}
                <Stack direction="col" gap={2} className="p-6">
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

                {/* Footer */}
                <Stack
                    direction="row"
                    align="center"
                    justify="end"
                    gap={3}
                    className="p-6 border-t border-gray-200 dark:border-gray-700"
                >
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
            </div>
        </div>
    );
}
