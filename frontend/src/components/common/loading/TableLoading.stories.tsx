import type { Meta, StoryObj } from '@storybook/react';
import { TableLoading } from './TableLoading';

const meta = {
    title: 'Common/Loading/TableLoading',
    component: TableLoading,
    parameters: { layout: 'centered' },
    tags: ['autodocs'],
} satisfies Meta<typeof TableLoading>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = { args: {} };

export const Compact: Story = {
    args: {
        rows: 4,
    },
};

