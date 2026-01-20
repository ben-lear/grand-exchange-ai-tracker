/**
 * Storybook stories for TableHeaderCell component
 */

import type { Meta, StoryObj } from '@storybook/react';
import {
    createColumnHelper,
    getCoreRowModel,
    getSortedRowModel,
    useReactTable,
    type Header,
} from '@tanstack/react-table';
import { TableHeaderCell } from './TableHeaderCell';

// Test data type
interface TestItem {
    id: number;
    name: string;
    price: number;
}

const columnHelper = createColumnHelper<TestItem>();

const testData: TestItem[] = [
    { id: 1, name: 'Abyssal whip', price: 1500000 },
    { id: 2, name: 'Dragon scimitar', price: 60000 },
];

// Story wrapper for a single header cell
function HeaderCellWrapper({
    columnId = 'name',
    enableSorting = true,
    enableResizing = true,
    showDivider = true,
    headerText = 'Item Name',
}: {
    columnId?: string;
    enableSorting?: boolean;
    enableResizing?: boolean;
    showDivider?: boolean;
    headerText?: string;
}) {
    const columns = [
        columnHelper.accessor('id', {
            header: 'ID',
            size: 60,
            enableSorting,
            enableResizing,
        }),
        columnHelper.accessor('name', {
            header: headerText,
            size: 200,
            enableSorting,
            enableResizing,
        }),
        columnHelper.accessor('price', {
            header: 'Price',
            size: 120,
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
    const columnIndex = columnId === 'id' ? 0 : columnId === 'name' ? 1 : 2;
    const header = headerGroups[0].headers[columnIndex];

    return (
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
            <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                        <TableHeaderCell
                            header={header as Header<any, unknown>}
                            showDivider={showDivider}
                            tableState={table.getState()}
                        />
                    </tr>
                </thead>
            </table>
        </div>
    );
}

// Interactive sorting demo
function SortingDemo() {
    const columns = [
        columnHelper.accessor('id', {
            header: 'ID',
            size: 80,
            enableSorting: true,
        }),
        columnHelper.accessor('name', {
            header: 'Name',
            size: 200,
            enableSorting: true,
        }),
        columnHelper.accessor('price', {
            header: 'Price',
            size: 120,
            enableSorting: true,
        }),
    ];

    const table = useReactTable({
        data: testData,
        columns,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
    });

    return (
        <div className="space-y-4">
            <p className="text-sm text-gray-600">
                Click column headers to cycle through: unsorted → ascending → descending
            </p>
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-gray-800">
                        <tr>
                            {table.getHeaderGroups()[0].headers.map((header, index) => (
                                <TableHeaderCell
                                    key={header.id}
                                    header={header as Header<any, unknown>}
                                    showDivider={index < 2}
                                    tableState={table.getState()}
                                />
                            ))}
                        </tr>
                    </thead>
                </table>
            </div>
        </div>
    );
}

const meta: Meta<typeof TableHeaderCell> = {
    title: 'Table/TableHeaderCell',
    component: TableHeaderCell,
    tags: ['autodocs'],
    parameters: {
        layout: 'padded',
    },
    decorators: [
        (Story) => (
            <div className="w-[400px]">
                <Story />
            </div>
        ),
    ],
};

export default meta;
type Story = StoryObj<typeof TableHeaderCell>;

export const Default: Story = {
    render: () => <HeaderCellWrapper />,
};

export const Sortable: Story = {
    render: () => <HeaderCellWrapper enableSorting />,
    parameters: {
        docs: {
            description: {
                story: 'Click the header to toggle sort direction. Shows sort indicator icons.',
            },
        },
    },
};

export const NonSortable: Story = {
    render: () => <HeaderCellWrapper enableSorting={false} />,
    parameters: {
        docs: {
            description: {
                story: 'Header without sort capability - displays as plain text.',
            },
        },
    },
};

export const Resizable: Story = {
    render: () => <HeaderCellWrapper enableResizing />,
    parameters: {
        docs: {
            description: {
                story: 'Hover near the right edge to see the resize handle. Drag to resize.',
            },
        },
    },
};

export const NonResizable: Story = {
    render: () => <HeaderCellWrapper enableResizing={false} />,
    parameters: {
        docs: {
            description: {
                story: 'Header without resize handle.',
            },
        },
    },
};

export const WithDivider: Story = {
    render: () => <HeaderCellWrapper showDivider />,
    parameters: {
        docs: {
            description: {
                story: 'Shows vertical divider line on the right edge.',
            },
        },
    },
};

export const WithoutDivider: Story = {
    render: () => <HeaderCellWrapper showDivider={false} />,
    parameters: {
        docs: {
            description: {
                story: 'No divider line - typically used for the last column.',
            },
        },
    },
};

export const InteractiveSorting: Story = {
    render: () => <SortingDemo />,
    parameters: {
        docs: {
            description: {
                story: 'Interactive demo showing multiple sortable columns.',
            },
        },
    },
};

export const LongHeaderText: Story = {
    render: () => (
        <HeaderCellWrapper headerText="Very Long Column Header That Might Overflow" />
    ),
    parameters: {
        docs: {
            description: {
                story: 'Demonstrates handling of long header text.',
            },
        },
    },
};
