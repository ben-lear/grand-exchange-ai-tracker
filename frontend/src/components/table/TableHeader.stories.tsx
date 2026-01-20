/**
 * Storybook stories for TableHeader component
 */

import type { Meta, StoryObj } from '@storybook/react';
import {
    createColumnHelper,
    getCoreRowModel,
    getSortedRowModel,
    useReactTable,
    type HeaderGroup,
} from '@tanstack/react-table';
import { TableHeader } from './TableHeader';

// Test data type
interface TestItem {
    id: number;
    name: string;
    price: number;
    volume: number;
}

const columnHelper = createColumnHelper<TestItem>();

const testData: TestItem[] = [
    { id: 1, name: 'Abyssal whip', price: 1500000, volume: 1200 },
    { id: 2, name: 'Dragon scimitar', price: 60000, volume: 3500 },
    { id: 3, name: 'Armadyl godsword', price: 15000000, volume: 150 },
];

// Story wrapper component
function TableHeaderWrapper({
    enableSorting = true,
    enableResizing = true,
}: {
    enableSorting?: boolean;
    enableResizing?: boolean;
}) {
    const columns = [
        columnHelper.accessor('id', {
            header: 'ID',
            size: 60,
            enableSorting,
        }),
        columnHelper.accessor('name', {
            header: 'Item Name',
            size: 200,
            enableSorting,
        }),
        columnHelper.accessor('price', {
            header: 'Price',
            size: 120,
            enableSorting,
        }),
        columnHelper.accessor('volume', {
            header: 'Volume',
            size: 100,
            enableSorting,
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

    return (
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
            <table className="w-full">
                <TableHeader
                    headerGroups={table.getHeaderGroups() as HeaderGroup<any>[]}
                    tableState={table.getState()}
                />
            </table>
        </div>
    );
}

const meta: Meta<typeof TableHeader> = {
    title: 'Table/TableHeader',
    component: TableHeader,
    tags: ['autodocs'],
    parameters: {
        layout: 'padded',
    },
    decorators: [
        (Story) => (
            <div className="w-[600px]">
                <Story />
            </div>
        ),
    ],
};

export default meta;
type Story = StoryObj<typeof TableHeader>;

export const Default: Story = {
    render: () => <TableHeaderWrapper />,
};

export const WithSorting: Story = {
    render: () => <TableHeaderWrapper enableSorting />,
    parameters: {
        docs: {
            description: {
                story: 'Click on column headers to sort. Shows sort indicators.',
            },
        },
    },
};

export const WithoutSorting: Story = {
    render: () => <TableHeaderWrapper enableSorting={false} />,
    parameters: {
        docs: {
            description: {
                story: 'Headers without sorting capability - no click interaction.',
            },
        },
    },
};

export const WithResizing: Story = {
    render: () => <TableHeaderWrapper enableResizing />,
    parameters: {
        docs: {
            description: {
                story: 'Drag the right edge of column headers to resize columns.',
            },
        },
    },
};

export const WithoutResizing: Story = {
    render: () => <TableHeaderWrapper enableResizing={false} />,
    parameters: {
        docs: {
            description: {
                story: 'Fixed-width columns without resize handles.',
            },
        },
    },
};
