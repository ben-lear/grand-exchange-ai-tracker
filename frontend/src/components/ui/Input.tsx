/**
 * Input component library with comprehensive variant system
 * Provides reusable input fields with consistent styling and behavior
 */

import { type VariantProps, cva } from 'class-variance-authority';
import { forwardRef } from 'react';
import { cn } from '../../utils';

// Input variant styles using class-variance-authority
const inputVariants = cva(
  // Base styles - common to all inputs
  'w-full transition-colors focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50',
  {
    variants: {
      variant: {
        // Default input style
        default: 'bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400',
        
        // Error state
        error: 'bg-white dark:bg-gray-700 border-2 border-red-500 dark:border-red-400 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-red-500',
        
        // Success state
        success: 'bg-white dark:bg-gray-700 border-2 border-green-500 dark:border-green-400 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-green-500',
        
        // Search input style
        search: 'bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400',
      },
      size: {
        sm: 'px-2 py-1 text-sm rounded-md',
        base: 'px-3 py-2 text-sm rounded-lg',
        lg: 'px-4 py-3 text-base rounded-lg',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'base',
    },
  }
);

export interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'>,
    VariantProps<typeof inputVariants> {
  /** Icon to display on the left side */
  leftIcon?: React.ReactNode;
  /** Icon to display on the right side */
  rightIcon?: React.ReactNode;
  /** Additional container class name */
  containerClassName?: string;
}

/**
 * Input component with support for variants, sizes, and icons
 * 
 * @example
 * // Basic input
 * <Input placeholder="Enter text..." />
 * 
 * @example
 * // With icons
 * <Input leftIcon={<Search />} placeholder="Search..." />
 * 
 * @example
 * // Error state
 * <Input variant="error" placeholder="Invalid input" />
 * 
 * @example
 * // Number input with size
 * <Input type="number" size="sm" placeholder="Amount" />
 */
export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, containerClassName, variant, size, leftIcon, rightIcon, ...props }, ref) => {
    // If no icons, render simple input
    if (!leftIcon && !rightIcon) {
      return (
        <input
          ref={ref}
          className={cn(inputVariants({ variant, size }), className)}
          {...props}
        />
      );
    }

    // With icons, wrap in container
    return (
      <div className={cn('relative', containerClassName)}>
        {leftIcon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
            {leftIcon}
          </div>
        )}
        <input
          ref={ref}
          className={cn(
            inputVariants({ variant, size }),
            leftIcon && 'pl-9',
            rightIcon && 'pr-9',
            className
          )}
          {...props}
        />
        {rightIcon && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
            {rightIcon}
          </div>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export { inputVariants };
