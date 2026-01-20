import type { Meta, StoryObj } from '@storybook/react';
import { LoadingSpinner } from './LoadingSpinner';

const meta = {
    title: 'Common/Loading/LoadingSpinner',
    component: LoadingSpinner,
    parameters: { layout: 'centered' },
    tags: ['autodocs'],
} satisfies Meta<typeof LoadingSpinner>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = { args: {} };

export const WithMessage: Story = {
    args: {
        message: 'Loading prices...',
    },
};

export const Large: Story = {
    args: {
        size: 'lg',
    },
};

