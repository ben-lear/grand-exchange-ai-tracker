/**
 * Alert component library with comprehensive variant system
 * Provides reusable alert notifications with consistent styling and behavior
 */

import { type VariantProps, cva } from 'class-variance-authority';
import { AlertCircle, CheckCircle, Info, X, XCircle } from 'lucide-react';
import { forwardRef } from 'react';
import { cn } from '../../utils';
import { Button } from './Button';

// Alert variant styles using class-variance-authority
const alertVariants = cva(
  // Base styles - common to all alerts
  'rounded-lg border p-4',
  {
    variants: {
      variant: {
        // Info alert (blue)
        info: 'bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-950 dark:border-blue-900 dark:text-blue-200',
        
        // Success alert (green)
        success: 'bg-green-50 border-green-200 text-green-800 dark:bg-green-950 dark:border-green-900 dark:text-green-200',
        
        // Warning alert (yellow/amber)
        warning: 'bg-amber-50 border-amber-200 text-amber-800 dark:bg-amber-950 dark:border-amber-900 dark:text-amber-200',
        
        // Error alert (red)
        error: 'bg-red-50 border-red-200 text-red-800 dark:bg-red-950 dark:border-red-900 dark:text-red-200',
      },
      size: {
        sm: 'text-sm',
        base: 'text-sm',
        lg: 'text-base',
      },
    },
    defaultVariants: {
      variant: 'info',
      size: 'base',
    },
  }
);

// Get the appropriate icon for each variant
const getAlertIcon = (variant: 'info' | 'success' | 'warning' | 'error') => {
  switch (variant) {
    case 'info':
      return Info;
    case 'success':
      return CheckCircle;
    case 'warning':
      return AlertCircle;
    case 'error':
      return XCircle;
    default:
      return Info;
  }
};

// Get icon color classes for each variant
const getIconColor = (variant: 'info' | 'success' | 'warning' | 'error') => {
  switch (variant) {
    case 'info':
      return 'text-blue-600 dark:text-blue-400';
    case 'success':
      return 'text-green-600 dark:text-green-400';
    case 'warning':
      return 'text-amber-600 dark:text-amber-400';
    case 'error':
      return 'text-red-600 dark:text-red-400';
    default:
      return 'text-blue-600 dark:text-blue-400';
  }
};

export interface AlertProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof alertVariants> {
  /** Alert title */
  title?: string;
  /** Alert description/message */
  description?: string;
  /** Custom icon (overrides default variant icon) */
  icon?: React.ReactNode;
  /** Whether to show the default icon */
  showIcon?: boolean;
  /** Close handler - if provided, close button will be shown */
  onClose?: () => void;
  /** Children content (used instead of description if provided) */
  children?: React.ReactNode;
}

/**
 * Alert component with support for variants, icons, and dismissal
 * 
 * @example
 * // Basic alert
 * <Alert variant="info" title="Information" description="This is an info message." />
 * 
 * @example
 * // Dismissible alert
 * <Alert 
 *   variant="error" 
 *   title="Error occurred" 
 *   description="Please try again later"
 *   onClose={() => console.log('Alert dismissed')}
 * />
 * 
 * @example
 * // Custom content
 * <Alert variant="warning">
 *   <h4>Custom Warning</h4>
 *   <p>This alert has custom JSX content.</p>
 * </Alert>
 * 
 * @example
 * // No icon
 * <Alert variant="success" showIcon={false} title="Success!" />
 */
export const Alert = forwardRef<HTMLDivElement, AlertProps>(
  (
    {
      className,
      variant = 'info',
      size,
      title,
      description,
      icon,
      showIcon = true,
      onClose,
      children,
      ...props
    },
    ref
  ) => {
    const IconComponent = icon ? null : getAlertIcon(variant || 'info');
    const iconColorClass = getIconColor(variant || 'info');
    
    return (
      <div
        ref={ref}
        className={cn(alertVariants({ variant, size }), className)}
        role="alert"
        {...props}
      >
        <div className="flex items-start gap-3">
          {/* Icon */}
          {showIcon && (
            <div className={cn('flex-shrink-0', iconColorClass)}>
              {icon || (IconComponent && <IconComponent className="w-5 h-5 mt-0.5" />)}
            </div>
          )}

          {/* Content */}
          <div className="flex-1 min-w-0">
            {title && (
              <h3 className="font-semibold mb-1">
                {title}
              </h3>
            )}
            
            {children ? (
              children
            ) : description ? (
              <p className="text-sm opacity-90">
                {description}
              </p>
            ) : null}
          </div>

          {/* Close button */}
          {onClose && (
            <div className="flex-shrink-0">
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                aria-label="Dismiss alert"
                className={cn(
                  'h-6 w-6 p-0',
                  iconColorClass,
                  'hover:bg-current hover:bg-opacity-10'
                )}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>
      </div>
    );
  }
);

Alert.displayName = 'Alert';

export { alertVariants };