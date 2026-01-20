import { Button, Input } from '@/components/ui';
import type { Meta, StoryObj } from '@storybook/react';
import { Search } from 'lucide-react';
import { TableContainer } from './TableContainer';

const meta: Meta<typeof TableContainer> = {
    title: 'Table/TableContainer',
    component: TableContainer,
    tags: ['autodocs'],
    decorators: [
        (Story) => (
            <div className="p-8 max-w-6xl mx-auto">
                <Story />
            </div>
        ),
    ],
};

export default meta;
type Story = StoryObj<typeof TableContainer>;

// Mock table component
const MockTable = () => (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
        <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">
                        Name
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">
                        Price
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">
                        Status
                    </th>
                </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                {[1, 2, 3, 4, 5].map((i) => (
                    <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                        <td className="px-4 py-3">Item {i}</td>
                        <td className="px-4 py-3">{(i * 1000).toLocaleString()} gp</td>
                        <td className="px-4 py-3">
                            <span className="px-2 py-1 text-xs rounded bg-green-100 text-green-800">
                                Active
                            </span>
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    </div>
);

const MockToolbar = () => (
    <div className="flex items-center gap-4">
        <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
                placeholder="Search items..."
                className="pl-10"
            />
        </div>
        <Button variant="secondary">Filter</Button>
    </div>
);

const MockPagination = () => (
    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
        <span>Showing 1-5 of 100 items</span>
        <div className="flex gap-1 ml-4">
            <Button variant="ghost" size="sm">Previous</Button>
            <Button variant="ghost" size="sm">Next</Button>
        </div>
    </div>
);

const MockActions = () => (
    <div className="flex gap-2">
        <Button variant="secondary" size="sm">Export CSV</Button>
        <Button variant="primary" size="sm">Create New</Button>
    </div>
);

export const TableOnly: Story = {
    args: {
        table: <MockTable />,
    },
};

export const WithToolbar: Story = {
    args: {
        toolbar: <MockToolbar />,
        table: <MockTable />,
    },
};

export const WithPagination: Story = {
    args: {
        table: <MockTable />,
        pagination: <MockPagination />,
    },
};

export const WithActions: Story = {
    args: {
        table: <MockTable />,
        actions: <MockActions />,
    },
};

export const Complete: Story = {
    args: {
        toolbar: <MockToolbar />,
        table: <MockTable />,
        pagination: <MockPagination />,
        actions: <MockActions />,
    },
};

export const CustomClassName: Story = {
    args: {
        table: <MockTable />,
        pagination: <MockPagination />,
        className: 'shadow-xl',
    },
};
