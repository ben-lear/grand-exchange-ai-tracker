/**
 * Textarea component stories for Storybook
 */

import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { Textarea } from './Textarea';

const meta: Meta<typeof Textarea> = {
    title: 'UI/Textarea',
    component: Textarea,
    parameters: {
        layout: 'centered',
    },
    tags: ['autodocs'],
    argTypes: {
        size: {
            control: 'select',
            options: ['sm', 'base', 'lg'],
        },
        variant: {
            control: 'select',
            options: ['default', 'error', 'success'],
        },
        disabled: {
            control: 'boolean',
        },
        autoResize: {
            control: 'boolean',
        },
        showCount: {
            control: 'boolean',
        },
    },
};

export default meta;
type Story = StoryObj<typeof meta>;

// Wrapper component to manage state
function TextareaDemo(args: any) {
    const [value, setValue] = useState(args.value || '');

    return (
        <div className="w-96">
            <Textarea
                {...args}
                value={value}
                onChange={(e) => setValue(e.target.value)}
            />
        </div>
    );
}

export const Default: Story = {
    render: (args) => <TextareaDemo {...args} />,
    args: {
        placeholder: 'Enter your message...',
        label: 'Message',
    },
};

export const AllSizes: Story = {
    render: () => (
        <div className="space-y-4">
            {(['sm', 'base', 'lg'] as const).map((size) => (
                <div key={size}>
                    <label className="text-sm font-medium mb-2 block">Size: {size}</label>
                    <TextareaDemo
                        size={size}
                        placeholder={`Textarea (${size})`}
                        rows={3}
                    />
                </div>
            ))}
        </div>
    ),
};

export const WithError: Story = {
    render: (args) => <TextareaDemo {...args} />,
    args: {
        placeholder: 'Enter your message...',
        label: 'Message',
        error: 'This field is required',
    },
};

export const WithSuccess: Story = {
    render: (args) => <TextareaDemo {...args} />,
    args: {
        value: 'This is a valid message',
        placeholder: 'Enter your message...',
        label: 'Message',
        variant: 'success',
    },
};

export const Disabled: Story = {
    render: (args) => <TextareaDemo {...args} />,
    args: {
        value: 'This textarea is disabled',
        placeholder: 'Enter your message...',
        label: 'Message',
        disabled: true,
    },
};

export const WithCharacterCounter: Story = {
    render: (args) => <TextareaDemo {...args} />,
    args: {
        placeholder: 'Enter your message...',
        label: 'Message',
        showCount: true,
        maxLength: 200,
    },
};

export const WithAutoResize: Story = {
    render: (args) => <TextareaDemo {...args} />,
    args: {
        placeholder: 'This textarea will grow as you type...',
        label: 'Expandable Message',
        autoResize: true,
        minHeight: 100,
        maxHeight: 300,
    },
};

export const WithHelperText: Story = {
    render: (args) => <TextareaDemo {...args} />,
    args: {
        placeholder: 'Enter your message...',
        label: 'Message',
        helperText: 'Be descriptive and clear',
    },
};

export const Required: Story = {
    render: (args) => <TextareaDemo {...args} />,
    args: {
        placeholder: 'Enter your message...',
        label: 'Message',
        required: true,
    },
};

export const AllVariants: Story = {
    render: () => (
        <div className="space-y-6">
            {(['default', 'error', 'success'] as const).map((variant) => (
                <div key={variant}>
                    <label className="text-sm font-medium mb-2 block">Variant: {variant}</label>
                    <TextareaDemo
                        variant={variant}
                        placeholder={`Textarea (${variant})`}
                        rows={3}
                    />
                </div>
            ))}
        </div>
    ),
};

export const Combined: Story = {
    render: (args) => <TextareaDemo {...args} />,
    args: {
        placeholder: 'Enter your message...',
        label: 'Feedback',
        helperText: 'Maximum 500 characters',
        showCount: true,
        maxLength: 500,
        required: true,
        autoResize: true,
        minHeight: 120,
    },
};

export const Interactive: Story = {
    render: () => {
        const [text, setText] = useState('');
        const [submitted, setSubmitted] = useState(false);

        const handleSubmit = () => {
            if (text.trim()) {
                setSubmitted(true);
                setTimeout(() => setSubmitted(false), 2000);
            }
        };

        return (
            <div className="w-96 space-y-4">
                <Textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="Share your feedback..."
                    label="Feedback"
                    helperText="Your feedback helps us improve"
                    showCount
                    maxLength={500}
                    autoResize
                    minHeight={100}
                    error={text.length === 0 && submitted ? 'Please enter some feedback' : undefined}
                />
                <button
                    onClick={handleSubmit}
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                    disabled={!text.trim()}
                >
                    Submit Feedback
                </button>
                {submitted && text.trim() && (
                    <p className="text-sm text-green-600">✓ Feedback received!</p>
                )}
            </div>
        );
    },
};

export const LongContent: Story = {
    render: (args) => <TextareaDemo {...args} />,
    args: {
        value: `Lorem ipsum dolor sit amet, consectetur adipiscing elit. 
Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. 
Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.`,
        placeholder: 'Enter your message...',
        label: 'Long Text',
        showCount: true,
    },
};
