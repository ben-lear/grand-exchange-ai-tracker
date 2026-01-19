/**
 * EditWatchlistModal - Modal for renaming a watchlist
 */

import { Button, Icon, Input, Stack, Text } from '@/components/ui';
import { WatchlistSchema } from '@/schemas/watchlist';
import { useWatchlistStore } from '@/stores/useWatchlistStore';
import { X } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { Watchlist } from '../../types/watchlist';

export interface EditWatchlistModalProps {
    isOpen: boolean;
    onClose: () => void;
    watchlist: Watchlist;
}

export function EditWatchlistModal({
    isOpen,
    onClose,
    watchlist,
}: EditWatchlistModalProps) {
    const { renameWatchlist } = useWatchlistStore();
    const [name, setName] = useState(watchlist.name);
    const [error, setError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Reset form when modal opens
    useEffect(() => {
        if (isOpen) {
            setName(watchlist.name);
            setError(null);
        }
    }, [isOpen, watchlist.name]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsSubmitting(true);

        const trimmedName = name.trim();

        // Validate name length
        if (trimmedName.length < 1) {
            setError('Name cannot be empty');
            setIsSubmitting(false);
            return;
        }

        if (trimmedName.length > 50) {
            setError('Name must be 50 characters or less');
            setIsSubmitting(false);
            return;
        }

        // Validate with Zod schema
        const result = WatchlistSchema.shape.name.safeParse(trimmedName);
        if (!result.success) {
            setError(result.error.errors[0]?.message || 'Invalid name');
            setIsSubmitting(false);
            return;
        }

        // Check if name is unchanged
        if (trimmedName === watchlist.name) {
            setIsSubmitting(false);
            onClose();
            return;
        }

        // Rename watchlist
        const success = renameWatchlist(watchlist.id, trimmedName);

        setIsSubmitting(false);

        if (success) {
            onClose();
        } else {
            setError('Failed to rename watchlist. Name may already exist or watchlist is default.');
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Escape') {
            onClose();
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
                    <Text as="h2" variant="heading" size="xl">
                        Rename Watchlist
                    </Text>
                    <button
                        onClick={onClose}
                        className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                        aria-label="Close"
                    >
                        <Icon as={X} size="md" color="muted" />
                    </button>
                </Stack>

                {/* Form */}
                <form onSubmit={handleSubmit}>
                    <Stack direction="col" gap={4} className="p-6">
                        <Stack direction="col" gap={2}>
                            <Text
                                as="label"
                                htmlFor="watchlist-name"
                                variant="body"
                                size="sm"
                                weight="medium"
                            >
                                Watchlist Name
                            </Text>
                            <Input
                                id="watchlist-name"
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Enter watchlist name"
                                maxLength={50}
                                autoFocus
                                disabled={isSubmitting}
                            />
                        </Stack>
                        {error && (
                            <Text variant="error" size="sm">
                                {error}
                            </Text>
                        )}
                        <Text variant="muted" size="xs">
                            {name.length}/50 characters
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
                            disabled={isSubmitting}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            variant="primary"
                            size="default"
                            disabled={isSubmitting || !name.trim()}
                        >
                            {isSubmitting ? 'Saving...' : 'Save'}
                        </Button>
                    </Stack>
                </form>
            </div>
        </div>
    );
}
