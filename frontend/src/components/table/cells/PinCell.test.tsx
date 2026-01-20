import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { PinCell } from './PinCell';

// Mock the store
vi.mock('@/stores', () => ({
    usePinnedItemsStore: vi.fn(() => ({
        togglePin: vi.fn(),
        isPinned: vi.fn((id: number) => id === 1),
    })),
}));

describe('PinCell', () => {
    it('should render pin button', () => {
        render(<PinCell itemId={1} />);
        const button = screen.getByRole('button');
        expect(button).toBeInTheDocument();
    });

    it('should show pinned state for pinned items', () => {
        render(<PinCell itemId={1} />);
        const button = screen.getByRole('button', { name: /unpin item/i });
        expect(button).toBeInTheDocument();
    });

    it('should show unpinned state for non-pinned items', () => {
        render(<PinCell itemId={2} />);
        const button = screen.getByRole('button', { name: /pin item to top/i });
        expect(button).toBeInTheDocument();
    });

    it('should call togglePin when clicked', async () => {
        const { usePinnedItemsStore } = await import('@/stores');
        const togglePin = vi.fn();
        vi.mocked(usePinnedItemsStore).mockReturnValue({
            togglePin,
            isPinned: vi.fn(() => false),
            pinnedItemIds: [],
        });

        const user = userEvent.setup();
        render(<PinCell itemId={1} />);

        const button = screen.getByRole('button');
        await user.click(button);

        expect(togglePin).toHaveBeenCalledWith(1);
    });

    it('should apply correct styling for pinned state', async () => {
        const { usePinnedItemsStore } = await import('@/stores');
        vi.mocked(usePinnedItemsStore).mockReturnValue({
            togglePin: vi.fn(),
            isPinned: vi.fn(() => true),
            pinnedItemIds: [1],
        });

        render(<PinCell itemId={1} />);
        const svg = screen.getByRole('button').querySelector('svg');
        expect(svg).toHaveClass('fill-blue-600');
    });

    it('should apply correct styling for unpinned state', async () => {
        const { usePinnedItemsStore } = await import('@/stores');
        vi.mocked(usePinnedItemsStore).mockReturnValue({
            togglePin: vi.fn(),
            isPinned: vi.fn(() => false),
            pinnedItemIds: [],
        });

        render(<PinCell itemId={2} />);
        const svg = screen.getByRole('button').querySelector('svg');
        expect(svg).toHaveClass('text-gray-400');
    });
});
