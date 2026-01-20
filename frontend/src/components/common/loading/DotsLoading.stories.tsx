import type { Meta, StoryObj } from '@storybook/react';
import { DotsLoading } from './DotsLoading';

const meta = {
    title: 'Common/Loading/DotsLoading',
    component: DotsLoading,
    parameters: { layout: 'centered' },
    tags: ['autodocs'],
} satisfies Meta<typeof DotsLoading>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = { args: {} };

export const Large: Story = {
    args: {
        size: 'lg',
    },
};

