import { type ClassValue, clsx } from 'clsx';

/**
 * Merge Tailwind CSS classes with proper precedence
 * Note: tailwind-merge not installed, using clsx only for now
 */
export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}
