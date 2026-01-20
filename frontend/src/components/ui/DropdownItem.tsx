/**
 * Generic dropdown item component with hover/selected states
 */

import { type ReactNode } from 'react';
import { cn } from '../../utils';

export interface DropdownItemProps {
    /** Whether this item is currently selected/highlighted */
    isSelected: boolean;
    /** Called when item is clicked */
    onClick: () => void;
    /** Called when mouse enters item (for keyboard + mouse selection sync) */
    onMouseEnter: () => void;
    /** Item content */
    children: ReactNode;
    /** Additional classes */
    className?: string;
    /** Data index for scroll-into-view targeting */
    'data-index'?: number;
}

/**
 * Selectable dropdown item with proper ARIA attributes
 *
 * @example
 * ```tsx
 * <DropdownItem
 *   isSelected={selectedIndex === index}
 *   onClick={() => selectItem(item)}
 *   onMouseEnter={() => setSelectedIndex(index)}
 * >
 *   <span>{item.name}</span>
 * </DropdownItem>
 * ```
 */
export function DropdownItem({
    isSelected,
    onClick,
    onMouseEnter,
    children,
    className = '',
    'data-index': dataIndex,
}: DropdownItemProps) {
    return (
        <li
            role="option"
            aria-selected={isSelected}
            data-index={dataIndex}
            className={cn(
                'flex items-center justify-between px-3 py-2 cursor-pointer',
                isSelected
                    ? 'bg-gray-100 dark:bg-gray-700'
                    : 'hover:bg-gray-100 dark:hover:bg-gray-700',
                className
            )}
            onClick={onClick}
            onMouseEnter={onMouseEnter}
        >
            {children}
        </li>
    );
}
