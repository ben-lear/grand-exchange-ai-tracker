/**
 * Stack component - Flexible layout primitive for spacing and alignment
 * Provides consistent flex layouts with gap, direction, alignment, and justification
 */

import { type VariantProps, cva } from 'class-variance-authority';
import React from 'react';
import type {
    PolymorphicComponent,
    PolymorphicComponentProps,
    PolymorphicRef,
} from '../../types/polymorphic';
import { cn } from '../../utils';

// Stack variant styles using class-variance-authority
const stackVariants = cva(
    // Base styles - flex display
    'flex',
    {
        variants: {
            direction: {
                row: 'flex-row',
                col: 'flex-col',
            },
            align: {
                start: 'items-start',
                center: 'items-center',
                end: 'items-end',
                stretch: 'items-stretch',
            },
            justify: {
                start: 'justify-start',
                center: 'justify-center',
                end: 'justify-end',
                between: 'justify-between',
                around: 'justify-around',
            },
            gap: {
                0: 'gap-0',
                1: 'gap-1',
                2: 'gap-2',
                3: 'gap-3',
                4: 'gap-4',
                5: 'gap-5',
                6: 'gap-6',
                7: 'gap-7',
                8: 'gap-8',
                9: 'gap-9',
                10: 'gap-10',
                11: 'gap-11',
                12: 'gap-12',
            },
        },
        defaultVariants: {
            direction: 'row',
            align: 'start',
            justify: 'start',
            gap: 0,
        },
    }
);

type StackOwnProps = VariantProps<typeof stackVariants> & {
    /** Additional CSS classes */
    className?: string;
    /** Children elements */
    children?: React.ReactNode;
};

export type StackProps<T extends React.ElementType = 'div'> =
    PolymorphicComponentProps<T, StackOwnProps>;

type StackBaseProps = StackOwnProps & {
    as?: React.ElementType;
} & Omit<React.ComponentPropsWithoutRef<React.ElementType>, keyof StackOwnProps | 'as'>;

/**
 * Stack component for flexible layouts
 * 
 * @example
 * // Horizontal stack with center alignment
 * <Stack direction="row" align="center" gap="2">
 *   <Icon as={Star} />
 *   <Text>Favorite</Text>
 * </Stack>
 * 
 * @example
 * // Vertical stack with spacing
 * <Stack direction="col" gap="4">
 *   <div>Item 1</div>
 *   <div>Item 2</div>
 * </Stack>
 * 
 * @example
 * // Semantic navigation
 * <Stack as="nav" direction="row" gap="6" align="center">
 *   <a href="/">Home</a>
 *   <a href="/about">About</a>
 * </Stack>
 * 
 * @example
 * // Space between layout
 * <Stack direction="row" justify="between" align="center">
 *   <h1>Title</h1>
 *   <button>Action</button>
 * </Stack>
 */
const StackBase = React.forwardRef<HTMLElement, StackBaseProps>(
    ({ as: Component = 'div', className, direction, align, justify, gap, children, ...props }, ref) => {
        return (
            <Component
                ref={ref as PolymorphicRef<React.ElementType>}
                className={cn(stackVariants({ direction, align, justify, gap }), className)}
                {...props}
            >
                {children}
            </Component>
        );
    }
);

StackBase.displayName = 'Stack';

export const Stack = StackBase as PolymorphicComponent<'div', StackOwnProps>;

export { stackVariants };

