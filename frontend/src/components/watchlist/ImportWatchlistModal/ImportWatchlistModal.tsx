/**
 * ImportWatchlistModal - Modal for importing watchlists from JSON files
 */

import { Button, FileInput, Stack, StandardModal, Text } from '@/components/ui';
import { useWatchlistStore } from '@/stores';
import type { WatchlistExport } from '@/types/watchlist';
import { validateWatchlistExport } from '@/utils';
import { AlertCircle, CheckCircle, Upload } from 'lucide-react';
import { useState } from 'react';

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

    const handleFileSelect = (files: File[]) => {
        if (files.length > 0) {
            processImport(files[0]);
        }
    };

    return (
        <StandardModal
            isOpen={isOpen}
            onClose={handleClose}
            title="Import Watchlists"
            icon={Upload}
            iconColor="primary"
            closeDisabled={importing}
            footer={
                result ? (
                    <Stack direction="row" gap={3} justify="end">
                        <Button
                            variant="secondary"
                            onClick={() => setResult(null)}
                        >
                            Import Another
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
            {/* Upload Area */}
            {!result && (
                <FileInput
                    onChange={handleFileSelect}
                    accept=".json"
                    maxFiles={1}
                    disabled={importing}
                    showFileList={false}
                    emptyMessage="Drop watchlist JSON file here or click to browse"
                    helperText="Supports .json files exported from this app"
                    size="md"
                    aria-label="Choose file to import"
                />
            )}

            {/* Import Result */}
            {result && (
                <Stack direction="col" gap={4}>
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
                            <Text weight="medium" className="mb-1">
                                {result.success
                                    ? `Successfully imported ${result.imported} watchlist${result.imported !== 1 ? 's' : ''}`
                                    : 'Import failed'
                                }
                            </Text>
                            {result.failed > 0 && (
                                <Text size="sm">
                                    {result.failed} watchlist{result.failed !== 1 ? 's' : ''} could not be imported
                                </Text>
                            )}
                        </div>
                    </div>

                    {/* Errors */}
                    {result.errors.length > 0 && (
                        <Stack direction="col" gap={2}>
                            <Text weight="medium" size="sm">Errors:</Text>
                            <ul className="space-y-1">
                                {result.errors.map((error, index) => (
                                    <li key={index} className="text-sm text-red-600 dark:text-red-400 flex items-start gap-2">
                                        <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                                        <span>{error}</span>
                                    </li>
                                ))}
                            </ul>
                        </Stack>
                    )}

                    {/* Warnings */}
                    {result.warnings.length > 0 && (
                        <Stack direction="col" gap={2}>
                            <Text weight="medium" size="sm">Warnings:</Text>
                            <ul className="space-y-1">
                                {result.warnings.map((warning, index) => (
                                    <li key={index} className="text-sm text-yellow-600 dark:text-yellow-400 flex items-start gap-2">
                                        <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                                        <span>{warning}</span>
                                    </li>
                                ))}
                            </ul>
                        </Stack>
                    )}
                </Stack>
            )}
        </StandardModal>
    );
}
