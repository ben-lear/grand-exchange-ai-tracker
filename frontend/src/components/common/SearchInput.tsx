/**
 * Reusable search input component with icon, clear button, and keyboard handling
 * Used by both GlobalSearch (header) and TableToolbar (table filtering)
 */

import { Search, X } from 'lucide-react';
import React, { forwardRef, useCallback } from 'react';
import { cn } from '../../utils';

export interface SearchInputProps {
    /** Current input value */
    value: string;
    /** Called when value changes */
    onChange: (value: string) => void;
    /** Called when input is focused */
    onFocus?: () => void;
    /** Called when input loses focus */
    onBlur?: () => void;
    /** Called on key down events */
    onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
    /** Placeholder text */
    placeholder?: string;
    /** Input ID for accessibility */
    id?: string;
    /** Input name for forms */
    name?: string;
    /** Additional classes for the container */
    className?: string;
    /** Additional classes for the input element */
    inputClassName?: string;
    /** Show "(Ctrl+K)" hint in placeholder */
    showShortcut?: boolean;
    /** ARIA expanded state for combobox */
    'aria-expanded'?: boolean;
    /** ARIA haspopup for combobox */
    'aria-haspopup'?: 'listbox' | 'menu' | 'dialog' | boolean;
}

/**
 * SearchInput component with search icon and optional clear button
 *
 * @example
 * ```tsx
 * <SearchInput
 *   value={query}
 *   onChange={setQuery}
 *   placeholder="Search items..."
 *   showShortcut
 * />
 * ```
 */
export const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(
    (
        {
            value,
            onChange,
            onFocus,
            onBlur,
            onKeyDown,
            placeholder = 'Search...',
            id,
            name,
            className = '',
            inputClassName = '',
            showShortcut = false,
            'aria-expanded': ariaExpanded,
            'aria-haspopup': ariaHaspopup,
        },
        ref
    ) => {
        const handleClear = useCallback(() => {
            onChange('');
        }, [onChange]);

        const displayPlaceholder = showShortcut
            ? `${placeholder} (Ctrl+K)`
            : placeholder;

        return (
            <div className={cn('relative', className)}>
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                <input
                    ref={ref}
                    id={id}
                    name={name}
                    type="text"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    onFocus={onFocus}
                    onBlur={onBlur}
                    onKeyDown={onKeyDown}
                    placeholder={displayPlaceholder}
                    className={cn(
                        'w-full pl-9 pr-8 py-2 text-sm',
                        'bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg',
                        'text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400',
                        'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent',
                        'transition-colors',
                        inputClassName
                    )}
                    aria-label={placeholder}
                    aria-expanded={ariaExpanded}
                    aria-haspopup={ariaHaspopup}
                    role={ariaHaspopup === 'listbox' ? 'combobox' : undefined}
                />
                {value && (
                    <button
                        type="button"
                        onClick={handleClear}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-white rounded-sm"
                        aria-label="Clear search"
                        tabIndex={-1}
                    >
                        <X className="w-4 h-4" />
                    </button>
                )}
            </div>
        );
    }
);

SearchInput.displayName = 'SearchInput';
