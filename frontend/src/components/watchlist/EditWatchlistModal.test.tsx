/**
 * Unit tests for EditWatchlistModal component
 */

import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useWatchlistStore } from '../../stores';
import type { Watchlist } from '../../types/watchlist';
import { EditWatchlistModal } from './EditWatchlistModal';

// Mock the store
vi.mock('../../stores');

describe('EditWatchlistModal', () => {
    const mockWatchlist: Watchlist = {
        id: 'test-id',
        name: 'Test Watchlist',
        items: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
        isDefault: false,
    };

    const mockRenameWatchlist = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(useWatchlistStore).mockReturnValue({
            renameWatchlist: mockRenameWatchlist,
        } as any);
    });

    it('renders when open', () => {
        render(
            <EditWatchlistModal
                isOpen={true}
                onClose={vi.fn()}
                watchlist={mockWatchlist}
            />
        );

        expect(screen.getByText('Rename Watchlist')).toBeInTheDocument();
        expect(screen.getByDisplayValue('Test Watchlist')).toBeInTheDocument();
    });

    it('does not render when closed', () => {
        render(
            <EditWatchlistModal
                isOpen={false}
                onClose={vi.fn()}
                watchlist={mockWatchlist}
            />
        );

        expect(screen.queryByText('Rename Watchlist')).not.toBeInTheDocument();
    });

    it('calls renameWatchlist and onClose on submit', async () => {
        const onClose = vi.fn();
        mockRenameWatchlist.mockReturnValue(true);

        render(
            <EditWatchlistModal
                isOpen={true}
                onClose={onClose}
                watchlist={mockWatchlist}
            />
        );

        const input = screen.getByDisplayValue('Test Watchlist');
        fireEvent.change(input, { target: { value: 'New Name' } });
        fireEvent.submit(screen.getByRole('button', { name: /save/i }).closest('form')!);

        await waitFor(() => {
            expect(mockRenameWatchlist).toHaveBeenCalledWith('test-id', 'New Name');
            expect(onClose).toHaveBeenCalled();
        });
    });

    it('shows error for empty name', async () => {
        render(
            <EditWatchlistModal
                isOpen={true}
                onClose={vi.fn()}
                watchlist={mockWatchlist}
            />
        );

        const input = screen.getByDisplayValue('Test Watchlist');
        fireEvent.change(input, { target: { value: '   ' } });
        fireEvent.submit(screen.getByRole('button', { name: /save/i }).closest('form')!);

        await waitFor(() => {
            expect(screen.getByText('Name cannot be empty')).toBeInTheDocument();
        });
    });

    it('shows error for name too long', async () => {
        render(
            <EditWatchlistModal
                isOpen={true}
                onClose={vi.fn()}
                watchlist={mockWatchlist}
            />
        );

        const input = screen.getByDisplayValue('Test Watchlist');
        const longName = 'a'.repeat(51);
        fireEvent.change(input, { target: { value: longName } });
        fireEvent.submit(screen.getByRole('button', { name: /save/i }).closest('form')!);

        await waitFor(() => {
            expect(screen.getByText('Name must be 50 characters or less')).toBeInTheDocument();
        });
    });

    it('shows error when rename fails', async () => {
        mockRenameWatchlist.mockReturnValue(false);

        render(
            <EditWatchlistModal
                isOpen={true}
                onClose={vi.fn()}
                watchlist={mockWatchlist}
            />
        );

        const input = screen.getByDisplayValue('Test Watchlist');
        fireEvent.change(input, { target: { value: 'New Name' } });
        fireEvent.submit(screen.getByRole('button', { name: /save/i }).closest('form')!);

        await waitFor(() => {
            expect(screen.getByText(/Failed to rename watchlist/)).toBeInTheDocument();
        });
    });

    it('closes when Cancel button is clicked', () => {
        const onClose = vi.fn();

        render(
            <EditWatchlistModal
                isOpen={true}
                onClose={onClose}
                watchlist={mockWatchlist}
            />
        );

        fireEvent.click(screen.getByText('Cancel'));
        expect(onClose).toHaveBeenCalled();
    });

    it('closes when close icon is clicked', () => {
        const onClose = vi.fn();

        render(
            <EditWatchlistModal
                isOpen={true}
                onClose={onClose}
                watchlist={mockWatchlist}
            />
        );

        fireEvent.click(screen.getByLabelText('Close'));
        expect(onClose).toHaveBeenCalled();
    });

    it('closes without saving if name unchanged', async () => {
        const onClose = vi.fn();

        render(
            <EditWatchlistModal
                isOpen={true}
                onClose={onClose}
                watchlist={mockWatchlist}
            />
        );

        fireEvent.submit(screen.getByRole('button', { name: /save/i }).closest('form')!);

        await waitFor(() => {
            expect(mockRenameWatchlist).not.toHaveBeenCalled();
            expect(onClose).toHaveBeenCalled();
        });
    });

    it('disables save button when name is empty', () => {
        render(
            <EditWatchlistModal
                isOpen={true}
                onClose={vi.fn()}
                watchlist={mockWatchlist}
            />
        );

        const input = screen.getByDisplayValue('Test Watchlist');
        fireEvent.change(input, { target: { value: '' } });

        const saveButton = screen.getByRole('button', { name: /save/i });
        expect(saveButton).toBeDisabled();
    });

    it('shows character count', () => {
        render(
            <EditWatchlistModal
                isOpen={true}
                onClose={vi.fn()}
                watchlist={mockWatchlist}
            />
        );

        expect(screen.getByText('14/50 characters')).toBeInTheDocument();
    });
});
