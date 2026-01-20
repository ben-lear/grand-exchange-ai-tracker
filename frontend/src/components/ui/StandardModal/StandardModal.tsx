/**
 * StandardModal - Reusable modal wrapper with consistent styling and behavior
 *
 * Wraps HeadlessUI Dialog + Transition with a standard layout pattern.
 * Reduces boilerplate in modal implementations by ~80 lines each.
 */

import { Dialog, Transition } from '@headlessui/react';
import { cva, type VariantProps } from 'class-variance-authority';
import { X } from 'lucide-react';
import React, { Fragment } from 'react';
import { cn } from '@/utils';
import { Icon, Stack } from '@/components/ui';

const modalSizeVariants = cva('w-full transform overflow-hidden rounded-lg bg-white dark:bg-gray-800 text-left align-middle shadow-xl transition-all', {
    variants: {
        size: {
            sm: 'max-w-sm',
            md: 'max-w-md',
            lg: 'max-w-lg',
            xl: 'max-w-xl',
            '2xl': 'max-w-2xl',
        },
    },
    defaultVariants: {
        size: 'md',
    },
});

export interface StandardModalProps extends VariantProps<typeof modalSizeVariants> {
    /** Whether the modal is open */
    isOpen: boolean;
    /** Called when modal should close */
    onClose: () => void;
    /** Modal title */
    title: string;
    /** Optional icon component to display next to the title */
    icon?: React.ComponentType<{ className?: string }>;
    /** Icon color variant */
    iconColor?: 'default' | 'primary' | 'success' | 'warning' | 'error';
    /** Modal content */
    children: React.ReactNode;
    /** Optional footer content (buttons, etc.) */
    footer?: React.ReactNode;
    /** Whether close button is disabled (e.g., during form submission) */
    closeDisabled?: boolean;
    /** Additional className for the modal panel */
    className?: string;
    /** Whether clicking backdrop closes the modal (default: true) */
    closeOnBackdropClick?: boolean;
    /** Whether to show the close button in header (default: true) */
    showCloseButton?: boolean;
}

const iconColorClasses = {
    default: 'text-gray-600 dark:text-gray-400',
    primary: 'text-blue-600 dark:text-blue-400',
    success: 'text-green-600 dark:text-green-400',
    warning: 'text-yellow-600 dark:text-yellow-400',
    error: 'text-red-600 dark:text-red-400',
};

/**
 * Standard modal wrapper with consistent animations, styling, and accessibility
 *
 * @example
 * ```tsx
 * <StandardModal
 *   isOpen={isOpen}
 *   onClose={() => setIsOpen(false)}
 *   title="Create Watchlist"
 *   icon={FolderPlus}
 *   iconColor="primary"
 *   footer={
 *     <div className="flex gap-3">
 *       <Button variant="secondary" onClick={handleCancel}>Cancel</Button>
 *       <Button variant="primary" onClick={handleSubmit}>Create</Button>
 *     </div>
 *   }
 * >
 *   <form>{...}</form>
 * </StandardModal>
 * ```
 */
export function StandardModal({
    isOpen,
    onClose,
    title,
    icon: IconComponent,
    iconColor = 'primary',
    children,
    footer,
    size = 'md',
    closeDisabled = false,
    className,
    closeOnBackdropClick = true,
    showCloseButton = true,
}: StandardModalProps): React.ReactElement {
    const handleClose = () => {
        if (!closeDisabled) {
            onClose();
        }
    };

    return (
        <Transition appear show={isOpen} as={Fragment}>
            <Dialog
                as="div"
                className="relative z-50"
                onClose={closeOnBackdropClick ? handleClose : () => { }}
            >
                {/* Backdrop */}
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-black/50" aria-hidden="true" />
                </Transition.Child>

                {/* Modal container */}
                <div className="fixed inset-0 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4">
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0 scale-95"
                            enterTo="opacity-100 scale-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100 scale-100"
                            leaveTo="opacity-0 scale-95"
                        >
                            <Dialog.Panel className={cn(modalSizeVariants({ size }), className)}>
                                {/* Header */}
                                <Stack
                                    direction="row"
                                    align="center"
                                    justify="between"
                                    className="p-4 border-b border-gray-200 dark:border-gray-700"
                                >
                                    <Stack direction="row" align="center" gap={2}>
                                        {IconComponent && (
                                            <Icon
                                                as={IconComponent}
                                                size="md"
                                                className={iconColorClasses[iconColor]}
                                            />
                                        )}
                                        <Dialog.Title className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                                            {title}
                                        </Dialog.Title>
                                    </Stack>
                                    {showCloseButton && (
                                        <button
                                            type="button"
                                            onClick={handleClose}
                                            disabled={closeDisabled}
                                            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                            aria-label="Close modal"
                                        >
                                            <Icon as={X} size="md" color="muted" />
                                        </button>
                                    )}
                                </Stack>

                                {/* Content */}
                                <div className="p-4">{children}</div>

                                {/* Footer (optional) */}
                                {footer && (
                                    <div className="p-4 pt-0">
                                        {footer}
                                    </div>
                                )}
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
}
