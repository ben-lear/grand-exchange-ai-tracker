import type { Meta, StoryObj } from '@storybook/react';
import { TableToolbar } from './TableToolbar';

const meta = {
    title: 'Table/TableToolbar',
    component: TableToolbar,
    parameters: { layout: 'padded' },
    tags: ['autodocs'],
} satisfies Meta<typeof TableToolbar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    args: {
        searchValue: '',
        onSearchChange: () => { },
    }
};

export const WithSearch: Story = {
    args: {
        searchValue: 'whip',
        onSearchChange: () => { },
    },
};
