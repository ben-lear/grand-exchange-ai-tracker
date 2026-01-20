/**
 * Card component library with comprehensive variant system
 * Provides reusable card containers with consistent styling and layout options
 */

import { type VariantProps, cva } from 'class-variance-authority';
import React from 'react';
import { cn } from '@/utils';

// Card variant styles using class-variance-authority
const cardVariants = cva(
    // Base styles - common to all cards
    'rounded-lg',
    {
        variants: {
            variant: {
                // Default card with border
                default: 'card-base',

                // Outlined card with emphasis on border
                outlined: 'card-outlined',

                // Elevated card with shadow
                elevated: 'card-elevated',

                // Error state card
                error: 'status-error',

                // Warning state card
                warning: 'status-warning',

                // Success state card
                success: 'status-success',

                // Info state card
                info: 'status-info',
            },
            padding: {
                none: '',
                sm: 'p-3',
                base: 'p-4',
                lg: 'p-6',
            },
        },
        defaultVariants: {
            variant: 'default',
            padding: 'base',
        },
    }
);

const cardHeaderVariants = cva(
    'flex items-center justify-between',
    {
        variants: {
            padding: {
                none: '',
                sm: 'pb-2',
                base: 'pb-3',
                lg: 'pb-4',
            },
        },
        defaultVariants: {
            padding: 'base',
        },
    }
);

const cardContentVariants = cva('', {
    variants: {
        padding: {
            none: '',
            sm: 'py-1',
            base: 'py-2',
            lg: 'py-3',
        },
    },
    defaultVariants: {
        padding: 'none',
    },
});

const cardFooterVariants = cva(
    'flex items-center justify-end gap-2',
    {
        variants: {
            padding: {
                none: '',
                sm: 'pt-2',
                base: 'pt-3',
                lg: 'pt-4',
            },
            borderTop: {
                true: 'border-t border-divider',
                false: '',
            },
        },
        defaultVariants: {
            padding: 'base',
            borderTop: false,
        },
    }
);

export interface CardProps
    extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> { }

export interface CardHeaderProps
    extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardHeaderVariants> { }

export interface CardContentProps
    extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardContentVariants> { }

export interface CardFooterProps
    extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardFooterVariants> { }

/**
 * Main Card component with support for variants and padding
 * 
 * @example
 * // Basic card
 * <Card>
 *   <CardContent>Hello World</CardContent>
 * </Card>
 * 
 * @example
 * // Error card
 * <Card variant="error">
 *   <CardContent>Something went wrong!</CardContent>
 * </Card>
 * 
 * @example
 * // Complete card with header and footer
 * <Card variant="elevated">
 *   <CardHeader>
 *     <h2>Card Title</h2>
 *     <button>Action</button>
 *   </CardHeader>
 *   <CardContent>
 *     Card body content goes here.
 *   </CardContent>
 *   <CardFooter borderTop>
 *     <button>Cancel</button>
 *     <button>Save</button>
 *   </CardFooter>
 * </Card>
 */
export const Card = React.forwardRef<HTMLDivElement, CardProps>(
    ({ className, variant, padding, ...props }, ref) => {
        return (
            <div
                ref={ref}
                className={cn(cardVariants({ variant, padding }), className)}
                {...props}
            />
        );
    }
);

/**
 * Card header component for titles and actions
 */
export const CardHeader = React.forwardRef<HTMLDivElement, CardHeaderProps>(
    ({ className, padding, ...props }, ref) => {
        return (
            <div
                ref={ref}
                className={cn(cardHeaderVariants({ padding }), className)}
                {...props}
            />
        );
    }
);

/**
 * Card content component for main body content
 */
export const CardContent = React.forwardRef<HTMLDivElement, CardContentProps>(
    ({ className, padding, ...props }, ref) => {
        return (
            <div
                ref={ref}
                className={cn(cardContentVariants({ padding }), className)}
                {...props}
            />
        );
    }
);

/**
 * Card footer component for actions and supplementary content
 */
export const CardFooter = React.forwardRef<HTMLDivElement, CardFooterProps>(
    ({ className, padding, borderTop, ...props }, ref) => {
        return (
            <div
                ref={ref}
                className={cn(cardFooterVariants({ padding, borderTop }), className)}
                {...props}
            />
        );
    }
);

Card.displayName = 'Card';
CardHeader.displayName = 'CardHeader';
CardContent.displayName = 'CardContent';
CardFooter.displayName = 'CardFooter';

export { cardContentVariants, cardFooterVariants, cardHeaderVariants, cardVariants };

