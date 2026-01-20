/**
 * Skeleton component library for loading states
 * Provides reusable skeleton loaders with consistent styling and animations
 */

import { type VariantProps, cva } from 'class-variance-authority';
import React from 'react';
import { cn } from '@/utils';

// Skeleton variant styles using class-variance-authority
const skeletonVariants = cva(
    // Base styles - common to all skeletons
    'skeleton-base',
    {
        variants: {
            variant: {
                // Text skeleton with rounded corners
                text: 'rounded',

                // Circular skeleton (for avatars, icons)
                circular: 'rounded-full',

                // Rectangular skeleton with rounded corners
                rectangular: 'rounded-md',

                // Button skeleton matching button shape
                button: 'rounded-lg',

                // Card skeleton with larger border radius
                card: 'rounded-xl',
            },
            size: {
                xs: 'h-3',
                sm: 'h-4',
                base: 'h-5',
                lg: 'h-6',
                xl: 'h-8',
                '2xl': 'h-10',
            },
        },
        defaultVariants: {
            variant: 'text',
            size: 'base',
        },
    }
);

export interface SkeletonProps
    extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof skeletonVariants> {
    /** Width of skeleton (CSS value) */
    width?: string | number;
    /** Height of skeleton (CSS value) - overrides size prop */
    height?: string | number;
    /** Number of text lines to render (text variant only) */
    lines?: number;
    /** Whether to add random width variation for text lines */
    randomWidth?: boolean;
}

/**
 * Skeleton component for loading states
 * 
 * @example
 * // Basic text skeleton
 * <Skeleton />
 * 
 * @example
 * // Avatar skeleton
 * <Skeleton variant="circular" width="40px" height="40px" />
 * 
 * @example
 * // Multiple text lines with random widths
 * <Skeleton lines={3} randomWidth />
 * 
 * @example
 * // Card skeleton
 * <Skeleton variant="card" width="300px" height="200px" />
 * 
 * @example
 * // Button skeleton
 * <Skeleton variant="button" width="120px" height="36px" />
 */
export const Skeleton = React.forwardRef<HTMLDivElement, SkeletonProps>(
    (
        {
            className,
            variant,
            size,
            width = '100%',
            height,
            lines = 1,
            randomWidth = false,
            style,
            ...props
        },
        ref
    ) => {
        // Convert width/height to CSS values
        const widthValue = typeof width === 'number' ? `${width}px` : width;
        const heightValue = typeof height === 'number' ? `${height}px` : height;

        const baseStyle = {
            width: widthValue,
            height: heightValue,
            ...style,
        };

        // For single skeleton or non-text variants
        if (lines <= 1 || variant !== 'text') {
            return (
                <div
                    ref={ref}
                    className={cn(skeletonVariants({ variant, size }), className)}
                    style={baseStyle}
                    aria-label="Loading..."
                    {...props}
                />
            );
        }

        // For multiple text lines
        return (
            <div ref={ref} className={cn('space-y-2', className)} aria-label="Loading..." {...props}>
                {Array.from({ length: lines }, (_, index) => {
                    let lineWidth = widthValue;

                    // Apply random width variation for text lines
                    if (randomWidth && variant === 'text') {
                        if (index === lines - 1) {
                            // Last line is shorter (60-80%)
                            lineWidth = `${Math.floor(Math.random() * 20 + 60)}%`;
                        } else if (Math.random() > 0.7) {
                            // Some lines are slightly shorter (80-95%)
                            lineWidth = `${Math.floor(Math.random() * 15 + 80)}%`;
                        }
                    }

                    return (
                        <div
                            key={index}
                            className={cn(skeletonVariants({ variant, size }))}
                            style={{
                                width: lineWidth,
                                height: heightValue,
                            }}
                        />
                    );
                })}
            </div>
        );
    }
);

Skeleton.displayName = 'Skeleton';

export { skeletonVariants };

/**
 * Predefined skeleton patterns for common use cases
 */

/**
 * Avatar skeleton with optional text
 */
export interface AvatarSkeletonProps {
    /** Size of avatar */
    size?: 'sm' | 'base' | 'lg' | 'xl';
    /** Whether to show text lines next to avatar */
    withText?: boolean;
    /** Number of text lines */
    textLines?: number;
    /** Additional className */
    className?: string;
}

export const AvatarSkeleton: React.FC<AvatarSkeletonProps> = ({
    size = 'base',
    withText = false,
    textLines = 2,
    className,
}) => {
    const avatarSizes = {
        sm: { width: '32px', height: '32px' },
        base: { width: '40px', height: '40px' },
        lg: { width: '48px', height: '48px' },
        xl: { width: '56px', height: '56px' },
    };

    const avatarSize = avatarSizes[size];

    if (!withText) {
        return (
            <Skeleton
                variant="circular"
                width={avatarSize.width}
                height={avatarSize.height}
                className={className}
            />
        );
    }

    return (
        <div className={cn('flex items-center gap-3', className)}>
            <Skeleton
                variant="circular"
                width={avatarSize.width}
                height={avatarSize.height}
            />
            <div className="flex-1">
                <Skeleton lines={textLines} randomWidth />
            </div>
        </div>
    );
};

/**
 * Table row skeleton
 */
export interface TableRowSkeletonProps {
    /** Number of columns */
    columns?: number;
    /** Additional className */
    className?: string;
}

export const TableRowSkeleton: React.FC<TableRowSkeletonProps> = ({
    columns = 4,
    className,
}) => {
    return (
        <div className={cn('flex items-center gap-4 py-3', className)}>
            {Array.from({ length: columns }, (_, index) => (
                <div key={index} className="flex-1">
                    <Skeleton randomWidth />
                </div>
            ))}
        </div>
    );
};

/**
 * Card skeleton with header and content
 */
export interface CardSkeletonProps {
    /** Whether to show header */
    showHeader?: boolean;
    /** Number of content lines */
    lines?: number;
    /** Whether to show footer actions */
    showActions?: boolean;
    /** Additional className */
    className?: string;
}

export const CardSkeleton: React.FC<CardSkeletonProps> = ({
    showHeader = true,
    lines = 3,
    showActions = false,
    className,
}) => {
    return (
        <div className={cn('border border-gray-200 dark:border-gray-700 rounded-lg p-4 space-y-4', className)}>
            {showHeader && (
                <div className="flex items-center justify-between">
                    <Skeleton width="40%" height="24px" />
                    <Skeleton variant="button" width="80px" height="32px" />
                </div>
            )}

            <div className="space-y-2">
                <Skeleton lines={lines} randomWidth />
            </div>

            {showActions && (
                <div className="flex justify-end gap-2 pt-2">
                    <Skeleton variant="button" width="80px" height="36px" />
                    <Skeleton variant="button" width="80px" height="36px" />
                </div>
            )}
        </div>
    );
};