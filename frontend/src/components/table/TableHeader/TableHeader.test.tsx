/**
 * Tests for TableHeader component
 */

import {
    createColumnHelper,
    getCoreRowModel,
    useReactTable,
    type HeaderGroup,
} from '@tanstack/react-table';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { TableHeader } from './TableHeader';

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
        size: 60,
    }),
    columnHelper.accessor('name', {
        header: 'Name',
        size: 150,
    }),
    columnHelper.accessor('value', {
        header: 'Value',
        size: 100,
    }),
];

const testData: TestItem[] = [
    { id: 1, name: 'Item 1', value: 100 },
    { id: 2, name: 'Item 2', value: 200 },
];

// Wrapper component to create table context
function TableHeaderTestWrapper({
    columns = testColumns,
    data = testData,
}: {
    columns?: typeof testColumns;
    data?: TestItem[];
}) {
    const table = useReactTable({
        data,
        columns,
        getCoreRowModel: getCoreRowModel(),
    });

    return (
        <table>
            <TableHeader
                headerGroups={table.getHeaderGroups() as HeaderGroup<any>[]}
                tableState={table.getState()}
            />
        </table>
    );
}

describe('TableHeader', () => {
    describe('Rendering', () => {
        it('should render header cells for each column', () => {
            render(<TableHeaderTestWrapper />);

            expect(screen.getByText('ID')).toBeInTheDocument();
            expect(screen.getByText('Name')).toBeInTheDocument();
            expect(screen.getByText('Value')).toBeInTheDocument();
        });

        it('should render thead element', () => {
            const { container } = render(<TableHeaderTestWrapper />);

            const thead = container.querySelector('thead');
            expect(thead).toBeInTheDocument();
        });

        it('should render tr element for header row', () => {
            const { container } = render(<TableHeaderTestWrapper />);

            const tr = container.querySelector('thead tr');
            expect(tr).toBeInTheDocument();
        });

        it('should render correct number of header cells', () => {
            const { container } = render(<TableHeaderTestWrapper />);

            const headerCells = container.querySelectorAll('th');
            expect(headerCells).toHaveLength(3);
        });
    });

    describe('Styling', () => {
        it('should have sticky positioning', () => {
            const { container } = render(<TableHeaderTestWrapper />);

            const thead = container.querySelector('thead');
            expect(thead).toHaveClass('sticky');
        });

        it('should have background color classes', () => {
            const { container } = render(<TableHeaderTestWrapper />);

            const thead = container.querySelector('thead');
            expect(thead).toHaveClass('bg-gray-50');
            expect(thead).toHaveClass('dark:bg-gray-800');
        });

        it('should have z-index for stacking', () => {
            const { container } = render(<TableHeaderTestWrapper />);

            const thead = container.querySelector('thead');
            expect(thead).toHaveClass('z-10');
        });
    });

    describe('Empty State', () => {
        it('should render empty header when no columns provided', () => {
            const emptyColumns: typeof testColumns = [];

            function EmptyHeaderWrapper() {
                const table = useReactTable({
                    data: [],
                    columns: emptyColumns,
                    getCoreRowModel: getCoreRowModel(),
                });

                return (
                    <table>
                        <TableHeader
                            headerGroups={table.getHeaderGroups() as HeaderGroup<any>[]}
                            tableState={table.getState()}
                        />
                    </table>
                );
            }

            const { container } = render(<EmptyHeaderWrapper />);
            const headerCells = container.querySelectorAll('th');
            expect(headerCells).toHaveLength(0);
        });
    });
});
