/**
 * FileInput component stories for Storybook
 */

import { FileInput } from '@/components/ui/FileInput/FileInput';
import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';

const meta: Meta<typeof FileInput> = {
    title: 'UI/FileInput',
    component: FileInput,
    parameters: {
        layout: 'centered',
    },
    tags: ['autodocs'],
    argTypes: {
        size: {
            control: 'select',
            options: ['xs', 'sm', 'md', 'lg', 'xl'],
        },
        disabled: {
            control: 'boolean',
        },
        allowDragDrop: {
            control: 'boolean',
        },
        showFileList: {
            control: 'boolean',
        },
    },
};

export default meta;
type Story = StoryObj<typeof meta>;

// Wrapper component to manage state
function FileInputDemo(args: any) {
    const [files, setFiles] = useState<File[]>([]);

    return (
        <div className="w-96">
            <FileInput
                {...args}
                onChange={setFiles}
            />
            {files.length > 0 && (
                <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm font-medium text-blue-900">
                        {files.length} file(s) selected
                    </p>
                    <ul className="text-sm text-blue-800 mt-1 space-y-1">
                        {files.map((file, idx) => (
                            <li key={idx}>{file.name}</li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
}

export const Default: Story = {
    render: (args) => <FileInputDemo {...args} />,
    args: {
        label: 'Upload File',
        showFileList: true,
    },
};

export const AllSizes: Story = {
    render: () => (
        <div className="space-y-6">
            {(['xs', 'sm', 'md', 'lg', 'xl'] as const).map((size) => (
                <div key={size}>
                    <label className="text-sm font-medium mb-2 block">Size: {size}</label>
                    <FileInputDemo
                        size={size}
                        label={`Upload (${size})`}
                        showFileList={true}
                    />
                </div>
            ))}
        </div>
    ),
};

export const WithError: Story = {
    render: (args) => <FileInputDemo {...args} />,
    args: {
        label: 'Upload File',
        error: 'File upload failed',
        showFileList: true,
    },
};

export const Disabled: Story = {
    render: (args) => <FileInputDemo {...args} />,
    args: {
        label: 'Upload File',
        disabled: true,
        showFileList: true,
    },
};

export const JSONFileOnly: Story = {
    render: (args) => <FileInputDemo {...args} />,
    args: {
        label: 'Upload JSON File',
        accept: '.json',
        maxFiles: 1,
        showFileList: true,
        emptyMessage: 'Drop JSON file here or click to browse',
    },
};

export const MultipleFiles: Story = {
    render: (args) => <FileInputDemo {...args} />,
    args: {
        label: 'Upload Multiple Files',
        maxFiles: 5,
        showFileList: true,
        emptyMessage: 'Drop up to 5 files here',
    },
};

export const WithFileSizeLimit: Story = {
    render: (args) => <FileInputDemo {...args} />,
    args: {
        label: 'Upload Image',
        accept: 'image/*',
        maxSize: 5 * 1024 * 1024, // 5MB
        showFileList: true,
        emptyMessage: 'Drop image (max 5MB) here',
    },
};

export const WithoutDragDrop: Story = {
    render: (args) => <FileInputDemo {...args} />,
    args: {
        label: 'Select File',
        allowDragDrop: false,
        showFileList: true,
        emptyMessage: 'Click to browse files',
    },
};

export const WithoutFileList: Story = {
    render: (args) => <FileInputDemo {...args} />,
    args: {
        label: 'Upload File',
        showFileList: false,
        emptyMessage: 'Drop file here or click to browse',
    },
};

export const Required: Story = {
    render: (args) => <FileInputDemo {...args} />,
    args: {
        label: 'Upload Document',
        required: true,
        showFileList: true,
    },
};

export const ImageUpload: Story = {
    render: (args) => <FileInputDemo {...args} />,
    args: {
        label: 'Upload Profile Photo',
        accept: 'image/jpeg,image/png,image/gif',
        maxFiles: 1,
        maxSize: 2 * 1024 * 1024, // 2MB
        showFileList: true,
        emptyMessage: 'Drop image here or click to browse',
        required: true,
    },
};

export const DocumentUpload: Story = {
    render: (args) => <FileInputDemo {...args} />,
    args: {
        label: 'Upload Documents',
        accept: '.pdf,.docx,.xlsx',
        maxFiles: 10,
        maxSize: 10 * 1024 * 1024, // 10MB
        showFileList: true,
        emptyMessage: 'Drop documents here (PDF, DOCX, XLSX)',
    },
};

export const Interactive: Story = {
    render: () => {
        const [files, setFiles] = useState<File[]>([]);
        const [submitted, setSubmitted] = useState(false);

        const handleSubmit = () => {
            if (files.length > 0) {
                setSubmitted(true);
                setTimeout(() => setSubmitted(false), 2000);
            }
        };

        return (
            <div className="w-96 space-y-4">
                <FileInput
                    label="Upload Files"
                    maxFiles={5}
                    showFileList
                    onChange={setFiles}
                    error={files.length === 0 && submitted ? 'Please select at least one file' : undefined}
                />
                <button
                    onClick={handleSubmit}
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                    disabled={files.length === 0}
                >
                    Upload {files.length > 0 && `(${files.length})`}
                </button>
                {submitted && files.length > 0 && (
                    <p className="text-sm text-green-600">✓ Files uploaded successfully!</p>
                )}
            </div>
        );
    },
};

export const Minimal: Story = {
    render: (args) => <FileInputDemo {...args} />,
    args: {
        showFileList: false,
        emptyMessage: 'Click to browse files',
    },
};

export const WatchlistImport: Story = {
    render: (args) => <FileInputDemo {...args} />,
    args: {
        label: 'Import Watchlist',
        accept: '.json',
        maxFiles: 1,
        maxSize: 5 * 1024 * 1024, // 5MB
        showFileList: true,
        emptyMessage: 'Drop watchlist JSON file here or click to browse',
        helperText: 'Upload a previously exported watchlist file',
        required: true,
    },
};
