/**
 * Tests for TableHeaderCell component
 */

import {
    createColumnHelper,
    getCoreRowModel,
    getSortedRowModel,
    useReactTable,
    type Header,
} from '@tanstack/react-table';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { TableHeaderCell } from './TableHeaderCell';

// Simple test data type
interface TestItem {
    id: number;
    name: string;
    value: number;
}

// Create test columns
const columnHelper = createColumnHelper<TestItem>();

const testData: TestItem[] = [
    { id: 1, name: 'Item 1', value: 100 },
    { id: 2, name: 'Item 2', value: 200 },
];

// Wrapper component to create a single header cell
function HeaderCellTestWrapper({
    columnIndex = 0,
    showDivider = true,
    enableSorting = true,
    enableResizing = true,
}: {
    columnIndex?: number;
    showDivider?: boolean;
    enableSorting?: boolean;
    enableResizing?: boolean;
}) {
    const columns = [
        columnHelper.accessor('id', {
            header: 'ID',
            size: 60,
            enableSorting,
            enableResizing,
        }),
        columnHelper.accessor('name', {
            header: 'Name',
            size: 150,
            enableSorting,
            enableResizing,
        }),
    ];

    const table = useReactTable({
        data: testData,
        columns,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        enableColumnResizing: enableResizing,
        columnResizeMode: 'onChange',
    });

    const headerGroups = table.getHeaderGroups();
    const header = headerGroups[0].headers[columnIndex];

    return (
        <table>
            <thead>
                <tr>
                    <TableHeaderCell
                        header={header as Header<any, unknown>}
                        showDivider={showDivider}
                        tableState={table.getState()}
                    />
                </tr>
            </thead>
        </table>
    );
}

describe('TableHeaderCell', () => {
    describe('Rendering', () => {
        it('should render header text', () => {
            render(<HeaderCellTestWrapper columnIndex={0} />);

            expect(screen.getByText('ID')).toBeInTheDocument();
        });

        it('should render th element', () => {
            const { container } = render(<HeaderCellTestWrapper />);

            const th = container.querySelector('th');
            expect(th).toBeInTheDocument();
        });

        it('should render different column headers', () => {
            render(<HeaderCellTestWrapper columnIndex={1} />);

            expect(screen.getByText('Name')).toBeInTheDocument();
        });
    });

    describe('Sorting', () => {
        it('should render sort button when sorting is enabled', () => {
            render(<HeaderCellTestWrapper enableSorting />);

            const sortButton = screen.getByRole('button', { name: /sort by/i });
            expect(sortButton).toBeInTheDocument();
        });

        it('should not render sort button when sorting is disabled', () => {
            render(<HeaderCellTestWrapper enableSorting={false} />);

            const sortButton = screen.queryByRole('button', { name: /sort by/i });
            expect(sortButton).not.toBeInTheDocument();
        });

        it('should have aria-label for sort button', () => {
            render(<HeaderCellTestWrapper />);

            const sortButton = screen.getByRole('button', { name: /sort by id/i });
            expect(sortButton).toBeInTheDocument();
        });

        it('should toggle sort direction on click', async () => {
            const user = userEvent.setup();
            const { container } = render(<HeaderCellTestWrapper />);
            const sortButton = screen.getByRole('button', { name: /sort by id/i });

            // Initially unsorted, click once for ascending
            await user.click(sortButton);

            // Look for the SVG with specific class pattern that lucide icons use
            let svg = container.querySelector('button svg');
            expect(svg).toBeTruthy();

            // Click again for descending
            await user.click(sortButton);
            svg = container.querySelector('button svg');
            expect(svg).toBeTruthy();
        });
    });

    describe('Divider', () => {
        it('should render divider when showDivider is true', () => {
            const { container } = render(<HeaderCellTestWrapper showDivider />);

            const divider = container.querySelector('.absolute.right-0.top-3.bottom-3.w-px');
            expect(divider).toBeInTheDocument();
        });

        it('should not render divider when showDivider is false', () => {
            const { container } = render(<HeaderCellTestWrapper showDivider={false} />);

            const divider = container.querySelector('.absolute.right-0.top-3.bottom-3.w-px.bg-gray-200');
            expect(divider).not.toBeInTheDocument();
        });
    });

    describe('Resizing', () => {
        it('should render resize handle when resizing is enabled', () => {
            const { container } = render(<HeaderCellTestWrapper enableResizing />);

            const resizeHandle = container.querySelector('.cursor-col-resize');
            expect(resizeHandle).toBeInTheDocument();
        });

        it('should not render resize handle when resizing is disabled', () => {
            const { container } = render(<HeaderCellTestWrapper enableResizing={false} />);

            const resizeHandle = container.querySelector('.cursor-col-resize');
            expect(resizeHandle).not.toBeInTheDocument();
        });
    });

    describe('Styling', () => {
        it('should have proper text styling', () => {
            const { container } = render(<HeaderCellTestWrapper />);

            const th = container.querySelector('th');
            expect(th).toHaveClass('text-xs');
            expect(th).toHaveClass('font-medium');
            expect(th).toHaveClass('uppercase');
        });

        it('should have border styling', () => {
            const { container } = render(<HeaderCellTestWrapper />);

            const th = container.querySelector('th');
            expect(th).toHaveClass('border-b');
        });
    });
});
