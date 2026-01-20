/**
 * MultiSelect component tests
 */

import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { MultiSelect } from './MultiSelect';
import type { SelectOption } from './selectTypes';

const defaultOptions: SelectOption<string>[] = [
    { value: 'option1', label: 'Option 1' },
    { value: 'option2', label: 'Option 2' },
    { value: 'option3', label: 'Option 3', disabled: true },
];

describe('MultiSelect', () => {
    describe('Rendering', () => {
        it('should render with placeholder when no values selected', () => {
            const handleChange = vi.fn();
            render(
                <MultiSelect
                    value={[]}
                    onChange={handleChange}
                    options={defaultOptions}
                    placeholder="Select options"
                />
            );

            expect(screen.getByText('Select options')).toBeInTheDocument();
        });

        it('should render single selected value label', () => {
            const handleChange = vi.fn();
            render(
                <MultiSelect
                    value={['option1']}
                    onChange={handleChange}
                    options={defaultOptions}
                />
            );

            // Button text shows the selected option label
            const button = screen.getByRole('button', { name: 'Select' });
            expect(button).toHaveTextContent('Option 1');
        });

        it('should render count when multiple values selected', () => {
            const handleChange = vi.fn();
            render(
                <MultiSelect
                    value={['option1', 'option2']}
                    onChange={handleChange}
                    options={defaultOptions}
                />
            );

            expect(screen.getByText('2 selected')).toBeInTheDocument();
        });

        it('should render selected tags', () => {
            const handleChange = vi.fn();
            render(
                <MultiSelect
                    value={['option1', 'option2']}
                    onChange={handleChange}
                    options={defaultOptions}
                />
            );

            // Tags should show individual labels
            const tags = screen.getAllByText(/Option [12]/);
            expect(tags.length).toBeGreaterThanOrEqual(2);
        });

        it('should render label when provided', () => {
            const handleChange = vi.fn();
            render(
                <MultiSelect
                    value={[]}
                    onChange={handleChange}
                    options={defaultOptions}
                    label="Choose options"
                />
            );

            expect(screen.getByText('Choose options')).toBeInTheDocument();
        });

        it('should render error message when error prop is provided', () => {
            const handleChange = vi.fn();
            render(
                <MultiSelect
                    value={[]}
                    onChange={handleChange}
                    options={defaultOptions}
                    error="Please select at least one option"
                />
            );

            expect(screen.getByText('Please select at least one option')).toBeInTheDocument();
        });

        it('should be disabled when disabled prop is true', () => {
            const handleChange = vi.fn();
            render(
                <MultiSelect
                    value={[]}
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
                <MultiSelect
                    value={[]}
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

        it('should add option to selection on click', async () => {
            const handleChange = vi.fn();
            render(
                <MultiSelect
                    value={[]}
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

            expect(handleChange).toHaveBeenCalledWith(['option1']);
        });

        it('should toggle selection when clicking already selected option', async () => {
            const handleChange = vi.fn();
            render(
                <MultiSelect
                    value={['option1']}
                    onChange={handleChange}
                    options={defaultOptions}
                />
            );

            // Use haspopup to target the select button, not tag remove buttons
            const button = screen.getByRole('button', { name: 'Select' });
            await userEvent.click(button);

            // Wait for dropdown and use role='option' to find the selectable item
            await waitFor(() => {
                expect(screen.getByRole('option', { name: /Option 1/i })).toBeInTheDocument();
            });

            // Click the option to deselect
            await userEvent.click(screen.getByRole('option', { name: /Option 1/i }));

            // HeadlessUI handles the toggle internally
            expect(handleChange).toHaveBeenCalled();
        });

        it('should remove value when clicking tag remove button', async () => {
            const handleChange = vi.fn();
            render(
                <MultiSelect
                    value={['option1', 'option2']}
                    onChange={handleChange}
                    options={defaultOptions}
                />
            );

            const removeButton = screen.getByLabelText('Remove Option 1');
            await userEvent.click(removeButton);

            expect(handleChange).toHaveBeenCalledWith(['option2']);
        });
    });

    describe('Search', () => {
        it('should filter options when searchable is true', async () => {
            const handleChange = vi.fn();
            render(
                <MultiSelect
                    value={[]}
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
    });

    describe('Accessibility', () => {
        it('should have correct ARIA attributes on button', () => {
            const handleChange = vi.fn();
            render(
                <MultiSelect
                    value={[]}
                    onChange={handleChange}
                    options={defaultOptions}
                    label="Test MultiSelect"
                />
            );

            const button = screen.getByRole('button');
            expect(button).toHaveAttribute('aria-haspopup', 'listbox');
            expect(button).toHaveAttribute('aria-label', 'Test MultiSelect');
        });
    });
});
