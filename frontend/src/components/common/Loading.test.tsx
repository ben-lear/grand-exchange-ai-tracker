/**
 * Tests for Loading component
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Loading, InlineLoading } from './Loading';

describe('Loading', () => {
  describe('Basic Rendering', () => {
    it('should render loading spinner', () => {
      render(<Loading />);
      const spinner = screen.getByRole('status', { name: 'Loading' });
      expect(spinner).toBeInTheDocument();
    });

    it('should render with message', () => {
      render(<Loading message="Loading items..." />);
      expect(screen.getByText('Loading items...')).toBeInTheDocument();
    });

    it('should not render message when not provided', () => {
      const { container } = render(<Loading />);
      const message = container.querySelector('p');
      expect(message).not.toBeInTheDocument();
    });
  });

  describe('Size Variants', () => {
    it('should render with small size', () => {
      const { container } = render(<Loading size="sm" />);
      const spinner = container.querySelector('.w-4');
      expect(spinner).toBeInTheDocument();
    });

    it('should render with medium size (default)', () => {
      const { container } = render(<Loading size="md" />);
      const spinner = container.querySelector('.w-8');
      expect(spinner).toBeInTheDocument();
    });

    it('should render with large size', () => {
      const { container } = render(<Loading size="lg" />);
      const spinner = container.querySelector('.w-12');
      expect(spinner).toBeInTheDocument();
    });

    it('should render with extra large size', () => {
      const { container } = render(<Loading size="xl" />);
      const spinner = container.querySelector('.w-16');
      expect(spinner).toBeInTheDocument();
    });
  });

  describe('Full Screen Mode', () => {
    it('should render full screen overlay', () => {
      const { container } = render(<Loading fullScreen />);
      const overlay = container.querySelector('.fixed.inset-0');
      expect(overlay).toBeInTheDocument();
    });

    it('should render full screen with message', () => {
      render(<Loading fullScreen message="Processing..." />);
      expect(screen.getByText('Processing...')).toBeInTheDocument();
    });

    it('should have backdrop blur in full screen mode', () => {
      const { container } = render(<Loading fullScreen />);
      const overlay = container.querySelector('.backdrop-blur-sm');
      expect(overlay).toBeInTheDocument();
    });
  });

  describe('Custom Styling', () => {
    it('should apply custom className', () => {
      const { container } = render(<Loading className="custom-class" />);
      const spinner = container.querySelector('.custom-class');
      expect(spinner).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper role attribute', () => {
      render(<Loading />);
      const spinner = screen.getByRole('status');
      expect(spinner).toBeInTheDocument();
    });

    it('should have aria-label', () => {
      render(<Loading />);
      const spinner = screen.getByLabelText('Loading');
      expect(spinner).toBeInTheDocument();
    });
  });
});

describe('InlineLoading', () => {
  it('should render inline loading spinner', () => {
    render(<InlineLoading />);
    const spinner = screen.getByRole('status', { name: 'Loading' });
    expect(spinner).toBeInTheDocument();
  });

  it('should be inline-block by default', () => {
    const { container } = render(<InlineLoading />);
    const spinner = container.querySelector('.inline-block');
    expect(spinner).toBeInTheDocument();
  });

  it('should apply custom className', () => {
    const { container } = render(<InlineLoading className="ml-2" />);
    const spinner = container.querySelector('.ml-2');
    expect(spinner).toBeInTheDocument();
  });

  it('should be small by default', () => {
    const { container } = render(<InlineLoading />);
    const spinner = container.querySelector('.w-4.h-4');
    expect(spinner).toBeInTheDocument();
  });

  it('should have accessibility attributes', () => {
    render(<InlineLoading />);
    const spinner = screen.getByRole('status');
    expect(spinner).toHaveAttribute('aria-label', 'Loading');
  });
});
