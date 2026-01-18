/**
 * ShareWatchlistModal - Modal for sharing watchlists via shareable links
 */

import { Dialog, Transition } from '@headlessui/react';
import { AlertCircle, Check, Clock, Copy, ExternalLink, Share2, X } from 'lucide-react';
import { Fragment, useState } from 'react';
import { createWatchlistShare } from '../../api/watchlist';
import type { Watchlist, WatchlistShare } from '../../types/watchlist';

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
        <Transition appear show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={handleClose}>
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-black bg-opacity-25 dark:bg-opacity-50" />
                </Transition.Child>

                <div className="fixed inset-0 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4">
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0 scale-95"
                            enterTo="opacity-100 scale-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100 scale-100"
                            leaveTo="opacity-0 scale-95"
                        >
                            <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-lg bg-white dark:bg-gray-800 p-6 shadow-xl transition-all">
                                {/* Header */}
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                                            <Share2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                                        </div>
                                        <Dialog.Title className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                                            Share Watchlist
                                        </Dialog.Title>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={handleClose}
                                        className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>

                                {/* Watchlist Info */}
                                <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                                    <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-1">
                                        {watchlist.name}
                                    </h3>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                        {watchlist.items.length} item{watchlist.items.length !== 1 ? 's' : ''}
                                    </p>
                                </div>

                                {/* Create Share or Show Link */}
                                {!share ? (
                                    <div className="space-y-4">
                                        <p className="text-sm text-gray-600 dark:text-gray-400">
                                            Create a shareable link that anyone can use to view and import this watchlist.
                                            The link will expire after 7 days.
                                        </p>

                                        {error && (
                                            <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-300 rounded-lg flex items-start gap-2">
                                                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                                                <span className="text-sm">{error}</span>
                                            </div>
                                        )}

                                        <button
                                            type="button"
                                            onClick={handleCreateShare}
                                            disabled={loading}
                                            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {loading ? 'Creating Link...' : 'Create Share Link'}
                                        </button>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {/* Success Message */}
                                        <div className="p-3 bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-300 rounded-lg flex items-start gap-2">
                                            <Check className="w-5 h-5 flex-shrink-0 mt-0.5" />
                                            <span className="text-sm">Share link created successfully!</span>
                                        </div>

                                        {/* Share Token */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                Share Token
                                            </label>
                                            <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-700">
                                                <code className="flex-1 text-sm font-mono text-gray-900 dark:text-gray-100">
                                                    {share.token}
                                                </code>
                                                <button
                                                    type="button"
                                                    onClick={handleCopyToken}
                                                    className="p-1 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                                                    title="Copy token"
                                                >
                                                    <Copy className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>

                                        {/* Share URL */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                Share Link
                                            </label>
                                            <div className="flex items-center gap-2">
                                                <input
                                                    type="text"
                                                    readOnly
                                                    value={getShareUrl()}
                                                    className="flex-1 px-3 py-2 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-gray-100 font-mono"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={handleCopyLink}
                                                    className={`
                                                        px-3 py-2 rounded-lg flex items-center gap-2 transition-colors
                                                        ${copied
                                                            ? 'bg-green-600 text-white'
                                                            : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                                                        }
                                                    `}
                                                    title="Copy link"
                                                >
                                                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                                </button>
                                            </div>
                                        </div>

                                        {/* Expiration Info */}
                                        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                                            <Clock className="w-4 h-4" />
                                            <span>Expires in {getExpirationText()}</span>
                                        </div>

                                        {/* Actions */}
                                        <div className="flex gap-3 pt-2">
                                            <button
                                                type="button"
                                                onClick={handleOpenLink}
                                                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center justify-center gap-2"
                                            >
                                                <ExternalLink className="w-4 h-4" />
                                                <span>Open Link</span>
                                            </button>
                                            <button
                                                type="button"
                                                onClick={handleClose}
                                                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                                            >
                                                Done
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
}
