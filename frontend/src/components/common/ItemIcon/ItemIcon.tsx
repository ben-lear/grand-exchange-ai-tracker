/**
 * ItemIcon component for displaying OSRS item icons with fallback handling
 */

import { cva, type VariantProps } from 'class-variance-authority';
import { HelpCircle } from 'lucide-react';
import React, { useState } from 'react';
import { cn } from '@/utils';
import { Icon } from '@/components/ui';

const itemIconVariants = cva(
    'relative inline-block rounded border bg-gray-100 dark:bg-gray-800 overflow-hidden flex items-center justify-center',
    {
        variants: {
            size: {
                xs: 'w-4 h-4',
                sm: 'w-6 h-6',
                md: 'w-8 h-8',
                lg: 'w-12 h-12',
                xl: 'w-16 h-16',
            },
        },
        defaultVariants: {
            size: 'md',
        },
    }
);

export interface ItemIconProps extends VariantProps<typeof itemIconVariants> {
    /** Image source URL */
    src: string;
    /** Alt text for the image */
    alt: string;
    /** Size variant */
    size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
    /** Custom fallback content */
    fallback?: React.ReactNode;
    /** Whether to show loading skeleton */
    loading?: boolean;
    /** Custom className */
    className?: string;
    /** Error handler callback */
    onError?: () => void;
}

/**
 * ItemIcon component with automatic fallback on load error
 * 
 * Usage:
 * <ItemIcon
 *   src="https://example.com/icon.png"
 *   alt="Dragon Scimitar"
 *   size="md"
 * />
 */
export const ItemIcon: React.FC<ItemIconProps> = ({
    src,
    alt,
    size = 'md',
    fallback,
    loading = false,
    className,
    onError,
}) => {
    const [hasError, setHasError] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    const handleError = () => {
        setHasError(true);
        setIsLoading(false);
        if (onError) {
            onError();
        }
    };

    const handleLoad = () => {
        setIsLoading(false);
    };

    const showSkeleton = loading || isLoading;
    const showFallback = hasError;

    return (
        <div
            className={cn(
                itemIconVariants({ size }),
                'border-gray-300 dark:border-gray-700',
                className
            )}
            role="img"
            aria-label={alt}
        >
            {showSkeleton && !showFallback && (
                <div className="absolute inset-0 animate-pulse bg-gray-200 dark:bg-gray-700" />
            )}

            {showFallback ? (
                fallback || (
                    <Icon
                        as={HelpCircle}
                        size={size === 'xs' ? 'xs' : size === 'sm' ? 'sm' : 'md'}
                        className="text-gray-400 dark:text-gray-600"
                    />
                )
            ) : (
                <img
                    src={src}
                    alt={alt}
                    onError={handleError}
                    onLoad={handleLoad}
                    className={cn(
                        'w-full h-full object-cover',
                        showSkeleton && 'opacity-0'
                    )}
                />
            )}
        </div>
    );
};
