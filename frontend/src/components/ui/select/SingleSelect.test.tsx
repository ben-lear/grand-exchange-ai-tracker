/**
 * SingleSelect component tests
 */

import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { SingleSelect } from './SingleSelect';
import type { SelectOption } from './selectTypes';

const defaultOptions: SelectOption<string>[] = [
    { value: 'option1', label: 'Option 1' },
    { value: 'option2', label: 'Option 2' },
    { value: 'option3', label: 'Option 3', disabled: true },
];

describe('SingleSelect', () => {
    describe('Rendering', () => {
        it('should render with placeholder when no value selected', () => {
            const handleChange = vi.fn();
            render(
                <SingleSelect
                    value={null}
                    onChange={handleChange}
                    options={defaultOptions}
                    placeholder="Select an option"
                />
            );

            expect(screen.getByText('Select an option')).toBeInTheDocument();
        });

        it('should render selected value', () => {
            const handleChange = vi.fn();
            render(
                <SingleSelect
                    value="option1"
                    onChange={handleChange}
                    options={defaultOptions}
                />
            );

            expect(screen.getByText('Option 1')).toBeInTheDocument();
        });

        it('should render label when provided', () => {
            const handleChange = vi.fn();
            render(
                <SingleSelect
                    value={null}
                    onChange={handleChange}
                    options={defaultOptions}
                    label="Choose an option"
                />
            );

            expect(screen.getByText('Choose an option')).toBeInTheDocument();
        });

        it('should render required indicator when required prop is true', () => {
            const handleChange = vi.fn();
            render(
                <SingleSelect
                    value={null}
                    onChange={handleChange}
                    options={defaultOptions}
                    label="Field"
                    required
                />
            );

            expect(screen.getByText('*')).toBeInTheDocument();
        });

        it('should render error message when error prop is provided', () => {
            const handleChange = vi.fn();
            render(
                <SingleSelect
                    value={null}
                    onChange={handleChange}
                    options={defaultOptions}
                    error="This field is required"
                />
            );

            expect(screen.getByText('This field is required')).toBeInTheDocument();
        });

        it('should render helper text when provided', () => {
            const handleChange = vi.fn();
            render(
                <SingleSelect
                    value={null}
                    onChange={handleChange}
                    options={defaultOptions}
                    helperText="Choose wisely"
                />
            );

            expect(screen.getByText('Choose wisely')).toBeInTheDocument();
        });

        it('should be disabled when disabled prop is true', () => {
            const handleChange = vi.fn();
            render(
                <SingleSelect
                    value={null}
                    onChange={handleChange}
                    options={defaultOptions}
                    disabled
                />
            );

            expect(screen.getByRole('button')).toBeDisabled();
        });
    });

    describe('Selection', () => {
        it('should open dropdown on click', async () => {
            const handleChange = vi.fn();
            render(
                <SingleSelect
                    value={null}
                    onChange={handleChange}
                    options={defaultOptions}
                />
            );

            const button = screen.getByRole('button');
            await userEvent.click(button);

            await waitFor(() => {
                expect(screen.getByText('Option 1')).toBeInTheDocument();
                expect(screen.getByText('Option 2')).toBeInTheDocument();
            });
        });

        it('should select option on click', async () => {
            const handleChange = vi.fn();
            render(
                <SingleSelect
                    value={null}
                    onChange={handleChange}
                    options={defaultOptions}
                />
            );

            const button = screen.getByRole('button');
            await userEvent.click(button);

            await waitFor(() => {
                expect(screen.getByText('Option 1')).toBeInTheDocument();
            });

            await userEvent.click(screen.getByText('Option 1'));

            expect(handleChange).toHaveBeenCalledWith('option1');
        });

        it('should not allow selecting disabled options', async () => {
            const handleChange = vi.fn();
            render(
                <SingleSelect
                    value={null}
                    onChange={handleChange}
                    options={defaultOptions}
                />
            );

            const button = screen.getByRole('button');
            await userEvent.click(button);

            await waitFor(() => {
                expect(screen.getByText('Option 3')).toBeInTheDocument();
            });

            const disabledOption = screen.getByText('Option 3').closest('[data-disabled="true"]');
            expect(disabledOption).toBeInTheDocument();
        });
    });

    describe('Search', () => {
        it('should filter options when searchable is true', async () => {
            const handleChange = vi.fn();
            render(
                <SingleSelect
                    value={null}
                    onChange={handleChange}
                    options={defaultOptions}
                    searchable
                />
            );

            const button = screen.getByRole('button');
            await userEvent.click(button);

            await waitFor(() => {
                expect(screen.getByPlaceholderText('Search...')).toBeInTheDocument();
            });

            const searchInput = screen.getByPlaceholderText('Search...');
            // Use fireEvent.change to set the search value directly (userEvent.type has issues with spaces)
            fireEvent.change(searchInput, { target: { value: 'Option 2' } });

            await waitFor(() => {
                expect(screen.getByRole('option', { name: /Option 2/i })).toBeInTheDocument();
                expect(screen.queryByRole('option', { name: /Option 1/i })).not.toBeInTheDocument();
            });
        });

        it('should show "No options found" when search has no results', async () => {
            const handleChange = vi.fn();
            render(
                <SingleSelect
                    value={null}
                    onChange={handleChange}
                    options={defaultOptions}
                    searchable
                />
            );

            const button = screen.getByRole('button');
            await userEvent.click(button);

            await waitFor(() => {
                expect(screen.getByPlaceholderText('Search...')).toBeInTheDocument();
            });

            const searchInput = screen.getByPlaceholderText('Search...');
            await userEvent.type(searchInput, 'xyz');

            await waitFor(() => {
                expect(screen.getByText('No options found')).toBeInTheDocument();
            });
        });
    });

    describe('Keyboard Navigation', () => {
        it('should close on Escape key', async () => {
            const handleChange = vi.fn();
            render(
                <SingleSelect
                    value={null}
                    onChange={handleChange}
                    options={defaultOptions}
                />
            );

            const button = screen.getByRole('button');
            await userEvent.click(button);

            await waitFor(() => {
                expect(screen.getByText('Option 1')).toBeInTheDocument();
            });

            await userEvent.keyboard('{Escape}');

            await waitFor(() => {
                expect(screen.queryByText('Option 1')).not.toBeInTheDocument();
            });
        });
    });

    describe('Accessibility', () => {
        it('should have correct ARIA attributes on button', () => {
            const handleChange = vi.fn();
            render(
                <SingleSelect
                    value={null}
                    onChange={handleChange}
                    options={defaultOptions}
                    label="Test Select"
                />
            );

            const button = screen.getByRole('button');
            expect(button).toHaveAttribute('aria-haspopup', 'listbox');
            expect(button).toHaveAttribute('aria-label', 'Test Select');
        });
    });
});
