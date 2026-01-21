/**
 * Link component - styled router/external link wrapper
 */

import { cn } from '@/utils';
import { cva, type VariantProps } from 'class-variance-authority';
import React from 'react';
import { Link as RouterLink } from 'react-router-dom';

const linkVariants = cva(
    'transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2',
    {
        variants: {
            variant: {
                default: 'text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300',
                primary: 'text-blue-600 hover:text-blue-700 font-medium',
                muted: 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100',
                danger: 'text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300',
                success: 'text-green-700 hover:text-green-800 dark:text-green-300 dark:hover:text-green-200',
            },
            size: {
                xs: 'text-xs',
                sm: 'text-sm',
                md: 'text-base',
                lg: 'text-lg',
                xl: 'text-xl',
            },
            underline: {
                none: 'no-underline',
                hover: 'no-underline hover:underline',
                always: 'underline',
            },
        },
        defaultVariants: {
            variant: 'default',
            size: 'md',
            underline: 'hover',
        },
    }
);

export interface LinkProps
    extends Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, 'href'>,
    VariantProps<typeof linkVariants> {
    /** Link destination (internal path or external URL) */
    to: string;
    /** Whether link is external (opens in new tab) */
    external?: boolean;
}

/**
 * Link component with centralized variants and external handling
 */
export function Link({
    to,
    external = false,
    variant,
    size,
    underline,
    className,
    children,
    ...props
}: LinkProps) {
    const isExternal = external || to.startsWith('http');
    const linkClassName = cn(linkVariants({ variant, size, underline }), className);

    if (isExternal) {
        return (
            <a
                href={to}
                target="_blank"
                rel="noopener noreferrer"
                className={linkClassName}
                {...props}
            >
                {children}
            </a>
        );
    }

    return (
        <RouterLink to={to} className={linkClassName} {...props}>
            {children}
        </RouterLink>
    );
}

export { linkVariants };
