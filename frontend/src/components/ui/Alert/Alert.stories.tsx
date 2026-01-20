import type { Meta, StoryObj } from '@storybook/react';
import { AlertTriangle, CheckCircle, Info as InfoIcon, XCircle } from 'lucide-react';
import { Alert } from './Alert';

/**
 * Alert component displays important messages with different severity levels.
 * Supports info, success, warning, and error variants with optional icons.
 */
const meta = {
    title: 'UI/Alert',
    component: Alert,
    parameters: {
        layout: 'centered',
    },
    tags: ['autodocs'],
    argTypes: {
        variant: {
            control: 'select',
            options: ['info', 'success', 'warning', 'error'],
        },
    },
} satisfies Meta<typeof Alert>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Info: Story = {
    args: {
        variant: 'info',
        icon: <InfoIcon className="w-5 h-5" />,
        children: 'This is an informational alert message.',
    },
};

export const Success: Story = {
    args: {
        variant: 'success',
        icon: <CheckCircle className="w-5 h-5" />,
        children: 'Operation completed successfully!',
    },
};

export const Warning: Story = {
    args: {
        variant: 'warning',
        icon: <AlertTriangle className="w-5 h-5" />,
        children: 'Please review this warning before proceeding.',
    },
};

export const Error: Story = {
    args: {
        variant: 'error',
        icon: <XCircle className="w-5 h-5" />,
        children: 'An error occurred while processing your request.',
    },
};

export const WithoutIcon: Story = {
    args: {
        variant: 'info',
        children: 'Alert without an icon.',
    },
};

export const LongMessage: Story = {
    args: {
        variant: 'warning',
        icon: <AlertTriangle className="w-5 h-5" />,
        children: 'This is a longer alert message that demonstrates how the component handles multiple lines of text. It should wrap appropriately and maintain proper spacing throughout.',
    },
};

export const Dismissible: Story = {
    args: {
        variant: 'info',
        title: 'Update available',
        description: 'A new version is ready to install.',
        onClose: () => alert('Alert dismissed'),
    },
};
