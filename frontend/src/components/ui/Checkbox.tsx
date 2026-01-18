/**
 * Checkbox component library with comprehensive variant system
 * Provides reusable checkbox inputs with consistent styling and label support
 */

import { type VariantProps, cva } from 'class-variance-authority';
import { forwardRef } from 'react';
import { cn } from '../../utils';

// Checkbox variant styles using class-variance-authority
const checkboxVariants = cva(
    // Base styles - common to all checkboxes
    'rounded border-gray-300 dark:border-gray-600 dark:bg-gray-700 text-blue-600 focus:ring-blue-500 focus:ring-2 focus:ring-offset-0 transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-50',
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

export interface CheckboxProps
    extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size' | 'type'>,
    VariantProps<typeof checkboxVariants> {
    /** Label text to display next to checkbox */
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
 * Checkbox component with support for sizes, labels, and descriptions
 * 
 * @example
 * // Basic checkbox
 * <Checkbox checked={value} onChange={(e) => setValue(e.target.checked)} />
 * 
 * @example
 * // With label
 * <Checkbox label="Accept terms" checked={accepted} onChange={(e) => setAccepted(e.target.checked)} />
 * 
 * @example
 * // With label and description
 * <Checkbox
 *   label="Send notifications"
 *   description="Receive email notifications about price changes"
 *   checked={notify}
 *   onChange={(e) => setNotify(e.target.checked)}
 * />
 * 
 * @example
 * // Disabled state
 * <Checkbox label="Required field" checked disabled />
 */
export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
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
        const checkboxId = id || `checkbox-${Math.random().toString(36).substr(2, 9)}`;

        // If no label, render simple checkbox
        if (!label && !description) {
            return (
                <input
                    ref={ref}
                    id={checkboxId}
                    type="checkbox"
                    className={cn(checkboxVariants({ size }), className)}
                    {...props}
                />
            );
        }

        // With label, wrap in container
        return (
            <div className={cn('flex items-start gap-2', containerClassName)}>
                <input
                    ref={ref}
                    id={checkboxId}
                    type="checkbox"
                    className={cn(
                        checkboxVariants({ size }),
                        description && 'mt-0.5',
                        className
                    )}
                    {...props}
                />
                {(label || description) && (
                    <div className="flex-1">
                        {label && (
                            <label
                                htmlFor={checkboxId}
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

Checkbox.displayName = 'Checkbox';

export { checkboxVariants };

