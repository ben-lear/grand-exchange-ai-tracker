/**
 * Select component tests
 */

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Select } from './Select';

describe('Select', () => {
    const options = [
        { value: '50', label: '50' },
        { value: '100', label: '100' },
        { value: '200', label: '200' },
    ];

    it('renders placeholder when no selection', () => {
        render(
            <Select
                ariaLabel="Page size"
                value=""
                onChange={vi.fn()}
                options={options}
                placeholder="Select size"
            />
        );

        const button = screen.getByRole('button', { name: 'Page size' });
        expect(button).toHaveTextContent('Select size');
    });

    it('renders selected value', () => {
        render(
            <Select
                ariaLabel="Page size"
                value="100"
                onChange={vi.fn()}
                options={options}
            />
        );

        const button = screen.getByRole('button', { name: 'Page size' });
        expect(button).toHaveTextContent('100');
    });

    it('calls onChange when option selected', async () => {
        const onChange = vi.fn();
        const user = userEvent.setup();

        render(
            <Select
                ariaLabel="Page size"
                value="50"
                onChange={onChange}
                options={options}
            />
        );

        await user.click(screen.getByRole('button', { name: 'Page size' }));
        await user.click(screen.getByRole('option', { name: '100' }));

        expect(onChange).toHaveBeenCalledWith('100');
    });

    it('renders helper text and error', () => {
        render(
            <Select
                ariaLabel="Page size"
                value="50"
                onChange={vi.fn()}
                options={options}
                helperText="Helper text"
                error="Required"
            />
        );

        expect(screen.getByText('Required')).toBeInTheDocument();
        expect(screen.queryByText('Helper text')).not.toBeInTheDocument();
    });

    it('is disabled when disabled', () => {
        render(
            <Select
                ariaLabel="Page size"
                value="50"
                onChange={vi.fn()}
                options={options}
                disabled
            />
        );

        const button = screen.getByRole('button', { name: 'Page size' });
        expect(button).toHaveAttribute('aria-disabled', 'true');
    });
});
