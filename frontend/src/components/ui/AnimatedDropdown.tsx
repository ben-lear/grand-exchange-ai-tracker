/**
 * AnimatedDropdown - Reusable animated dropdown wrapper
 *
 * Wraps HeadlessUI Transition + Menu pattern for consistent dropdown animations.
 * Provides a simpler API for creating animated dropdown menus.
 */

import { Menu, Transition } from '@headlessui/react';
import React, { Fragment } from 'react';
import { cn } from '../../utils';

export interface AnimatedDropdownProps {
    /** Whether the dropdown is open */
    isOpen: boolean;
    /** Called when dropdown should close */
    onClose: () => void;
    /** Trigger element (button, icon, etc.) */
    trigger: React.ReactNode;
    /** Dropdown content */
    children: React.ReactNode;
    /** Alignment of the dropdown (default: right) */
    align?: 'left' | 'right';
    /** Additional className for the dropdown panel */
    className?: string;
    /** Additional className for the trigger wrapper */
    triggerClassName?: string;
    /** Width of the dropdown panel */
    width?: 'auto' | 'sm' | 'md' | 'lg' | 'full';
    /** Max height with overflow scroll */
    maxHeight?: string;
}

const widthClasses = {
    auto: 'w-auto min-w-[12rem]',
    sm: 'w-48',
    md: 'w-56',
    lg: 'w-64',
    full: 'w-full',
};

/**
 * Animated dropdown with HeadlessUI transitions
 *
 * @example
 * ```tsx
 * <AnimatedDropdown
 *   isOpen={isOpen}
 *   onClose={() => setIsOpen(false)}
 *   trigger={<button onClick={() => setIsOpen(!isOpen)}>Open</button>}
 *   align="right"
 * >
 *   <DropdownItem onClick={handleOption1}>Option 1</DropdownItem>
 *   <DropdownItem onClick={handleOption2}>Option 2</DropdownItem>
 * </AnimatedDropdown>
 * ```
 */
export function AnimatedDropdown({
    isOpen,
    trigger,
    children,
    align = 'right',
    className,
    triggerClassName,
    width = 'sm',
    maxHeight = 'max-h-80',
}: AnimatedDropdownProps): React.ReactElement {
    return (
        <Menu as="div" className="relative">
            {() => (
                <>
                    <div className={triggerClassName}>{trigger}</div>

                    <Transition
                        as={Fragment}
                        show={isOpen}
                        enter="transition ease-out duration-100"
                        enterFrom="transform opacity-0 scale-95"
                        enterTo="transform opacity-100 scale-100"
                        leave="transition ease-in duration-75"
                        leaveFrom="transform opacity-100 scale-100"
                        leaveTo="transform opacity-0 scale-95"
                    >
                        <Menu.Items
                            static
                            className={cn(
                                'absolute mt-2 bg-white dark:bg-gray-800',
                                'border border-gray-200 dark:border-gray-700',
                                'rounded-lg shadow-lg z-50',
                                'focus:outline-none',
                                maxHeight,
                                'overflow-y-auto',
                                widthClasses[width],
                                align === 'right' ? 'right-0 origin-top-right' : 'left-0 origin-top-left',
                                className
                            )}
                        >
                            <div className="py-1">{children}</div>
                        </Menu.Items>
                    </Transition>
                </>
            )}
        </Menu>
    );
}

/**
 * AnimatedDropdownItem - Individual dropdown item with hover states
 */
export interface AnimatedDropdownItemProps {
    /** Click handler */
    onClick: () => void;
    /** Item content */
    children: React.ReactNode;
    /** Whether this item is disabled */
    disabled?: boolean;
    /** Visual variant */
    variant?: 'default' | 'destructive';
    /** Additional className */
    className?: string;
}

export function AnimatedDropdownItem({
    onClick,
    children,
    disabled = false,
    variant = 'default',
    className,
}: AnimatedDropdownItemProps): React.ReactElement {
    return (
        <Menu.Item disabled={disabled}>
            {({ active, disabled: isDisabled }) => (
                <button
                    onClick={onClick}
                    disabled={isDisabled}
                    className={cn(
                        'w-full text-left px-4 py-2 text-sm transition-colors',
                        variant === 'destructive'
                            ? cn(
                                'text-red-600 dark:text-red-400',
                                active && 'bg-red-50 dark:bg-red-900/20'
                            )
                            : cn(
                                'text-gray-700 dark:text-gray-300',
                                active && 'bg-gray-100 dark:bg-gray-700'
                            ),
                        isDisabled && 'opacity-50 cursor-not-allowed',
                        className
                    )}
                >
                    {children}
                </button>
            )}
        </Menu.Item>
    );
}

/**
 * AnimatedDropdownDivider - Visual divider between dropdown sections
 */
export function AnimatedDropdownDivider(): React.ReactElement {
    return <div className="my-1 border-t border-gray-200 dark:border-gray-700" />;
}

/**
 * AnimatedDropdownHeader - Header/label for dropdown sections
 */
export interface AnimatedDropdownHeaderProps {
    /** Header text */
    children: React.ReactNode;
    /** Additional className */
    className?: string;
}

export function AnimatedDropdownHeader({
    children,
    className,
}: AnimatedDropdownHeaderProps): React.ReactElement {
    return (
        <div
            className={cn(
                'px-4 py-2 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide',
                className
            )}
        >
            {children}
        </div>
    );
}
