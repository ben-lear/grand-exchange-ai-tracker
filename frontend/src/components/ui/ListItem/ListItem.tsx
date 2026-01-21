/**
 * ListItem component - semantic list item with optional icon
 */

import React from 'react';
import { cn } from '@/utils';
import { Icon } from '@/components/ui/Icon/Icon';

export interface ListItemProps {
    /** Child content */
    children: React.ReactNode;
    /** Optional icon component */
    icon?: React.ElementType;
    /** Additional classes */
    className?: string;
    /** Optional content wrapper classes */
    contentClassName?: string;
}

/**
 * ListItem component
 */
export function ListItem({ children, icon: IconComponent, className, contentClassName }: ListItemProps) {
    return (
        <li className={cn('flex items-start gap-2', className)}>
            {IconComponent && <Icon as={IconComponent} size="sm" className="mt-0.5" />}
            <div className={cn('min-w-0', contentClassName)}>{children}</div>
        </li>
    );
}
