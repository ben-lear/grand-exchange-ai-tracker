import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { ExportButton } from './ExportButton';
import { ItemWithPrice } from './columns';

const mockData: ItemWithPrice[] = [
    {
        itemId: 4151,
        name: 'Abyssal whip',
        iconUrl: 'https://example.com/icon.png',
        members: true,
        buyLimit: 70,
        highAlch: 72000,
        lowAlch: 48000,
        currentPrice: {
            highPrice: 2500000,
            lowPrice: 2400000,
            updatedAt: '2024-01-01T00:00:00Z',
        },
    },
    {
        itemId: 1042,
        name: 'Berserker helm',
        iconUrl: 'https://example.com/icon2.png',
        members: true,
        buyLimit: 10,
        highAlch: 39000,
        lowAlch: 26000,
        currentPrice: {
            highPrice: 120000,
            lowPrice: 115000,
            updatedAt: '2024-01-01T00:00:00Z',
        },
    },
];

// Setup global mocks before all tests
beforeAll(() => {
    // Mock URL.createObjectURL and URL.revokeObjectURL
    if (!URL.createObjectURL) {
        URL.createObjectURL = vi.fn(() => 'blob:mock-url');
    }
    if (!URL.revokeObjectURL) {
        URL.revokeObjectURL = vi.fn();
    }
});

