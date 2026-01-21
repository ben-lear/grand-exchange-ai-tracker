import { render, screen } from '@testing-library/react';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { ShareInfoBanner } from './ShareInfoBanner';

// Mock the StatusBanner component
vi.mock('@/components/ui', () => ({
    StatusBanner: ({ variant, title, description, icon: Icon, className }: any) => (
        <div data-testid="status-banner" data-variant={variant} className={className}>
            <Icon className="w-5 h-5" />
            <h3>{title}</h3>
            <div>{description}</div>
        </div>
    ),
    Icon: ({ as: Component, className = '', ...props }: any) => {
        if (Component) {
            return React.createElement(Component, { className, ...props, 'data-testid': 'icon' });
        }
        return React.createElement('span', { className, ...props, 'data-testid': 'icon' }, 'icon');
    },
    Link: ({ to, children, ...props }: any) => (
        <a href={to} {...props}>
            {children}
        </a>
    ),
}));

describe('ShareInfoBanner', () => {
    const defaultProps = {
        token: 'abc123xyz789',
        expirationText: '3 days',
        accessCount: 5,
    };

    describe('Rendering', () => {
        it('should render with correct variant', () => {
            render(<ShareInfoBanner {...defaultProps} />);
            const banner = screen.getByTestId('status-banner');
            expect(banner).toHaveAttribute('data-variant', 'info');
        });

        it('should display share token', () => {
            render(<ShareInfoBanner {...defaultProps} />);
            expect(screen.getByText('abc123xyz789')).toBeInTheDocument();
        });

        it('should display expiration text', () => {
            render(<ShareInfoBanner {...defaultProps} />);
            expect(screen.getByTestId('status-banner')).toHaveTextContent(/Expires in\s*3 days/);
        });

        it('should display access count with plural', () => {
            render(<ShareInfoBanner {...defaultProps} />);
            expect(screen.getByTestId('status-banner')).toHaveTextContent(/Accessed\s*6\s*times/);
        });

        it('should display access count with singular for first access', () => {
            render(<ShareInfoBanner {...defaultProps} accessCount={0} />);
            expect(screen.getByTestId('status-banner')).toHaveTextContent(/Accessed\s*1\s*time\b/);
        });

        it('should display title', () => {
            render(<ShareInfoBanner {...defaultProps} />);
            expect(screen.getByText('This is a shared watchlist')).toBeInTheDocument();
        });
    });

    describe('Token display', () => {
        it('should render token in code formatting', () => {
            render(<ShareInfoBanner {...defaultProps} />);
            const tokenElement = screen.getByText('abc123xyz789');
            expect(tokenElement.tagName).toBe('CODE');
        });

        it('should handle long tokens', () => {
            const longToken = 'very-long-share-token-that-should-still-render-properly-123456789';
            render(<ShareInfoBanner {...defaultProps} token={longToken} />);
            expect(screen.getByText(longToken)).toBeInTheDocument();
        });

        it('should handle empty token', () => {
            render(<ShareInfoBanner {...defaultProps} token="" />);
            expect(screen.getByTestId('status-banner')).toHaveTextContent('Share token:');
        });
    });

    describe('Expiration display', () => {
        it('should handle different expiration formats', () => {
            render(<ShareInfoBanner {...defaultProps} expirationText="24 hours" />);
            expect(screen.getByTestId('status-banner')).toHaveTextContent(/Expires in\s*24 hours/);
        });

        it('should handle "Expired" status', () => {
            render(<ShareInfoBanner {...defaultProps} expirationText="Expired" />);
            expect(screen.getByTestId('status-banner')).toHaveTextContent(/Expires in\s*Expired/);
        });
    });

    describe('Styling', () => {
        it('should apply custom className', () => {
            const { container } = render(
                <ShareInfoBanner {...defaultProps} className="custom-class" />
            );
            // The className will be passed to StatusBanner, check the rendered structure
            expect(container.querySelector('.custom-class')).toBeInTheDocument();
        });
    });
});