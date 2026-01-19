import type { Meta, StoryObj } from '@storybook/react';
import { ItemIcon } from './ItemIcon';

const meta: Meta<typeof ItemIcon> = {
    title: 'Common/ItemIcon',
    component: ItemIcon,
    parameters: {
        layout: 'centered',
        docs: {
            description: {
                component: 'ItemIcon component for displaying OSRS item icons with automatic fallback handling on load errors.',
            },
        },
    },
    tags: ['autodocs'],
    argTypes: {
        src: {
            control: 'text',
            description: 'Image URL',
        },
        alt: {
            control: 'text',
            description: 'Alt text for accessibility',
        },
        size: {
            control: 'select',
            options: ['xs', 'sm', 'md', 'lg', 'xl'],
        },
        loading: {
            control: 'boolean',
            description: 'Show loading skeleton',
        },
    },
};

export default meta;
type Story = StoryObj<typeof ItemIcon>;

const SAMPLE_ICON = 'https://oldschool.runescape.wiki/images/thumb/Dragon_scimitar_detail.png/150px-Dragon_scimitar_detail.png?1234';

export const Default: Story = {
    args: {
        src: SAMPLE_ICON,
        alt: 'Dragon Scimitar',
        size: 'md',
    },
};

export const AllSizes: Story = {
    render: () => (
        <div className="flex items-end gap-4">
            <ItemIcon src={SAMPLE_ICON} alt="Extra Small" size="xs" />
            <ItemIcon src={SAMPLE_ICON} alt="Small" size="sm" />
            <ItemIcon src={SAMPLE_ICON} alt="Medium" size="md" />
            <ItemIcon src={SAMPLE_ICON} alt="Large" size="lg" />
            <ItemIcon src={SAMPLE_ICON} alt="Extra Large" size="xl" />
        </div>
    ),
};

export const Loading: Story = {
    args: {
        src: SAMPLE_ICON,
        alt: 'Loading Item',
        loading: true,
        size: 'lg',
    },
};

export const ErrorFallback: Story = {
    args: {
        src: 'invalid-url',
        alt: 'Item with Error',
        size: 'lg',
    },
    parameters: {
        docs: {
            description: {
                story: 'Shows fallback icon when image fails to load.',
            },
        },
    },
};

export const CustomFallback: Story = {
    args: {
        src: 'invalid-url',
        alt: 'Custom Fallback',
        size: 'lg',
        fallback: <div className="text-xs text-gray-500">?</div>,
    },
};
