/**
 * Date and time formatting utilities
 */

import { format, formatDistanceToNow, isValid, parseISO } from 'date-fns';

/**
 * Format a date to a human-readable string
 * @param date - The date to format (Date, string, or number)
 * @param formatString - The format string (default: 'MMM d, yyyy')
 * @returns Formatted date string
 * 
 * @example
 * formatDate('2024-01-15T10:30:00Z') // "Jan 15, 2024"
 * formatDate(new Date(), 'PPpp') // "Jan 15, 2024, 10:30:45 AM"
 */
export const formatDate = (
  date: Date | string | number,
  formatString: string = 'MMM d, yyyy'
): string => {
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : new Date(date);
    
    if (!isValid(dateObj)) {
      return 'Invalid date';
    }
    
    return format(dateObj, formatString);
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Invalid date';
  }
};

/**
 * Format a date with time
 * @param date - The date to format
 * @returns Formatted date and time string
 * 
 * @example
 * formatDateTime('2024-01-15T10:30:00Z') // "Jan 15, 2024 10:30 AM"
 */
export const formatDateTime = (date: Date | string | number): string => {
  return formatDate(date, 'MMM d, yyyy h:mm a');
};

/**
 * Format a date as a relative time string
 * @param date - The date to format
 * @returns Relative time string (e.g., "5 minutes ago")
 * 
 * @example
 * formatRelativeTime('2024-01-15T10:25:00Z') // "5 minutes ago"
 */
export const formatRelativeTime = (date: Date | string | number): string => {
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : new Date(date);
    
    if (!isValid(dateObj)) {
      return 'Invalid date';
    }
    
    return formatDistanceToNow(dateObj, { addSuffix: true });
  } catch (error) {
    console.error('Error formatting relative time:', error);
    return 'Invalid date';
  }
};

/**
 * Format a timestamp (milliseconds) to a date string
 * @param timestamp - Unix timestamp in milliseconds
 * @param formatString - The format string
 * @returns Formatted date string
 */
export const formatTimestamp = (
  timestamp: number,
  formatString: string = 'MMM d, yyyy h:mm a'
): string => {
  return formatDate(new Date(timestamp), formatString);
};

/**
 * Format time only (no date)
 * @param date - The date to format
 * @returns Time string
 * 
 * @example
 * formatTime('2024-01-15T10:30:00Z') // "10:30 AM"
 */
export const formatTime = (date: Date | string | number): string => {
  return formatDate(date, 'h:mm a');
};

/**
 * Format date for API requests (ISO 8601)
 * @param date - The date to format
 * @returns ISO 8601 formatted string
 */
export const formatISODate = (date: Date | string | number): string => {
  const dateObj = typeof date === 'string' ? parseISO(date) : new Date(date);
  return dateObj.toISOString();
};

/**
 * Get a short date format
 * @param date - The date to format
 * @returns Short date string
 * 
 * @example
 * formatShortDate('2024-01-15') // "1/15/24"
 */
export const formatShortDate = (date: Date | string | number): string => {
  return formatDate(date, 'M/d/yy');
};

/**
 * Check if a date is recent (within last N minutes)
 * @param date - The date to check
 * @param minutes - Number of minutes to consider recent (default: 5)
 * @returns True if the date is recent
 */
export const isRecent = (date: Date | string | number, minutes: number = 5): boolean => {
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : new Date(date);
    const now = new Date();
    const diffMs = now.getTime() - dateObj.getTime();
    const diffMinutes = diffMs / (1000 * 60);
    
    return diffMinutes <= minutes;
  } catch {
    return false;
  }
};
