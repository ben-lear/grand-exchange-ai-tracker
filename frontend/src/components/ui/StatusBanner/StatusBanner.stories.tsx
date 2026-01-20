import { Button } from '@/components/ui/Button/Button';
import { StatusBanner } from '@/components/ui/StatusBanner/StatusBanner';
import type { Meta, StoryObj } from '@storybook/react';
import { Link, Share2, Star } from 'lucide-react';

const meta: Meta<typeof StatusBanner> = {
    title: 'UI/StatusBanner',
    component: StatusBanner,
    parameters: {
        layout: 'padded',
        docs: {
            description: {
                component: 'StatusBanner component for displaying contextual information, alerts, and notifications with different severity levels.',
            },
        },
    },
    tags: ['autodocs'],
    argTypes: {
        variant: {
            control: 'select',
            options: ['info', 'success', 'warning', 'error'],
            description: 'Visual variant affecting color scheme',
        },
        title: {
            control: 'text',
            description: 'Main title text',
        },
        description: {
            control: 'text',
            description: 'Optional description text',
        },
    },
};

export default meta;
type Story = StoryObj<typeof StatusBanner>;

export const Info: Story = {
    args: {
        variant: 'info',
        title: 'Information',
        description: 'This is an informational message for the user.',
    },
};

export const Success: Story = {
    args: {
        variant: 'success',
        title: 'Success!',
        description: 'Your action completed successfully.',
    },
};

export const Warning: Story = {
    args: {
        variant: 'warning',
        title: 'Warning',
        description: 'Please be careful with this action.',
    },
};

export const Error: Story = {
    args: {
        variant: 'error',
        title: 'Error',
        description: 'Something went wrong. Please try again.',
    },
};

export const WithAction: Story = {
    args: {
        variant: 'info',
        title: 'Share Link Active',
        description: 'Anyone with the link can view this watchlist.',
        action: (
            <Button size="sm" variant="ghost">
                Copy Link
            </Button>
        ),
    },
};

export const WithClose: Story = {
    args: {
        variant: 'success',
        title: 'Import Successful',
        description: '25 items have been added to your watchlist.',
        onClose: () => alert('Closed!'),
    },
};

export const WithCustomIcon: Story = {
    args: {
        variant: 'info',
        title: 'Favorites Feature',
        description: 'Mark items as favorites for quick access.',
        icon: Star,
    },
};

export const Complete: Story = {
    args: {
        variant: 'info',
        title: 'Watchlist Shared',
        description: 'Share this link with others to let them view your watchlist.',
        icon: Share2,
        action: (
            <div className="flex gap-2">
                <Button size="sm" variant="primary">
                    <Link className="w-4 h-4 mr-1" />
                    Copy Link
                </Button>
                <Button size="sm" variant="ghost">
                    View Details
                </Button>
            </div>
        ),
        onClose: () => alert('Closed!'),
    },
    parameters: {
        docs: {
            description: {
                story: 'StatusBanner with all features: custom icon, multiple actions, and close button.',
            },
        },
    },
};

export const TitleOnly: Story = {
    args: {
        variant: 'info',
        title: 'Quick notification',
    },
    parameters: {
        docs: {
            description: {
                story: 'Minimal banner with just a title.',
            },
        },
    },
};

export const NoDescription: Story = {
    args: {
        variant: 'success',
        title: 'Saved',
    },
};

export const LongContent: Story = {
    args: {
        variant: 'warning',
        title: 'This is a very long title that might wrap to multiple lines in narrow containers',
        description: 'This is a very long description that provides extensive details about the situation. It should wrap nicely across multiple lines and remain readable even in narrow containers. The layout should handle this gracefully without breaking.',
        action: (
            <Button size="sm" variant="ghost">
                View Full Details
            </Button>
        ),
        onClose: () => { },
    },
};

export const AllVariants: Story = {
    render: () => (
        <div className="space-y-4">
            <StatusBanner
                variant="info"
                title="Information"
                description="This is an informational message."
            />
            <StatusBanner
                variant="success"
                title="Success"
                description="Operation completed successfully."
            />
            <StatusBanner
                variant="warning"
                title="Warning"
                description="Please review before proceeding."
            />
            <StatusBanner
                variant="error"
                title="Error"
                description="An error occurred. Please try again."
            />
        </div>
    ),
    parameters: {
        docs: {
            description: {
                story: 'All banner variants side by side.',
            },
        },
    },
};

export const RealWorldExamples: Story = {
    render: () => (
        <div className="space-y-4">
            <StatusBanner
                variant="info"
                title="Share Link Active"
                description="Anyone with the link can view this watchlist. Changes you make will be visible to all viewers."
                action={
                    <div className="flex gap-2">
                        <Button size="sm" variant="ghost">
                            <Link className="w-4 h-4 mr-1" />
                            Copy Link
                        </Button>
                        <Button size="sm" variant="ghost">
                            Revoke Access
                        </Button>
                    </div>
                }
                onClose={() => { }}
            />

            <StatusBanner
                variant="success"
                title="Watchlist Imported Successfully"
                description="25 items from the shared watchlist have been added to your collection."
                onClose={() => { }}
            />

            <StatusBanner
                variant="warning"
                title="Connection Lost"
                description="Real-time price updates are currently unavailable. Displaying cached data."
                action={
                    <Button size="sm" variant="ghost">
                        Retry Connection
                    </Button>
                }
            />

            <StatusBanner
                variant="error"
                title="Failed to Load Items"
                description="Unable to fetch item data from the server. Please check your connection and try again."
                action={
                    <Button size="sm" variant="ghost">
                        Retry
                    </Button>
                }
                onClose={() => { }}
            />
        </div>
    ),
    parameters: {
        docs: {
            description: {
                story: 'Real-world usage examples from the OSRS GE Tracker app.',
            },
        },
    },
};

export const InteractiveDemo: Story = {
    args: {
        variant: 'info',
        title: 'Interactive Demo',
        description: 'Change the props to see how the banner responds.',
        action: <Button size="sm">Take Action</Button>,
        onClose: () => alert('Banner closed!'),
    },
    parameters: {
        docs: {
            description: {
                story: 'Interactive demo with all controls available.',
            },
        },
    },
};
