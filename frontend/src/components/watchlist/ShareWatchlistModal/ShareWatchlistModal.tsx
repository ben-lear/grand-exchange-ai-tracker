/**
 * ShareWatchlistModal - Modal for sharing watchlists via shareable links
 */

import { AlertCircle, Check, Clock, Copy, Share2 } from 'lucide-react';
import { useState } from 'react';
import { createWatchlistShare } from '@/api/watchlist';
import type { Watchlist, WatchlistShare } from '@/types/watchlist';
import { Button, IconButton, Input, Stack, StandardModal, Text } from '@/components/ui';

export interface ShareWatchlistModalProps {
    isOpen: boolean;
    onClose: () => void;
    watchlist: Watchlist;
}

export function ShareWatchlistModal({ isOpen, onClose, watchlist }: ShareWatchlistModalProps) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [share, setShare] = useState<WatchlistShare | null>(null);
    const [copied, setCopied] = useState(false);

    const handleClose = () => {
        setShare(null);
        setError(null);
        setCopied(false);
        onClose();
    };

    const handleCreateShare = async () => {
        setLoading(true);
        setError(null);

        try {
            const shareData = await createWatchlistShare(watchlist);
            setShare(shareData);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to create share link');
        } finally {
            setLoading(false);
        }
    };

    const getShareUrl = () => {
        if (!share) return '';
        const baseUrl = window.location.origin;
        return `${baseUrl}/watchlist/share/${share.token}`;
    };

    const handleCopyToken = async () => {
        if (!share) return;

        try {
            await navigator.clipboard.writeText(share.token);
        } catch (err) {
            console.error('Failed to copy token:', err);
        }
    };

    const handleCopyLink = async () => {
        try {
            await navigator.clipboard.writeText(getShareUrl());
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    };

    const handleOpenLink = () => {
        window.open(getShareUrl(), '_blank');
    };

    const getExpirationText = () => {
        if (!share) return '';
        const now = Date.now();
        const expiresIn = share.expiresAt - now;
        const days = Math.ceil(expiresIn / (1000 * 60 * 60 * 24));
        return `${days} day${days !== 1 ? 's' : ''}`;
    };

    return (
        <StandardModal
            isOpen={isOpen}
            onClose={handleClose}
            title="Share Watchlist"
            icon={Share2}
            iconColor="primary"
            footer={
                share ? (
                    <Stack direction="row" gap={3}>
                        <Button
                            variant="secondary"
                            onClick={handleOpenLink}
                        >
                            Open Link
                        </Button>
                        <Button
                            variant="primary"
                            onClick={handleClose}
                        >
                            Done
                        </Button>
                    </Stack>
                ) : undefined
            }
        >
            <Stack direction="col" gap={4}>
                {/* Watchlist Info */}
                <div className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                    <Text weight="medium" className="text-gray-900 dark:text-gray-100 mb-1">
                        {watchlist.name}
                    </Text>
                    <Text variant="muted" size="sm">
                        {watchlist.items.length} item{watchlist.items.length !== 1 ? 's' : ''}
                    </Text>
                </div>

                {/* Create Share or Show Link */}
                {!share ? (
                    <Stack direction="col" gap={4}>
                        <Text variant="muted" size="sm">
                            Create a shareable link that anyone can use to view and import this watchlist.
                            The link will expire after 7 days.
                        </Text>

                        {error && (
                            <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-300 rounded-lg flex items-start gap-2">
                                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                                <Text size="sm">{error}</Text>
                            </div>
                        )}

                        <Button
                            variant="primary"
                            onClick={handleCreateShare}
                            disabled={loading}
                            className="w-full"
                        >
                            {loading ? 'Creating Link...' : 'Create Share Link'}
                        </Button>
                    </Stack>
                ) : (
                    <Stack direction="col" gap={4}>
                        {/* Success Message */}
                        <div className="p-3 bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-300 rounded-lg flex items-start gap-2">
                            <Check className="w-5 h-5 flex-shrink-0 mt-0.5" />
                            <Text size="sm">Share link created successfully!</Text>
                        </div>

                        {/* Share Token */}
                        <div>
                            <Text as="label" weight="medium" size="sm" className="block mb-2">
                                Share Token
                            </Text>
                            <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-700">
                                <code className="flex-1 text-sm font-mono text-gray-900 dark:text-gray-100">
                                    {share.token}
                                </code>
                                <IconButton
                                    icon={Copy}
                                    onClick={handleCopyToken}
                                    variant="ghost"
                                    size="sm"
                                    aria-label="Copy token"
                                />
                            </div>
                        </div>

                        {/* Share URL */}
                        <div>
                            <Text as="label" weight="medium" size="sm" className="block mb-2">
                                Share Link
                            </Text>
                            <Stack direction="row" gap={2}>
                                <Input
                                    type="text"
                                    readOnly
                                    value={getShareUrl()}
                                    className="flex-1 font-mono"
                                />
                                <Button
                                    variant={copied ? 'primary' : 'secondary'}
                                    onClick={handleCopyLink}
                                    className="shrink-0"
                                >
                                    {copied ? 'Copied' : 'Copy'}
                                </Button>
                            </Stack>
                        </div>

                        {/* Expiration Info */}
                        <Stack direction="row" align="center" gap={2}>
                            <Clock className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                            <Text variant="muted" size="sm">
                                Expires in {getExpirationText()}
                            </Text>
                        </Stack>
                    </Stack>
                )}
            </Stack>
        </StandardModal>
    );
}
