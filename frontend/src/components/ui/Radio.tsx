/**
 * Radio component library with consistent styling
 * Provides reusable radio inputs with label support
 */

import { type VariantProps, cva } from 'class-variance-authority';
import { forwardRef } from 'react';
import { cn } from '../../utils';

// Radio variant styles using class-variance-authority
const radioVariants = cva(
  // Base styles - common to all radio buttons
  'border-gray-300 text-blue-600 focus:ring-blue-500 focus:ring-2 focus:ring-offset-0 transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:bg-gray-700',
  {
    variants: {
      size: {
        sm: 'w-3.5 h-3.5',
        base: 'w-4 h-4',
        lg: 'w-5 h-5',
      },
    },
    defaultVariants: {
      size: 'base',
    },
  }
);

export interface RadioProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size' | 'type'>,
    VariantProps<typeof radioVariants> {
  /** Label text to display next to radio */
  label?: string;
  /** Description text to display below label */
  description?: string;
  /** Additional class for the container */
  containerClassName?: string;
  /** Additional class for the label */
  labelClassName?: string;
  /** Additional class for the description */
  descriptionClassName?: string;
}

/**
 * Radio component with support for sizes, labels, and descriptions
 * 
 * @example
 * // Basic radio
 * <Radio name="option" value="a" checked={value === 'a'} onChange={(e) => setValue(e.target.value)} />
 * 
 * @example
 * // With label
 * <Radio name="membership" value="members" label="Members Only" checked={value === 'members'} onChange={(e) => setValue(e.target.value)} />
 * 
 * @example
 * // With label and description
 * <Radio
 *   name="tier"
 *   value="premium"
 *   label="Premium"
 *   description="Access to all features"
 *   checked={tier === 'premium'}
 *   onChange={(e) => setTier(e.target.value)}
 * />
 */
export const Radio = forwardRef<HTMLInputElement, RadioProps>(
  (
    {
      className,
      containerClassName,
      labelClassName,
      descriptionClassName,
      size,
      label,
      description,
      id,
      ...props
    },
    ref
  ) => {
    // Generate ID if not provided (for label association)
    const radioId = id || `radio-${Math.random().toString(36).substr(2, 9)}`;

    // If no label, render simple radio
    if (!label && !description) {
      return (
        <input
          ref={ref}
          id={radioId}
          type="radio"
          className={cn(radioVariants({ size }), className)}
          {...props}
        />
      );
    }

    // With label, wrap in container
    return (
      <div className={cn('flex items-start gap-2', containerClassName)}>
        <input
          ref={ref}
          id={radioId}
          type="radio"
          className={cn(
            radioVariants({ size }),
            description && 'mt-0.5',
            className
          )}
          {...props}
        />
        {(label || description) && (
          <div className="flex-1">
            {label && (
              <label
                htmlFor={radioId}
                className={cn(
                  'text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer',
                  props.disabled && 'cursor-not-allowed opacity-50',
                  labelClassName
                )}
              >
                {label}
              </label>
            )}
            {description && (
              <p
                className={cn(
                  'text-xs text-gray-500 dark:text-gray-400 mt-0.5',
                  props.disabled && 'opacity-50',
                  descriptionClassName
                )}
              >
                {description}
              </p>
            )}
          </div>
        )}
      </div>
    );
  }
);

Radio.displayName = 'Radio';

export { radioVariants };
