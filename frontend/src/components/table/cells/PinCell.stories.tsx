import type { Meta, StoryObj } from '@storybook/react';
import { PinCell } from './PinCell';

const meta = {
    title: 'Table/Cells/PinCell',
    component: PinCell,
    parameters: { layout: 'padded' },
    tags: ['autodocs'],
} satisfies Meta<typeof PinCell>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    args: {
        itemId: 4151,
    }
};

export const DifferentItem: Story = {
    args: {
        itemId: 11840,
    },
};
