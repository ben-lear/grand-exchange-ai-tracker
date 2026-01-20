import type { Meta, StoryObj } from '@storybook/react';
import { InlineLoading } from './InlineLoading';

const meta = {
    title: 'Common/Loading/InlineLoading',
    component: InlineLoading,
    parameters: { layout: 'centered' },
    tags: ['autodocs'],
} satisfies Meta<typeof InlineLoading>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = { args: {} };

export const DotsVariant: Story = {
    args: {
        variant: 'dots',
    },
};

