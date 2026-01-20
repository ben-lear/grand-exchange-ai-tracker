/**
 * IconButton component - Button that renders only an icon
 * Combines Icon component with Button styling
 */

import { type VariantProps, cva } from 'class-variance-authority';
import React from 'react';
import { cn } from '../../utils';

// IconButton variant styles using class-variance-authority
const iconButtonVariants = cva(
    // Base styles
    'inline-flex items-center justify-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
    {
        variants: {
            variant: {
                default: 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600',
                primary: 'bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800',
                secondary: 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600',
                ghost: 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700',
                destructive: 'bg-red-600 text-white hover:bg-red-700 active:bg-red-800',
                toolbar: 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700',
                close: 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300',
            },
            size: {
                sm: 'h-8 w-8 p-1.5',
                default: 'h-10 w-10 p-2',
                lg: 'h-12 w-12 p-3',
            },
            radius: {
                default: 'rounded-lg',
                sm: 'rounded',
                md: 'rounded-md',
                lg: 'rounded-lg',
                full: 'rounded-full',
            },
        },
        defaultVariants: {
            variant: 'default',
            size: 'default',
            radius: 'default',
        },
    }
);

export interface IconButtonProps
    extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof iconButtonVariants> {
    /** Icon component to render (e.g., lucide-react icon) */
    icon: React.ElementType;
    /** Loading state */
    loading?: boolean;
}

/**
 * IconButton component for icon-only actions
 * 
 * @example
 * // Basic icon button
 * <IconButton icon={Search} aria-label="Search" />
 * 
 * @example
 * // Primary variant
 * <IconButton icon={Plus} variant="primary" aria-label="Add item" />
 * 
 * @example
 * // Loading state
 * <IconButton icon={RefreshCw} loading aria-label="Refreshing" />
 * 
 * @example
 * // Toolbar button
 * <IconButton icon={Settings} variant="toolbar" size="sm" aria-label="Settings" />
 * 
 * @example
 * // Close button
 * <IconButton icon={X} variant="close" size="sm" aria-label="Close" />
 */
export const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
    ({ className, variant, size, radius, icon: IconComponent, loading, disabled, ...props }, ref) => {
        return (
            <button
                className={cn(iconButtonVariants({ variant, size, radius }), className)}
                ref={ref}
                disabled={disabled || loading}
                {...props}
            >
                {loading ? (
                    <svg className="h-full w-full animate-spin" viewBox="0 0 24 24">
                        <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                            fill="none"
                        />
                        <path
                            className="opacity-75"
                            fill="currentColor"
                            d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                    </svg>
                ) : (
                    <IconComponent className="h-full w-full" />
                )}
            </button>
        );
    }
);

IconButton.displayName = 'IconButton';

export { iconButtonVariants };
