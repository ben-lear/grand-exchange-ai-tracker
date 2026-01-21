/**
 * List component - semantic list wrapper with variants
 */

import { cn } from '@/utils';
import { cva, type VariantProps } from 'class-variance-authority';
import React from 'react';

const listVariants = cva('', {
    variants: {
        spacing: {
            tight: 'space-y-1',
            normal: 'space-y-2',
            loose: 'space-y-4',
        },
        marker: {
            disc: 'list-disc',
            circle: 'list-circle',
            square: 'list-square',
            none: 'list-none',
        },
    },
    defaultVariants: {
        spacing: 'normal',
        marker: 'disc',
    },
});

export interface ListProps extends VariantProps<typeof listVariants> {
    /** List type */
    variant?: 'unordered' | 'ordered' | 'unstyled';
    /** List content */
    children: React.ReactNode;
    /** Additional classes */
    className?: string;
}

/**
 * List component
 */
export function List({
    variant = 'unordered',
    spacing,
    marker,
    children,
    className,
}: ListProps) {
    const Component = variant === 'ordered' ? 'ol' : 'ul';
    const resolvedMarker = variant === 'unstyled' ? 'none' : marker;

    return (
        <Component className={cn(listVariants({ spacing, marker: resolvedMarker }), className)}>
            {children}
        </Component>
    );
}
