import type { Meta, StoryObj } from '@storybook/react';
import { TablePagination } from './TablePagination';

const meta = {
    title: 'Table/TablePagination',
    component: TablePagination,
    parameters: { layout: 'padded' },
    tags: ['autodocs'],
} satisfies Meta<typeof TablePagination>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    args: {
        currentPage: 1,
        pageSize: 50,
        totalItems: 1000,
        onPageChange: () => { },
        onPageSizeChange: () => { },
    }
};

export const LastPage: Story = {
    args: {
        currentPage: 20,
        pageSize: 50,
        totalItems: 1000,
        onPageChange: () => { },
        onPageSizeChange: () => { },
    },
};
