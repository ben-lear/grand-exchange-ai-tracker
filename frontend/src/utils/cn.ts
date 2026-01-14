/**
 * Class name utility functions
 */

import clsx, { ClassValue } from 'clsx';

/**
 * Merge class names with conditional support
 * This is a re-export of clsx for convenience and consistency
 * 
 * @param inputs - Class names, objects, or arrays
 * @returns Merged class name string
 * 
 * @example
 * cn('btn', 'btn-primary') // "btn btn-primary"
 * cn('btn', { 'btn-active': isActive }) // "btn btn-active" or "btn"
 * cn(['btn', 'btn-primary'], { 'disabled': isDisabled })
 */
export const cn = (...inputs: ClassValue[]): string => {
  return clsx(inputs);
};

/**
 * Create a CSS module class name helper
 * Useful when working with CSS modules
 * 
 * @param styles - CSS modules object
 * @returns Function to merge class names from the module
 */
export const createCN = (styles: Record<string, string>) => {
  return (...inputs: ClassValue[]) => {
    const classNames = clsx(inputs);
    return classNames
      .split(' ')
      .map((cls) => styles[cls] || cls)
      .join(' ');
  };
};

export default cn;
