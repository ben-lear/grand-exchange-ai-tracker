/**
 * useSearchKeyboard - Custom hook for keyboard navigation in search dropdowns
 *
 * Handles arrow key navigation, Enter to select, Escape to close, and Tab handling.
 * Extracted from GlobalSearch.tsx for reuse in other dropdown components.
 */

import { useCallback } from 'react';

export interface UseSearchKeyboardParams {
    /** Whether the dropdown is currently open */
    isOpen: boolean;
    /** Total number of items in the list */
    itemCount: number;
    /** Currently selected item index */
    selectedIndex: number;
    /** Callback to update the selected index */
    setSelectedIndex: (index: number | ((prev: number) => number)) => void;
    /** Callback when an item is selected (Enter key) */
    onSelect: () => void;
    /** Callback when dropdown should close (Escape key) */
    onClose: () => void;
    /** Callback when dropdown should open */
    onOpen?: () => void;
    /** Optional ref to blur on escape */
    inputRef?: React.RefObject<HTMLInputElement>;
}

export interface UseSearchKeyboardReturn {
    /** Key down handler to attach to the input element */
    handleKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
}

/**
 * Hook for managing keyboard navigation in search dropdowns
 *
 * @example
 * ```tsx
 * const { handleKeyDown } = useSearchKeyboard({
 *   isOpen,
 *   itemCount: items.length,
 *   selectedIndex,
 *   setSelectedIndex,
 *   onSelect: () => selectItem(items[selectedIndex]),
 *   onClose: () => setIsOpen(false),
 *   onOpen: () => setIsOpen(true),
 *   inputRef,
 * });
 *
 * <input onKeyDown={handleKeyDown} />
 * ```
 */
export function useSearchKeyboard({
    isOpen,
    itemCount,
    selectedIndex,
    setSelectedIndex,
    onSelect,
    onClose,
    onOpen,
    inputRef,
}: UseSearchKeyboardParams): UseSearchKeyboardReturn {
    const handleKeyDown = useCallback(
        (e: React.KeyboardEvent<HTMLInputElement>) => {
            switch (e.key) {
                case 'ArrowDown':
                    e.preventDefault();
                    // Open dropdown if closed, otherwise move selection down
                    if (!isOpen) {
                        onOpen?.();
                    } else if (itemCount > 0) {
                        setSelectedIndex((i) => (i + 1) % itemCount);
                    }
                    break;

                case 'ArrowUp':
                    e.preventDefault();
                    if (itemCount > 0) {
                        setSelectedIndex((i) => (i - 1 + itemCount) % itemCount);
                    }
                    break;

                case 'Enter':
                    e.preventDefault();
                    if (isOpen && itemCount > 0 && selectedIndex >= 0 && selectedIndex < itemCount) {
                        onSelect();
                    }
                    break;

                case 'Escape':
                    e.preventDefault();
                    onClose();
                    inputRef?.current?.blur();
                    break;

                case 'Tab':
                    // Allow default tab behavior but close dropdown
                    if (isOpen) {
                        onClose();
                    }
                    break;
            }
        },
        [isOpen, itemCount, selectedIndex, setSelectedIndex, onSelect, onClose, onOpen, inputRef]
    );

    return { handleKeyDown };
}
