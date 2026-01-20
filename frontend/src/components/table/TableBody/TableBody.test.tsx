/**
 * Tests for TableBody component
 */

import {
    createColumnHelper,
    getCoreRowModel,
    useReactTable,
    type Row,
} from '@tanstack/react-table';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { TableBody } from './TableBody';

// Simple test data type
interface TestItem {
    id: number;
    name: string;
    value: number;
}

// Create test columns
const columnHelper = createColumnHelper<TestItem>();

const testColumns = [
    columnHelper.accessor('id', {
        header: 'ID',
        cell: (info) => info.getValue(),
        size: 60,
    }),
    columnHelper.accessor('name', {
        header: 'Name',
        cell: (info) => info.getValue(),
        size: 150,
    }),
    columnHelper.accessor('value', {
        header: 'Value',
        cell: (info) => info.getValue(),
        size: 100,
    }),
];

const testData: TestItem[] = [
    { id: 1, name: 'Item 1', value: 100 },
    { id: 2, name: 'Item 2', value: 200 },
    { id: 3, name: 'Item 3', value: 300 },
];

// Wrapper component to create table context
function TableBodyTestWrapper({
    data = testData,
    enableVirtualization = false,
    paddingTop = 0,
    paddingBottom = 0,
}: {
    data?: TestItem[];
    enableVirtualization?: boolean;
    paddingTop?: number;
    paddingBottom?: number;
}) {
    const table = useReactTable({
        data,
        columns: testColumns,
        getCoreRowModel: getCoreRowModel(),
    });

    return (
        <table>
            <TableBody
                rows={table.getRowModel().rows as Row<any>[]}
                enableVirtualization={enableVirtualization}
                paddingTop={paddingTop}
                paddingBottom={paddingBottom}
            />
        </table>
    );
}

describe('TableBody', () => {
    describe('Rendering', () => {
        it('should render all rows', () => {
            render(<TableBodyTestWrapper />);

            expect(screen.getByText('Item 1')).toBeInTheDocument();
            expect(screen.getByText('Item 2')).toBeInTheDocument();
            expect(screen.getByText('Item 3')).toBeInTheDocument();
        });

        it('should render tbody element', () => {
            const { container } = render(<TableBodyTestWrapper />);

            const tbody = container.querySelector('tbody');
            expect(tbody).toBeInTheDocument();
        });

        it('should render correct number of rows', () => {
            const { container } = render(<TableBodyTestWrapper />);

            const rows = container.querySelectorAll('tbody tr');
            expect(rows).toHaveLength(3);
        });

        it('should render cell values', () => {
            render(<TableBodyTestWrapper />);

            // Check ID values
            expect(screen.getByText('1')).toBeInTheDocument();
            expect(screen.getByText('2')).toBeInTheDocument();
            expect(screen.getByText('3')).toBeInTheDocument();

            // Check value column
            expect(screen.getByText('100')).toBeInTheDocument();
            expect(screen.getByText('200')).toBeInTheDocument();
            expect(screen.getByText('300')).toBeInTheDocument();
        });
    });

    describe('Styling', () => {
        it('should have background color class', () => {
            const { container } = render(<TableBodyTestWrapper />);

            const tbody = container.querySelector('tbody');
            expect(tbody).toHaveClass('bg-white');
        });

        it('should have divider classes', () => {
            const { container } = render(<TableBodyTestWrapper />);

            const tbody = container.querySelector('tbody');
            expect(tbody).toHaveClass('divide-y');
        });

        it('should have hover effect on rows', () => {
            const { container } = render(<TableBodyTestWrapper />);

            const rows = container.querySelectorAll('tbody tr');
            rows.forEach((row) => {
                expect(row).toHaveClass('hover:bg-gray-50');
            });
        });
    });

    describe('Empty State', () => {
        it('should render empty tbody when no data', () => {
            const { container } = render(<TableBodyTestWrapper data={[]} />);

            const tbody = container.querySelector('tbody');
            expect(tbody).toBeInTheDocument();

            const rows = container.querySelectorAll('tbody tr');
            expect(rows).toHaveLength(0);
        });
    });

    describe('Virtualization', () => {
        it('should render padding row when paddingTop is set with virtualization', () => {
            const { container } = render(
                <TableBodyTestWrapper enableVirtualization paddingTop={100} />
            );

            // First row should be padding row
            const firstTd = container.querySelector('tbody tr:first-child td');
            expect(firstTd).toHaveStyle({ height: '100px' });
        });

        it('should render padding row when paddingBottom is set with virtualization', () => {
            const { container } = render(
                <TableBodyTestWrapper enableVirtualization paddingBottom={50} />
            );

            // Last row should be padding row
            const lastTd = container.querySelector('tbody tr:last-child td');
            expect(lastTd).toHaveStyle({ height: '50px' });
        });

        it('should not render padding rows when virtualization is disabled', () => {
            const { container } = render(
                <TableBodyTestWrapper
                    enableVirtualization={false}
                    paddingTop={100}
                    paddingBottom={50}
                />
            );

            const rows = container.querySelectorAll('tbody tr');
            // Should only have data rows, no padding rows
            expect(rows).toHaveLength(3);
        });

        it('should include padding rows when both paddingTop and paddingBottom are set', () => {
            const { container } = render(
                <TableBodyTestWrapper enableVirtualization paddingTop={20} paddingBottom={30} />
            );

            const rows = container.querySelectorAll('tbody tr');
            expect(rows).toHaveLength(5);
        });
    });
});
