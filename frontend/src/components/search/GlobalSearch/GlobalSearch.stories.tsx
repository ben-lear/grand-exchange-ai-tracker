import type { Meta, StoryObj } from '@storybook/react';
import { GlobalSearch } from './GlobalSearch';

const meta = {
    title: 'Search/GlobalSearch',
    component: GlobalSearch,
    parameters: { layout: 'centered' },
    tags: ['autodocs'],
} satisfies Meta<typeof GlobalSearch>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = { args: {} };

export const Compact: Story = {
    args: {
        className: 'w-72',
    },
};
