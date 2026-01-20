import type { Meta, StoryObj } from '@storybook/react';
import { FilterPanel } from './FilterPanel';

const meta = {
    title: 'Table/FilterPanel',
    component: FilterPanel,
    parameters: { layout: 'padded' },
    tags: ['autodocs'],
} satisfies Meta<typeof FilterPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    args: {
        filters: { members: 'all' },
        onFiltersChange: () => { },
    }
};

export const MembersOnly: Story = {
    args: {
        filters: { members: 'members', priceMin: 100000, priceMax: 5000000 },
        onFiltersChange: () => { },
    },
};
