import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { TablePagination } from './TablePagination';

const mockOnPageChange = vi.fn();
const mockOnPageSizeChange = vi.fn();

const defaultProps = {
    currentPage: 1,
    totalItems: 500,
    pageSize: 50,
    pageSizeOptions: [50, 100, 200],
    onPageChange: mockOnPageChange,
    onPageSizeChange: mockOnPageSizeChange,
};

describe('TablePagination', () => {
    afterEach(() => {
        vi.clearAllMocks();
    });

    describe('Accessibility', () => {
        it('should have accessible page size select with id and name', () => {
            render(<TablePagination {...defaultProps} />);

            const select = document.getElementById('page-size-select');
            expect(select).toHaveAttribute('id', 'page-size-select');
        });

        it('should have proper label association', () => {
            render(<TablePagination {...defaultProps} />);

            const label = screen.getByText(/items per page/i);
            expect(label.tagName).toBe('LABEL');
            expect(label).toHaveAttribute('for', 'page-size-select');
        });

        it('should have accessible navigation buttons with titles', () => {
            render(<TablePagination {...defaultProps} currentPage={5} />);

            expect(screen.getByTitle(/first page/i)).toBeInTheDocument();
            expect(screen.getByTitle(/previous page/i)).toBeInTheDocument();
            expect(screen.getByTitle(/next page/i)).toBeInTheDocument();
            expect(screen.getByTitle(/last page/i)).toBeInTheDocument();
        });

        it('should disable first and previous buttons on first page', () => {
            render(<TablePagination {...defaultProps} currentPage={1} />);

            const firstButton = screen.getByTitle(/first page/i);
            const prevButton = screen.getByTitle(/previous page/i);

            expect(firstButton).toBeDisabled();
            expect(prevButton).toBeDisabled();
        });

        it('should disable next and last buttons on last page', () => {
            render(<TablePagination {...defaultProps} currentPage={10} />);

            const nextButton = screen.getByTitle(/next page/i);
            const lastButton = screen.getByTitle(/last page/i);

            expect(nextButton).toBeDisabled();
            expect(lastButton).toBeDisabled();
        });
    });

    describe('Page Size Selection', () => {
        it('should update page size when select changes', async () => {
            render(<TablePagination {...defaultProps} />);

            const select = screen.getByLabelText(/items per page/i) as HTMLSelectElement;
            await userEvent.selectOptions(select, '100');

            expect(mockOnPageSizeChange).toHaveBeenCalledWith(100);
        });

        it('should display current page size value', () => {
            render(<TablePagination {...defaultProps} pageSize={100} />);

            const select = screen.getByLabelText(/items per page/i) as HTMLSelectElement;
            expect(select.value).toBe('100');
        });

        it('should render all page size options', async () => {
            render(<TablePagination {...defaultProps} />);

            const options = screen.getAllByRole('option');
            expect(options.map(option => option.textContent)).toEqual(['50', '100', '200']);
        });
    });

    describe('Navigation', () => {
        it('should go to first page when first button clicked', () => {
            render(<TablePagination {...defaultProps} currentPage={5} />);

            const firstButton = screen.getByTitle(/first page/i);
            fireEvent.click(firstButton);

            expect(mockOnPageChange).toHaveBeenCalledWith(1);
        });

        it('should go to previous page when previous button clicked', () => {
            render(<TablePagination {...defaultProps} currentPage={5} />);

            const prevButton = screen.getByTitle(/previous page/i);
            fireEvent.click(prevButton);

            expect(mockOnPageChange).toHaveBeenCalledWith(4);
        });

        it('should go to next page when next button clicked', () => {
            render(<TablePagination {...defaultProps} currentPage={5} />);

            const nextButton = screen.getByTitle(/next page/i);
            fireEvent.click(nextButton);

            expect(mockOnPageChange).toHaveBeenCalledWith(6);
        });

        it('should go to last page when last button clicked', () => {
            render(<TablePagination {...defaultProps} currentPage={5} />);

            const lastButton = screen.getByTitle(/last page/i);
            fireEvent.click(lastButton);

            expect(mockOnPageChange).toHaveBeenCalledWith(10);
        });

        it('should not call onPageChange when clicking disabled buttons', () => {
            render(<TablePagination {...defaultProps} currentPage={1} />);

            const firstButton = screen.getByTitle(/first page/i);
            const prevButton = screen.getByTitle(/previous page/i);

            fireEvent.click(firstButton);
            fireEvent.click(prevButton);

            expect(mockOnPageChange).not.toHaveBeenCalled();
        });
    });

    describe('Page Information', () => {
        it('should display current page information', () => {
            render(<TablePagination {...defaultProps} currentPage={3} />);

            // Verify page numbers are displayed (text split across elements)
            expect(screen.getAllByText('3').length).toBeGreaterThan(0);
            expect(screen.getAllByText('10').length).toBeGreaterThan(0);
        });

        it('should display item range information', () => {
            render(<TablePagination {...defaultProps} currentPage={2} pageSize={50} />);

            // Page 2: items 51-100 of 500 - text is split across multiple span elements
            expect(screen.getAllByText('51').length).toBeGreaterThan(0);
            expect(screen.getAllByText('100').length).toBeGreaterThan(0);
            expect(screen.getAllByText('500').length).toBeGreaterThan(0);
        });

        it('should handle last page with partial items', () => {
            render(
                <TablePagination
                    {...defaultProps}
                    currentPage={10}
                    totalItems={475}
                    pageSize={50}
                />
            );

            // Page 10: items 451-475 of 475 - text is split across multiple span elements
            expect(screen.getAllByText('451').length).toBeGreaterThan(0);
            expect(screen.getAllByText('475').length).toBeGreaterThan(0);
        });
    });

    describe('Edge Cases', () => {
        it('should handle single page correctly', () => {
            render(
                <TablePagination
                    {...defaultProps}
                    currentPage={1}
                    totalItems={25}
                />
            );

            const firstButton = screen.getByTitle(/first page/i);
            const prevButton = screen.getByTitle(/previous page/i);
            const nextButton = screen.getByTitle(/next page/i);
            const lastButton = screen.getByTitle(/last page/i);

            expect(firstButton).toBeDisabled();
            expect(prevButton).toBeDisabled();
            expect(nextButton).toBeDisabled();
            expect(lastButton).toBeDisabled();
        });

        it('should handle empty results', () => {
            render(
                <TablePagination
                    {...defaultProps}
                    currentPage={1}
                    totalItems={0}
                />
            );

            // Text "1 - 0 of 0" is split across span elements
            expect(screen.getAllByText('1').length).toBeGreaterThan(0);
            expect(screen.getAllByText('0').length).toBeGreaterThan(0);
        });
    });
});