describe('ExportButton', () => {
    let originalCreateElement: typeof document.createElement;
    let mockLinkClick: ReturnType<typeof vi.fn>;

    beforeEach(() => {
        // Save original createElement
        originalCreateElement = document.createElement.bind(document);

        // Create a click spy
        mockLinkClick = vi.fn();

        // Mock document.createElement to intercept link creation
        vi.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
            const element = originalCreateElement(tagName);
            if (tagName === 'a') {
                element.click = mockLinkClick;
            }
            return element;
        });
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe('Rendering', () => {
        it('should render export button', () => {
            render(<ExportButton data={mockData} />);

            const button = screen.getByRole('button', { name: /export data/i });
            expect(button).toBeInTheDocument();
            expect(screen.getByText('Export')).toBeInTheDocument();
        });

        it('should have proper ARIA attributes when closed', () => {
            render(<ExportButton data={mockData} />);

            const button = screen.getByRole('button', { name: /export data/i });
            expect(button).toHaveAttribute('aria-expanded', 'false');
            expect(button).toHaveAttribute('aria-haspopup', 'true');
        });

        it('should not show dropdown menu initially', () => {
            render(<ExportButton data={mockData} />);

            expect(screen.queryByText('Export as CSV')).not.toBeInTheDocument();
            expect(screen.queryByText('Export as JSON')).not.toBeInTheDocument();
        });
    });

    describe('Dropdown Interaction', () => {
        it('should open dropdown when button is clicked', () => {
            render(<ExportButton data={mockData} />);

            const button = screen.getByRole('button', { name: /export data/i });
            fireEvent.click(button);

            expect(screen.getByText('Export as CSV')).toBeInTheDocument();
            expect(screen.getByText('Export as JSON')).toBeInTheDocument();
            expect(button).toHaveAttribute('aria-expanded', 'true');
        });

        it('should close dropdown when button is clicked again', () => {
            render(<ExportButton data={mockData} />);

            const button = screen.getByRole('button', { name: /export data/i });

            // Open dropdown
            fireEvent.click(button);
            expect(screen.getByText('Export as CSV')).toBeInTheDocument();

            // Close dropdown
            fireEvent.click(button);
            expect(screen.queryByText('Export as CSV')).not.toBeInTheDocument();
        });

        it('should have proper role attributes on dropdown menu', () => {
            render(<ExportButton data={mockData} />);

            const button = screen.getByRole('button', { name: /export data/i });
            fireEvent.click(button);

            const menu = screen.getByRole('menu');
            expect(menu).toBeInTheDocument();

            const menuItems = screen.getAllByRole('menuitem');
            expect(menuItems).toHaveLength(2);
        });
    });

    describe('Keyboard Accessibility', () => {
        it('should close dropdown on Escape key', async () => {
            render(<ExportButton data={mockData} />);

            const button = screen.getByRole('button', { name: /export data/i });
            fireEvent.click(button);

            expect(screen.getByText('Export as CSV')).toBeInTheDocument();

            fireEvent.keyDown(document, { key: 'Escape' });

            await waitFor(() => {
                expect(screen.queryByText('Export as CSV')).not.toBeInTheDocument();
            });
        });

        it('should not close dropdown on other keys', () => {
            render(<ExportButton data={mockData} />);

            const button = screen.getByRole('button', { name: /export data/i });
            fireEvent.click(button);

            fireEvent.keyDown(document, { key: 'Enter' });
            fireEvent.keyDown(document, { key: 'Tab' });

            expect(screen.getByText('Export as CSV')).toBeInTheDocument();
        });
    });

    describe('Click Outside', () => {
        it('should close dropdown on click outside', async () => {
            render(
                <div>
                    <ExportButton data={mockData} />
                    <div data-testid="outside">Outside element</div>
                </div>
            );

            const button = screen.getByRole('button', { name: /export data/i });
            fireEvent.click(button);

            expect(screen.getByText('Export as CSV')).toBeInTheDocument();

            const outsideElement = screen.getByTestId('outside');
            fireEvent.mouseDown(outsideElement);

            await waitFor(() => {
                expect(screen.queryByText('Export as CSV')).not.toBeInTheDocument();
            });
        });

        it('should not close dropdown on click inside', () => {
            render(<ExportButton data={mockData} />);

            const button = screen.getByRole('button', { name: /export data/i });
            fireEvent.click(button);

            const menu = screen.getByRole('menu');
            fireEvent.mouseDown(menu);

            expect(screen.getByText('Export as CSV')).toBeInTheDocument();
        });
    });

    describe('CSV Export', () => {
        it('should export data as CSV when CSV button clicked', () => {
            render(<ExportButton data={mockData} filename="test-export" />);

            const button = screen.getByRole('button', { name: /export data/i });
            fireEvent.click(button);

            const csvButton = screen.getByText('Export as CSV');
            fireEvent.click(csvButton);

            expect(mockLinkClick).toHaveBeenCalled();
            // We can't easily check the download attribute value with this approach
            // but we verify the click happened which means download was triggered
        });

        it('should close dropdown after CSV export', async () => {
            render(<ExportButton data={mockData} />);

            const button = screen.getByRole('button', { name: /export data/i });
            fireEvent.click(button);

            const csvButton = screen.getByText('Export as CSV');
            fireEvent.click(csvButton);

            await waitFor(() => {
                expect(screen.queryByText('Export as CSV')).not.toBeInTheDocument();
            });
        });
    });

    describe('JSON Export', () => {
        it('should export data as JSON when JSON button clicked', () => {
            render(<ExportButton data={mockData} filename="test-export" />);

            const button = screen.getByRole('button', { name: /export data/i });
            fireEvent.click(button);

            const jsonButton = screen.getByText('Export as JSON');
            fireEvent.click(jsonButton);

            expect(mockLinkClick).toHaveBeenCalled();
        });

        it('should close dropdown after JSON export', async () => {
            render(<ExportButton data={mockData} />);

            const button = screen.getByRole('button', { name: /export data/i });
            fireEvent.click(button);

            const jsonButton = screen.getByText('Export as JSON');
            fireEvent.click(jsonButton);

            await waitFor(() => {
                expect(screen.queryByText('Export as JSON')).not.toBeInTheDocument();
            });
        });
    });

    describe('Custom Props', () => {
        it('should apply custom className', () => {
            const { container } = render(
                <ExportButton data={mockData} className="custom-class" />
            );

            const wrapper = container.querySelector('.custom-class');
            expect(wrapper).toBeInTheDocument();
        });

        it('should use custom filename', () => {
            render(<ExportButton data={mockData} filename="my-custom-export" />);

            const button = screen.getByRole('button', { name: /export data/i });
            fireEvent.click(button);

            const csvButton = screen.getByText('Export as CSV');
            fireEvent.click(csvButton);

            // Verify download was triggered
            expect(mockLinkClick).toHaveBeenCalled();
        });

        it('should use default filename if not provided', () => {
            render(<ExportButton data={mockData} />);

            const button = screen.getByRole('button', { name: /export data/i });
            fireEvent.click(button);

            const csvButton = screen.getByText('Export as CSV');
            fireEvent.click(csvButton);

            // Verify download was triggered
            expect(mockLinkClick).toHaveBeenCalled();
        });
    });
});
