import type { Meta, StoryObj } from '@storybook/react';
import { DashboardHeader } from './DashboardHeader';

const meta: Meta<typeof DashboardHeader> = {
    title: 'Dashboard/DashboardHeader',
    component: DashboardHeader,
    tags: ['autodocs'],
    parameters: {
        layout: 'padded',
    },
};

export default meta;
type Story = StoryObj<typeof DashboardHeader>;

export const Default: Story = {
    args: {},
};

export const CustomTitle: Story = {
    args: {
        title: 'My Items Dashboard',
    },
};

export const CustomDescription: Story = {
    args: {
        description: 'Explore items with advanced filtering and real-time price tracking.',
    },
};

export const CustomTitleAndDescription: Story = {
    args: {
        title: 'OSRS Item Tracker',
        description: 'Track your favorite items and monitor price changes across the Grand Exchange.',
    },
};

export const LongTitle: Story = {
    args: {
        title: 'Grand Exchange Item Price Tracker and Portfolio Management Dashboard',
        description: 'Advanced tools for tracking items and prices',
    },
};

export const LongDescription: Story = {
    args: {
        title: 'Dashboard',
        description: 'This is a comprehensive dashboard that provides detailed insights into Grand Exchange items, their current prices, historical trends, and advanced filtering capabilities to help you make informed trading decisions.',
    },
};

export const Minimal: Story = {
    args: {
        title: 'Items',
        description: 'View items',
    },
};