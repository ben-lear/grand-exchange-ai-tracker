/**
 * Unit tests for ColumnToggle component
 */

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ColumnToggle } from './ColumnToggle';

const toggleColumn = vi.fn();
const showAll = vi.fn();
const resetToDefaults = vi.fn();

vi.mock('@/stores', () => ({
    ALL_COLUMNS: ['name', 'highPrice'],
    useColumnVisibilityStore: () => ({
        visibleColumns: ['name'],
        toggleColumn,
        showAll,
        resetToDefaults,
    }),
}));

describe('ColumnToggle', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should render column toggle', () => {
        render(
            <ColumnToggle />
        );

        expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('should render with table context', async () => {
        render(
            <ColumnToggle />
        );

        expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('should open dropdown and show column labels', async () => {
        const user = userEvent.setup();
        render(<ColumnToggle />);

        await user.click(screen.getByRole('button'));

        expect(screen.getByText('Toggle Columns')).toBeInTheDocument();
        expect(screen.getByText('Item')).toBeInTheDocument();
        expect(screen.getByText('High Price')).toBeInTheDocument();
    });

    it('should call toggleColumn when a column is clicked', async () => {
        const user = userEvent.setup();
        render(<ColumnToggle />);

        await user.click(screen.getByRole('button'));
        await user.click(screen.getByText('High Price'));

        expect(toggleColumn).toHaveBeenCalledWith('highPrice');
    });

    it('should call showAll and resetToDefaults actions', async () => {
        const user = userEvent.setup();
        render(<ColumnToggle />);

        await user.click(screen.getByRole('button'));
        await user.click(screen.getByRole('button', { name: 'Show All' }));
        await user.click(screen.getByRole('button', { name: 'Reset' }));

        expect(showAll).toHaveBeenCalledOnce();
        expect(resetToDefaults).toHaveBeenCalledOnce();
    });
});
