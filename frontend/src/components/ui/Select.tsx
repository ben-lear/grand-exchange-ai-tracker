/**
 * Select component - basic select dropdown
 */

import React from 'react';

export interface SelectOption {
    value: string;
    label: string;
}

export interface SelectProps {
    options: SelectOption[];
    value: string | null;
    onChange: (value: string | null) => void;
    disabled?: boolean;
    className?: string;
}

const Select: React.FC<SelectProps> = ({ value, onChange, options, disabled, className }) => {
    return (
        <select
            value={value || ''}
            onChange={(e) => onChange(e.target.value || null)}
            disabled={disabled}
            className={className}
        >
            <option value="">Select...</option>
            {options.map((opt) => (
                <option key={opt.value} value={opt.value}>
                    {opt.label}
                </option>
            ))}
        </select>
    );
};

export default Select;
