/**
 * FormField - Reusable form field wrapper component
 *
 * Provides consistent styling for form labels, inputs, errors, and hints.
 * Reduces boilerplate in forms by standardizing the field pattern.
 */

import { cva, type VariantProps } from 'class-variance-authority';
import React from 'react';
import { cn } from '@/utils';

const formFieldVariants = cva('', {
  variants: {
    size: {
      sm: 'space-y-1',
      md: 'space-y-1.5',
      lg: 'space-y-2',
    },
  },
  defaultVariants: {
    size: 'md',
  },
});

export interface FormFieldProps extends VariantProps<typeof formFieldVariants> {
  /** Label text for the field */
  label: string;
  /** HTML for attribute to associate label with input */
  htmlFor: string;
  /** The form input element(s) */
  children: React.ReactNode;
  /** Error message to display */
  error?: string;
  /** Hint text to display below the input */
  hint?: string;
  /** Whether the field is required */
  required?: boolean;
  /** Additional className for the container */
  className?: string;
  /** Whether to visually hide the label (still accessible) */
  hideLabel?: boolean;
  /** Optional description shown between label and input */
  description?: string;
}

/**
 * Form field wrapper with label, error, and hint support
 *
 * @example
 * ```tsx
 * <FormField
 *   label="Watchlist Name"
 *   htmlFor="watchlist-name"
 *   required
 *   error={errors.name}
 *   hint="Max 50 characters"
 * >
 *   <Input
 *     id="watchlist-name"
 *     value={name}
 *     onChange={(e) => setName(e.target.value)}
 *   />
 * </FormField>
 * ```
 */
export function FormField({
  label,
  htmlFor,
  children,
  error,
  hint,
  required = false,
  className,
  size = 'md',
  hideLabel = false,
  description,
}: FormFieldProps): React.ReactElement {
  const labelSizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  };

  const messageSizeClasses = {
    sm: 'text-xs',
    md: 'text-xs',
    lg: 'text-sm',
  };

  return (
    <div className={cn(formFieldVariants({ size }), className)}>
      {/* Label */}
      <label
        htmlFor={htmlFor}
        className={cn(
          'block font-medium text-gray-700 dark:text-gray-300',
          labelSizeClasses[size || 'md'],
          hideLabel && 'sr-only'
        )}
      >
        {required && (
          <span className="text-red-500 mr-0.5" aria-hidden="true">
            *
          </span>
        )}
        {label}
        {required && <span className="sr-only"> (required)</span>}
      </label>

      {/* Description (optional) */}
      {description && !hideLabel && (
        <p
          className={cn(
            'text-gray-500 dark:text-gray-400',
            messageSizeClasses[size || 'md']
          )}
        >
          {description}
        </p>
      )}

      {/* Input(s) */}
      <div>{children}</div>

      {/* Error message */}
      {error && (
        <p
          role="alert"
          className={cn(
            'text-red-600 dark:text-red-400',
            messageSizeClasses[size || 'md']
          )}
        >
          {error}
        </p>
      )}

      {/* Hint text (only shown if no error) */}
      {hint && !error && (
        <p
          className={cn(
            'text-gray-500 dark:text-gray-400',
            messageSizeClasses[size || 'md']
          )}
        >
          {hint}
        </p>
      )}
    </div>
  );
}

/**
 * Inline form field layout for horizontal forms
 */
export interface InlineFormFieldProps extends Omit<FormFieldProps, 'hideLabel'> {
  /** Width of the label column */
  labelWidth?: string;
}

export function InlineFormField({
  label,
  htmlFor,
  children,
  error,
  hint,
  required = false,
  className,
  size = 'md',
  labelWidth = 'w-32',
  description,
}: InlineFormFieldProps): React.ReactElement {
  const labelSizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  };

  const messageSizeClasses = {
    sm: 'text-xs',
    md: 'text-xs',
    lg: 'text-sm',
  };

  return (
    <div className={cn('flex items-start gap-4', className)}>
      {/* Label column */}
      <label
        htmlFor={htmlFor}
        className={cn(
          'flex-shrink-0 font-medium text-gray-700 dark:text-gray-300 pt-2',
          labelWidth,
          labelSizeClasses[size || 'md']
        )}
      >
        {required && (
          <span className="text-red-500 mr-0.5" aria-hidden="true">
            *
          </span>
        )}
        {label}
        {required && <span className="sr-only"> (required)</span>}
      </label>

      {/* Input column */}
      <div className="flex-1 space-y-1">
        {description && (
          <p
            className={cn(
              'text-gray-500 dark:text-gray-400 mb-1',
              messageSizeClasses[size || 'md']
            )}
          >
            {description}
          </p>
        )}

        {children}

        {error && (
          <p
            role="alert"
            className={cn(
              'text-red-600 dark:text-red-400',
              messageSizeClasses[size || 'md']
            )}
          >
            {error}
          </p>
        )}

        {hint && !error && (
          <p
            className={cn(
              'text-gray-500 dark:text-gray-400',
              messageSizeClasses[size || 'md']
            )}
          >
            {hint}
          </p>
        )}
      </div>
    </div>
  );
}
