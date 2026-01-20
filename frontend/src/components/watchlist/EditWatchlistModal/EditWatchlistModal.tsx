/**
 * EditWatchlistModal - Modal for renaming a watchlist
 */

import { FormField } from '@/components/forms';
import { Button, Input, Stack, StandardModal } from '@/components/ui';
import { WatchlistSchema } from '@/schemas/watchlist';
import { useWatchlistStore } from '@/stores';
import type { Watchlist } from '@/types/watchlist';
import { Edit2 } from 'lucide-react';
import { useEffect, useState } from 'react';

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

    const handleSubmit = () => {
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

    return (
        <StandardModal
            isOpen={isOpen}
            onClose={onClose}
            title="Rename Watchlist"
            icon={Edit2}
            iconColor="primary"
            closeDisabled={isSubmitting}
            footer={
                <Stack direction="row" align="center" justify="end" gap={3}>
                    <Button
                        variant="secondary"
                        size="default"
                        onClick={onClose}
                        disabled={isSubmitting}
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="primary"
                        size="default"
                        onClick={handleSubmit}
                        disabled={isSubmitting || !name.trim()}
                    >
                        {isSubmitting ? 'Saving...' : 'Save'}
                    </Button>
                </Stack>
            }
        >
            <Stack direction="col" gap={4}>
                <FormField
                    label="Watchlist Name"
                    htmlFor="watchlist-name"
                    required
                    error={error || undefined}
                    hint={`${name.length}/50 characters`}
                >
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
                </FormField>
            </Stack>
        </StandardModal>
    );
}
