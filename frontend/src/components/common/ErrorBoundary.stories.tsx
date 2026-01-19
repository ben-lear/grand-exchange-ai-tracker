import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { Button } from '../ui';
import { ErrorBoundary } from './ErrorBoundary';
import { ErrorFallback } from './ErrorFallback';

const ThrowError = ({ shouldThrow }: { shouldThrow: boolean }) => {
    if (shouldThrow) {
        throw new Error('This is a simulated error for testing the ErrorBoundary');
    }
    return (
        <div className="p-8 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <h3 className="text-lg font-semibold text-green-800 dark:text-green-300 mb-2">
                ✓ No Error
            </h3>
            <p className="text-green-600 dark:text-green-400">
                Component is rendering successfully without errors.
            </p>
        </div>
    );
};

const ErrorDemo = ({ variant }: { variant: 'page' | 'section' | 'inline' }) => {
    const [shouldThrow, setShouldThrow] = useState(false);
    const [resetKey, setResetKey] = useState(0);

    const handleThrowError = () => {
        setShouldThrow(true);
    };

    const handleReset = () => {
        setShouldThrow(false);
        setResetKey(prev => prev + 1);
    };

    return (
        <div className="space-y-4">
            <div className="flex gap-2">
                <Button onClick={handleThrowError} variant="error">
                    Throw Error
                </Button>
                <Button onClick={handleReset} variant="secondary">
                    Reset
                </Button>
            </div>

            <ErrorBoundary
                fallback={(props) => <ErrorFallback {...props} variant={variant} />}
                resetKeys={[resetKey]}
            >
                <ThrowError shouldThrow={shouldThrow} />
            </ErrorBoundary>
        </div>
    );
};

const meta: Meta<typeof ErrorBoundary> = {
    title: 'Common/ErrorBoundary',
    component: ErrorBoundary,
    parameters: {
        layout: 'padded',
        docs: {
            description: {
                component: 'ErrorBoundary catches JavaScript errors in child components and displays a fallback UI.',
            },
        },
    },
    tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof ErrorBoundary>;

export const PageVariant: Story = {
    render: () => <ErrorDemo variant="page" />,
    parameters: {
        layout: 'fullscreen',
        docs: {
            description: {
                story: 'Full page error fallback for critical errors (404, 500 style).',
            },
        },
    },
};

export const SectionVariant: Story = {
    render: () => <ErrorDemo variant="section" />,
    parameters: {
        docs: {
            description: {
                story: 'Section error fallback for component-level errors (charts, tables).',
            },
        },
    },
};

export const InlineVariant: Story = {
    render: () => <ErrorDemo variant="inline" />,
    parameters: {
        docs: {
            description: {
                story: 'Inline error fallback for small, compact error displays.',
            },
        },
    },
};

export const WithResetKeys: Story = {
    render: () => {
        const [itemId, setItemId] = useState(1);
        const [shouldThrow, setShouldThrow] = useState(false);

        return (
            <div className="space-y-4">
                <div className="flex gap-2">
                    <Button onClick={() => setShouldThrow(true)} variant="error">
                        Throw Error
                    </Button>
                    <Button onClick={() => setItemId(prev => prev + 1)} variant="secondary">
                        Change Item ID (triggers reset)
                    </Button>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                    Current Item ID: <strong>{itemId}</strong>
                </p>

                <ErrorBoundary
                    fallback={(props) => <ErrorFallback {...props} variant="section" />}
                    resetKeys={[itemId]}
                >
                    <ThrowError shouldThrow={shouldThrow} />
                </ErrorBoundary>
            </div>
        );
    },
    parameters: {
        docs: {
            description: {
                story: 'ErrorBoundary automatically resets when resetKeys prop changes. Useful for resetting errors when navigating to different items.',
            },
        },
    },
};

export const WithErrorLogging: Story = {
    render: () => {
        const [shouldThrow, setShouldThrow] = useState(false);

        const handleError = (error: Error, errorInfo: React.ErrorInfo) => {
            console.log('Custom error handler called:', { error, errorInfo });
            // In production, send to error tracking service
        };

        return (
            <div className="space-y-4">
                <div className="flex gap-2">
                    <Button onClick={() => setShouldThrow(true)} variant="error">
                        Throw Error
                    </Button>
                    <Button onClick={() => setShouldThrow(false)} variant="secondary">
                        Reset
                    </Button>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                    Check console for logged errors
                </p>

                <ErrorBoundary
                    fallback={(props) => <ErrorFallback {...props} variant="section" />}
                    onError={handleError}
                >
                    <ThrowError shouldThrow={shouldThrow} />
                </ErrorBoundary>
            </div>
        );
    },
    parameters: {
        docs: {
            description: {
                story: 'Use onError callback to log errors to external services or perform custom error handling.',
            },
        },
    },
};
