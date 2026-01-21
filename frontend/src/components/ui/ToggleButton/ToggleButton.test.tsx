/**
 * ToggleButton component tests
 */

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Star } from 'lucide-react';
import { describe, expect, it, vi } from 'vitest';
import { ToggleButton } from './ToggleButton';

describe('ToggleButton', () => {
    it('renders in inactive state', () => {
        render(
            <ToggleButton
                icon={Star}
                isActive={false}
                onToggle={vi.fn()}
                label="Favorite"
            />
        );

        const button = screen.getByRole('button', { name: 'Favorite' });
        expect(button).toHaveAttribute('aria-pressed', 'false');
    });

    it('renders in active state', () => {
        render(
            <ToggleButton
                icon={Star}
                isActive={true}
                onToggle={vi.fn()}
                label="Favorite"
            />
        );

        const button = screen.getByRole('button', { name: 'Favorite' });
        expect(button).toHaveAttribute('aria-pressed', 'true');
        expect(button.className).toMatch(/fill-current/);
    });

    it('toggles state on click', async () => {
        const onToggle = vi.fn();
        const user = userEvent.setup();

        render(
            <ToggleButton
                icon={Star}
                isActive={false}
                onToggle={onToggle}
                label="Favorite"
            />
        );

        await user.click(screen.getByRole('button', { name: 'Favorite' }));
        expect(onToggle).toHaveBeenCalledWith(true);
    });
});
