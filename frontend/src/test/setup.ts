import '@testing-library/jest-dom';
import { mockAnimationsApi } from 'jsdom-testing-mocks';
import React from 'react';
// Make vi available globally for mocks
import { afterAll, beforeAll, vi } from 'vitest';

// Mock Web Animations API for HeadlessUI
mockAnimationsApi();

declare global {
    var vi: typeof import('vitest').vi;
}

// Make vi globally available for all test files
globalThis.vi = vi;

// Suppress expected console warnings in tests
const originalError = console.error;
const originalWarn = console.warn;

beforeAll(() => {
    console.error = (...args: any[]) => {
        const message = args[0]?.toString() || '';
        // Suppress React Router future flag warnings
        if (message.includes('React Router Future Flag Warning')) {
            return;
        }
        // Suppress HeadlessUI warnings (should be handled by jsdom-testing-mocks, but just in case)
        if (message.includes('getAnimations') || message.includes('polyfilled')) {
            return;
        }
        originalError.call(console, ...args);
    };

    console.warn = (...args: any[]) => {
        const message = args[0]?.toString() || '';
        // Suppress React Router future flag warnings
        if (message.includes('React Router Future Flag Warning')) {
            return;
        }
        originalWarn.call(console, ...args);
    };
});

afterAll(() => {
    console.error = originalError;
    console.warn = originalWarn;
});

// Global mock for commonly used UI components
vi.mock('@/components/ui', async () => {
    const actual = await vi.importActual('@/components/ui');
    return {
        ...actual,
        Icon: ({ as: Component, className = '', spin, ...props }: any) => {
            const combinedClassName = [className, spin ? 'animate-spin' : null]
                .filter(Boolean)
                .join(' ');
            const dataTestId = props['data-testid'] ?? 'icon';
            if (Component) {
                return React.createElement(Component, { className: combinedClassName, ...props, 'data-testid': dataTestId });
            }
            return React.createElement('span', { className: combinedClassName, ...props, 'data-testid': dataTestId }, 'icon');
        },
        StatusBanner: ({ variant, title, description, icon: IconComponent, ...props }: any) =>
            React.createElement(
                'div',
                { 'data-testid': 'status-banner', 'data-variant': variant, ...props },
                IconComponent && React.createElement(IconComponent, { className: 'w-5 h-5', 'data-testid': 'status-icon' }),
                React.createElement('h3', { 'data-testid': 'status-title' }, title),
                React.createElement('div', { 'data-testid': 'status-description' }, description)
            ),
    };
});

// Mock ResizeObserver for HeadlessUI components
class MockResizeObserver {
    observe() { }
    unobserve() { }
    disconnect() { }
}

globalThis.ResizeObserver = MockResizeObserver as unknown as typeof ResizeObserver;

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
