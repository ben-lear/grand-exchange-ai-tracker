/**
 * MultiSelect component stories
 */

import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { MultiSelect } from './MultiSelect';
import type { SelectOption } from './selectTypes';

const defaultOptions: SelectOption<string>[] = [
    { value: 'option1', label: 'Option 1' },
    { value: 'option2', label: 'Option 2' },
    { value: 'option3', label: 'Option 3' },
    { value: 'option4', label: 'Disabled Option', disabled: true },
];

const skillOptions: SelectOption<string>[] = [
    { value: 'react', label: 'React' },
    { value: 'typescript', label: 'TypeScript' },
    { value: 'javascript', label: 'JavaScript' },
    { value: 'nodejs', label: 'Node.js' },
    { value: 'python', label: 'Python' },
    { value: 'go', label: 'Go' },
    { value: 'rust', label: 'Rust' },
    { value: 'java', label: 'Java' },
    { value: 'csharp', label: 'C#' },
    { value: 'cpp', label: 'C++' },
];

const categoryOptions: SelectOption<number>[] = [
    { value: 1, label: 'Weapons' },
    { value: 2, label: 'Armor' },
    { value: 3, label: 'Consumables' },
    { value: 4, label: 'Materials' },
    { value: 5, label: 'Runes' },
];

const meta: Meta<typeof MultiSelect> = {
    title: 'UI/MultiSelect',
    component: MultiSelect,
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
type Story = StoryObj<typeof MultiSelect>;

// Basic controlled component wrapper
function MultiSelectControlled<T extends string | number>({
    initialValue = [],
    ...props
}: Omit<React.ComponentProps<typeof MultiSelect<T>>, 'value' | 'onChange'> & {
    initialValue?: T[];
}) {
    const [value, setValue] = useState<T[]>(initialValue);
    return (
        <MultiSelect<T>
            {...(props as React.ComponentProps<typeof MultiSelect<T>>)}
            value={value}
            onChange={setValue}
        />
    );
}

export const Default: Story = {
    render: () => (
        <MultiSelectControlled
            options={defaultOptions}
            placeholder="Select options"
        />
    ),
};

export const WithLabel: Story = {
    render: () => (
        <MultiSelectControlled
            options={defaultOptions}
            label="Choose options"
            placeholder="Select..."
        />
    ),
};

export const Required: Story = {
    render: () => (
        <MultiSelectControlled
            options={defaultOptions}
            label="Required Field"
            placeholder="Select..."
            required
        />
    ),
};

export const WithError: Story = {
    render: () => (
        <MultiSelectControlled
            options={defaultOptions}
            label="Field with error"
            placeholder="Select..."
            error="Please select at least one option"
        />
    ),
};

export const WithHelperText: Story = {
    render: () => (
        <MultiSelectControlled
            options={defaultOptions}
            label="Field with helper"
            placeholder="Select..."
            helperText="You can select multiple options"
        />
    ),
};

export const Disabled: Story = {
    render: () => (
        <MultiSelectControlled
            options={defaultOptions}
            label="Disabled select"
            placeholder="Select..."
            disabled
        />
    ),
};

export const Searchable: Story = {
    render: () => (
        <MultiSelectControlled
            options={skillOptions}
            label="Select Skills"
            placeholder="Search and select skills..."
            searchable
        />
    ),
};

export const WithTags: Story = {
    render: () => (
        <MultiSelectControlled
            options={skillOptions}
            label="Skills (with tags)"
            placeholder="Select skills..."
            initialValue={['react', 'typescript']}
        />
    ),
};

export const ManySelections: Story = {
    render: () => (
        <MultiSelectControlled
            options={skillOptions}
            label="Skills (many selections)"
            placeholder="Select skills..."
            initialValue={['react', 'typescript', 'nodejs']}
        />
    ),
};

export const SmallSize: Story = {
    render: () => (
        <MultiSelectControlled
            options={defaultOptions}
            placeholder="Small select"
            size="sm"
        />
    ),
};

export const LargeSize: Story = {
    render: () => (
        <MultiSelectControlled
            options={defaultOptions}
            placeholder="Large select"
            size="lg"
        />
    ),
};

export const NumericValues: Story = {
    render: () => (
        <MultiSelectControlled<number>
            options={categoryOptions}
            label="Select Categories"
            placeholder="Select categories..."
        />
    ),
};

export const PreSelectedValues: Story = {
    render: () => (
        <MultiSelectControlled
            options={defaultOptions}
            placeholder="Select..."
            initialValue={['option1', 'option2']}
        />
    ),
};

export const ManyOptions: Story = {
    render: () => (
        <MultiSelectControlled
            options={skillOptions}
            label="Select Technologies"
            placeholder="Search technologies..."
            searchable
        />
    ),
};

export const AllSizes: Story = {
    render: () => (
        <div className="space-y-4 w-80">
            <MultiSelectControlled
                options={defaultOptions}
                placeholder="Small"
                size="sm"
                label="Small"
                initialValue={['option1']}
            />
            <MultiSelectControlled
                options={defaultOptions}
                placeholder="Medium"
                size="md"
                label="Medium (default)"
                initialValue={['option1']}
            />
            <MultiSelectControlled
                options={defaultOptions}
                placeholder="Large"
                size="lg"
                label="Large"
                initialValue={['option1']}
            />
        </div>
    ),
};

export const AllStates: Story = {
    render: () => (
        <div className="space-y-4 w-80">
            <MultiSelectControlled
                options={defaultOptions}
                placeholder="Default"
                label="Default"
            />
            <MultiSelectControlled
                options={defaultOptions}
                placeholder="Disabled"
                label="Disabled"
                disabled
            />
            <MultiSelectControlled
                options={defaultOptions}
                placeholder="Error"
                label="With Error"
                error="This field has an error"
            />
            <MultiSelectControlled
                options={defaultOptions}
                placeholder="Required"
                label="Required"
                required
            />
        </div>
    ),
};
