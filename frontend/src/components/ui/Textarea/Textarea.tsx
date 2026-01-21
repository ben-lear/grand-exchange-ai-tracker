/**
 * Textarea component library
 * Provides reusable textarea fields with auto-resize, character counter, and consistent styling
 */

import { CommonComponentProps } from '@/types/components';
import { cn } from '@/utils';
import { type VariantProps, cva } from 'class-variance-authority';
import React, { useCallback, useEffect, useRef, useState } from 'react';

// Textarea variant styles using class-variance-authority
const textareaVariants = cva(
    // Base styles - common to all textareas
    'w-full transition-colors focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50 rounded-lg font-sans resize-none',
    {
        variants: {
            variant: {
                // Default textarea style
                default:
                    'bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400',

                // Error state
                error:
                    'bg-white dark:bg-gray-700 border-2 border-red-500 dark:border-red-400 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-red-500',

                // Success state
                success:
                    'bg-white dark:bg-gray-700 border-2 border-green-500 dark:border-green-400 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-green-500',
            },
            size: {
                xs: 'px-2 py-1 text-xs',
                sm: 'px-3 py-1.5 text-sm',
                md: 'px-3.5 py-2 text-sm',
                lg: 'px-4 py-2.5 text-base',
                xl: 'px-5 py-3 text-lg',
            },
        },
        defaultVariants: {
            variant: 'default',
            size: 'md',
        },
    }
);

/**
 * Props for the Textarea component
 */
export interface TextareaProps
    extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'size'>,
    Omit<CommonComponentProps, 'variant' | 'size'>,
    VariantProps<typeof textareaVariants> {
    /** Enable auto-resize to fit content */
    autoResize?: boolean;
    /** Minimum height in pixels (only applies with autoResize) */
    minHeight?: number;
    /** Maximum height in pixels (only applies with autoResize) */
    maxHeight?: number;
    /** Show character counter */
    showCount?: boolean;
    /** Custom label for the textarea */
    label?: string;
    /** Whether field is required */
    required?: boolean;
    /** Additional container class name */
    containerClassName?: string;
    /** Size variant */
    size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
    /** Value change handler (value only) */
    onValueChange?: (value: string) => void;
}

/**
 * Textarea component with support for auto-resize, character counter, and variants
 *
 * @example
 * // Basic textarea
 * <Textarea placeholder="Enter text..." />
 *
 * @example
 * // With auto-resize
 * <Textarea
 *   placeholder="This will grow as you type..."
 *   autoResize
 *   minHeight={100}
 *   maxHeight={300}
 * />
 *
 * @example
 * // With character counter
 * <Textarea
 *   value={text}
 *   onChange={(e) => setText(e.target.value)}
 *   maxLength={500}
 *   showCount
 * />
 *
 * @example
 * // Error state
 * <Textarea
 *   variant="error"
 *   error="This field is required"
 *   placeholder="Invalid input"
 * />
 */
export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
    (
        {
            className,
            containerClassName,
            variant,
            size,
            autoResize = false,
            minHeight = 100,
            maxHeight = 500,
            disabled = false,
            error,
            showCount = false,
            maxLength,
            label,
            required,
            value,
            onChange,
            onValueChange,
            helperText,
            ...props
        },
        ref
    ) => {
        const internalRef = useRef<HTMLTextAreaElement>(null);
        const textareaRef = ref || internalRef;
        const [charCount, setCharCount] = useState(
            typeof value === 'string' ? value.length : 0
        );

        const minHeightPx = minHeight;
        const maxHeightPx = maxHeight;

        // Auto-resize textarea to fit content
        const handleAutoResize = useCallback(() => {
            if (!autoResize || typeof textareaRef !== 'object' || !textareaRef?.current) {
                return;
            }

            const textarea = textareaRef.current;
            textarea.style.height = 'auto';
            const newHeight = Math.min(
                Math.max(textarea.scrollHeight, minHeightPx),
                maxHeightPx
            );
            textarea.style.height = `${newHeight}px`;
        }, [autoResize, minHeightPx, maxHeightPx, textareaRef]);

        // Handle input change
        const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
            onChange?.(e);
            onValueChange?.(e.target.value);
            if (showCount) {
                setCharCount(e.target.value.length);
            }
            if (autoResize) {
                handleAutoResize();
            }
        };

        // Setup auto-resize on mount and when value changes
        useEffect(() => {
            if (value !== undefined) {
                setCharCount(String(value).length);
            }
            handleAutoResize();
        }, [value, handleAutoResize]);

        // Set initial height
        useEffect(() => {
            if (autoResize && typeof textareaRef === 'object' && textareaRef?.current) {
                textareaRef.current.style.minHeight = `${minHeightPx}px`;
                textareaRef.current.style.maxHeight = `${maxHeightPx}px`;
                handleAutoResize();
            }
        }, [autoResize, minHeightPx, maxHeightPx, textareaRef, handleAutoResize]);

        const displayVariant = error ? 'error' : variant;

        return (
            <div className={cn('w-full', containerClassName)}>
                {label && (
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        {label}
                        {required && <span className="text-red-500 ml-1">*</span>}
                    </label>
                )}

                <div className="relative">
                    <textarea
                        ref={textareaRef}
                        className={cn(
                            textareaVariants({ variant: displayVariant, size }),
                            autoResize && 'overflow-hidden',
                            className
                        )}
                        disabled={disabled}
                        maxLength={maxLength}
                        value={value}
                        onChange={handleChange}
                        style={
                            autoResize
                                ? {
                                    minHeight: `${minHeightPx}px`,
                                    maxHeight: `${maxHeightPx}px`,
                                }
                                : undefined
                        }
                        {...props}
                    />
                </div>

                {/* Error message or helper text */}
                <div className="mt-1 flex items-center justify-between">
                    <div>
                        {error && (
                            <p className="text-sm text-red-500 dark:text-red-400">{error}</p>
                        )}
                        {helperText && !error && (
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                {helperText}
                            </p>
                        )}
                    </div>

                    {/* Character counter */}
                    {showCount && (
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                            {charCount}
                            {maxLength && `/${maxLength}`}
                        </p>
                    )}
                </div>
            </div>
        );
    }
);

Textarea.displayName = 'Textarea';
