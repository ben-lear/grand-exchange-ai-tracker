/**
 * ImportWatchlistModal - Modal for importing watchlists from JSON files
 */

import { Dialog, Transition } from '@headlessui/react';
import { AlertCircle, CheckCircle, Upload, X } from 'lucide-react';
import React, { Fragment, useState } from 'react';
import { useWatchlistStore } from '../../stores';
import type { WatchlistExport } from '../../types/watchlist';
import { validateWatchlistExport } from '../../utils';

export interface ImportWatchlistModalProps {
    isOpen: boolean;
    onClose: () => void;
}

interface ImportResult {
    success: boolean;
    imported: number;
    failed: number;
    errors: string[];
    warnings: string[];
}

export function ImportWatchlistModal({ isOpen, onClose }: ImportWatchlistModalProps) {
    const [dragActive, setDragActive] = useState(false);
    const [importing, setImporting] = useState(false);
    const [result, setResult] = useState<ImportResult | null>(null);
    const { importWatchlist, getWatchlistCount } = useWatchlistStore();

    const handleClose = () => {
        setResult(null);
        setImporting(false);
        onClose();
    };

    const processImport = async (file: File) => {
        setImporting(true);
        setResult(null);

        try {
            // Read file content
            const text = await file.text();
            let data: unknown;

            try {
                data = JSON.parse(text);
            } catch {
                setResult({
                    success: false,
                    imported: 0,
                    failed: 0,
                    errors: ['Invalid JSON file format'],
                    warnings: [],
                });
                setImporting(false);
                return;
            }

            // Validate export format
            const validation = validateWatchlistExport(data);

            if (!validation.valid || !validation.export) {
                setResult({
                    success: false,
                    imported: 0,
                    failed: 0,
                    errors: validation.errors,
                    warnings: validation.warnings,
                });
                setImporting(false);
                return;
            }

            // Import watchlists
            const exportData = validation.export as WatchlistExport;
            let importedCount = 0;
            let failedCount = 0;
            const errors: string[] = [];
            const warnings: string[] = validation.warnings;

            for (const watchlist of exportData.watchlists) {
                // Check if we've hit the limit
                if (getWatchlistCount() >= 10) {
                    warnings.push(`Skipped "${watchlist.name}" - Maximum of 10 watchlists reached`);
                    failedCount++;
                    continue;
                }

                const result = importWatchlist(watchlist);
                if (result) {
                    importedCount++;
                } else {
                    failedCount++;
                    errors.push(`Failed to import "${watchlist.name}" - Duplicate or invalid data`);
                }
            }

            setResult({
                success: importedCount > 0,
                imported: importedCount,
                failed: failedCount,
                errors,
                warnings,
            });
        } catch (error) {
            setResult({
                success: false,
                imported: 0,
                failed: 0,
                errors: [`Import failed: ${error instanceof Error ? error.message : 'Unknown error'}`],
                warnings: [],
            });
        } finally {
            setImporting(false);
        }
    };

    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            processImport(file);
        }
    };

    const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        setDragActive(false);

        const file = event.dataTransfer.files?.[0];
        if (file) {
            processImport(file);
        }
    };

    const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        setDragActive(true);
    };

    const handleDragLeave = () => {
        setDragActive(false);
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
                                    <Dialog.Title className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                                        Import Watchlists
                                    </Dialog.Title>
                                    <button
                                        type="button"
                                        onClick={handleClose}
                                        className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>

                                {/* Upload Area */}
                                {!result && (
                                    <div
                                        onDrop={handleDrop}
                                        onDragOver={handleDragOver}
                                        onDragLeave={handleDragLeave}
                                        className={`
                                            border-2 border-dashed rounded-lg p-8 text-center transition-colors
                                            ${dragActive
                                                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                                                : 'border-gray-300 dark:border-gray-600'
                                            }
                                            ${importing ? 'opacity-50 pointer-events-none' : ''}
                                        `}
                                    >
                                        <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                                        <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                                            Drag and drop your watchlist file here
                                        </p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
                                            or
                                        </p>
                                        <label className="inline-block">
                                            <input
                                                type="file"
                                                accept=".json"
                                                onChange={handleFileSelect}
                                                disabled={importing}
                                                className="hidden"
                                                aria-label="Choose file to import"
                                            />
                                            <span className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer inline-block">
                                                {importing ? 'Importing...' : 'Choose File'}
                                            </span>
                                        </label>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-4">
                                            Supports .json files exported from this app
                                        </p>
                                    </div>
                                )}

                                {/* Import Result */}
                                {result && (
                                    <div className="space-y-4">
                                        {/* Success Summary */}
                                        <div className={`
                                            p-4 rounded-lg flex items-start gap-3
                                            ${result.success
                                                ? 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-300'
                                                : 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-300'
                                            }
                                        `}>
                                            {result.success ? (
                                                <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                                            ) : (
                                                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                                            )}
                                            <div className="flex-1">
                                                <p className="font-medium mb-1">
                                                    {result.success
                                                        ? `Successfully imported ${result.imported} watchlist${result.imported !== 1 ? 's' : ''}`
                                                        : 'Import failed'
                                                    }
                                                </p>
                                                {result.failed > 0 && (
                                                    <p className="text-sm">
                                                        {result.failed} watchlist{result.failed !== 1 ? 's' : ''} could not be imported
                                                    </p>
                                                )}
                                            </div>
                                        </div>

                                        {/* Errors */}
                                        {result.errors.length > 0 && (
                                            <div className="space-y-2">
                                                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Errors:</h4>
                                                <ul className="space-y-1">
                                                    {result.errors.map((error, index) => (
                                                        <li key={index} className="text-sm text-red-600 dark:text-red-400 flex items-start gap-2">
                                                            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                                                            <span>{error}</span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}

                                        {/* Warnings */}
                                        {result.warnings.length > 0 && (
                                            <div className="space-y-2">
                                                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Warnings:</h4>
                                                <ul className="space-y-1">
                                                    {result.warnings.map((warning, index) => (
                                                        <li key={index} className="text-sm text-yellow-600 dark:text-yellow-400 flex items-start gap-2">
                                                            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                                                            <span>{warning}</span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}

                                        {/* Actions */}
                                        <div className="flex gap-3 pt-2">
                                            <button
                                                type="button"
                                                onClick={handleClose}
                                                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                                            >
                                                Done
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setResult(null)}
                                                className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                                            >
                                                Import Another
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
