import type { Meta, StoryObj } from '@storybook/react';
import { ColumnToggle } from './ColumnToggle';

const meta = {
    title: 'Table/ColumnToggle',
    component: ColumnToggle,
    parameters: { layout: 'padded' },
    tags: ['autodocs'],
} satisfies Meta<typeof ColumnToggle>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = { args: {} };

export const InToolbar: Story = {
    args: {},
    decorators: [
        (Story) => (
            <div className="flex justify-end bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
                <Story />
            </div>
        ),
    ],
};
