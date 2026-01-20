/**
 * Storybook stories for Loading components
 */

import type { Meta, StoryObj } from '@storybook/react';
import { Stack } from '../../ui';
import {
    CardGridLoading,
    DotsLoading,
    InlineLoading,
    Loading,
    LoadingSpinner,
    PulseLoading,
    TableLoading,
} from './index';

const meta: Meta<typeof Loading> = {
    title: 'Common/Loading',
    component: Loading,
    tags: ['autodocs'],
    parameters: {
        layout: 'centered',
    },
};

export default meta;
type Story = StoryObj<typeof Loading>;

// Main Loading component stories
export const Default: Story = {
    args: {
        size: 'md',
        variant: 'spinner',
    },
};

export const WithMessage: Story = {
    args: {
        size: 'md',
        variant: 'spinner',
        message: 'Loading items...',
    },
};

export const AllSizes: Story = {
    render: () => (
        <Stack direction="row" gap={8} align="center">
            <Stack direction="col" gap={2} align="center">
                <Loading size="sm" />
                <span className="text-xs text-gray-500">Small</span>
            </Stack>
            <Stack direction="col" gap={2} align="center">
                <Loading size="md" />
                <span className="text-xs text-gray-500">Medium</span>
            </Stack>
            <Stack direction="col" gap={2} align="center">
                <Loading size="lg" />
                <span className="text-xs text-gray-500">Large</span>
            </Stack>
            <Stack direction="col" gap={2} align="center">
                <Loading size="xl" />
                <span className="text-xs text-gray-500">X-Large</span>
            </Stack>
        </Stack>
    ),
};

export const AllVariants: Story = {
    render: () => (
        <Stack direction="row" gap={8} align="center">
            <Stack direction="col" gap={2} align="center">
                <Loading variant="spinner" size="lg" />
                <span className="text-xs text-gray-500">Spinner</span>
            </Stack>
            <Stack direction="col" gap={2} align="center">
                <Loading variant="dots" size="lg" />
                <span className="text-xs text-gray-500">Dots</span>
            </Stack>
            <Stack direction="col" gap={2} align="center">
                <Loading variant="pulse" size="lg" />
                <span className="text-xs text-gray-500">Pulse</span>
            </Stack>
        </Stack>
    ),
};

// Individual component stories
export const SpinnerVariants: Story = {
    render: () => (
        <Stack direction="row" gap={6} align="center">
            <LoadingSpinner size="sm" />
            <LoadingSpinner size="md" />
            <LoadingSpinner size="lg" />
            <LoadingSpinner size="xl" />
        </Stack>
    ),
};

export const SpinnerWithMessage: Story = {
    render: () => <LoadingSpinner size="lg" message="Fetching data..." />,
};

export const DotsVariants: Story = {
    render: () => (
        <Stack direction="row" gap={6} align="center">
            <DotsLoading size="sm" />
            <DotsLoading size="md" />
            <DotsLoading size="lg" />
            <DotsLoading size="xl" />
        </Stack>
    ),
};

export const PulseVariants: Story = {
    render: () => (
        <Stack direction="row" gap={6} align="center">
            <PulseLoading size="sm" />
            <PulseLoading size="md" />
            <PulseLoading size="lg" />
            <PulseLoading size="xl" />
        </Stack>
    ),
};

export const InlineLoadingVariants: Story = {
    render: () => (
        <Stack direction="col" gap={4}>
            <div className="flex items-center gap-2">
                <span>Loading</span>
                <InlineLoading variant="spinner" />
            </div>
            <div className="flex items-center gap-2">
                <span>Processing</span>
                <InlineLoading variant="dots" />
            </div>
            <div className="flex items-center gap-2">
                <span>Saving</span>
                <InlineLoading variant="pulse" />
            </div>
        </Stack>
    ),
};

export const TableLoadingDefault: Story = {
    render: () => (
        <div className="w-[600px]">
            <TableLoading rows={5} columns={4} />
        </div>
    ),
};

export const TableLoadingCustom: Story = {
    render: () => (
        <div className="w-[400px]">
            <TableLoading rows={3} columns={2} />
        </div>
    ),
};

export const CardGridLoadingDefault: Story = {
    render: () => (
        <div className="w-[800px]">
            <CardGridLoading count={6} columns={3} />
        </div>
    ),
};

export const CardGridLoadingTwoColumns: Story = {
    render: () => (
        <div className="w-[600px]">
            <CardGridLoading count={4} columns={2} />
        </div>
    ),
};

export const FullScreenLoading: Story = {
    parameters: {
        layout: 'fullscreen',
    },
    render: () => (
        <div className="relative h-[400px] w-full bg-gray-100">
            <Loading fullScreen message="Loading application..." />
        </div>
    ),
};
