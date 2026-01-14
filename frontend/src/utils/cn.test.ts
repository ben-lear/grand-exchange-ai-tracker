/**
 * Unit tests for class name utility
 */

import { describe, it, expect } from 'vitest';
import { cn, createCN } from './cn';

describe('cn', () => {
  it('merges simple class names', () => {
    expect(cn('btn', 'btn-primary')).toBe('btn btn-primary');
  });

  it('handles conditional classes with objects', () => {
    expect(cn('btn', { 'btn-active': true, 'btn-disabled': false })).toBe('btn btn-active');
  });

  it('handles arrays of class names', () => {
    expect(cn(['btn', 'btn-primary'])).toBe('btn btn-primary');
  });

  it('handles mixed inputs', () => {
    expect(cn('btn', ['btn-primary', 'text-white'], { 'hover:bg-blue-700': true }))
      .toBe('btn btn-primary text-white hover:bg-blue-700');
  });

  it('filters out falsy values', () => {
    expect(cn('btn', undefined, null, false, 'btn-primary')).toBe('btn btn-primary');
  });

  it('handles empty input', () => {
    expect(cn()).toBe('');
  });
});

describe('createCN', () => {
  it('creates a function that maps CSS module classes', () => {
    const styles = {
      btn: 'btn-module-123',
      'btn-primary': 'btn-primary-module-456',
    };
    const cnModule = createCN(styles);
    
    expect(cnModule('btn', 'btn-primary')).toBe('btn-module-123 btn-primary-module-456');
  });

  it('handles classes not in the module', () => {
    const styles = {
      btn: 'btn-module-123',
    };
    const cnModule = createCN(styles);
    
    expect(cnModule('btn', 'unknown-class')).toBe('btn-module-123 unknown-class');
  });

  it('works with conditional classes', () => {
    const styles = {
      btn: 'btn-module-123',
      active: 'active-module-789',
    };
    const cnModule = createCN(styles);
    
    expect(cnModule('btn', { active: true })).toBe('btn-module-123 active-module-789');
  });
});
