/**
 * SingleSelect component stories
 */

import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { SingleSelect } from './SingleSelect';
import type { SelectOption } from './selectTypes';

const defaultOptions: SelectOption<string>[] = [
    { value: 'option1', label: 'Option 1' },
    { value: 'option2', label: 'Option 2' },
    { value: 'option3', label: 'Option 3' },
    { value: 'option4', label: 'Disabled Option', disabled: true },
];

const countryOptions: SelectOption<string>[] = [
    { value: 'us', label: 'United States' },
    { value: 'uk', label: 'United Kingdom' },
    { value: 'ca', label: 'Canada' },
    { value: 'au', label: 'Australia' },
    { value: 'de', label: 'Germany' },
    { value: 'fr', label: 'France' },
    { value: 'jp', label: 'Japan' },
    { value: 'cn', label: 'China' },
    { value: 'br', label: 'Brazil' },
    { value: 'in', label: 'India' },
];

const numericOptions: SelectOption<number>[] = [
    { value: 10, label: '10 items' },
    { value: 25, label: '25 items' },
    { value: 50, label: '50 items' },
    { value: 100, label: '100 items' },
];

const meta: Meta<typeof SingleSelect> = {
    title: 'UI/SingleSelect',
    component: SingleSelect,
    parameters: {
        layout: 'centered',
    },
    tags: ['autodocs'],
    argTypes: {
        size: {
            control: 'select',
            options: ['sm', 'md', 'lg'],
        },
        disabled: {
            control: 'boolean',
        },
        required: {
            control: 'boolean',
        },
        searchable: {
            control: 'boolean',
        },
    },
};

export default meta;
type Story = StoryObj<typeof SingleSelect>;

// Basic controlled component wrapper
function SingleSelectControlled<T extends string | number>({
    initialValue = null,
    ...props
}: Omit<React.ComponentProps<typeof SingleSelect<T>>, 'value' | 'onChange'> & {
    initialValue?: T | null;
}) {
    const [value, setValue] = useState<T | null>(initialValue);
    return (
        <SingleSelect<T>
            {...(props as React.ComponentProps<typeof SingleSelect<T>>)}
            value={value}
            onChange={setValue}
        />
    );
}

export const Default: Story = {
    render: () => (
        <SingleSelectControlled
            options={defaultOptions}
            placeholder="Select an option"
        />
    ),
};

export const WithLabel: Story = {
    render: () => (
        <SingleSelectControlled
            options={defaultOptions}
            label="Choose an option"
            placeholder="Select..."
        />
    ),
};

export const Required: Story = {
    render: () => (
        <SingleSelectControlled
            options={defaultOptions}
            label="Required Field"
            placeholder="Select..."
            required
        />
    ),
};

export const WithError: Story = {
    render: () => (
        <SingleSelectControlled
            options={defaultOptions}
            label="Field with error"
            placeholder="Select..."
            error="This field is required"
        />
    ),
};

export const WithHelperText: Story = {
    render: () => (
        <SingleSelectControlled
            options={defaultOptions}
            label="Field with helper"
            placeholder="Select..."
            helperText="Select one of the available options"
        />
    ),
};

export const Disabled: Story = {
    render: () => (
        <SingleSelectControlled
            options={defaultOptions}
            label="Disabled select"
            placeholder="Select..."
            disabled
        />
    ),
};

export const Searchable: Story = {
    render: () => (
        <SingleSelectControlled
            options={countryOptions}
            label="Select Country"
            placeholder="Search and select..."
            searchable
        />
    ),
};

export const SmallSize: Story = {
    render: () => (
        <SingleSelectControlled
            options={defaultOptions}
            placeholder="Small select"
            size="sm"
        />
    ),
};

export const LargeSize: Story = {
    render: () => (
        <SingleSelectControlled
            options={defaultOptions}
            placeholder="Large select"
            size="lg"
        />
    ),
};

export const NumericValues: Story = {
    render: () => (
        <SingleSelectControlled<number>
            options={numericOptions}
            label="Items per page"
            placeholder="Select count..."
        />
    ),
};

export const PreSelectedValue: Story = {
    render: () => (
        <SingleSelectControlled
            options={defaultOptions}
            placeholder="Select..."
            initialValue="option2"
        />
    ),
};

export const AllSizes: Story = {
    render: () => (
        <div className="space-y-4 w-64">
            <SingleSelectControlled
                options={defaultOptions}
                placeholder="Small"
                size="sm"
                label="Small"
            />
            <SingleSelectControlled
                options={defaultOptions}
                placeholder="Medium"
                size="md"
                label="Medium (default)"
            />
            <SingleSelectControlled
                options={defaultOptions}
                placeholder="Large"
                size="lg"
                label="Large"
            />
        </div>
    ),
};

export const AllStates: Story = {
    render: () => (
        <div className="space-y-4 w-64">
            <SingleSelectControlled
                options={defaultOptions}
                placeholder="Default"
                label="Default"
            />
            <SingleSelectControlled
                options={defaultOptions}
                placeholder="Disabled"
                label="Disabled"
                disabled
            />
            <SingleSelectControlled
                options={defaultOptions}
                placeholder="Error"
                label="With Error"
                error="This field has an error"
            />
            <SingleSelectControlled
                options={defaultOptions}
                placeholder="Required"
                label="Required"
                required
            />
        </div>
    ),
};
