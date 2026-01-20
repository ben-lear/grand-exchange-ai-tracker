/**
 * Hook to debounce a value
 */

import { useEffect, useState } from 'react';

/**
 * Debounce a value with a specified delay
 * 
 * @param value - The value to debounce
 * @param delay - The debounce delay in milliseconds (default: 150ms)
 * @returns The debounced value
 * 
 * @example
 * const [search, setSearch] = useState('');
 * const debouncedSearch = useDebouncedValue(search, 150);
 * 
 * useEffect(() => {
 *   // This will only run 150ms after the user stops typing
 *   fetchResults(debouncedSearch);
 * }, [debouncedSearch]);
 */
export function useDebouncedValue<T>(value: T, delay = 150): T {
    const [debouncedValue, setDebouncedValue] = useState<T>(value);

    useEffect(() => {
        // Set up the timeout
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);

        // Clean up the timeout if value changes or component unmounts
        return () => {
            clearTimeout(handler);
        };
    }, [value, delay]);

    return debouncedValue;
}
