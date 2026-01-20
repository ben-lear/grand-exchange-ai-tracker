/**
 * useSearchKeyboard hook tests
 */

import { act, renderHook } from '@testing-library/react';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { useSearchKeyboard } from './useSearchKeyboard';

describe('useSearchKeyboard', () => {
  const createMockParams = (overrides = {}) => ({
    isOpen: true,
    itemCount: 5,
    selectedIndex: 0,
    setSelectedIndex: vi.fn(),
    onSelect: vi.fn(),
    onClose: vi.fn(),
    onOpen: vi.fn(),
    inputRef: { current: { blur: vi.fn() } } as unknown as React.RefObject<HTMLInputElement>,
    ...overrides,
  });

  const createKeyboardEvent = (key: string) =>
    ({
      key,
      preventDefault: vi.fn(),
    }) as unknown as React.KeyboardEvent<HTMLInputElement>;

  describe('ArrowDown key', () => {
    it('should open dropdown when closed', () => {
      const params = createMockParams({ isOpen: false });
      const { result } = renderHook(() => useSearchKeyboard(params));

      const event = createKeyboardEvent('ArrowDown');
      act(() => {
        result.current.handleKeyDown(event);
      });

      expect(event.preventDefault).toHaveBeenCalled();
      expect(params.onOpen).toHaveBeenCalled();
      expect(params.setSelectedIndex).not.toHaveBeenCalled();
    });

    it('should move selection down when open', () => {
      const params = createMockParams();
      const { result } = renderHook(() => useSearchKeyboard(params));

      const event = createKeyboardEvent('ArrowDown');
      act(() => {
        result.current.handleKeyDown(event);
      });

      expect(event.preventDefault).toHaveBeenCalled();
      expect(params.setSelectedIndex).toHaveBeenCalled();

      // Call the callback to verify the logic
      const callback = params.setSelectedIndex.mock.calls[0][0];
      expect(callback(0)).toBe(1);
      expect(callback(4)).toBe(0); // Wraps around
    });

    it('should not change selection when itemCount is 0', () => {
      const params = createMockParams({ itemCount: 0 });
      const { result } = renderHook(() => useSearchKeyboard(params));

      const event = createKeyboardEvent('ArrowDown');
      act(() => {
        result.current.handleKeyDown(event);
      });

      expect(params.setSelectedIndex).not.toHaveBeenCalled();
    });
  });

  describe('ArrowUp key', () => {
    it('should move selection up', () => {
      const params = createMockParams({ selectedIndex: 2 });
      const { result } = renderHook(() => useSearchKeyboard(params));

      const event = createKeyboardEvent('ArrowUp');
      act(() => {
        result.current.handleKeyDown(event);
      });

      expect(event.preventDefault).toHaveBeenCalled();
      expect(params.setSelectedIndex).toHaveBeenCalled();

      const callback = params.setSelectedIndex.mock.calls[0][0];
      expect(callback(2)).toBe(1);
      expect(callback(0)).toBe(4); // Wraps around
    });

    it('should not change selection when itemCount is 0', () => {
      const params = createMockParams({ itemCount: 0 });
      const { result } = renderHook(() => useSearchKeyboard(params));

      const event = createKeyboardEvent('ArrowUp');
      act(() => {
        result.current.handleKeyDown(event);
      });

      expect(params.setSelectedIndex).not.toHaveBeenCalled();
    });
  });

  describe('Enter key', () => {
    it('should call onSelect when dropdown is open with items', () => {
      const params = createMockParams();
      const { result } = renderHook(() => useSearchKeyboard(params));

      const event = createKeyboardEvent('Enter');
      act(() => {
        result.current.handleKeyDown(event);
      });

      expect(event.preventDefault).toHaveBeenCalled();
      expect(params.onSelect).toHaveBeenCalled();
    });

    it('should not call onSelect when dropdown is closed', () => {
      const params = createMockParams({ isOpen: false });
      const { result } = renderHook(() => useSearchKeyboard(params));

      const event = createKeyboardEvent('Enter');
      act(() => {
        result.current.handleKeyDown(event);
      });

      expect(params.onSelect).not.toHaveBeenCalled();
    });

    it('should not call onSelect when itemCount is 0', () => {
      const params = createMockParams({ itemCount: 0 });
      const { result } = renderHook(() => useSearchKeyboard(params));

      const event = createKeyboardEvent('Enter');
      act(() => {
        result.current.handleKeyDown(event);
      });

      expect(params.onSelect).not.toHaveBeenCalled();
    });

    it('should not call onSelect when selectedIndex is out of bounds', () => {
      const params = createMockParams({ selectedIndex: 10 });
      const { result } = renderHook(() => useSearchKeyboard(params));

      const event = createKeyboardEvent('Enter');
      act(() => {
        result.current.handleKeyDown(event);
      });

      expect(params.onSelect).not.toHaveBeenCalled();
    });
  });

  describe('Escape key', () => {
    it('should close dropdown and blur input', () => {
      const params = createMockParams();
      const { result } = renderHook(() => useSearchKeyboard(params));

      const event = createKeyboardEvent('Escape');
      act(() => {
        result.current.handleKeyDown(event);
      });

      expect(event.preventDefault).toHaveBeenCalled();
      expect(params.onClose).toHaveBeenCalled();
      expect(params.inputRef?.current?.blur).toHaveBeenCalled();
    });

    it('should work without inputRef', () => {
      const params = createMockParams({ inputRef: undefined });
      const { result } = renderHook(() => useSearchKeyboard(params));

      const event = createKeyboardEvent('Escape');
      act(() => {
        result.current.handleKeyDown(event);
      });

      expect(params.onClose).toHaveBeenCalled();
    });
  });

  describe('Tab key', () => {
    it('should close dropdown when open', () => {
      const params = createMockParams();
      const { result } = renderHook(() => useSearchKeyboard(params));

      const event = createKeyboardEvent('Tab');
      act(() => {
        result.current.handleKeyDown(event);
      });

      // Tab should allow default behavior
      expect(event.preventDefault).not.toHaveBeenCalled();
      expect(params.onClose).toHaveBeenCalled();
    });

    it('should not call onClose when dropdown is closed', () => {
      const params = createMockParams({ isOpen: false });
      const { result } = renderHook(() => useSearchKeyboard(params));

      const event = createKeyboardEvent('Tab');
      act(() => {
        result.current.handleKeyDown(event);
      });

      expect(params.onClose).not.toHaveBeenCalled();
    });
  });

  describe('other keys', () => {
    it('should not handle other keys', () => {
      const params = createMockParams();
      const { result } = renderHook(() => useSearchKeyboard(params));

      const event = createKeyboardEvent('a');
      act(() => {
        result.current.handleKeyDown(event);
      });

      expect(event.preventDefault).not.toHaveBeenCalled();
      expect(params.onSelect).not.toHaveBeenCalled();
      expect(params.onClose).not.toHaveBeenCalled();
      expect(params.setSelectedIndex).not.toHaveBeenCalled();
    });
  });
});
