import type { Meta, StoryObj } from '@storybook/react';
import { PriceCell } from './PriceCell';

const meta = {
    title: 'Table/Cells/PriceCell',
    component: PriceCell,
    parameters: { layout: 'padded' },
    tags: ['autodocs'],
} satisfies Meta<typeof PriceCell>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = { args: {} };

export const HighPrice: Story = {
    args: {
        value: 2500000,
        type: 'high',
    },
};

export const LowPrice: Story = {
    args: {
        value: 1900000,
        type: 'low',
    },
};
