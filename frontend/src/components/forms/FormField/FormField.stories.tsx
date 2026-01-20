/**
 * FormField Storybook stories
 */

import { Checkbox, Input } from '@/components/ui';
import type { Meta, StoryObj } from '@storybook/react';
import { FormField, InlineFormField } from './FormField';

const meta: Meta<typeof FormField> = {
    title: 'Forms/FormField',
    component: FormField,
    tags: ['autodocs'],
    parameters: {
        docs: {
            description: {
                component:
                    'A reusable form field wrapper that provides consistent styling for labels, inputs, errors, and hints. Reduces form boilerplate significantly.',
            },
        },
    },
    argTypes: {
        size: {
            control: 'select',
            options: ['sm', 'md', 'lg'],
        },
    },
};

export default meta;
type Story = StoryObj<typeof FormField>;

/**
 * Default form field with label
 */
export const Default: Story = {
    args: {
        label: 'Email Address',
        htmlFor: 'email',
        children: <Input id="email" type="email" placeholder="you@example.com" />,
    },
};

/**
 * Required field with asterisk indicator
 */
export const Required: Story = {
    args: {
        label: 'Username',
        htmlFor: 'username',
        required: true,
        children: <Input id="username" placeholder="Enter username" />,
    },
};

/**
 * Field with error message
 */
export const WithError: Story = {
    args: {
        label: 'Password',
        htmlFor: 'password',
        required: true,
        error: 'Password must be at least 8 characters',
        children: <Input id="password" type="password" />,
    },
};

/**
 * Field with hint text
 */
export const WithHint: Story = {
    args: {
        label: 'Watchlist Name',
        htmlFor: 'watchlist-name',
        hint: 'Maximum 50 characters allowed',
        children: <Input id="watchlist-name" placeholder="My Watchlist" />,
    },
};

/**
 * Field with description between label and input
 */
export const WithDescription: Story = {
    args: {
        label: 'Bio',
        htmlFor: 'bio',
        description: 'Tell us a little about yourself. This will be visible on your profile.',
        children: (
            <textarea
                id="bio"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                rows={3}
                placeholder="Write something..."
            />
        ),
    },
};

/**
 * Field with all optional elements
 */
export const FullExample: Story = {
    args: {
        label: 'Display Name',
        htmlFor: 'display-name',
        required: true,
        description: 'This is how other users will see you.',
        hint: 'You can change this later in settings.',
        children: <Input id="display-name" placeholder="John Doe" />,
    },
};

/**
 * Field with error (hint is hidden when error is shown)
 */
export const ErrorOverridesHint: Story = {
    args: {
        label: 'Email',
        htmlFor: 'email-error',
        hint: 'We will never share your email.',
        error: 'Please enter a valid email address',
        children: <Input id="email-error" type="email" defaultValue="invalid-email" />,
    },
};

/**
 * Small size variant
 */
export const SmallSize: Story = {
    args: {
        label: 'Small Field',
        htmlFor: 'small-field',
        size: 'sm',
        hint: 'This is a small form field',
        children: <Input id="small-field" placeholder="Small input" />,
    },
};

/**
 * Large size variant
 */
export const LargeSize: Story = {
    args: {
        label: 'Large Field',
        htmlFor: 'large-field',
        size: 'lg',
        hint: 'This is a large form field',
        children: <Input id="large-field" placeholder="Large input" />,
    },
};

/**
 * Hidden label (still accessible)
 */
export const HiddenLabel: Story = {
    args: {
        label: 'Search',
        htmlFor: 'search',
        hideLabel: true,
        children: <Input id="search" placeholder="Search items..." />,
    },
};

/**
 * Field with checkbox
 */
export const WithCheckbox: Story = {
    args: {
        label: 'Remember me',
        htmlFor: 'remember',
        hint: 'Keep me logged in for 30 days',
        children: <Checkbox id="remember" />,
    },
};

/**
 * Multiple fields in a form
 */
export const FormExample: Story = {
    render: () => (
        <form className="space-y-4 max-w-md">
            <FormField label="Full Name" htmlFor="full-name" required>
                <Input id="full-name" placeholder="John Doe" />
            </FormField>

            <FormField
                label="Email Address"
                htmlFor="email-form"
                required
                hint="We'll use this to contact you"
            >
                <Input id="email-form" type="email" placeholder="you@example.com" />
            </FormField>

            <FormField
                label="Password"
                htmlFor="password-form"
                required
                error="Password is too weak"
            >
                <Input id="password-form" type="password" />
            </FormField>

            <FormField label="Confirm Password" htmlFor="confirm-password" required>
                <Input id="confirm-password" type="password" />
            </FormField>
        </form>
    ),
};

/**
 * InlineFormField - Horizontal layout
 */
export const InlineLayout: Story = {
    render: () => (
        <form className="space-y-4 max-w-lg">
            <InlineFormField label="Username" htmlFor="inline-username" required>
                <Input id="inline-username" placeholder="username" />
            </InlineFormField>

            <InlineFormField
                label="Email"
                htmlFor="inline-email"
                required
                hint="Used for notifications"
            >
                <Input id="inline-email" type="email" placeholder="you@example.com" />
            </InlineFormField>

            <InlineFormField
                label="Bio"
                htmlFor="inline-bio"
                description="A short description"
            >
                <textarea
                    id="inline-bio"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                    rows={3}
                />
            </InlineFormField>
        </form>
    ),
};

/**
 * InlineFormField with custom label width
 */
export const InlineCustomWidth: Story = {
    render: () => (
        <form className="space-y-4 max-w-xl">
            <InlineFormField label="Full Name" htmlFor="wide-name" labelWidth="w-48">
                <Input id="wide-name" placeholder="John Doe" />
            </InlineFormField>

            <InlineFormField
                label="Email Address"
                htmlFor="wide-email"
                labelWidth="w-48"
            >
                <Input id="wide-email" type="email" placeholder="you@example.com" />
            </InlineFormField>
        </form>
    ),
};

/**
 * Field with helper + error
 */
export const ErrorWithHint: Story = {
    args: {
        label: 'Email Address',
        htmlFor: 'email-hint-error',
        hint: 'We will never share your email.',
        error: 'Email address is required',
        children: <Input id="email-hint-error" type="email" placeholder="you@example.com" />,
    },
};
