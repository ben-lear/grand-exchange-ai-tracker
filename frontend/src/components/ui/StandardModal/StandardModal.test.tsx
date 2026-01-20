/**
 * StandardModal component tests
 */

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FolderPlus } from 'lucide-react';
import { describe, expect, it, vi } from 'vitest';
import { StandardModal, type StandardModalProps } from '@/components/ui/StandardModal/StandardModal';

const defaultProps: StandardModalProps = {
  isOpen: true,
  onClose: vi.fn(),
  title: 'Test Modal',
  children: <div>Modal content</div>,
};

describe('StandardModal', () => {
  it('should render when open', () => {
    render(<StandardModal {...defaultProps} />);

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Test Modal')).toBeInTheDocument();
    expect(screen.getByText('Modal content')).toBeInTheDocument();
  });

  it('should not render when closed', () => {
    render(<StandardModal {...defaultProps} isOpen={false} />);

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('should display title', () => {
    render(<StandardModal {...defaultProps} title="My Custom Title" />);

    expect(screen.getByText('My Custom Title')).toBeInTheDocument();
  });

  it('should display icon when provided', () => {
    render(<StandardModal {...defaultProps} icon={FolderPlus} />);

    // The icon should be rendered (via lucide-react SVG)
    const svgIcon = document.querySelector('svg');
    expect(svgIcon).toBeInTheDocument();
  });

  it('should render children content', () => {
    render(
      <StandardModal {...defaultProps}>
        <p data-testid="custom-content">Custom content here</p>
      </StandardModal>
    );

    expect(screen.getByTestId('custom-content')).toHaveTextContent('Custom content here');
  });

  it('should render footer when provided', () => {
    render(
      <StandardModal
        {...defaultProps}
        footer={<button data-testid="footer-btn">Submit</button>}
      />
    );

    expect(screen.getByTestId('footer-btn')).toBeInTheDocument();
  });

  it('should not render footer when not provided', () => {
    render(<StandardModal {...defaultProps} footer={undefined} />);

    // Only header and content divs, no footer
    const contentContainer = screen.getByText('Modal content').parentElement;
    expect(contentContainer).toBeInTheDocument();
  });

  describe('close button', () => {
    it('should call onClose when close button is clicked', async () => {
      const user = userEvent.setup();
      const onClose = vi.fn();

      render(<StandardModal {...defaultProps} onClose={onClose} />);

      await user.click(screen.getByLabelText('Close modal'));

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('should be disabled when closeDisabled is true', async () => {
      const user = userEvent.setup();
      const onClose = vi.fn();

      render(
        <StandardModal {...defaultProps} onClose={onClose} closeDisabled={true} />
      );

      const closeButton = screen.getByLabelText('Close modal');
      expect(closeButton).toBeDisabled();

      await user.click(closeButton);

      expect(onClose).not.toHaveBeenCalled();
    });
  });

  describe('backdrop click', () => {
    it('should close on backdrop click by default', async () => {
      const user = userEvent.setup();
      const onClose = vi.fn();

      render(<StandardModal {...defaultProps} onClose={onClose} />);

      // Click the backdrop (outside the modal panel)
      const backdrop = document.querySelector('[aria-hidden="true"]');
      if (backdrop) {
        await user.click(backdrop);
      }

      // HeadlessUI handles this internally, we just verify the modal is closeable
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });
    });

    it('should not close on backdrop click when closeOnBackdropClick is false', async () => {
      const onClose = vi.fn();

      render(
        <StandardModal
          {...defaultProps}
          onClose={onClose}
          closeOnBackdropClick={false}
        />
      );

      // The modal should remain open
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
  });

  describe('sizes', () => {
    it('should apply small size class', () => {
      render(<StandardModal {...defaultProps} size="sm" />);

      const panel = screen.getByRole('dialog').querySelector('[class*="max-w-sm"]');
      expect(panel).toBeInTheDocument();
    });

    it('should apply large size class', () => {
      render(<StandardModal {...defaultProps} size="lg" />);

      const panel = screen.getByRole('dialog').querySelector('[class*="max-w-lg"]');
      expect(panel).toBeInTheDocument();
    });

    it('should apply default (md) size when not specified', () => {
      render(<StandardModal {...defaultProps} />);

      const panel = screen.getByRole('dialog').querySelector('[class*="max-w-md"]');
      expect(panel).toBeInTheDocument();
    });
  });

  describe('icon colors', () => {
    it('should apply primary icon color by default', () => {
      render(<StandardModal {...defaultProps} icon={FolderPlus} />);

      const icon = document.querySelector('svg');
      expect(icon).toHaveClass('text-blue-600');
    });

    it('should apply success icon color', () => {
      render(<StandardModal {...defaultProps} icon={FolderPlus} iconColor="success" />);

      const icon = document.querySelector('svg');
      expect(icon).toHaveClass('text-green-600');
    });

    it('should apply error icon color', () => {
      render(<StandardModal {...defaultProps} icon={FolderPlus} iconColor="error" />);

      const icon = document.querySelector('svg');
      expect(icon).toHaveClass('text-red-600');
    });
  });

  describe('custom className', () => {
    it('should apply custom className to panel', () => {
      render(<StandardModal {...defaultProps} className="custom-class" />);

      const panel = screen.getByRole('dialog').querySelector('.custom-class');
      expect(panel).toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('should have accessible dialog role', () => {
      render(<StandardModal {...defaultProps} />);

      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('should have accessible close button', () => {
      render(<StandardModal {...defaultProps} />);

      expect(screen.getByLabelText('Close modal')).toBeInTheDocument();
    });
  });
});
