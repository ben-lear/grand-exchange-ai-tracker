/**
 * KeyboardShortcut component for displaying keyboard shortcuts
 */

import { cva, type VariantProps } from 'class-variance-authority';
import React from 'react';
import { cn } from '@/utils';

const keyboardShortcutVariants = cva(
    'inline-flex items-center gap-1',
    {
        variants: {
            size: {
                xs: 'text-xs',
                sm: 'text-sm',
                md: 'text-base',
            },
            variant: {
                default: '',
                inline: 'opacity-70',
            },
        },
        defaultVariants: {
            size: 'sm',
            variant: 'default',
        },
    }
);

const keyVariants = cva(
    'inline-flex items-center justify-center font-mono font-medium border rounded',
    {
        variants: {
            size: {
                xs: 'px-1 py-0.5 text-xs min-w-[1.25rem]',
                sm: 'px-1.5 py-0.5 text-sm min-w-[1.5rem]',
                md: 'px-2 py-1 text-base min-w-[2rem]',
            },
        },
        defaultVariants: {
            size: 'sm',
        },
    }
);

export interface KeyboardShortcutProps extends VariantProps<typeof keyboardShortcutVariants> {
    /** Key or array of keys to display (e.g., 'K' or ['Ctrl', 'K']) */
    keys: string | string[];
    /** Size variant */
    size?: 'xs' | 'sm' | 'md';
    /** Visual variant */
    variant?: 'default' | 'inline';
}

// Platform detection
const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPod|iPad/i.test(navigator.platform);

// Key display mapping (Mac vs Windows/Linux)
const keyMapping: Record<string, string> = {
    Ctrl: isMac ? '⌘' : 'Ctrl',
    Control: isMac ? '⌘' : 'Ctrl',
    Cmd: '⌘',
    Command: '⌘',
    Alt: isMac ? '⌥' : 'Alt',
    Option: '⌥',
    Shift: isMac ? '⇧' : 'Shift',
    Enter: '↵',
    Return: '↵',
    Backspace: '⌫',
    Delete: '⌦',
    Escape: 'Esc',
    Tab: '⇥',
    ArrowUp: '↑',
    ArrowDown: '↓',
    ArrowLeft: '←',
    ArrowRight: '→',
};

/**
 * KeyboardShortcut component for displaying keyboard shortcuts
 * 
 * Usage:
 * <KeyboardShortcut keys="K" />
 * <KeyboardShortcut keys={['Ctrl', 'K']} />
 * <KeyboardShortcut keys={['Cmd', 'Shift', 'P']} size="md" />
 */
export const KeyboardShortcut: React.FC<KeyboardShortcutProps> = ({
    keys,
    size = 'sm',
    variant = 'default',
}) => {
    const keyArray = Array.isArray(keys) ? keys : [keys];

    const displayKeys = keyArray.map(key => keyMapping[key] || key);

    return (
        <kbd
            className={cn(keyboardShortcutVariants({ size, variant }))}
            aria-label={`Keyboard shortcut: ${keyArray.join(' + ')}`}
        >
            {displayKeys.map((key, index) => (
                <React.Fragment key={index}>
                    {index > 0 && (
                        <span className="text-gray-400 dark:text-gray-600">+</span>
                    )}
                    <span
                        className={cn(
                            keyVariants({ size }),
                            'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300'
                        )}
                    >
                        {key}
                    </span>
                </React.Fragment>
            ))}
        </kbd>
    );
};
