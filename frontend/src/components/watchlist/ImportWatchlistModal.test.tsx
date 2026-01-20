/**
 * Unit tests for ImportWatchlistModal component
 */

import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { validateWatchlistExport } from '../../utils';
import { ImportWatchlistModal } from './ImportWatchlistModal';

// Mock dependencies
const mockImportWatchlist = vi.fn();
const mockGetWatchlistCount = vi.fn();

vi.mock('../../stores', () => ({
    useWatchlistStore: vi.fn((selector) => {
        const state = {
            importWatchlist: mockImportWatchlist,
            getWatchlistCount: mockGetWatchlistCount,
        };
        return selector ? selector(state) : state;
    }),
}));

vi.mock('../../utils');

describe('ImportWatchlistModal', () => {
    const mockOnClose = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
        mockGetWatchlistCount.mockReturnValue(2);
        mockImportWatchlist.mockReturnValue('new-watchlist-id');
    });

    it('renders when open', () => {
        render(<ImportWatchlistModal isOpen={true} onClose={mockOnClose} />);

        expect(screen.getByText('Import Watchlists')).toBeInTheDocument();
        expect(screen.getByText(/Drag and drop your watchlist file here/)).toBeInTheDocument();
    });

    it('does not render when closed', () => {
        render(<ImportWatchlistModal isOpen={false} onClose={mockOnClose} />);

        expect(screen.queryByText('Import Watchlists')).not.toBeInTheDocument();
    });

    it('displays file upload area', () => {
        render(<ImportWatchlistModal isOpen={true} onClose={mockOnClose} />);

        expect(screen.getByText('Choose File')).toBeInTheDocument();
        expect(screen.getByText(/Supports .json files/)).toBeInTheDocument();
    });

    it('closes modal when close button is clicked', async () => {
        const user = userEvent.setup();

        render(<ImportWatchlistModal isOpen={true} onClose={mockOnClose} />);

        const closeButton = screen.getByRole('button', { name: 'Close modal' });
        await user.click(closeButton);

        expect(mockOnClose).toHaveBeenCalled();
    });

    it('shows error for invalid JSON', async () => {
        const user = userEvent.setup();
        const invalidFile = new File(['invalid json'], 'test.json', { type: 'application/json' });

        render(<ImportWatchlistModal isOpen={true} onClose={mockOnClose} />);

        const fileInput = screen.getByLabelText('Choose file to import');
        await user.upload(fileInput, invalidFile);

        await waitFor(() => {
            expect(screen.getByText('Invalid JSON file format')).toBeInTheDocument();
        });
    });

    it('shows error for invalid export format', async () => {
        const user = userEvent.setup();
        const validJSON = JSON.stringify({ invalid: 'format' });
        const file = new File([validJSON], 'test.json', { type: 'application/json' });

        (validateWatchlistExport as ReturnType<typeof vi.fn>).mockReturnValue({
            valid: false,
            errors: ['Invalid export format: missing required fields or invalid structure'],
            warnings: [],
        });

        render(<ImportWatchlistModal isOpen={true} onClose={mockOnClose} />);

        const fileInput = screen.getByLabelText('Choose file to import');
        await user.upload(fileInput, file);

        await waitFor(() => {
            expect(screen.getByText(/Invalid export format/)).toBeInTheDocument();
        });
    });

    it('successfully imports valid watchlist', async () => {
        const user = userEvent.setup();
        const validExport = {
            version: '1.0',
            metadata: { exportedAt: new Date().toISOString(), source: 'osrs-ge-tracker' },
            watchlists: [{
                id: 'test-id',
                name: 'Test Watchlist',
                items: [],
                createdAt: Date.now(),
                updatedAt: Date.now(),
                isDefault: false,
            }],
        };
        const file = new File([JSON.stringify(validExport)], 'test.json', { type: 'application/json' });

        (validateWatchlistExport as ReturnType<typeof vi.fn>).mockReturnValue({
            valid: true,
            export: validExport,
            errors: [],
            warnings: [],
        });

        render(<ImportWatchlistModal isOpen={true} onClose={mockOnClose} />);

        const fileInput = screen.getByLabelText('Choose file to import');
        await user.upload(fileInput, file);

        await waitFor(() => {
            expect(screen.getByText(/Successfully imported 1 watchlist/)).toBeInTheDocument();
        });

        expect(mockImportWatchlist).toHaveBeenCalledWith(validExport.watchlists[0]);
    });

    it('shows warnings for skipped watchlists when at limit', async () => {
        const user = userEvent.setup();
        mockGetWatchlistCount.mockReturnValue(10); // At limit

        const validExport = {
            version: '1.0',
            metadata: { exportedAt: new Date().toISOString(), source: 'osrs-ge-tracker' },
            watchlists: [{
                id: 'test-id',
                name: 'Test Watchlist',
                items: [],
                createdAt: Date.now(),
                updatedAt: Date.now(),
                isDefault: false,
            }],
        };
        const file = new File([JSON.stringify(validExport)], 'test.json', { type: 'application/json' });

        (validateWatchlistExport as ReturnType<typeof vi.fn>).mockReturnValue({
            valid: true,
            export: validExport,
            errors: [],
            warnings: [],
        });

        render(<ImportWatchlistModal isOpen={true} onClose={mockOnClose} />);

        const fileInput = screen.getByLabelText('Choose file to import');
        await user.upload(fileInput, file);

        await waitFor(() => {
            expect(screen.getByText(/Maximum of 10 watchlists reached/)).toBeInTheDocument();
        });
    });

    it('displays partial success with warnings', async () => {
        const user = userEvent.setup();
        const validExport = {
            version: '1.0',
            metadata: { exportedAt: new Date().toISOString(), source: 'osrs-ge-tracker' },
            watchlists: [{
                id: 'test-id',
                name: 'Test Watchlist',
                items: [],
                createdAt: Date.now(),
                updatedAt: Date.now(),
                isDefault: false,
            }],
        };
        const file = new File([JSON.stringify(validExport)], 'test.json', { type: 'application/json' });

        (validateWatchlistExport as ReturnType<typeof vi.fn>).mockReturnValue({
            valid: true,
            export: validExport,
            errors: [],
            warnings: ['Some items were invalid and skipped'],
        });

        render(<ImportWatchlistModal isOpen={true} onClose={mockOnClose} />);

        const fileInput = screen.getByLabelText('Choose file to import');
        await user.upload(fileInput, file);

        await waitFor(() => {
            expect(screen.getByText(/Some items were invalid and skipped/)).toBeInTheDocument();
        });
    });

    it('allows importing another file after success', async () => {
        const user = userEvent.setup();
        const validExport = {
            version: '1.0',
            metadata: { exportedAt: new Date().toISOString(), source: 'osrs-ge-tracker' },
            watchlists: [{
                id: 'test-id',
                name: 'Test Watchlist',
                items: [],
                createdAt: Date.now(),
                updatedAt: Date.now(),
                isDefault: false,
            }],
        };
        const file = new File([JSON.stringify(validExport)], 'test.json', { type: 'application/json' });

        (validateWatchlistExport as ReturnType<typeof vi.fn>).mockReturnValue({
            valid: true,
            export: validExport,
            errors: [],
            warnings: [],
        });

        render(<ImportWatchlistModal isOpen={true} onClose={mockOnClose} />);

        const fileInput = screen.getByLabelText('Choose file to import');
        await user.upload(fileInput, file);

        await waitFor(() => {
            expect(screen.getByText('Import Another')).toBeInTheDocument();
        });

        await user.click(screen.getByText('Import Another'));

        expect(screen.getByText(/Drag and drop your watchlist file here/)).toBeInTheDocument();
    });

    it('shows error when import fails', async () => {
        const user = userEvent.setup();
        mockImportWatchlist.mockReturnValue(null); // Failed import

        const validExport = {
            version: '1.0',
            metadata: { exportedAt: new Date().toISOString(), source: 'osrs-ge-tracker' },
            watchlists: [{
                id: 'test-id',
                name: 'Test Watchlist',
                items: [],
                createdAt: Date.now(),
                updatedAt: Date.now(),
                isDefault: false,
            }],
        };
        const file = new File([JSON.stringify(validExport)], 'test.json', { type: 'application/json' });

        (validateWatchlistExport as ReturnType<typeof vi.fn>).mockReturnValue({
            valid: true,
            export: validExport,
            errors: [],
            warnings: [],
        });

        render(<ImportWatchlistModal isOpen={true} onClose={mockOnClose} />);

        const fileInput = screen.getByLabelText('Choose file to import');
        await user.upload(fileInput, file);

        await waitFor(() => {
            expect(screen.getByText(/Failed to import.*Duplicate or invalid data/)).toBeInTheDocument();
        });
    });

    it('handles file drop', async () => {
        const validExport = {
            version: '1.0',
            metadata: { exportedAt: new Date().toISOString(), source: 'osrs-ge-tracker' },
            watchlists: [{
                id: 'test-id',
                name: 'Test Watchlist',
                items: [],
                createdAt: Date.now(),
                updatedAt: Date.now(),
                isDefault: false,
            }],
        };
        const file = new File([JSON.stringify(validExport)], 'test.json', { type: 'application/json' });

        (validateWatchlistExport as ReturnType<typeof vi.fn>).mockReturnValue({
            valid: true,
            export: validExport,
            errors: [],
            warnings: [],
        });

        render(<ImportWatchlistModal isOpen={true} onClose={mockOnClose} />);

        const dropZone = screen.getByText(/Drag and drop your watchlist file here/).closest('div');

        // Use fireEvent for better jsdom compatibility
        fireEvent.drop(dropZone!, {
            dataTransfer: {
                files: [file],
            },
        });

        await waitFor(() => {
            expect(mockImportWatchlist).toHaveBeenCalled();
        });
    });
});
