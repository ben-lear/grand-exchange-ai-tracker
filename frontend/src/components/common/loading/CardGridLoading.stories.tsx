import type { Meta, StoryObj } from '@storybook/react';
import { CardGridLoading } from './CardGridLoading';

const meta = {
    title: 'Common/Loading/CardGridLoading',
    component: CardGridLoading,
    parameters: { layout: 'centered' },
    tags: ['autodocs'],
} satisfies Meta<typeof CardGridLoading>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = { args: {} };

export const Dense: Story = {
    args: {
        columns: 4,
        count: 8,
    },
};

