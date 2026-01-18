import '@testing-library/jest-dom';
// Make vi available globally for mocks
import { vi } from 'vitest';

// Mock ResizeObserver for HeadlessUI components
class MockResizeObserver {
    observe() { }
    unobserve() { }
    disconnect() { }
}

global.ResizeObserver = MockResizeObserver as any;

// Mock clipboard API for tests
export const mockWriteText = vi.fn().mockResolvedValue(undefined);
export const mockReadText = vi.fn().mockResolvedValue('');

Object.assign(navigator, {
    clipboard: {
        writeText: mockWriteText,
        readText: mockReadText,
    },
});

// Mock File.prototype.text() for drag and drop tests
if (!File.prototype.text) {
    File.prototype.text = function () {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.readAsText(this);
        });
    };
}
