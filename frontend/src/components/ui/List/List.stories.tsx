/**
 * List component stories
 */

import type { Meta, StoryObj } from '@storybook/react';
import { CheckCircle } from 'lucide-react';
import { ListItem } from '../ListItem/ListItem';
import { List } from './List';

const meta: Meta<typeof List> = {
    title: 'UI/List',
    component: List,
    parameters: {
        layout: 'centered',
    },
    tags: ['autodocs'],
    argTypes: {
        variant: {
            control: 'select',
            options: ['unordered', 'ordered', 'unstyled'],
        },
        spacing: {
            control: 'select',
            options: ['tight', 'normal', 'loose'],
        },
        marker: {
            control: 'select',
            options: ['disc', 'circle', 'square', 'none'],
        },
    },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Unordered: Story = {
    args: {
        children: (
            <>
                <ListItem>First item</ListItem>
                <ListItem>Second item</ListItem>
                <ListItem>Third item</ListItem>
            </>
        ),
    },
};

export const Ordered: Story = {
    args: {
        variant: 'ordered',
        children: (
            <>
                <ListItem>Step one</ListItem>
                <ListItem>Step two</ListItem>
                <ListItem>Step three</ListItem>
            </>
        ),
    },
};

export const WithIcons: Story = {
    args: {
        variant: 'unstyled',
        children: (
            <>
                <ListItem icon={CheckCircle}>Accessible</ListItem>
                <ListItem icon={CheckCircle}>Consistent</ListItem>
                <ListItem icon={CheckCircle}>Reusable</ListItem>
            </>
        ),
    },
};
