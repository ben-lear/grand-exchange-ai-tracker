/**
 * Badge component library with comprehensive variant system
 * Provides reusable badges/tags with consistent styling
 */

import { type VariantProps, cva } from 'class-variance-authority';
import { forwardRef } from 'react';
import { cn } from '../../utils';

// Badge variant styles using class-variance-authority
const badgeVariants = cva(
  // Base styles - common to all badges
  'inline-flex items-center font-medium',
  {
    variants: {
      variant: {
        // Default gray badge
        default: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
        
        // Primary blue badge
        primary: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
        
        // Secondary purple badge
        secondary: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
        
        // Success green badge
        success: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
        
        // Warning yellow/amber badge (P2P - members)
        warning: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',
        
        // Error red badge
        error: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
        
        // Info cyan badge
        info: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200',
      },
      size: {
        sm: 'px-1.5 py-0.5 text-xs',
        base: 'px-2 py-1 text-xs',
        lg: 'px-2.5 py-1 text-sm',
      },
      shape: {
        square: 'rounded',
        rounded: 'rounded-md',
        pill: 'rounded-full',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'base',
      shape: 'pill',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {
  /** Icon to display before the text */
  icon?: React.ReactNode;
}

/**
 * Badge component with support for variants, sizes, and shapes
 * 
 * @example
 * // Basic badge
 * <Badge>Default</Badge>
 * 
 * @example
 * // P2P membership badge
 * <Badge variant="warning">P2P</Badge>
 * 
 * @example
 * // F2P membership badge
 * <Badge variant="default">F2P</Badge>
 * 
 * @example
 * // Success badge with icon
 * <Badge variant="success" icon={<Check />}>Verified</Badge>
 * 
 * @example
 * // Small size badge
 * <Badge size="sm" variant="info">New</Badge>
 */
export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant, size, shape, icon, children, ...props }, ref) => {
    return (
      <span
        ref={ref}
        className={cn(badgeVariants({ variant, size, shape }), className)}
        {...props}
      >
        {icon && <span className="mr-1">{icon}</span>}
        {children}
      </span>
    );
  }
);

Badge.displayName = 'Badge';

export { badgeVariants };
