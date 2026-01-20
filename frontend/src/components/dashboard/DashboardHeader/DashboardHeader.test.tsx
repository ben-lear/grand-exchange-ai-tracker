import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { DashboardHeader } from './DashboardHeader';

describe('DashboardHeader', () => {
    describe('Rendering', () => {
        it('should render default title and description', () => {
            render(<DashboardHeader />);
            expect(screen.getByText('Grand Exchange Items')).toBeInTheDocument();
            expect(screen.getByText(/Browse and track all OSRS Grand Exchange items/)).toBeInTheDocument();
        });

        it('should render custom title', () => {
            render(<DashboardHeader title="Custom Title" />);
            expect(screen.getByText('Custom Title')).toBeInTheDocument();
        });

        it('should render custom description', () => {
            render(<DashboardHeader description="Custom description text" />);
            expect(screen.getByText('Custom description text')).toBeInTheDocument();
        });

        it('should render both custom title and description', () => {
            render(
                <DashboardHeader
                    title="My Dashboard"
                    description="A custom dashboard description"
                />
            );
            expect(screen.getByText('My Dashboard')).toBeInTheDocument();
            expect(screen.getByText('A custom dashboard description')).toBeInTheDocument();
        });
    });

    describe('Styling', () => {
        it('should apply custom className', () => {
            const { container } = render(
                <DashboardHeader className="custom-class" />
            );
            expect(container.firstChild).toHaveClass('custom-class');
        });

        it('should have default flex layout', () => {
            const { container } = render(<DashboardHeader />);
            expect(container.firstChild).toHaveClass('flex', 'items-center', 'justify-between');
        });
    });

    describe('Accessibility', () => {
        it('should have proper heading hierarchy', () => {
            render(<DashboardHeader />);
            const heading = screen.getByRole('heading', { level: 1 });
            expect(heading).toHaveTextContent('Grand Exchange Items');
        });

        it('should have proper heading with custom title', () => {
            render(<DashboardHeader title="My Dashboard" />);
            const heading = screen.getByRole('heading', { level: 1 });
            expect(heading).toHaveTextContent('My Dashboard');
        });
    });

    describe('Content', () => {
        it('should handle empty strings', () => {
            const { container } = render(<DashboardHeader title="" description="" />);
            const heading = screen.getByRole('heading', { level: 1 });
            expect(heading).toHaveTextContent('');
            // Description paragraph should still exist but be empty
            const description = container.querySelector('p');
            expect(description).toBeInTheDocument();
            expect(description).toHaveTextContent('');
        });

        it('should handle long titles', () => {
            const longTitle = 'This is a very long dashboard title that should still render properly';
            render(<DashboardHeader title={longTitle} />);
            expect(screen.getByText(longTitle)).toBeInTheDocument();
        });

        it('should handle long descriptions', () => {
            const longDescription = 'This is a very long description that provides detailed information about what users can expect to find on this dashboard page and how they can interact with the various features available to them.';
            render(<DashboardHeader description={longDescription} />);
            expect(screen.getByText(longDescription)).toBeInTheDocument();
        });
    });
});