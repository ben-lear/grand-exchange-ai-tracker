/**
 * FileInput component tests
 */

import { FileInput } from '@/components/ui/FileInput/FileInput';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

describe('FileInput', () => {
    describe('Rendering', () => {
        it('should render file input element', () => {
            const handleChange = vi.fn();
            render(<FileInput onChange={handleChange} />);

            expect(screen.getByRole('button', { name: /select/i })).toBeInTheDocument();
        });

        it('should render with label when provided', () => {
            const handleChange = vi.fn();
            render(
                <FileInput onChange={handleChange} label="Upload Document" />
            );

            expect(screen.getByText('Upload Document')).toBeInTheDocument();
        });

        it('should render required indicator when required prop is true', () => {
            const handleChange = vi.fn();
            render(
                <FileInput
                    onChange={handleChange}
                    label="Upload"
                    required
                />
            );

            expect(screen.getByText('*')).toBeInTheDocument();
        });

        it('should render error message when error prop is provided', () => {
            const handleChange = vi.fn();
            render(
                <FileInput
                    onChange={handleChange}
                    error="File upload failed"
                />
            );

            expect(screen.getByText('File upload failed')).toBeInTheDocument();
        });

        it('should be disabled when disabled prop is true', () => {
            const handleChange = vi.fn();
            render(
                <FileInput onChange={handleChange} disabled />
            );

            const button = screen.getByRole('button', { name: /select/i });
            expect(button).toBeDisabled();
        });

        it('should render custom empty message', () => {
            const handleChange = vi.fn();
            render(
                <FileInput
                    onChange={handleChange}
                    emptyMessage="Drop your JSON file here"
                />
            );

            expect(screen.getByText('Drop your JSON file here')).toBeInTheDocument();
        });

        it('should show accepted file types', () => {
            const handleChange = vi.fn();
            render(
                <FileInput
                    onChange={handleChange}
                    accept=".json"
                />
            );

            expect(screen.getByText(/Accepted.*\.json/i)).toBeInTheDocument();
        });

        it('should show max file size', () => {
            const handleChange = vi.fn();
            render(
                <FileInput
                    onChange={handleChange}
                    maxSize={5 * 1024 * 1024}
                />
            );

            expect(screen.getByText(/Max size.*5.*MB/i)).toBeInTheDocument();
        });
    });

    describe('File Selection', () => {
        it('should call onChange when file is selected', async () => {
            const handleChange = vi.fn();
            render(
                <FileInput onChange={handleChange} />
            );

            const input = document.querySelector('input[type="file"]') as HTMLInputElement;
            const file = new File(['test content'], 'test.txt', { type: 'text/plain' });

            fireEvent.change(input, { target: { files: [file] } });

            await waitFor(() => {
                expect(handleChange).toHaveBeenCalled();
            });
        });

        it('should show uploaded file in list', async () => {
            const handleChange = vi.fn();
            const { rerender } = render(
                <FileInput onChange={handleChange} showFileList />
            );

            const input = document.querySelector('input[type="file"]') as HTMLInputElement;
            const file = new File(['test content'], 'test.txt', { type: 'text/plain' });

            fireEvent.change(input, { target: { files: [file] } });

            await waitFor(() => {
                expect(handleChange).toHaveBeenCalled();
            });

            // Re-render after state update
            rerender(
                <FileInput onChange={handleChange} showFileList />
            );

            expect(screen.getByText('test.txt')).toBeInTheDocument();
        });

        it('should handle multiple files', async () => {
            const handleChange = vi.fn();
            render(
                <FileInput onChange={handleChange} maxFiles={3} />
            );

            const input = document.querySelector('input[type="file"]') as HTMLInputElement;
            const files = [
                new File(['content1'], 'file1.txt', { type: 'text/plain' }),
                new File(['content2'], 'file2.txt', { type: 'text/plain' }),
            ];

            fireEvent.change(input, { target: { files } });

            await waitFor(() => {
                expect(handleChange).toHaveBeenCalledWith(expect.arrayContaining([
                    expect.objectContaining({ name: 'file1.txt' }),
                    expect.objectContaining({ name: 'file2.txt' }),
                ]));
            });
        });

        it('should allow removing files', async () => {
            const handleChange = vi.fn();
            const { rerender } = render(
                <FileInput onChange={handleChange} showFileList />
            );

            const input = document.querySelector('input[type="file"]') as HTMLInputElement;
            const file = new File(['test content'], 'test.txt', { type: 'text/plain' });

            fireEvent.change(input, { target: { files: [file] } });

            await waitFor(() => {
                expect(handleChange).toHaveBeenCalled();
            });

            rerender(
                <FileInput onChange={handleChange} showFileList />
            );

            const removeButton = screen.getByRole('button', { name: /remove/i });
            await userEvent.click(removeButton);

            expect(handleChange).toHaveBeenCalledWith([]);
        });

        it('should show drag state when dragging over dropzone', async () => {
            const handleChange = vi.fn();
            const { container } = render(
                <FileInput onChange={handleChange} allowDragDrop />
            );

            const dropzone = container.querySelector('.border-dashed') as HTMLElement;
            fireEvent.dragEnter(dropzone);

            await waitFor(() => {
                expect(dropzone).toHaveClass('border-blue-500');
            });

            fireEvent.dragLeave(dropzone);
            await waitFor(() => {
                expect(dropzone).not.toHaveClass('border-blue-500');
            });
        });
    });

    describe('File Validation', () => {
        it('should validate file type', async () => {
            const handleChange = vi.fn();
            render(
                <FileInput onChange={handleChange} accept=".json" />
            );

            const input = document.querySelector('input[type="file"]') as HTMLInputElement;
            const file = new File(['test content'], 'test.txt', { type: 'text/plain' });

            fireEvent.change(input, { target: { files: [file] } });

            await waitFor(() => {
                expect(screen.getByText(/File type not allowed/i)).toBeInTheDocument();
            });
        });

        it('should validate file size', async () => {
            const handleChange = vi.fn();
            render(
                <FileInput onChange={handleChange} maxSize={1000} />
            );

            const input = document.querySelector('input[type="file"]') as HTMLInputElement;
            const content = new ArrayBuffer(2000);
            const file = new File([content], 'large.txt', { type: 'text/plain' });

            fireEvent.change(input, { target: { files: [file] } });

            await waitFor(() => {
                expect(screen.getByText(/File size exceeds/i)).toBeInTheDocument();
            });
        });

        it('should enforce maxFiles constraint', async () => {
            const handleChange = vi.fn();
            render(
                <FileInput onChange={handleChange} maxFiles={1} />
            );

            const input = document.querySelector('input[type="file"]') as HTMLInputElement;
            const files = [
                new File(['content1'], 'file1.txt', { type: 'text/plain' }),
                new File(['content2'], 'file2.txt', { type: 'text/plain' }),
            ];

            fireEvent.change(input, { target: { files } });

            await waitFor(() => {
                expect(screen.getByText(/Maximum.*file/i)).toBeInTheDocument();
            });
        });

        it('should accept .json files', async () => {
            const handleChange = vi.fn();
            render(
                <FileInput onChange={handleChange} accept=".json" showFileList />
            );

            const input = document.querySelector('input[type="file"]') as HTMLInputElement;
            const file = new File(['{"test": "data"}'], 'data.json', { type: 'application/json' });

            fireEvent.change(input, { target: { files: [file] } });

            await waitFor(() => {
                expect(handleChange).toHaveBeenCalledWith([expect.objectContaining({ name: 'data.json' })]);
            });
        });

        it('should accept image/* files', async () => {
            const handleChange = vi.fn();
            render(
                <FileInput onChange={handleChange} accept="image/*" showFileList />
            );

            const input = document.querySelector('input[type="file"]') as HTMLInputElement;
            const file = new File(['image data'], 'photo.jpg', { type: 'image/jpeg' });

            fireEvent.change(input, { target: { files: [file] } });

            await waitFor(() => {
                expect(handleChange).toHaveBeenCalledWith([expect.objectContaining({ name: 'photo.jpg' })]);
            });
        });
    });

    describe('Drag and Drop', () => {
        it('should handle drag enter', async () => {
            const handleChange = vi.fn();
            render(
                <FileInput onChange={handleChange} allowDragDrop />
            );

            const container = screen.getByRole('button').parentElement;
            fireEvent.dragEnter(container!);

            expect(container).toHaveClass('border-blue-500');
        });

        it('should handle drop files', async () => {
            const handleChange = vi.fn();
            render(
                <FileInput onChange={handleChange} allowDragDrop showFileList />
            );

            const container = screen.getByRole('button').parentElement;
            const file = new File(['test content'], 'test.txt', { type: 'text/plain' });

            const dataTransfer = {
                files: [file],
            };

            fireEvent.drop(container!, { dataTransfer });

            await waitFor(() => {
                expect(handleChange).toHaveBeenCalled();
            });
        });

        it('should disable drag drop when disabled', () => {
            const handleChange = vi.fn();
            render(
                <FileInput onChange={handleChange} allowDragDrop disabled />
            );

            const container = screen.getByRole('button').parentElement;
            const file = new File(['test content'], 'test.txt', { type: 'text/plain' });

            const dataTransfer = {
                files: [file],
            };

            fireEvent.drop(container!, { dataTransfer });

            expect(handleChange).not.toHaveBeenCalled();
        });
    });

    describe('File List', () => {
        it('should show file list when showFileList is true', async () => {
            const handleChange = vi.fn();
            const { rerender } = render(
                <FileInput onChange={handleChange} showFileList />
            );

            const input = document.querySelector('input[type="file"]') as HTMLInputElement;
            const file = new File(['test content'], 'test.txt', { type: 'text/plain' });

            fireEvent.change(input, { target: { files: [file] } });

            await waitFor(() => {
                expect(handleChange).toHaveBeenCalled();
            });

            rerender(
                <FileInput onChange={handleChange} showFileList />
            );

            expect(screen.getByText('test.txt')).toBeInTheDocument();
        });

        it('should hide file list when showFileList is false', () => {
            const handleChange = vi.fn();
            render(
                <FileInput onChange={handleChange} showFileList={false} />
            );

            const input = document.querySelector('input[type="file"]') as HTMLInputElement;
            const file = new File(['test content'], 'test.txt', { type: 'text/plain' });

            fireEvent.change(input, { target: { files: [file] } });

            expect(screen.queryByText('test.txt')).not.toBeInTheDocument();
        });

        it('should format file size correctly', async () => {
            const handleChange = vi.fn();
            const { rerender } = render(
                <FileInput onChange={handleChange} showFileList />
            );

            const input = document.querySelector('input[type="file"]') as HTMLInputElement;
            const file = new File(['x'.repeat(1024)], 'test.txt', { type: 'text/plain' });

            fireEvent.change(input, { target: { files: [file] } });

            await waitFor(() => {
                expect(handleChange).toHaveBeenCalled();
            });

            rerender(
                <FileInput onChange={handleChange} showFileList />
            );

            expect(screen.getByText(/1.*KB/i)).toBeInTheDocument();
        });
    });

    describe('Accessibility', () => {
        it('should be keyboard accessible', async () => {
            const handleChange = vi.fn();
            render(
                <FileInput onChange={handleChange} />
            );

            const button = screen.getByRole('button');
            button.focus();

            expect(button).toHaveFocus();
        });

        it('should have remove button with aria-label', async () => {
            const handleChange = vi.fn();
            const { rerender } = render(
                <FileInput onChange={handleChange} showFileList />
            );

            const input = document.querySelector('input[type="file"]') as HTMLInputElement;
            const file = new File(['test content'], 'test.txt', { type: 'text/plain' });

            fireEvent.change(input, { target: { files: [file] } });

            await waitFor(() => {
                expect(handleChange).toHaveBeenCalled();
            });

            rerender(
                <FileInput onChange={handleChange} showFileList />
            );

            const removeButton = screen.getByRole('button', { name: /remove/i });
            expect(removeButton).toHaveAttribute('aria-label');
        });
    });

    describe('Click to Browse', () => {
        it('should open file dialog on button click', async () => {
            const handleChange = vi.fn();
            render(
                <FileInput onChange={handleChange} />
            );

            const button = screen.getByRole('button', { name: /select/i });
            const input = document.querySelector('input[type="file"]') as HTMLInputElement;

            const clickSpy = vi.spyOn(input, 'click');

            await userEvent.click(button);

            expect(clickSpy).toHaveBeenCalled();
            clickSpy.mockRestore();
        });
    });
});
