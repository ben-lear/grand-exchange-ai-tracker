/**
 * Shared hook for Select components
 * Provides common filtering and state management logic
 */

import { useMemo, useState } from 'react';
import type { SelectOption } from './selectTypes';

export interface UseSelectBaseOptions<T> {
    /** Available options */
    options: SelectOption<T>[];
    /** Whether search/filter is enabled */
    searchable?: boolean;
}

export interface UseSelectBaseReturn<T> {
    /** Current search query */
    search: string;
    /** Update search query */
    setSearch: (search: string) => void;
    /** Options filtered by search query */
    filteredOptions: SelectOption<T>[];
    /** Whether dropdown is open */
    isOpen: boolean;
    /** Update open state */
    setIsOpen: (isOpen: boolean) => void;
    /** Clear search and close dropdown */
    handleClose: () => void;
}

/**
 * Shared hook for Select component logic
 *
 * @example
 * const { search, setSearch, filteredOptions, isOpen, setIsOpen, handleClose } =
 *   useSelectBase({ options, searchable: true });
 */
export function useSelectBase<T>({
    options,
    searchable = false,
}: UseSelectBaseOptions<T>): UseSelectBaseReturn<T> {
    const [search, setSearch] = useState('');
    const [isOpen, setIsOpen] = useState(false);

    // Filter options based on search term
    const filteredOptions = useMemo(() => {
        if (!searchable || !search) return options;
        return options.filter((opt) =>
            opt.label.toLowerCase().includes(search.toLowerCase())
        );
    }, [options, search, searchable]);

    // Clear search and close dropdown
    const handleClose = () => {
        setIsOpen(false);
        setSearch('');
    };

    return {
        search,
        setSearch,
        filteredOptions,
        isOpen,
        setIsOpen,
        handleClose,
    };
}
