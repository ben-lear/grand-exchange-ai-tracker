/**
 * Shared types for Select components
 */

import React from 'react';
import { CommonComponentProps } from '../../../types/components';

/**
 * Represents a single option in the Select dropdown
 */
export interface SelectOption<T = string> {
    /** Unique value for the option */
    value: T;
    /** Display label */
    label: string;
    /** Optional icon component */
    icon?: React.ComponentType<{ className?: string }>;
    /** Optional description text */
    description?: string;
    /** Whether the option is disabled */
    disabled?: boolean;
}

/**
 * Size options for select components
 */
export type SelectSize = 'xs' | 'sm' | 'md' | 'lg';

/**
 * Base props shared by SingleSelect and MultiSelect
 */
export interface BaseSelectProps<T = string>
    extends Omit<CommonComponentProps, 'variant' | 'size'> {
    /** Available options */
    options: SelectOption<T>[];
    /** Placeholder text when nothing is selected */
    placeholder?: string;
    /** Enable search/filter functionality */
    searchable?: boolean;
    /** Maximum height of dropdown */
    maxHeight?: string;
    /** Custom label for the select (displayed above) */
    label?: string;
    /** Whether field is required */
    required?: boolean;
    /** Name attribute for form submission */
    name?: string;
    /** ID attribute */
    id?: string;
    /** Size of the select */
    size?: SelectSize;
}

/**
 * Props for SingleSelect component
 */
export interface SingleSelectProps<T = string> extends BaseSelectProps<T> {
    /** Selected value */
    value?: T | null;
    /** Change handler */
    onChange: (value: T) => void;
}

/**
 * Props for MultiSelect component
 */
export interface MultiSelectProps<T = string> extends BaseSelectProps<T> {
    /** Selected values */
    value?: T[] | null;
    /** Change handler */
    onChange: (value: T[]) => void;
}
