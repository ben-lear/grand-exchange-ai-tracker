/**
 * ExportButton - Export table data to CSV or JSON
 */

import { Button, Icon } from '@/components/ui';
import { Download } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { ItemWithPrice } from '../columns';

export interface ExportButtonProps {
  data: ItemWithPrice[];
  filename?: string;
  className?: string;
}

/**
 * Convert data to CSV format
 */
function convertToCSV(data: ItemWithPrice[]): string {
  // CSV headers
  const headers = [
    'Item ID',
    'Name',
    'High Price',
    'Low Price',

    'Members',
    'Buy Limit',
    'High Alch',
    'Low Alch',
  ];

  // CSV rows
  const rows = data.map((item) => [
    item.itemId,
    `"${item.name}"`, // Wrap in quotes to handle commas
    item.currentPrice?.highPrice ?? '',
    item.currentPrice?.lowPrice ?? '',
    item.members ? 'Yes' : 'No',
    item.buyLimit ?? '',
    item.highAlch ?? '',
    item.lowAlch ?? '',
  ]);

  // Combine headers and rows
  const csvContent = [
    headers.join(','),
    ...rows.map((row) => row.join(',')),
  ].join('\n');

  return csvContent;
}

/**
 * Convert data to JSON format
 */
function convertToJSON(data: ItemWithPrice[]): string {
  const jsonData = data.map((item) => ({
    itemId: item.itemId,
    name: item.name,
    icon: item.iconUrl,
    members: item.members,
    buyLimit: item.buyLimit,
    highAlch: item.highAlch,
    lowAlch: item.lowAlch,
    currentPrice: item.currentPrice
      ? {
        highPrice: item.currentPrice.highPrice,
        lowPrice: item.currentPrice.lowPrice,
        updatedAt: item.currentPrice.updatedAt,
      }
      : null,
  }));

  return JSON.stringify(jsonData, null, 2);
}

/**
 * Download data as a file
 */
function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function ExportButton({ data, filename = 'osrs-items', className = '' }: ExportButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleExportCSV = () => {
    const csv = convertToCSV(data);
    const timestamp = new Date().toISOString().split('T')[0];
    downloadFile(csv, `${filename}-${timestamp}.csv`, 'text/csv;charset=utf-8;');
    setIsOpen(false);
  };

  const handleExportJSON = () => {
    const json = convertToJSON(data);
    const timestamp = new Date().toISOString().split('T')[0];
    downloadFile(json, `${filename}-${timestamp}.json`, 'application/json;charset=utf-8;');
    setIsOpen(false);
  };

  // Handle Escape key to close dropdown
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen]);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  return (
    <div ref={dropdownRef} className={`relative ${className}`}>
      <Button
        variant="secondary"
        size="default"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Export data"
        aria-expanded={isOpen}
        aria-haspopup="true"
        leftIcon={<Icon as={Download} size="sm" />}
      >
        Export
      </Button>

      {/* Dropdown menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-10">
          <div className="py-1" role="menu">
            <Button
              variant="menu"
              size="sm"
              onClick={handleExportCSV}
              role="menuitem"
            >
              Export as CSV
            </Button>
            <Button
              variant="menu"
              size="sm"
              onClick={handleExportJSON}
              role="menuitem"
            >
              Export as JSON
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
