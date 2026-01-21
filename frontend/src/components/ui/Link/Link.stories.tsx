/**
 * Link component stories
 */

import type { Meta, StoryObj } from '@storybook/react';
import { Link } from './Link';

const meta: Meta<typeof Link> = {
    title: 'UI/Link',
    component: Link,
    parameters: {
        layout: 'centered',
    },
    tags: ['autodocs'],
    argTypes: {
        variant: {
            control: 'select',
            options: ['default', 'primary', 'muted', 'danger', 'success'],
        },
        size: {
            control: 'select',
            options: ['xs', 'sm', 'md', 'lg', 'xl'],
        },
        underline: {
            control: 'select',
            options: ['none', 'hover', 'always'],
        },
    },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Internal: Story = {
    args: {
        to: '/items/123',
        children: 'View item',
        variant: 'primary',
    },
};

export const External: Story = {
    args: {
        to: 'https://example.com',
        external: true,
        children: 'External link',
        variant: 'muted',
    },
};

export const AllSizes: Story = {
    render: () => (
        <div className="flex flex-col gap-2">
            {(['xs', 'sm', 'md', 'lg', 'xl'] as const).map((size) => (
                <Link key={size} to="/items/123" size={size}>
                    Size {size}
                </Link>
            ))}
        </div>
    ),
};
