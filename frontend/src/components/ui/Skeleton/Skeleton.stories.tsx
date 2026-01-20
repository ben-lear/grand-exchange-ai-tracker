import type { Meta, StoryObj } from '@storybook/react';
import { Skeleton } from './Skeleton';

const meta = {
    title: 'UI/Skeleton',
    component: Skeleton,
    parameters: {
        layout: 'centered',
    },
    tags: ['autodocs'],
} satisfies Meta<typeof Skeleton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    args: {
        width: '120px',
    },
};

export const Circular: Story = {
    args: {
        variant: 'circular',
        width: '40px',
        height: '40px',
    },
};

export const MultiLine: Story = {
    args: {
        lines: 3,
        randomWidth: true,
    },
};
