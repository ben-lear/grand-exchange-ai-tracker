/**
 * Unit tests for LiveIndicator component
 */

import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { LiveIndicator } from './LiveIndicator';

describe('LiveIndicator', () => {
    it('should render connected state', () => {
        render(<LiveIndicator isConnected={true} lastUpdateTime={new Date()} />);
        expect(screen.getByText(/live/i)).toBeInTheDocument();
    });

    it('should render disconnected state', () => {
        render(<LiveIndicator isConnected={false} lastUpdateTime={null} />);
        expect(screen.getByText(/connecting/i)).toBeInTheDocument();
    });

    it('should show reconnect count when provided', () => {
        render(<LiveIndicator isConnected={false} lastUpdateTime={null} reconnectCount={3} />);
        expect(screen.getByText(/retries:\s*3/i)).toBeInTheDocument();
    });

    it('should render with last update time', () => {
        const { container } = render(
            <LiveIndicator isConnected={true} lastUpdateTime={new Date()} />
        );
        expect(container.firstChild).toBeInTheDocument();
    });

    it('should not show reconnect count when zero', () => {
        render(<LiveIndicator isConnected={false} lastUpdateTime={null} reconnectCount={0} />);
        expect(screen.queryByText(/retries/i)).not.toBeInTheDocument();
    });

    it('should display updated text when lastUpdateTime is provided', () => {
        render(<LiveIndicator isConnected={true} lastUpdateTime={new Date()} />);
        expect(screen.getByText(/updated/i)).toBeInTheDocument();
    });
});
