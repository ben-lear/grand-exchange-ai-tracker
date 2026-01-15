/**
 * ExportButton - Export table data to CSV or JSON
 */

import { Download } from 'lucide-react';
import { ItemWithPrice } from './columns';

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
  const handleExportCSV = () => {
    const csv = convertToCSV(data);
    const timestamp = new Date().toISOString().split('T')[0];
    downloadFile(csv, `${filename}-${timestamp}.csv`, 'text/csv;charset=utf-8;');
  };

  const handleExportJSON = () => {
    const json = convertToJSON(data);
    const timestamp = new Date().toISOString().split('T')[0];
    downloadFile(json, `${filename}-${timestamp}.json`, 'application/json;charset=utf-8;');
  };

  return (
    <div className={`relative group ${className}`}>
      <button
        className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 border border-gray-300 dark:border-gray-600 rounded-lg transition-colors"
      >
        <Download className="w-4 h-4" />
        <span>Export</span>
      </button>

      {/* Dropdown menu */}
      <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
        <div className="py-1">
          <button
            onClick={handleExportCSV}
            className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            Export as CSV
          </button>
          <button
            onClick={handleExportJSON}
            className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            Export as JSON
          </button>
        </div>
      </div>
    </div>
  );
}
