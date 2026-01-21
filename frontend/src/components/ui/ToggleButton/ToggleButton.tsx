/**
 * ToggleButton component - icon-only toggle with active/inactive styling
 */

import { IconButton } from '@/components/ui/IconButton/IconButton';
import { cn } from '@/utils';
import React from 'react';

const activeColorClasses = {
    blue: 'text-blue-600 dark:text-blue-400',
    yellow: 'text-yellow-500 dark:text-yellow-400',
    green: 'text-green-600 dark:text-green-400',
    red: 'text-red-600 dark:text-red-400',
    purple: 'text-purple-600 dark:text-purple-400',
};

const inactiveColorClasses = {
    gray: 'text-gray-400 dark:text-gray-500',
    muted: 'text-gray-300 dark:text-gray-600',
};

const iconButtonSizeMap = {
    xs: 'sm',
    sm: 'sm',
    md: 'default',
    lg: 'lg',
    xl: 'lg',
} as const;

export interface ToggleButtonProps
    extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'onChange'> {
    /** Icon component to display */
    icon: React.ElementType;
    /** Whether the toggle is active */
    isActive: boolean;
    /** Toggle handler */
    onToggle: (isActive: boolean) => void;
    /** Active color variant */
    activeColor?: keyof typeof activeColorClasses;
    /** Inactive color variant */
    inactiveColor?: keyof typeof inactiveColorClasses;
    /** Size variant */
    size?: keyof typeof iconButtonSizeMap;
    /** Accessible label */
    label: string;
    /** Optional tooltip text */
    tooltip?: string;
}

/**
 * ToggleButton component
 */
export function ToggleButton({
    icon,
    isActive,
    onToggle,
    activeColor = 'blue',
    inactiveColor = 'gray',
    size = 'sm',
    label,
    tooltip,
    className,
    ...props
}: ToggleButtonProps) {
    return (
        <IconButton
            icon={icon}
            onClick={() => onToggle(!isActive)}
            variant={isActive ? 'primary' : 'ghost'}
            size={iconButtonSizeMap[size]}
            aria-label={label}
            aria-pressed={isActive}
            title={tooltip}
            className={cn(
                isActive ? activeColorClasses[activeColor] : inactiveColorClasses[inactiveColor],
                isActive && 'fill-current',
                className
            )}
            {...props}
        />
    );
}
