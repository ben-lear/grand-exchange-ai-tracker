/**
 * Shared CVA variants for Select components
 */

import { cva } from 'class-variance-authority';

/**
 * Button variant styles for the select trigger
 */
export const selectButtonVariants = cva(
    'w-full rounded-lg border transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 flex items-center justify-between px-3 py-2 text-sm',
    {
        variants: {
            variant: {
                default:
                    'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 hover:border-gray-400 dark:hover:border-gray-500 focus:ring-blue-500',
                error:
                    'bg-white dark:bg-gray-700 border-2 border-red-500 dark:border-red-400 text-gray-900 dark:text-gray-100 focus:ring-red-500',
                success:
                    'bg-white dark:bg-gray-700 border-2 border-green-500 dark:border-green-400 text-gray-900 dark:text-gray-100 focus:ring-green-500',
            },
            size: {
                xs: 'h-8 text-xs',
                sm: 'h-9 text-sm',
                md: 'h-10 text-sm',
                lg: 'h-12 text-base',
            },
        },
        defaultVariants: {
            variant: 'default',
            size: 'md',
        },
    }
);

/**
 * Dropdown panel variant styles
 */
export const dropdownPanelVariants = cva(
    'absolute w-full mt-2 rounded-lg border bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 shadow-lg z-50',
    {
        variants: {
            size: {
                xs: 'text-xs',
                sm: 'text-sm',
                md: 'text-sm',
                lg: 'text-base',
            },
        },
    }
);

/**
 * Option item variant styles
 */
export const optionVariants = cva(
    'w-full px-3 py-2 text-left transition-colors cursor-pointer flex items-center gap-2',
    {
        variants: {
            selected: {
                true: 'bg-blue-50 dark:bg-blue-900 text-blue-900 dark:text-blue-100',
                false: 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600',
            },
            disabled: {
                true: 'opacity-50 cursor-not-allowed',
                false: '',
            },
        },
    }
);

/**
 * Search input styles
 */
export const searchInputClassName =
    'w-full px-2 py-1 text-sm border rounded bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500';

/**
 * Transition props for dropdown animation
 */
export const transitionProps = {
    enter: 'transition ease-out duration-100',
    enterFrom: 'transform opacity-0 scale-95',
    enterTo: 'transform opacity-100 scale-100',
    leave: 'transition ease-in duration-75',
    leaveFrom: 'transform opacity-100 scale-100',
    leaveTo: 'transform opacity-0 scale-95',
};
