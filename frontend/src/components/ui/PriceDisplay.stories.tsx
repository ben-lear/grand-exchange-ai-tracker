import type { Meta, StoryObj } from '@storybook/react';
import { PriceDisplay } from './PriceDisplay';

const meta: Meta<typeof PriceDisplay> = {
    title: 'UI/PriceDisplay',
    component: PriceDisplay,
    parameters: {
        layout: 'centered',
        docs: {
            description: {
                component: 'PriceDisplay component for consistent formatting and color-coding of OSRS Grand Exchange prices.',
            },
        },
    },
    tags: ['autodocs'],
    argTypes: {
        value: {
            control: 'number',
            description: 'The price value to display',
        },
        type: {
            control: 'select',
            options: ['high', 'low', 'mid', 'margin'],
            description: 'The type of price (affects color)',
        },
        size: {
            control: 'select',
            options: ['sm', 'md', 'lg'],
            description: 'Size variant',
        },
        showLabel: {
            control: 'boolean',
            description: 'Whether to show the label prefix',
        },
        label: {
            control: 'text',
            description: 'Custom label text',
        },
    },
};

export default meta;
type Story = StoryObj<typeof PriceDisplay>;

export const High: Story = {
    args: {
        value: 1500000,
        type: 'high',
    },
    parameters: {
        docs: {
            description: {
                story: 'High price variant with emerald/green color.',
            },
        },
    },
};

export const Low: Story = {
    args: {
        value: 1200000,
        type: 'low',
    },
    parameters: {
        docs: {
            description: {
                story: 'Low price variant with rose/red color.',
            },
        },
    },
};

export const Mid: Story = {
    args: {
        value: 1350000,
        type: 'mid',
    },
    parameters: {
        docs: {
            description: {
                story: 'Mid price variant with blue color.',
            },
        },
    },
};

export const Margin: Story = {
    args: {
        value: 150000,
        type: 'margin',
    },
    parameters: {
        docs: {
            description: {
                story: 'Margin/profit variant with purple color.',
            },
        },
    },
};

export const WithLabel: Story = {
    args: {
        value: 1500000,
        type: 'high',
        showLabel: true,
    },
    parameters: {
        docs: {
            description: {
                story: 'Display with default label prefix.',
            },
        },
    },
};

export const WithCustomLabel: Story = {
    args: {
        value: 1500000,
        type: 'high',
        showLabel: true,
        label: 'Buy',
    },
    parameters: {
        docs: {
            description: {
                story: 'Display with custom label text.',
            },
        },
    },
};

export const SmallSize: Story = {
    args: {
        value: 1500000,
        type: 'high',
        size: 'sm',
    },
};

export const MediumSize: Story = {
    args: {
        value: 1500000,
        type: 'high',
        size: 'md',
    },
};

export const LargeSize: Story = {
    args: {
        value: 1500000,
        type: 'high',
        size: 'lg',
    },
};

export const AllTypes: Story = {
    render: () => (
        <div className="space-y-4">
            <div className="flex items-center gap-4">
                <span className="w-20 text-gray-600 dark:text-gray-400">High:</span>
                <PriceDisplay value={1500000} type="high" />
            </div>
            <div className="flex items-center gap-4">
                <span className="w-20 text-gray-600 dark:text-gray-400">Low:</span>
                <PriceDisplay value={1200000} type="low" />
            </div>
            <div className="flex items-center gap-4">
                <span className="w-20 text-gray-600 dark:text-gray-400">Mid:</span>
                <PriceDisplay value={1350000} type="mid" />
            </div>
            <div className="flex items-center gap-4">
                <span className="w-20 text-gray-600 dark:text-gray-400">Margin:</span>
                <PriceDisplay value={300000} type="margin" />
            </div>
        </div>
    ),
    parameters: {
        docs: {
            description: {
                story: 'All price type variants with color coding.',
            },
        },
    },
};

export const AllSizes: Story = {
    render: () => (
        <div className="space-y-4">
            <div className="flex items-center gap-4">
                <span className="w-20 text-gray-600 dark:text-gray-400">Small:</span>
                <PriceDisplay value={1500000} type="high" size="sm" />
            </div>
            <div className="flex items-center gap-4">
                <span className="w-20 text-gray-600 dark:text-gray-400">Medium:</span>
                <PriceDisplay value={1500000} type="high" size="md" />
            </div>
            <div className="flex items-center gap-4">
                <span className="w-20 text-gray-600 dark:text-gray-400">Large:</span>
                <PriceDisplay value={1500000} type="high" size="lg" />
            </div>
        </div>
    ),
    parameters: {
        docs: {
            description: {
                story: 'All size variants.',
            },
        },
    },
};

export const NumberFormats: Story = {
    render: () => (
        <div className="space-y-4">
            <div className="flex items-center gap-4">
                <span className="w-32 text-gray-600 dark:text-gray-400">Billions:</span>
                <PriceDisplay value={2500000000} type="high" />
            </div>
            <div className="flex items-center gap-4">
                <span className="w-32 text-gray-600 dark:text-gray-400">Millions:</span>
                <PriceDisplay value={45000000} type="high" />
            </div>
            <div className="flex items-center gap-4">
                <span className="w-32 text-gray-600 dark:text-gray-400">Thousands:</span>
                <PriceDisplay value={150000} type="high" />
            </div>
            <div className="flex items-center gap-4">
                <span className="w-32 text-gray-600 dark:text-gray-400">Hundreds:</span>
                <PriceDisplay value={500} type="high" />
            </div>
            <div className="flex items-center gap-4">
                <span className="w-32 text-gray-600 dark:text-gray-400">Zero:</span>
                <PriceDisplay value={0} type="mid" />
            </div>
        </div>
    ),
    parameters: {
        docs: {
            description: {
                story: 'Different number formats and magnitudes.',
            },
        },
    },
};

export const WithLabels: Story = {
    render: () => (
        <div className="space-y-4">
            <PriceDisplay value={1500000} type="high" showLabel />
            <PriceDisplay value={1200000} type="low" showLabel />
            <PriceDisplay value={1350000} type="mid" showLabel />
            <PriceDisplay value={300000} type="margin" showLabel />
        </div>
    ),
    parameters: {
        docs: {
            description: {
                story: 'All types with default labels.',
            },
        },
    },
};

export const InteractiveDemo: Story = {
    args: {
        value: 1500000,
        type: 'high',
        size: 'md',
        showLabel: false,
    },
    parameters: {
        docs: {
            description: {
                story: 'Interactive demo with all controls available.',
            },
        },
    },
};
