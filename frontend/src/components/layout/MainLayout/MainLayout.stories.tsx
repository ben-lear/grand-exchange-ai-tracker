import type { Meta, StoryObj } from '@storybook/react';
import { MainLayout } from './MainLayout';

const meta = {
    title: 'Layout/MainLayout',
    component: MainLayout,
    parameters: { layout: 'centered' },
    tags: ['autodocs'],
} satisfies Meta<typeof MainLayout>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = { args: {} };

export const WithContent: Story = {
    args: {
        children: (
            <div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6">
                <h2 className="text-lg font-semibold">Dashboard Content</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                    This is a placeholder for main page content inside the layout.
                </p>
            </div>
        ),
    },
};
