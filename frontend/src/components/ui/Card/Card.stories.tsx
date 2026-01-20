import type { Meta, StoryObj } from '@storybook/react';
import { Card } from './Card';

const meta = {
    title: 'UI/Card',
    component: Card,
    parameters: {
        layout: 'centered',
    },
    tags: ['autodocs'],
} satisfies Meta<typeof Card>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    args: {
        children: (
            <div className="space-y-2">
                <h3 className="text-base font-semibold">Card Title</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">Card content goes here.</p>
            </div>
        ),
    },
};

export const WithFooter: Story = {
    args: {
        children: (
            <div className="space-y-4">
                <div>
                    <h3 className="text-base font-semibold">Card With Footer</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Supporting details.</p>
                </div>
                <div className="pt-3 border-t border-gray-200 dark:border-gray-700 text-sm text-gray-500">
                    Updated just now
                </div>
            </div>
        ),
    },
};
