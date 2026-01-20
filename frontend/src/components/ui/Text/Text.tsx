/**
 * Text component - Typography primitive with semantic variants
 * Provides consistent text styling throughout the application
 */

import type {
    PolymorphicComponent,
    PolymorphicComponentProps,
    PolymorphicRef,
} from '@/types/polymorphic';
import { cn } from '@/utils';
import { type VariantProps, cva } from 'class-variance-authority';
import React from 'react';

// Text variant styles using class-variance-authority
const textVariants = cva(
    // Base styles
    '',
    {
        variants: {
            variant: {
                heading: 'text-gray-900 dark:text-gray-100',
                body: 'text-gray-700 dark:text-gray-300',
                muted: 'text-gray-500 dark:text-gray-400',
                error: 'text-red-600 dark:text-red-400',
                success: 'text-green-600 dark:text-green-400',
                warning: 'text-amber-600 dark:text-amber-400',
                primary: 'text-blue-600 dark:text-blue-400',
            },
            size: {
                xs: 'text-xs',
                sm: 'text-sm',
                base: 'text-base',
                lg: 'text-lg',
                xl: 'text-xl',
                '2xl': 'text-2xl',
                '3xl': 'text-3xl',
            },
            weight: {
                normal: 'font-normal',
                medium: 'font-medium',
                semibold: 'font-semibold',
                bold: 'font-bold',
            },
            align: {
                left: 'text-left',
                center: 'text-center',
                right: 'text-right',
            },
        },
        defaultVariants: {
            variant: 'body',
            size: 'base',
            weight: 'normal',
            align: 'left',
        },
    }
);

type TextOwnProps = VariantProps<typeof textVariants> & {
    /** Additional CSS classes */
    className?: string;
    /** Children elements */
    children?: React.ReactNode;
};

export type TextProps<T extends React.ElementType = 'span'> =
    PolymorphicComponentProps<T, TextOwnProps>;

type TextBaseProps = TextOwnProps & {
    as?: React.ElementType;
} & Omit<React.ComponentPropsWithoutRef<React.ElementType>, keyof TextOwnProps | 'as'>;

/**
 * Text component for consistent typography
 * 
 * @example
 * // Heading text
 * <Text variant="heading" weight="semibold" size="xl">
 *   Page Title
 * </Text>
 * 
 * @example
 * // Body text
 * <Text variant="body">
 *   Regular paragraph text
 * </Text>
 * 
 * @example
 * // Muted helper text
 * <Text variant="muted" size="sm">
 *   Helper information
 * </Text>
 * 
 * @example
 * // Error message
 * <Text variant="error" weight="medium">
 *   An error occurred
 * </Text>
 * 
 * @example
 * // Semantic HTML
 * <Text as="h1" variant="heading" size="3xl" weight="bold">
 *   Main Heading
 * </Text>
 */
const TextBase = React.forwardRef<HTMLElement, TextBaseProps>(
    ({ as: Component = 'span', className, variant, size, weight, align, children, ...props }, ref) => {
        return (
            <Component
                ref={ref as PolymorphicRef<React.ElementType>}
                className={cn(textVariants({ variant, size, weight, align }), className)}
                {...props}
            >
                {children}
            </Component>
        );
    }
);

TextBase.displayName = 'Text';

export const Text = TextBase as PolymorphicComponent<'span', TextOwnProps>;

export { textVariants };

