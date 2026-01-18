/**
 * Modal component library with comprehensive variant system
 * Provides reusable modal dialogs with backdrop and focus management
 */

import { type VariantProps, cva } from 'class-variance-authority';
import { X } from 'lucide-react';
import { forwardRef, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '../../utils';
import { Button } from './Button';

// Modal backdrop styles
const backdropVariants = cva(
    'modal-backdrop',
    {
        variants: {
            backdrop: {
                blur: 'modal-backdrop-blur',
                solid: 'modal-backdrop-solid',
                light: 'modal-backdrop-light',
            },
        },
        defaultVariants: {
            backdrop: 'blur',
        },
    }
);

// Modal container styles
const modalVariants = cva(
    'modal-container',
    {
        variants: {
            size: {
                sm: 'w-full max-w-sm mx-4',
                base: 'w-full max-w-md mx-4',
                lg: 'w-full max-w-lg mx-4',
                xl: 'w-full max-w-xl mx-4',
                '2xl': 'w-full max-w-2xl mx-4',
                '3xl': 'w-full max-w-3xl mx-4',
                '4xl': 'w-full max-w-4xl mx-4',
                full: 'w-full h-full m-0 rounded-none',
            },
        },
        defaultVariants: {
            size: 'base',
        },
    }
);

const modalHeaderVariants = cva(
    'flex items-center justify-between p-4 border-b border-divider flex-shrink-0'
);

const modalBodyVariants = cva('flex-1 overflow-y-auto p-4');

const modalFooterVariants = cva(
    'flex items-center justify-end gap-2 p-4 border-t border-divider flex-shrink-0'
);

export interface ModalProps
    extends VariantProps<typeof modalVariants>,
    VariantProps<typeof backdropVariants> {
    /** Whether the modal is open */
    isOpen: boolean;
    /** Called when modal should close */
    onClose: () => void;
    /** Modal title */
    title?: string;
    /** Whether to show close button */
    showCloseButton?: boolean;
    /** Modal content */
    children: React.ReactNode;
    /** Additional className for modal container */
    className?: string;
    /** Additional className for backdrop */
    backdropClassName?: string;
}

export interface ModalHeaderProps extends React.HTMLAttributes<HTMLDivElement> { }
export interface ModalBodyProps extends React.HTMLAttributes<HTMLDivElement> { }
export interface ModalFooterProps extends React.HTMLAttributes<HTMLDivElement> { }

/**
 * Modal component with backdrop and focus management
 * 
 * @example
 * // Basic modal
 * <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Confirmation">
 *   <p>Are you sure you want to continue?</p>
 * </Modal>
 * 
 * @example
 * // Large modal with custom content
 * <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} size="lg">
 *   <ModalHeader>
 *     <h2>Custom Title</h2>
 *   </ModalHeader>
 *   <ModalBody>
 *     <p>Custom body content</p>
 *   </ModalBody>
 *   <ModalFooter>
 *     <Button variant="secondary" onClick={() => setIsOpen(false)}>Cancel</Button>
 *     <Button variant="primary" onClick={handleSave}>Save</Button>
 *   </ModalFooter>
 * </Modal>
 */
export const Modal = forwardRef<HTMLDivElement, ModalProps>(
    (
        {
            isOpen,
            onClose,
            title,
            showCloseButton = true,
            size,
            backdrop,
            children,
            className,
            backdropClassName,
        },
        ref
    ) => {
        const modalRef = useRef<HTMLDivElement>(null);

        // Handle escape key
        useEffect(() => {
            const handleEscape = (event: KeyboardEvent) => {
                if (event.key === 'Escape' && isOpen) {
                    onClose();
                }
            };

            if (isOpen) {
                document.addEventListener('keydown', handleEscape);
                document.body.style.overflow = 'hidden';
            }

            return () => {
                document.removeEventListener('keydown', handleEscape);
                document.body.style.overflow = '';
            };
        }, [isOpen, onClose]);

        // Focus management
        useEffect(() => {
            if (isOpen && modalRef.current) {
                const focusableElements = modalRef.current.querySelectorAll(
                    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
                );
                const firstElement = focusableElements[0] as HTMLElement;
                if (firstElement) {
                    firstElement.focus();
                }
            }
        }, [isOpen]);

        if (!isOpen) return null;

        const handleBackdropClick = (e: React.MouseEvent) => {
            if (e.target === e.currentTarget) {
                onClose();
            }
        };

        return createPortal(
            <div
                className={cn(backdropVariants({ backdrop }), backdropClassName)}
                onClick={handleBackdropClick}
                role="dialog"
                aria-modal="true"
                aria-labelledby={title ? 'modal-title' : undefined}
            >
                <div
                    ref={ref || modalRef}
                    className={cn(modalVariants({ size }), className)}
                    onClick={(e) => e.stopPropagation()}
                >
                    {(title || showCloseButton) && (
                        <ModalHeader>
                            {title && (
                                <h2 id="modal-title" className="text-lg font-semibold text-gray-900 dark:text-white">
                                    {title}
                                </h2>
                            )}
                            {showCloseButton && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={onClose}
                                    aria-label="Close modal"
                                    className="ml-auto"
                                >
                                    <X className="w-4 h-4" />
                                </Button>
                            )}
                        </ModalHeader>
                    )}

                    <ModalBody>{children}</ModalBody>
                </div>
            </div>,
            document.body
        );
    }
);

/**
 * Modal header component for custom headers
 */
export const ModalHeader = forwardRef<HTMLDivElement, ModalHeaderProps>(
    ({ className, ...props }, ref) => {
        return (
            <div
                ref={ref}
                className={cn(modalHeaderVariants(), className)}
                {...props}
            />
        );
    }
);

/**
 * Modal body component for scrollable content
 */
export const ModalBody = forwardRef<HTMLDivElement, ModalBodyProps>(
    ({ className, ...props }, ref) => {
        return (
            <div
                ref={ref}
                className={cn(modalBodyVariants(), className)}
                {...props}
            />
        );
    }
);

/**
 * Modal footer component for actions
 */
export const ModalFooter = forwardRef<HTMLDivElement, ModalFooterProps>(
    ({ className, ...props }, ref) => {
        return (
            <div
                ref={ref}
                className={cn(modalFooterVariants(), className)}
                {...props}
            />
        );
    }
);

Modal.displayName = 'Modal';
ModalHeader.displayName = 'ModalHeader';
ModalBody.displayName = 'ModalBody';
ModalFooter.displayName = 'ModalFooter';

export { backdropVariants, modalBodyVariants, modalFooterVariants, modalHeaderVariants, modalVariants };

