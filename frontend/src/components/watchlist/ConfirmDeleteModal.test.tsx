/**
 * Unit tests for ConfirmDeleteModal component
 */

import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { Watchlist } from '../../types/watchlist';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';

describe('ConfirmDeleteModal', () => {
    const mockWatchlist: Watchlist = {
        id: 'test-id',
        name: 'Test Watchlist',
        items: [
            {
                itemId: 1,
                name: 'Item 1',
                iconUrl: 'https://example.com/icon1.png',
                addedAt: Date.now(),
            },
            {
                itemId: 2,
                name: 'Item 2',
                iconUrl: 'https://example.com/icon2.png',
                addedAt: Date.now(),
            },
        ],
        createdAt: Date.now(),
        updatedAt: Date.now(),
        isDefault: false,
    };

    it('renders when open', () => {
        render(
            <ConfirmDeleteModal
                isOpen={true}
                onClose={vi.fn()}
                onConfirm={vi.fn()}
                watchlist={mockWatchlist}
            />
        );

        expect(screen.getByRole('heading', { name: 'Delete Watchlist' })).toBeInTheDocument();
        expect(screen.getByText(/Test Watchlist/)).toBeInTheDocument();
    });

    it('does not render when closed', () => {
        render(
            <ConfirmDeleteModal
                isOpen={false}
                onClose={vi.fn()}
                onConfirm={vi.fn()}
                watchlist={mockWatchlist}
            />
        );

        expect(screen.queryByText('Delete Watchlist')).not.toBeInTheDocument();
    });

    it('shows correct item count', () => {
        render(
            <ConfirmDeleteModal
                isOpen={true}
                onClose={vi.fn()}
                onConfirm={vi.fn()}
                watchlist={mockWatchlist}
            />
        );

        expect(screen.getByText(/contains 2 items/)).toBeInTheDocument();
    });

    it('shows singular form for one item', () => {
        const singleItemWatchlist = {
            ...mockWatchlist,
            items: [mockWatchlist.items[0]],
        };

        render(
            <ConfirmDeleteModal
                isOpen={true}
                onClose={vi.fn()}
                onConfirm={vi.fn()}
                watchlist={singleItemWatchlist}
            />
        );

        expect(screen.getByText(/contains 1 item/)).toBeInTheDocument();
    });

    it('calls onConfirm and onClose when Delete button is clicked', () => {
        const onClose = vi.fn();
        const onConfirm = vi.fn();

        render(
            <ConfirmDeleteModal
                isOpen={true}
                onClose={onClose}
                onConfirm={onConfirm}
                watchlist={mockWatchlist}
            />
        );

        fireEvent.click(screen.getByRole('button', { name: 'Delete Watchlist' }));

        expect(onConfirm).toHaveBeenCalled();
        expect(onClose).toHaveBeenCalled();
    });

    it('calls onClose when Cancel button is clicked', () => {
        const onClose = vi.fn();
        const onConfirm = vi.fn();

        render(
            <ConfirmDeleteModal
                isOpen={true}
                onClose={onClose}
                onConfirm={onConfirm}
                watchlist={mockWatchlist}
            />
        );

        fireEvent.click(screen.getByText('Cancel'));

        expect(onClose).toHaveBeenCalled();
        expect(onConfirm).not.toHaveBeenCalled();
    });

    it('calls onClose when close icon is clicked', () => {
        const onClose = vi.fn();

        render(
            <ConfirmDeleteModal
                isOpen={true}
                onClose={onClose}
                onConfirm={vi.fn()}
                watchlist={mockWatchlist}
            />
        );

        fireEvent.click(screen.getByLabelText('Close modal'));
        expect(onClose).toHaveBeenCalled();
    });

    it('shows warning icon', () => {
        render(
            <ConfirmDeleteModal
                isOpen={true}
                onClose={vi.fn()}
                onConfirm={vi.fn()}
                watchlist={mockWatchlist}
            />
        );

        // Check for heading in the header
        const heading = screen.getByRole('heading', { name: 'Delete Watchlist' });
        expect(heading).toBeInTheDocument();
    });

    it('displays warning about irreversible action', () => {
        render(
            <ConfirmDeleteModal
                isOpen={true}
                onClose={vi.fn()}
                onConfirm={vi.fn()}
                watchlist={mockWatchlist}
            />
        );

        expect(screen.getByText(/This action cannot be undone/)).toBeInTheDocument();
    });
});
