/**
 * Select component - HeadlessUI Listbox wrapper
 */

import type { CommonComponentProps } from '@/types/components';
import { cn } from '@/utils';
import { Listbox, Transition } from '@headlessui/react';
import { cva } from 'class-variance-authority';
import { Check, ChevronDown } from 'lucide-react';
import React, { Fragment } from 'react';
import { Icon } from './Icon/Icon';

export interface SelectOption<T = string> {
    value: T;
    label: string;
    icon?: React.ElementType;
    disabled?: boolean;
    description?: string;
}

export interface SelectProps<T = string>
    extends Omit<CommonComponentProps, 'variant'> {
    /** Selected value */
    value: T;
    /** Change handler */
    onChange: (value: T) => void;
    /** Options */
    options: SelectOption<T>[];
    /** Placeholder when no value selected */
    placeholder?: string;
    /** Optional id for the trigger */
    id?: string;
    /** Optional name for hidden input */
    name?: string;
    /** Aria label */
    ariaLabel?: string;
    /** Aria labelledby */
    ariaLabelledBy?: string;
    /** Dropdown alignment */
    align?: 'left' | 'right';
    /** Dropdown position */
    position?: 'bottom' | 'top';
    /** Max height class for options */
    maxHeight?: string;
}

const selectButtonVariants = cva(
    'relative w-full rounded-lg border bg-white dark:bg-gray-800 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500',
    {
        variants: {
            size: {
                xs: 'px-2 py-1 text-xs',
                sm: 'px-3 py-1.5 text-sm',
                md: 'px-4 py-2 text-sm',
                lg: 'px-4 py-2.5 text-base',
                xl: 'px-5 py-3 text-lg',
            },
            state: {
                default: 'border-gray-300 dark:border-gray-600',
                error: 'border-red-500 dark:border-red-400',
                disabled: 'border-gray-200 dark:border-gray-700 text-gray-400 bg-gray-50 dark:bg-gray-800 cursor-not-allowed',
            },
        },
        defaultVariants: {
            size: 'md',
            state: 'default',
        },
    }
);

const selectOptionsVariants = cva(
    'absolute z-50 mt-1 w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-lg focus:outline-none',
    {
        variants: {
            position: {
                bottom: 'top-full',
                top: 'bottom-full mb-1',
            },
            align: {
                left: 'left-0',
                right: 'right-0',
            },
        },
        defaultVariants: {
            position: 'bottom',
            align: 'left',
        },
    }
);

export function Select<T = string>({
    value,
    onChange,
    options,
    placeholder = 'Select...',
    disabled = false,
    error,
    helperText,
    className,
    size = 'md',
    id,
    name,
    ariaLabel,
    ariaLabelledBy,
    align = 'left',
    position = 'bottom',
    maxHeight = 'max-h-60',
}: SelectProps<T>) {
    const selectedOption = options.find((option) => option.value === value) || null;
    const state = disabled ? 'disabled' : error ? 'error' : 'default';

    return (
        <div className="w-full">
            {name && <input type="hidden" name={name} value={String(value)} />}
            <Listbox value={value} onChange={onChange} disabled={disabled}>
                <div className="relative">
                    <Listbox.Button
                        id={id}
                        aria-label={ariaLabel}
                        aria-labelledby={ariaLabelledBy}
                        aria-disabled={disabled}
                        className={cn(selectButtonVariants({ size, state }), className)}
                    >
                        <span className="flex items-center gap-2">
                            {selectedOption?.icon && (
                                <Icon as={selectedOption.icon} size="sm" className="text-gray-500" />
                            )}
                            <span className={cn(!selectedOption && 'text-gray-400')}>
                                {selectedOption ? selectedOption.label : placeholder}
                            </span>
                        </span>
                        <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
                            <Icon as={ChevronDown} size="sm" className="text-gray-400" />
                        </span>
                    </Listbox.Button>

                    <Transition
                        as={Fragment}
                        leave="transition ease-in duration-100"
                        leaveFrom="opacity-100"
                        leaveTo="opacity-0"
                    >
                        <Listbox.Options
                            className={cn(selectOptionsVariants({ position, align }), maxHeight, 'overflow-y-auto')}
                        >
                            {options.map((option) => (
                                <Listbox.Option
                                    key={String(option.value)}
                                    value={option.value}
                                    disabled={option.disabled}
                                    className={({ active, disabled: optionDisabled }) =>
                                        cn(
                                            'relative cursor-pointer select-none px-3 py-2',
                                            active && !optionDisabled && 'bg-gray-100 dark:bg-gray-700',
                                            optionDisabled && 'text-gray-400 cursor-not-allowed'
                                        )
                                    }
                                >
                                    {({ selected }) => (
                                        <div className="flex items-start gap-2">
                                            {option.icon && (
                                                <Icon as={option.icon} size="sm" className="mt-0.5 text-gray-500" />
                                            )}
                                            <div className="flex-1">
                                                <p className="text-sm text-gray-900 dark:text-gray-100">
                                                    {option.label}
                                                </p>
                                                {option.description && (
                                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                                        {option.description}
                                                    </p>
                                                )}
                                            </div>
                                            {selected && (
                                                <Icon as={Check} size="sm" className="text-blue-600" />
                                            )}
                                        </div>
                                    )}
                                </Listbox.Option>
                            ))}
                        </Listbox.Options>
                    </Transition>
                </div>
            </Listbox>
            {error && <p className="mt-1 text-sm text-red-500 dark:text-red-400">{error}</p>}
            {helperText && !error && (
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{helperText}</p>
            )}
        </div>
    );
}
