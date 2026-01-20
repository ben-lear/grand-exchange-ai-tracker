/**
 * Storybook stories for TableBody component
 */

import type { Meta, StoryObj } from '@storybook/react';
import {
    createColumnHelper,
    getCoreRowModel,
    useReactTable,
    type HeaderGroup,
    type Row,
} from '@tanstack/react-table';
import { TableBody } from './TableBody';
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
    { id: 4, name: 'Bandos chestplate', price: 18000000, volume: 80 },
    { id: 5, name: 'Twisted bow', price: 1200000000, volume: 25 },
];

const formatPrice = (value: number) => {
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
    return value.toString();
};

// Story wrapper component
function TableBodyWrapper({
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
    const columns = [
        columnHelper.accessor('id', {
            header: 'ID',
            cell: (info) => info.getValue(),
            size: 60,
        }),
        columnHelper.accessor('name', {
            header: 'Item Name',
            cell: (info) => (
                <span className="font-medium text-blue-600 dark:text-blue-400">
                    {info.getValue()}
                </span>
            ),
            size: 200,
        }),
        columnHelper.accessor('price', {
            header: 'Price',
            cell: (info) => (
                <span className="font-mono text-green-600 dark:text-green-400">
                    {formatPrice(info.getValue())}
                </span>
            ),
            size: 120,
        }),
        columnHelper.accessor('volume', {
            header: 'Volume',
            cell: (info) => info.getValue().toLocaleString(),
            size: 100,
        }),
    ];

    const table = useReactTable({
        data,
        columns,
        getCoreRowModel: getCoreRowModel(),
    });

    return (
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
            <table className="w-full">
                <TableHeader
                    headerGroups={table.getHeaderGroups() as HeaderGroup<any>[]}
                    tableState={table.getState()}
                />
                <TableBody
                    rows={table.getRowModel().rows as Row<any>[]}
                    enableVirtualization={enableVirtualization}
                    paddingTop={paddingTop}
                    paddingBottom={paddingBottom}
                />
            </table>
        </div>
    );
}

const meta: Meta<typeof TableBody> = {
    title: 'Table/TableBody',
    component: TableBody,
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
type Story = StoryObj<typeof TableBody>;

export const Default: Story = {
    render: () => <TableBodyWrapper />,
};

export const FewRows: Story = {
    render: () => <TableBodyWrapper data={testData.slice(0, 2)} />,
    parameters: {
        docs: {
            description: {
                story: 'Table body with just 2 rows of data.',
            },
        },
    },
};

export const EmptyState: Story = {
    render: () => <TableBodyWrapper data={[]} />,
    parameters: {
        docs: {
            description: {
                story: 'Empty table body with no data rows.',
            },
        },
    },
};

export const WithVirtualizationPadding: Story = {
    render: () => (
        <TableBodyWrapper enableVirtualization paddingTop={50} paddingBottom={100} />
    ),
    parameters: {
        docs: {
            description: {
                story:
                    'Shows virtual scrolling padding. In real usage, this creates space for off-screen rows.',
            },
        },
    },
};

export const ManyRows: Story = {
    render: () => {
        const manyItems: TestItem[] = Array.from({ length: 20 }, (_, i) => ({
            id: i + 1,
            name: `Item ${i + 1}`,
            price: Math.floor(Math.random() * 10000000) + 1000,
            volume: Math.floor(Math.random() * 5000) + 100,
        }));
        return (
            <div className="max-h-[400px] overflow-auto">
                <TableBodyWrapper data={manyItems} />
            </div>
        );
    },
    parameters: {
        docs: {
            description: {
                story: 'Table with many rows in a scrollable container.',
            },
        },
    },
};
