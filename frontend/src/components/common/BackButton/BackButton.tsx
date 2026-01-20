/**
 * BackButton component for navigation
 */

import { ArrowLeft } from 'lucide-react';
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/utils';
import { Button, Icon } from '@/components/ui';

export interface BackButtonProps {
    /** Optional click handler (defaults to navigate(-1)) */
    onClick?: () => void;
    /** Optional custom label text */
    label?: string;
    /** Custom className */
    className?: string;
}

/**
 * BackButton component for consistent back navigation
 * 
 * Usage:
 * <BackButton />
 * <BackButton label="Back to Dashboard" onClick={customHandler} />
 */
export const BackButton: React.FC<BackButtonProps> = ({
    onClick,
    label = 'Back',
    className,
}) => {
    const navigate = useNavigate();

    const handleClick = () => {
        if (onClick) {
            onClick();
        } else {
            navigate(-1);
        }
    };

    return (
        <Button
            variant="ghost"
            size="sm"
            onClick={handleClick}
            leftIcon={<Icon as={ArrowLeft} size="sm" />}
            className={cn('text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100', className)}
            aria-label={label}
        >
            {label}
        </Button>
    );
};
