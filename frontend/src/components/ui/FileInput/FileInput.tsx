/**
 * FileInput component library
 * Provides file upload with drag-and-drop, validation, and preview support
 */

import { CommonComponentProps } from '@/types/components';
import { cn } from '@/utils';
import { cva } from 'class-variance-authority';
import { Upload, X } from 'lucide-react';
import React, { useCallback, useState } from 'react';

// FileInput container variant styles
const fileInputContainerVariants = cva(
    'w-full rounded-lg border-2 border-dashed transition-colors',
    {
        variants: {
            variant: {
                default:
                    'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 hover:border-gray-400 dark:hover:border-gray-500',
                error:
                    'border-red-500 dark:border-red-400 bg-red-50 dark:bg-red-900/20',
                success:
                    'border-green-500 dark:border-green-400 bg-green-50 dark:bg-green-900/20',
            },
            isDragging: {
                true: 'border-blue-500 dark:border-blue-400 bg-blue-50 dark:bg-blue-900/20',
                false: '',
            },
            size: {
                xs: 'p-3',
                sm: 'p-4',
                md: 'p-6',
                lg: 'p-8',
                xl: 'p-10',
            },
        },
        defaultVariants: {
            variant: 'default',
            isDragging: false,
            size: 'md',
        },
    }
);

// File item variant styles
const fileItemVariants = cva(
    'flex items-center justify-between p-3 rounded-lg border',
    {
        variants: {
            variant: {
                default:
                    'bg-gray-50 dark:bg-gray-600 border-gray-200 dark:border-gray-500 text-gray-900 dark:text-gray-100',
                error:
                    'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700 text-red-900 dark:text-red-100',
            },
        },
        defaultVariants: {
            variant: 'default',
        },
    }
);

/**
 * Props for the FileInput component
 */
export interface FileInputProps
    extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'onChange' | 'size'>,
    Omit<CommonComponentProps, 'variant' | 'size'> {
    /** File selection handler */
    onChange?: (files: File[]) => void;
    /** Accepted file types (e.g., ".json,image/*") */
    accept?: string;
    /** Maximum number of files allowed */
    maxFiles?: number;
    /** Maximum file size in bytes */
    maxSize?: number;
    /** Enable drag and drop */
    allowDragDrop?: boolean;
    /** Show file preview thumbnails */
    showPreview?: boolean;
    /** Show file list */
    showFileList?: boolean;
    /** Custom label */
    label?: string;
    /** Whether field is required */
    required?: boolean;
    /** Empty state message */
    emptyMessage?: string;
    /** Additional container class name */
    containerClassName?: string;
    /** Size variant */
    size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
}

/**
 * Validate a file against constraints
 */
function validateFile(
    file: File,
    accept?: string,
    maxSize?: number
): string | null {
    // Check file type
    if (accept) {
        const acceptTypes = accept.split(',').map((t) => t.trim());
        const fileType = file.type;
        const fileName = file.name;

        const isAccepted = acceptTypes.some((type) => {
            if (type.startsWith('.')) {
                // Extension-based match (e.g., ".json")
                return fileName.endsWith(type);
            }
            if (type.includes('/')) {
                // MIME type match (e.g., "image/*", "application/json")
                const [category] = type.split('/');
                if (category === '*') return true; // Accept all
                if (type.endsWith('/*')) {
                    return fileType.startsWith(category);
                }
                return fileType === type;
            }
            return false;
        });

        if (!isAccepted) {
            return `File type not allowed. Accepted: ${accept}`;
        }
    }

    // Check file size
    if (maxSize && file.size > maxSize) {
        const maxSizeMB = (maxSize / 1024 / 1024).toFixed(2);
        return `File size exceeds ${maxSizeMB}MB`;
    }

    return null;
}

/**
 * Format file size for display
 */
function formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

/**
 * FileInput component with drag-and-drop, validation, and preview support
 *
 * @example
 * // Basic file input
 * const [files, setFiles] = useState<File[]>([]);
 * <FileInput onChange={setFiles} />
 *
 * @example
 * // JSON file upload with size limit
 * <FileInput
 *   accept=".json"
 *   maxSize={5 * 1024 * 1024} // 5MB
 *   maxFiles={1}
 *   onChange={handleFileSelect}
 * />
 *
 * @example
 * // Multiple image files with preview
 * <FileInput
 *   accept="image/*"
 *   multiple
 *   maxFiles={5}
 *   showPreview
 *   onChange={handleImageSelect}
 * />
 */
