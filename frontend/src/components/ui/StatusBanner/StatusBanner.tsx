/**
 * StatusBanner component for displaying contextual information and alerts
 */

import { cva, type VariantProps } from 'class-variance-authority';
import { AlertCircle, CheckCircle, Info, X, XCircle } from 'lucide-react';
import React from 'react';
import { cn } from '@/utils';
import { Icon } from '@/components/ui';

const statusBannerVariants = cva(
    'rounded-lg border p-4 flex items-start gap-3',
    {
        variants: {
            variant: {
                info: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-900 dark:text-blue-100',
                success: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-900 dark:text-green-100',
                warning: 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800 text-yellow-900 dark:text-yellow-100',
                error: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-900 dark:text-red-100',
            },
        },
        defaultVariants: {
            variant: 'info',
        },
    }
);

const iconVariants: Record<string, React.ComponentType<{ className?: string }>> = {
    info: Info,
    success: CheckCircle,
    warning: AlertCircle,
    error: XCircle,
};

const iconColorVariants: Record<string, string> = {
    info: 'text-blue-600 dark:text-blue-400',
    success: 'text-green-600 dark:text-green-400',
    warning: 'text-yellow-600 dark:text-yellow-400',
    error: 'text-red-600 dark:text-red-400',
};

export interface StatusBannerProps extends VariantProps<typeof statusBannerVariants> {
    /** Variant of the banner */
    variant: 'info' | 'success' | 'warning' | 'error';
    /** Main title text */
    title: string;
    /** Optional description text */
    description?: React.ReactNode;
    /** Optional custom icon component */
    icon?: React.ComponentType<{ className?: string }>;
    /** Optional action element (button, link, etc.) */
    action?: React.ReactNode;
    /** Custom className */
    className?: string;
    /** Optional close handler */
    onClose?: () => void;
}

/**
 * StatusBanner component for contextual information display
 * 
 * Usage:
 * <StatusBanner
 *   variant="info"
 *   title="Share Link Active"
 *   description="Anyone with the link can view this watchlist"
 *   action={<Button size="sm">Copy Link</Button>}
 *   onClose={handleClose}
 * />
 */
export const StatusBanner: React.FC<StatusBannerProps> = ({
    variant,
    title,
    description,
    icon: CustomIcon,
    action,
    className,
    onClose,
}) => {
    const IconComponent = CustomIcon || iconVariants[variant];
    const iconColor = iconColorVariants[variant];

    return (
        <div
            className={cn(statusBannerVariants({ variant }), className)}
            role="alert"
            aria-live="polite"
        >
            {/* Icon */}
            <div className="flex-shrink-0">
                <Icon as={IconComponent} size="md" className={iconColor} />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-sm mb-1">
                    {title}
                </h4>
                {description && (
                    <p className="text-sm opacity-90">
                        {description}
                    </p>
                )}
                {action && (
                    <div className="mt-3">
                        {action}
                    </div>
                )}
            </div>

            {/* Close Button */}
            {onClose && (
                <button
                    onClick={onClose}
                    className={cn(
                        'flex-shrink-0 p-1 rounded hover:bg-black/5 dark:hover:bg-white/5 transition-colors',
                        iconColor
                    )}
                    aria-label="Close banner"
                >
                    <X className="w-4 h-4" />
                </button>
            )}
        </div>
    );
};
