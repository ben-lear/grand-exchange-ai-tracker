import type { Meta, StoryObj } from '@storybook/react';
import { PulseLoading } from './PulseLoading';

const meta = {
    title: 'Common/Loading/PulseLoading',
    component: PulseLoading,
    parameters: { layout: 'centered' },
    tags: ['autodocs'],
} satisfies Meta<typeof PulseLoading>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = { args: {} };

export const Large: Story = {
    args: {
        size: 'lg',
    },
};

