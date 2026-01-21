/**
 * Select component stories
 */

import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { Select } from './Select';

const meta: Meta<typeof Select> = {
    title: 'UI/Select',
    component: Select,
    parameters: {
        layout: 'centered',
    },
    tags: ['autodocs'],
    argTypes: {
        size: {
            control: 'select',
            options: ['xs', 'sm', 'md', 'lg', 'xl'],
        },
        align: {
            control: 'select',
            options: ['left', 'right'],
        },
        position: {
            control: 'select',
            options: ['bottom', 'top'],
        },
    },
};

export default meta;
type Story = StoryObj<typeof meta>;

const options = [
    { value: '50', label: '50' },
    { value: '100', label: '100' },
    { value: '200', label: '200' },
];

function SelectDemo(args: any) {
    const [value, setValue] = useState(args.value ?? '50');

    return (
        <div className="w-64">
            <Select
                {...args}
                value={value}
                onChange={setValue}
                options={options}
                ariaLabel="Page size"
            />
        </div>
    );
}

export const Default: Story = {
    render: (args) => <SelectDemo {...args} />,
    args: {
        value: '50',
    },
};

export const Disabled: Story = {
    render: (args) => <SelectDemo {...args} />,
    args: {
        value: '50',
        disabled: true,
    },
};

export const WithError: Story = {
    render: (args) => <SelectDemo {...args} />,
    args: {
        value: '50',
        error: 'Selection required',
    },
};

export const AllSizes: Story = {
    render: () => (
        <div className="space-y-3">
            {(['xs', 'sm', 'md', 'lg', 'xl'] as const).map((size) => (
                <div key={size} className="w-64">
                    <SelectDemo size={size} />
                </div>
            ))}
        </div>
    ),
};
