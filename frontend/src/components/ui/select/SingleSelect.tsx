/**
 * SingleSelect component - accessible dropdown for selecting a single option
 * Uses HeadlessUI Listbox with full keyboard navigation support
 */

import { Listbox, Transition } from '@headlessui/react';
import { Check, ChevronDown } from 'lucide-react';
import React, { useCallback } from 'react';
import { cn } from '../../../utils';
import {
    dropdownPanelVariants,
    optionVariants,
    searchInputClassName,
    selectButtonVariants,
    transitionProps,
} from './selectStyles';
import type { SelectOption, SingleSelectProps } from './selectTypes';
import { useSelectBase } from './useSelectBase';

/**
 * SingleSelect - accessible dropdown for selecting a single value
 *
 * @example
 * const [selected, setSelected] = useState<string | null>(null);
 * <SingleSelect
 *   value={selected}
 *   onChange={setSelected}
 *   options={[
 *     { value: 'option1', label: 'Option 1' },
 *     { value: 'option2', label: 'Option 2' },
 *   ]}
 *   placeholder="Select an option"
 * />
 */
export function SingleSelect<T extends string | number = string>({
    value,
    onChange,
    options,
    placeholder = 'Select an option',
    searchable = false,
    maxHeight = '300px',
    disabled = false,
    error,
    label,
    required,
    name,
    id,
    size = 'md',
    className,
    helperText,
}: SingleSelectProps<T>): React.ReactElement {
    const { search, setSearch, filteredOptions, setIsOpen, handleClose } =
        useSelectBase({ options, searchable });

    const selectId = id || `select-${Math.random().toString(36).slice(2)}`;
    const variant = error ? 'error' : 'default';

    // Get display label for current value
    const getDisplayLabel = useCallback((): string => {
        if (value === null || value === undefined) return placeholder;
        const option = options.find((opt) => opt.value === value);
        return option?.label || placeholder;
    }, [value, options, placeholder]);

    // Handle selection - just pass value through since Listbox handles it
    const handleSelect = useCallback(
        (selectedValue: T) => {
            onChange(selectedValue);
            setIsOpen(false);
        },
        [onChange, setIsOpen]
    );

    return (
        <div className={cn('w-full', className)}>
            {label && (
                <label
                    htmlFor={selectId}
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                    {label}
                    {required && <span className="text-red-500 ml-1">*</span>}
                </label>
            )}

            <Listbox
                value={value ?? undefined}
                onChange={handleSelect}
                disabled={disabled}
            >
                {({ open }) => (
                    <div className="relative">
                        <Listbox.Button
                            id={selectId}
                            name={name}
                            className={selectButtonVariants({ variant, size })}
                            aria-label={label || 'Select'}
                        >
                            <span className="truncate">{getDisplayLabel()}</span>
                            <ChevronDown
                                className={cn(
                                    'h-4 w-4 transition-transform',
                                    open && 'rotate-180'
                                )}
                            />
                        </Listbox.Button>

                        <Transition
                            show={open}
                            {...transitionProps}
                            beforeEnter={() => setIsOpen(true)}
                            afterLeave={handleClose}
                        >
                            <Listbox.Options
                                className={dropdownPanelVariants({ size })}
                                static
                            >
                                {searchable && (
                                    <div className="border-b border-gray-200 dark:border-gray-600 p-2">
                                        <input
                                            type="text"
                                            placeholder="Search..."
                                            value={search}
                                            onChange={(e) => setSearch(e.target.value)}
                                            className={searchInputClassName}
                                            onClick={(e) => e.stopPropagation()}
                                        />
                                    </div>
                                )}

                                <div className="overflow-y-auto" style={{ maxHeight }}>
                                    {filteredOptions.length === 0 ? (
                                        <div className="px-3 py-2 text-gray-500 dark:text-gray-400 text-center">
                                            No options found
                                        </div>
                                    ) : (
                                        filteredOptions.map((option) => (
                                            <Listbox.Option
                                                key={String(option.value)}
                                                value={option.value}
                                                disabled={option.disabled}
                                            >
                                                {({ selected, active }) => (
                                                    <div
                                                        className={optionVariants({
                                                            selected,
                                                            disabled: option.disabled,
                                                        })}
                                                        data-active={active}
                                                        data-disabled={option.disabled}
                                                    >
                                                        {option.icon && (
                                                            <option.icon className="h-4 w-4 flex-shrink-0" />
                                                        )}
                                                        <div className="flex-1">
                                                            <div className="text-sm font-medium">
                                                                {option.label}
                                                            </div>
                                                            {option.description && (
                                                                <div className="text-xs opacity-75">
                                                                    {option.description}
                                                                </div>
                                                            )}
                                                        </div>
                                                        {selected && (
                                                            <Check className="h-4 w-4 flex-shrink-0" />
                                                        )}
                                                    </div>
                                                )}
                                            </Listbox.Option>
                                        ))
                                    )}
                                </div>
                            </Listbox.Options>
                        </Transition>
                    </div>
                )}
            </Listbox>

            {error && (
                <p className="mt-1 text-sm text-red-500 dark:text-red-400">{error}</p>
            )}
            {helperText && !error && (
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    {helperText}
                </p>
            )}
        </div>
    );
}

// Re-export types for convenience
export type { SelectOption, SingleSelectProps };