export const FileInput = React.forwardRef<HTMLInputElement, FileInputProps>(
    (
        {
            onChange,
            accept,
            maxFiles = 1,
            maxSize,
            allowDragDrop = true,
            showPreview = false,
            showFileList = true,
            disabled = false,
            error,
            label,
            required,
            size = 'md',
            emptyMessage = 'Drag and drop files here, or click to select',
            containerClassName,
            className,
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            helperText: _helperText, // Extracted to prevent passing to DOM element
            ...props
        },
        ref
    ) => {
        const [files, setFiles] = useState<File[]>([]);
        const [fileErrors, setFileErrors] = useState<Record<string, string>>({});
        const [isDragging, setIsDragging] = useState(false);
        const inputRef = React.useRef<HTMLInputElement>(null);
        const finalRef = ref || inputRef;

        // Handle file validation and update
        const processFiles = useCallback(
            (newFiles: FileList | null) => {
                if (!newFiles) return;

                const fileArray = Array.from(newFiles);
                const errors: Record<string, string> = {};
                const validFiles: File[] = [];

                fileArray.forEach((file, idx) => {
                    const validationError = validateFile(file, accept, maxSize);
                    if (validationError) {
                        errors[`${idx}-${file.name}`] = validationError;
                    } else {
                        validFiles.push(file);
                    }
                });

                // Check max files constraint
                const totalFiles = files.length + validFiles.length;
                if (totalFiles > maxFiles) {
                    errors['max-files'] = `Maximum ${maxFiles} file(s) allowed`;
                    // Keep only the first N files
                    validFiles.splice(maxFiles - files.length);
                }

                setFileErrors(errors);
                const newFileList = [...files, ...validFiles];
                setFiles(newFileList);
                onChange?.(newFileList);
            },
            [files, accept, maxSize, maxFiles, onChange]
        );

        // Handle file input change
        const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
            processFiles(e.target.files);
        };

        // Handle drag and drop
        const handleDragEnter = (e: React.DragEvent) => {
            e.preventDefault();
            e.stopPropagation();
            if (!disabled) {
                setIsDragging(true);
            }
        };

        const handleDragLeave = (e: React.DragEvent) => {
            e.preventDefault();
            e.stopPropagation();
            setIsDragging(false);
        };

        const handleDragOver = (e: React.DragEvent) => {
            e.preventDefault();
            e.stopPropagation();
        };

        const handleDrop = (e: React.DragEvent) => {
            e.preventDefault();
            e.stopPropagation();
            setIsDragging(false);
            if (!disabled) {
                processFiles(e.dataTransfer.files);
            }
        };

        // Handle file removal
        const removeFile = (index: number) => {
            const newFiles = files.filter((_, i) => i !== index);
            setFiles(newFiles);
            onChange?.(newFiles);
            // Clear error for this file
            const newErrors = { ...fileErrors };
            delete newErrors[`${index}-${files[index].name}`];
            setFileErrors(newErrors);
        };

        // Handle click to browse
        const handleClick = () => {
            if (typeof finalRef === 'object' && finalRef?.current) {
                finalRef.current.click();
            }
        };

        const hasErrors = Object.keys(fileErrors).length > 0;
        const displayVariant = hasErrors ? 'error' : error ? 'error' : 'default';

        return (
            <div className={cn('w-full', containerClassName)}>
                {label && (
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        {label}
                        {required && <span className="text-red-500 ml-1">*</span>}
                    </label>
                )}

                {/* Main file input area */}
                <div
                    className={fileInputContainerVariants({
                        variant: displayVariant,
                        isDragging,
                        size,
                    })}
                    onDragEnter={allowDragDrop ? handleDragEnter : undefined}
                    onDragLeave={allowDragDrop ? handleDragLeave : undefined}
                    onDragOver={allowDragDrop ? handleDragOver : undefined}
                    onDrop={allowDragDrop ? handleDrop : undefined}
                >
                    <input
                        ref={finalRef}
                        type="file"
                        onChange={handleInputChange}
                        accept={accept}
                        multiple={maxFiles > 1}
                        disabled={disabled}
                        className="hidden"
                        {...props}
                    />

                    <button
                        type="button"
                        onClick={handleClick}
                        disabled={disabled}
                        className="w-full flex flex-col items-center justify-center gap-2 text-center cursor-pointer"
                    >
                        <Upload className="h-8 w-8 text-gray-400 dark:text-gray-500" />
                        <div>
                            <p className="font-medium text-gray-900 dark:text-gray-100">
                                {emptyMessage}
                            </p>
                            {accept && (
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                    Accepted: {accept}
                                </p>
                            )}
                            {maxSize && (
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                    Max size: {formatFileSize(maxSize)}
                                </p>
                            )}
                        </div>
                    </button>
                </div>

                {/* Error messages */}
                <div className="mt-2 space-y-1">
                    {error && (
                        <p className="text-sm text-red-500 dark:text-red-400">{error}</p>
                    )}
                    {Object.entries(fileErrors).map(([key, errorMsg]) => (
                        <p key={key} className="text-sm text-red-500 dark:text-red-400">
                            {errorMsg}
                        </p>
                    ))}
                </div>

                {/* File list */}
                {showFileList && files.length > 0 && (
                    <div className="mt-4 space-y-2">
                        {files.map((file, index) => (
                            <div key={`${index}-${file.name}`} className={fileItemVariants()}>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium truncate">{file.name}</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                        {formatFileSize(file.size)}
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => removeFile(index)}
                                    className="ml-2 p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-500 transition-colors flex-shrink-0"
                                    aria-label="Remove file"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        );
    }
);

FileInput.displayName = 'FileInput';
