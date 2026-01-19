import type { Meta, StoryObj } from '@storybook/react';
import { FileX, Package, Search, Star } from 'lucide-react';
import { EmptyState } from './EmptyState';

const meta: Meta<typeof EmptyState> = {
    title: 'UI/EmptyState',
    component: EmptyState,
    parameters: {
        layout: 'padded',
        docs: {
            description: {
                component: 'EmptyState component for displaying consistent empty state UI when no data is available.',
            },
        },
    },
    tags: ['autodocs'],
    argTypes: {
        title: {
            control: 'text',
            description: 'The main title text to display',
        },
        description: {
            control: 'text',
            description: 'Optional description text providing context',
        },
        icon: {
            options: ['Package', 'Search', 'Star', 'FileX', 'None'],
            mapping: {
                Package,
                Search,
                Star,
                FileX,
                None: undefined,
            },
            control: { type: 'select' },
        },
    },
};

export default meta;
type Story = StoryObj<typeof EmptyState>;

export const Default: Story = {
    args: {
        title: 'No items found',
    },
};

export const WithDescription: Story = {
    args: {
        title: 'No items found',
        description: 'Try adjusting your search or filter criteria to find what you\'re looking for.',
    },
};

export const WithIcon: Story = {
    args: {
        icon: Package,
        title: 'No items in your watchlist',
        description: 'Start adding items to track their prices over time.',
    },
};

export const WithAction: Story = {
    args: {
        icon: FileX,
        title: 'No results found',
        description: 'We couldn\'t find any items matching your search.',
        action: {
            label: 'Clear Filters',
            onClick: () => alert('Filters cleared!'),
        },
    },
};

export const Complete: Story = {
    args: {
        icon: Star,
        title: 'No favorites yet',
        description: 'Mark items as favorites to quickly access them later.',
        action: {
            label: 'Browse Items',
            onClick: () => alert('Navigate to items!'),
        },
    },
};

export const SearchEmpty: Story = {
    args: {
        icon: Search,
        title: 'No search results',
        description: 'We couldn\'t find any items matching "Dragon Scimitar". Try a different search term.',
    },
};

export const LongContent: Story = {
    args: {
        icon: Package,
        title: 'This is a very long title that might wrap to multiple lines in the empty state',
        description: 'This is a very long description that provides extensive details about why the state is empty and what actions the user might take to resolve this situation. It should wrap nicely and remain readable.',
        action: {
            label: 'Very Long Action Button Label',
            onClick: () => { },
        },
    },
};

export const MinimalVariant: Story = {
    args: {
        title: 'Nothing here',
        className: 'py-8',
    },
    parameters: {
        docs: {
            description: {
                story: 'Minimal variant with just a title and reduced padding.',
            },
        },
    },
};

export const InteractiveDemo: Story = {
    render: () => {
        const examples = [
            {
                icon: Package,
                title: 'No items in watchlist',
                description: 'Start tracking items to see price trends.',
                action: { label: 'Add Items', onClick: () => alert('Add items!') },
            },
            {
                icon: Search,
                title: 'No search results',
                description: 'Try a different search term.',
            },
            {
                icon: Star,
                title: 'No favorites',
                description: 'Mark items as favorites for quick access.',
                action: { label: 'Browse Items', onClick: () => alert('Browse!') },
            },
        ];

        return (
            <div className="space-y-8">
                {examples.map((props, index) => (
                    <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                        <EmptyState {...props} />
                    </div>
                ))}
            </div>
        );
    },
    parameters: {
        docs: {
            description: {
                story: 'Multiple empty state variants demonstrated side by side.',
            },
        },
    },
};
