/**
 * CreateWatchlistModal - Modal for creating a new watchlist
 */

import { FormField } from '@/components/forms';
import { Button, Input, Stack, StandardModal } from '@/components/ui';
import { useWatchlistStore } from '@/stores';
import { WATCHLIST_LIMITS } from '@/types/watchlist';
import { isValidWatchlistName } from '@/utils';
import { FolderPlus } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

export interface CreateWatchlistModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: (watchlistId: string) => void;
}

export function CreateWatchlistModal({
    isOpen,
    onClose,
    onSuccess,
}: CreateWatchlistModalProps) {
    const [name, setName] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const createWatchlist = useWatchlistStore((state) => state.createWatchlist);
    const getAllWatchlists = useWatchlistStore((state) => state.getAllWatchlists);
    const watchlists = getAllWatchlists();
    const existingNames = watchlists.map((w) => w.name);

    const handleSubmit = async () => {
        if (isSubmitting) return;

        const validation = isValidWatchlistName(name, existingNames);
        if (!validation.valid) {
            toast.error(validation.error);
            return;
        }

        setIsSubmitting(true);

        try {
            const watchlistId = createWatchlist(name);

            if (!watchlistId) {
                toast.error('Failed to create watchlist. You may have reached the limit.');
                return;
            }

            toast.success(`Watchlist "${name}" created successfully`);
            onSuccess?.(watchlistId);
            handleClose();
        } catch (error) {
            console.error('Error creating watchlist:', error);
            toast.error('An error occurred while creating the watchlist');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleClose = () => {
        if (!isSubmitting) {
            setName('');
            onClose();
        }
    };

    const watchlistCount = watchlists.length;
    const isAtLimit = watchlistCount >= WATCHLIST_LIMITS.MAX_WATCHLISTS;

    return (
        <StandardModal
            isOpen={isOpen}
            onClose={handleClose}
            title="Create New Watchlist"
            icon={FolderPlus}
            iconColor="primary"
            closeDisabled={isSubmitting}
            footer={
                !isAtLimit && (
                    <Stack direction="row" gap={3} justify="end">
                        <Button
                            variant="secondary"
                            onClick={handleClose}
                            disabled={isSubmitting}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="primary"
                            onClick={handleSubmit}
                            disabled={isSubmitting || !name.trim()}
                        >
                            {isSubmitting ? 'Creating...' : 'Create Watchlist'}
                        </Button>
                    </Stack>
                )
            }
        >
            {isAtLimit ? (
                <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                    <p className="text-sm text-yellow-800 dark:text-yellow-200">
                        You've reached the maximum of {WATCHLIST_LIMITS.MAX_WATCHLISTS} watchlists.
                        Delete a watchlist to create a new one.
                    </p>
                </div>
            ) : (
                <Stack direction="col" gap={4}>
                    <FormField
                        label="Watchlist Name"
                        htmlFor="watchlist-name"
                        required
                        hint={`${name.length}/${WATCHLIST_LIMITS.MAX_NAME_LENGTH} characters`}
                    >
                        <Input
                            id="watchlist-name"
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Enter watchlist name..."
                            maxLength={WATCHLIST_LIMITS.MAX_NAME_LENGTH}
                            disabled={isSubmitting}
                            autoFocus
                        />
                    </FormField>

                    <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        <p className="text-sm text-gray-700 dark:text-gray-300">
                            <span className="font-medium">Tip:</span> You can add up to{' '}
                            {WATCHLIST_LIMITS.MAX_ITEMS_PER_WATCHLIST} items per watchlist.
                        </p>
                    </div>

                    <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                            Watchlists: {watchlistCount} / {WATCHLIST_LIMITS.MAX_WATCHLISTS}
                        </p>
                    </div>
                </Stack>
            )}
        </StandardModal>
    );
}
