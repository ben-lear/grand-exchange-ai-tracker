/**
 * Generic dropdown container component
 * Handles positioning, click-outside close, and optional footer
 */

import { useEffect, useRef, type ReactNode, type RefObject } from 'react';
import { cn } from '@/utils';

export interface DropdownProps {
    /** Whether the dropdown is open */
    isOpen: boolean;
    /** Called when dropdown should close (click outside, etc.) */
    onClose: () => void;
    /** Dropdown content (usually DropdownItem components) */
    children: ReactNode;
    /** Optional footer content (e.g., loading indicator) */
    footer?: ReactNode;
    /** Additional classes for the dropdown container */
    className?: string;
    /** Max height class (default: max-h-80) */
    maxHeight?: string;
    /** Optional ref for the list element (for scroll control) */
    listRef?: RefObject<HTMLUListElement>;
}

/**
 * Dropdown container with click-outside handling
 *
 * @example
 * ```tsx
 * <Dropdown isOpen={isOpen} onClose={() => setIsOpen(false)}>
 *   <DropdownItem isSelected={true} onClick={handleClick} onMouseEnter={handleHover}>
 *     Item content
 *   </DropdownItem>
 * </Dropdown>
 * ```
 */
export function Dropdown({
    isOpen,
    onClose,
    children,
    footer,
    className = '',
    maxHeight = 'max-h-80',
    listRef,
}: DropdownProps) {
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Close on click outside
    useEffect(() => {
        if (!isOpen) return;

        function handleClickOutside(e: MouseEvent) {
            if (
                dropdownRef.current &&
                !dropdownRef.current.contains(e.target as Node)
            ) {
                onClose();
            }
        }

        // Use mousedown so clicking the trigger doesn't immediately close
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div
            ref={dropdownRef}
            className={cn(
                'absolute top-full left-0 right-0 mt-1',
                'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700',
                'rounded-lg shadow-xl z-50 overflow-hidden',
                className
            )}
        >
            <ul ref={listRef} role="listbox" className={cn(maxHeight, 'overflow-y-auto')}>
                {children}
            </ul>
            {footer}
        </div>
    );
}
