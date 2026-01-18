/**
 * Tests for ErrorDisplay component
 */

import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { ApiError } from '../../types';
import { ErrorDisplay } from './ErrorDisplay';

// Helper to create ApiError objects with required Error properties
const createApiError = (error: string, status: number, extras?: Partial<ApiError>): ApiError => ({
  name: 'ApiError',
  message: error,
  error,
  status,
  ...extras,
});

describe('ErrorDisplay', () => {
  describe('Basic Rendering', () => {
    it('should render nothing when no error provided', () => {
      const { container } = render(<ErrorDisplay error={null} />);
      expect(container.firstChild).toBeNull();
    });

    it('should render string error', () => {
      render(<ErrorDisplay error="Something went wrong" />);
      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    });

    it('should render Error object', () => {
      const error = new Error('Test error');
      render(<ErrorDisplay error={error} />);
      expect(screen.getByText('Test error')).toBeInTheDocument();
    });

    it('should render ApiError object', () => {
      const apiError: ApiError = createApiError('API request failed', 500);
      render(<ErrorDisplay error={apiError} />);
      expect(screen.getByText('API request failed')).toBeInTheDocument();
    });

    it('should display default error message for unknown error type', () => {
      render(<ErrorDisplay error={{ name: 'TestError', message: 'Test error message' }} />);
      expect(screen.getByText('Test error message')).toBeInTheDocument();
    });
  });

  describe('Title and Status Code', () => {
    it('should render default title', () => {
      render(<ErrorDisplay error="Test error" />);
      expect(screen.getByText('Error')).toBeInTheDocument();
    });

    it('should render custom title', () => {
      render(<ErrorDisplay error="Test error" title="Custom Error Title" />);
      expect(screen.getByText('Custom Error Title')).toBeInTheDocument();
    });

    it('should display status code with ApiError', () => {
      const apiError: ApiError = createApiError('Not found', 404);
      render(<ErrorDisplay error={apiError} />);
      expect(screen.getByText(/404/)).toBeInTheDocument();
    });
  });

  describe('Inline Mode', () => {
    it('should render inline error', () => {
      const { container } = render(
        <ErrorDisplay error="Inline error" inline />
      );
      const errorDiv = container.querySelector('.flex.items-center');
      expect(errorDiv).toBeInTheDocument();
    });

    it('should not show title in inline mode', () => {
      render(<ErrorDisplay error="Test" title="Error Title" inline />);
      expect(screen.queryByText('Error Title')).not.toBeInTheDocument();
    });

    it('should show retry button in inline mode', () => {
      const onRetry = vi.fn();
      render(<ErrorDisplay error="Test" inline onRetry={onRetry} />);
      const retryButton = screen.getByText('Retry');
      expect(retryButton).toBeInTheDocument();
    });
  });

  describe('Retry Functionality', () => {
    it('should show retry button when onRetry is provided', () => {
      const onRetry = vi.fn();
      render(<ErrorDisplay error="Test error" onRetry={onRetry} />);
      const retryButton = screen.getByRole('button', { name: /retry/i });
      expect(retryButton).toBeInTheDocument();
    });

    it('should call onRetry when button is clicked', () => {
      const onRetry = vi.fn();
      render(<ErrorDisplay error="Test error" onRetry={onRetry} />);
      const retryButton = screen.getByRole('button', { name: /retry/i });

      fireEvent.click(retryButton);
      expect(onRetry).toHaveBeenCalledTimes(1);
    });

    it('should not show retry button when onRetry is not provided', () => {
      render(<ErrorDisplay error="Test error" />);
      const retryButton = screen.queryByRole('button', { name: /retry/i });
      expect(retryButton).not.toBeInTheDocument();
    });
  });

  describe('Custom Styling', () => {
    it('should apply custom className', () => {
      const { container } = render(
        <ErrorDisplay error="Test" className="custom-error-class" />
      );
      const errorDiv = container.querySelector('.custom-error-class');
      expect(errorDiv).toBeInTheDocument();
    });

    it('should apply custom className in inline mode', () => {
      const { container } = render(
        <ErrorDisplay error="Test" inline className="custom-inline-class" />
      );
      const errorDiv = container.querySelector('.custom-inline-class');
      expect(errorDiv).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have role="alert"', () => {
      render(<ErrorDisplay error="Test error" />);
      const alert = screen.getByRole('alert');
      expect(alert).toBeInTheDocument();
    });

    it('should have alert icon', () => {
      const { container } = render(<ErrorDisplay error="Test error" />);
      const icon = container.querySelector('svg');
      expect(icon).toBeInTheDocument();
    });
  });

  describe('ApiError Details', () => {
    it('should handle ApiError with request ID', () => {
      const apiError: ApiError = createApiError('Server error', 500, { requestId: 'req_12345' });
      render(<ErrorDisplay error={apiError} />);
      expect(screen.getByText('Server error')).toBeInTheDocument();
    });

    it('should handle ApiError with details', () => {
      const apiError: ApiError = createApiError('Validation failed', 400, { details: { field: 'email', message: 'Invalid email' } });
      render(<ErrorDisplay error={apiError} />);
      expect(screen.getByText('Validation failed')).toBeInTheDocument();
    });
  });

  describe('Network Errors', () => {
    it('should handle network timeout error', () => {
      const error = new Error('Network timeout');
      render(<ErrorDisplay error={error} title="Network Error" />);
      expect(screen.getByText('Network timeout')).toBeInTheDocument();
      expect(screen.getByText('Network Error')).toBeInTheDocument();
    });

    it('should handle connection refused error', () => {
      const apiError: ApiError = createApiError('Connection refused', 0);
      render(<ErrorDisplay error={apiError} />);
      expect(screen.getByText('Connection refused')).toBeInTheDocument();
    });
  });
});
