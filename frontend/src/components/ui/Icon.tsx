/**
 * Icon component - Wrapper for consistent icon sizing, coloring, and animations
 * Works with lucide-react icons and other icon libraries
 */

import { type VariantProps, cva } from 'class-variance-authority';
import React from 'react';
import type { PolymorphicRef } from '../../types/polymorphic';
import { cn } from '../../utils';

// Icon variant styles using class-variance-authority
const iconVariants = cva(
    // Base styles - inline flex for alignment
    'inline-flex shrink-0',
    {
        variants: {
            size: {
                xs: 'w-3 h-3',
                sm: 'w-4 h-4',
                md: 'w-5 h-5',
                lg: 'w-6 h-6',
                xl: 'w-8 h-8',
            },
            color: {
                default: 'text-current',
                muted: 'text-gray-500 dark:text-gray-400',
                primary: 'text-blue-600 dark:text-blue-400',
                success: 'text-green-600 dark:text-green-400',
                warning: 'text-amber-600 dark:text-amber-400',
                error: 'text-red-600 dark:text-red-400',
            },
        },
        defaultVariants: {
            size: 'md',
            color: 'default',
        },
    }
);

type IconOwnProps = VariantProps<typeof iconVariants> & {
    /** Additional CSS classes */
    className?: string;
    /** Enable spin animation for loading states */
    spin?: boolean;
    /** Accessible label for semantic icons (when provided, removes aria-hidden) */
    'aria-label'?: string;
};

export type IconProps<T extends React.ElementType = 'svg'> =
    IconOwnProps & {
        /** Icon component to render (e.g., lucide-react icon) */
        as: T;
    } & Omit<React.ComponentPropsWithoutRef<T>, keyof IconOwnProps | 'as'>;

type IconBaseProps = IconOwnProps & {
    as: React.ElementType;
} & Omit<React.ComponentPropsWithoutRef<React.ElementType>, keyof IconOwnProps | 'as'>;

/**
 * Icon component for consistent icon rendering
 * 
 * @example
 * // Basic icon
 * <Icon as={Search} />
 * 
 * @example
 * // Icon with size and color
 * <Icon as={Star} size="sm" color="warning" />
 * 
 * @example
 * // Loading spinner
 * <Icon as={Loader2} spin aria-label="Loading" />
 * 
 * @example
 * // Muted icon in layout
 * <Icon as={ChevronRight} size="sm" color="muted" />
 * 
 * @example
 * // Large primary icon
 * <Icon as={CheckCircle} size="xl" color="primary" />
 */
const IconBase = React.forwardRef<SVGSVGElement, IconBaseProps>(
    ({ as: Component, className, size, color, spin, 'aria-label': ariaLabel, ...props }, ref) => {
        const iconClasses = cn(
            iconVariants({ size, color }),
            spin && 'animate-spin',
            className
        );

        return (
            <Component
                ref={ref as PolymorphicRef<React.ElementType>}
                className={iconClasses}
                aria-hidden={ariaLabel ? undefined : 'true'}
                aria-label={ariaLabel}
                {...props}
            />
        );
    }
);

IconBase.displayName = 'Icon';

export const Icon = IconBase as <T extends React.ElementType = 'svg'>(
    props: IconProps<T>
) => React.ReactElement | null;

export { iconVariants };

