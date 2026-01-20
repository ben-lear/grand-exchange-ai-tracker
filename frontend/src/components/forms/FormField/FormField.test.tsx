/**
 * FormField component tests
 */

import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { FormField, InlineFormField, type FormFieldProps } from './FormField';

const defaultProps: FormFieldProps = {
    label: 'Username',
    htmlFor: 'username',
    children: <input id="username" type="text" />,
};

describe('FormField', () => {
    it('should render label and children', () => {
        render(<FormField {...defaultProps} />);

        expect(screen.getByLabelText('Username')).toBeInTheDocument();
        expect(screen.getByRole('textbox')).toBeInTheDocument();
    });

    it('should associate label with input via htmlFor', () => {
        render(<FormField {...defaultProps} />);

        const label = screen.getByText('Username');
        const input = screen.getByRole('textbox');

        expect(label).toHaveAttribute('for', 'username');
        expect(input).toHaveAttribute('id', 'username');
    });

    describe('required indicator', () => {
        it('should show asterisk when required', () => {
            render(<FormField {...defaultProps} required />);

            expect(screen.getByText('*')).toBeInTheDocument();
        });

        it('should include screen reader text for required', () => {
            render(<FormField {...defaultProps} required />);

            expect(screen.getByText('(required)')).toHaveClass('sr-only');
        });

        it('should not show asterisk when not required', () => {
            render(<FormField {...defaultProps} />);

            expect(screen.queryByText('*')).not.toBeInTheDocument();
        });
    });

    describe('error message', () => {
        it('should display error message', () => {
            render(<FormField {...defaultProps} error="This field is required" />);

            expect(screen.getByRole('alert')).toHaveTextContent('This field is required');
        });

        it('should have error styling', () => {
            render(<FormField {...defaultProps} error="Error message" />);

            const errorMessage = screen.getByRole('alert');
            expect(errorMessage).toHaveClass('text-red-600');
        });

        it('should not display error when not provided', () => {
            render(<FormField {...defaultProps} />);

            expect(screen.queryByRole('alert')).not.toBeInTheDocument();
        });
    });

    describe('hint text', () => {
        it('should display hint text', () => {
            render(<FormField {...defaultProps} hint="Enter your username" />);

            expect(screen.getByText('Enter your username')).toBeInTheDocument();
        });

        it('should not display hint when error is present', () => {
            render(
                <FormField
                    {...defaultProps}
                    hint="Enter your username"
                    error="This field is required"
                />
            );

            expect(screen.queryByText('Enter your username')).not.toBeInTheDocument();
            expect(screen.getByText('This field is required')).toBeInTheDocument();
        });

        it('should have muted styling', () => {
            render(<FormField {...defaultProps} hint="Hint text" />);

            const hint = screen.getByText('Hint text');
            expect(hint).toHaveClass('text-gray-500');
        });
    });

    describe('description', () => {
        it('should display description between label and input', () => {
            render(
                <FormField {...defaultProps} description="This is a helpful description" />
            );

            expect(screen.getByText('This is a helpful description')).toBeInTheDocument();
        });

        it('should not display description when label is hidden', () => {
            render(
                <FormField
                    {...defaultProps}
                    description="This is a description"
                    hideLabel
                />
            );

            expect(screen.queryByText('This is a description')).not.toBeInTheDocument();
        });
    });

    describe('hideLabel', () => {
        it('should visually hide label when hideLabel is true', () => {
            render(<FormField {...defaultProps} hideLabel />);

            const label = screen.getByText('Username');
            expect(label).toHaveClass('sr-only');
        });

        it('should still be accessible when hidden', () => {
            render(<FormField {...defaultProps} hideLabel />);

            // Input should still be labeled
            expect(screen.getByLabelText('Username')).toBeInTheDocument();
        });
    });

    describe('sizes', () => {
        it('should apply small size classes', () => {
            const { container } = render(<FormField {...defaultProps} size="sm" />);

            expect(container.firstChild).toHaveClass('space-y-1');
        });

        it('should apply medium size classes by default', () => {
            const { container } = render(<FormField {...defaultProps} />);

            expect(container.firstChild).toHaveClass('space-y-1.5');
        });

        it('should apply large size classes', () => {
            const { container } = render(<FormField {...defaultProps} size="lg" />);

            expect(container.firstChild).toHaveClass('space-y-2');
        });
    });

    describe('custom className', () => {
        it('should apply custom className to container', () => {
            const { container } = render(
                <FormField {...defaultProps} className="custom-class" />
            );

            expect(container.firstChild).toHaveClass('custom-class');
        });
    });
});

describe('InlineFormField', () => {
    it('should render in horizontal layout', () => {
        render(
            <InlineFormField label="Email" htmlFor="email">
                <input id="email" type="email" />
            </InlineFormField>
        );

        expect(screen.getByLabelText('Email')).toBeInTheDocument();
    });

    it('should apply default label width', () => {
        render(
            <InlineFormField label="Email" htmlFor="email">
                <input id="email" type="email" />
            </InlineFormField>
        );

        const label = screen.getByText('Email');
        expect(label).toHaveClass('w-32');
    });

    it('should apply custom label width', () => {
        render(
            <InlineFormField label="Email" htmlFor="email" labelWidth="w-48">
                <input id="email" type="email" />
            </InlineFormField>
        );

        const label = screen.getByText('Email');
        expect(label).toHaveClass('w-48');
    });

    it('should display error message', () => {
        render(
            <InlineFormField label="Email" htmlFor="email" error="Invalid email">
                <input id="email" type="email" />
            </InlineFormField>
        );

        expect(screen.getByRole('alert')).toHaveTextContent('Invalid email');
    });

    it('should display hint text', () => {
        render(
            <InlineFormField label="Email" htmlFor="email" hint="We won't share your email">
                <input id="email" type="email" />
            </InlineFormField>
        );

        expect(screen.getByText("We won't share your email")).toBeInTheDocument();
    });

    it('should display required indicator', () => {
        render(
            <InlineFormField label="Email" htmlFor="email" required>
                <input id="email" type="email" />
            </InlineFormField>
        );

        expect(screen.getByText('*')).toBeInTheDocument();
    });

    it('should display description', () => {
        render(
            <InlineFormField label="Email" htmlFor="email" description="Your work email">
                <input id="email" type="email" />
            </InlineFormField>
        );

        expect(screen.getByText('Your work email')).toBeInTheDocument();
    });
});
