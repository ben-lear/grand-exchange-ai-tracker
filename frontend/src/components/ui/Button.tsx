/**
 * Button component library with comprehensive variant system
 * Supports all common button patterns used throughout the application
 */

import { type VariantProps, cva } from 'class-variance-authority';
import React from 'react';
import { cn } from '../../utils';

// Button variant styles using class-variance-authority
const buttonVariants = cva(
  // Base styles - common to all buttons
  'inline-flex items-center justify-center font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        // Primary action buttons
        primary: 'bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800',

        // Secondary action buttons
        secondary: 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 hover:text-gray-900 dark:hover:text-gray-100',

        // Destructive actions
        destructive: 'bg-red-600 text-white hover:bg-red-700 active:bg-red-800',

        // Subtle actions
        ghost: 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700',

        // Menu items and dropdowns
        menu: 'w-full text-left text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700',

        // Toolbar buttons
        toolbar: 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700',

        // Active/selected state (for toggles, tabs)
        active: 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm',

        // Inactive state (for toggles, tabs)
        inactive: 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200',

        // Error/retry actions
        error: 'text-red-700 dark:text-red-300 bg-red-100 dark:bg-red-900 hover:bg-red-200 dark:hover:bg-red-800',

        // Close buttons
        close: 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300',
      },
      size: {
        sm: 'h-8 px-3 text-sm',
        default: 'h-10 px-4 py-2',
        lg: 'h-12 px-6 py-3',
        icon: 'h-10 w-10 p-2',
        'icon-sm': 'h-8 w-8 p-1.5',
        'icon-lg': 'h-12 w-12 p-3',
      },
      radius: {
        default: 'rounded-lg',
        sm: 'rounded',
        md: 'rounded-md',
        lg: 'rounded-lg',
        xl: 'rounded-xl',
        full: 'rounded-full',
      },
      width: {
        default: '',
        full: 'w-full',
        auto: 'w-auto',
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
      variant: 'secondary',
      size: 'default',
      radius: 'default',
      width: 'default',
      gap: 2,
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
  VariantProps<typeof buttonVariants> {
  /** Button content */
  children?: React.ReactNode;
  /** Loading state */
  loading?: boolean;
  /** Icon to display before text */
  leftIcon?: React.ReactNode;
  /** Icon to display after text */
  rightIcon?: React.ReactNode;
}

/**
 * Versatile Button component with comprehensive variant system
 * 
 * @example
 * // Primary action button
 * <Button variant="primary">Save Changes</Button>
 * 
 * // Secondary button with icon
 * <Button variant="secondary" leftIcon={<Download />}>Export</Button>
 * 
 * // Icon-only button
 * <Button variant="ghost" size="icon" aria-label="Close">
 *   <X />
 * </Button>
 * 
 * // Toolbar button
 * <Button variant="toolbar" size="icon-sm">
 *   <RefreshCw />
 * </Button>
 * 
 * // Menu item
 * <Button variant="menu" width="full">Menu Item</Button>
 */
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({
    className,
    variant,
    size,
    radius,
    width,
    gap,
    children,
    loading,
    leftIcon,
    rightIcon,
    disabled,
    ...props
  }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, radius, width, gap, className }))}
        ref={ref}
        disabled={disabled || loading}
        {...props}
      >
        {loading && (
          <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24">
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
        )}
        {!loading && leftIcon}
        {children}
        {!loading && rightIcon}
      </button>
    );
  }
);

Button.displayName = 'Button';

// Export types for external use
export { buttonVariants };
export type { VariantProps };

