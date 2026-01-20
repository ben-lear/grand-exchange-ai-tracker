import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { TableContainer } from './TableContainer';

describe('TableContainer', () => {
    it('should render table content', () => {
        render(
            <TableContainer
                table={<div data-testid="mock-table">Table Content</div>}
            />
        );
        expect(screen.getByTestId('mock-table')).toBeInTheDocument();
    });

    it('should render toolbar when provided', () => {
        render(
            <TableContainer
                toolbar={<div data-testid="mock-toolbar">Toolbar</div>}
                table={<div>Table</div>}
            />
        );
        expect(screen.getByTestId('mock-toolbar')).toBeInTheDocument();
    });

    it('should render pagination when provided', () => {
        render(
            <TableContainer
                table={<div>Table</div>}
                pagination={<div data-testid="mock-pagination">Pagination</div>}
            />
        );
        expect(screen.getByTestId('mock-pagination')).toBeInTheDocument();
    });

    it('should render actions when provided', () => {
        render(
            <TableContainer
                table={<div>Table</div>}
                actions={<button data-testid="mock-action">Export</button>}
            />
        );
        expect(screen.getByTestId('mock-action')).toBeInTheDocument();
    });

    it('should render all sections together', () => {
        render(
            <TableContainer
                toolbar={<div data-testid="toolbar">Toolbar</div>}
                table={<div data-testid="table">Table</div>}
                pagination={<div data-testid="pagination">Pagination</div>}
                actions={<div data-testid="actions">Actions</div>}
            />
        );
        expect(screen.getByTestId('toolbar')).toBeInTheDocument();
        expect(screen.getByTestId('table')).toBeInTheDocument();
        expect(screen.getByTestId('pagination')).toBeInTheDocument();
        expect(screen.getByTestId('actions')).toBeInTheDocument();
    });

    it('should not render footer when pagination and actions are not provided', () => {
        const { container } = render(
            <TableContainer table={<div>Table</div>} />
        );
        const footer = container.querySelector('.border-t');
        expect(footer).not.toBeInTheDocument();
    });

    it('should render footer when pagination or actions are provided', () => {
        const { container } = render(
            <TableContainer
                table={<div>Table</div>}
                pagination={<div>Pagination</div>}
            />
        );

        const footer = container.querySelector('.border-t');
        expect(footer).toBeInTheDocument();
    });

    it('should apply custom className', () => {
        const { container } = render(
            <TableContainer
                table={<div>Table</div>}
                className="custom-class"
            />
        );
        expect(container.firstChild).toHaveClass('custom-class');
    });
});
