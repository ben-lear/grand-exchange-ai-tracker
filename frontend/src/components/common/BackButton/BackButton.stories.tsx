import type { Meta, StoryObj } from '@storybook/react';
import { BrowserRouter } from 'react-router-dom';
import { BackButton } from './BackButton';

const meta: Meta<typeof BackButton> = {
    title: 'Common/BackButton',
    component: BackButton,
    decorators: [
        (Story) => (
            <BrowserRouter>
                <Story />
            </BrowserRouter>
        ),
    ],
    parameters: {
        layout: 'centered',
        docs: {
            description: {
                component: 'BackButton component for consistent back navigation with automatic browser history integration.',
            },
        },
    },
    tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof BackButton>;

export const Default: Story = {
    args: {},
};

export const CustomLabel: Story = {
    args: {
        label: 'Back to Dashboard',
    },
};

export const WithCustomHandler: Story = {
    args: {
        label: 'Go Back',
        onClick: () => alert('Custom back handler'),
    },
};
