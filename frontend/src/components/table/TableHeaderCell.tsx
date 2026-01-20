/**
 * TableHeaderCell Component
 * Renders a single table header cell with sorting and resizing functionality
 */

import { Icon } from '@/components/ui';
import { flexRender, type Header, type TableState } from '@tanstack/react-table';
import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react';
import type { ItemWithPrice } from './columns';

interface TableHeaderCellProps {
    header: Header<ItemWithPrice, unknown>;
    showDivider?: boolean;
    tableState?: TableState;
}

type ColumnMeta = {
    cellClassName?: string;
};

export function TableHeaderCell({ header, showDivider, tableState }: TableHeaderCellProps) {
    const customClassName = (header.column.columnDef.meta as ColumnMeta | undefined)?.cellClassName;
    const baseClassName = customClassName || 'px-2';

    return (
        <th
            key={header.id}
            className={`${baseClassName} py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider border-b border-gray-200 dark:border-gray-700 relative`}
            style={{
                width: header.getSize(),
            }}
        >
            {header.isPlaceholder ? null : (
                <div className="flex items-center gap-2">
                    {/* Column Header with Sort Button */}
                    {header.column.getCanSort() ? (
                        <button
                            className="flex items-center gap-1 hover:text-gray-900 dark:hover:text-white"
                            onClick={header.column.getToggleSortingHandler()}
                            aria-label={`Sort by ${header.column.columnDef.header}`}
                        >
                            {flexRender(header.column.columnDef.header, header.getContext())}
                            {header.column.getIsSorted() === 'asc' ? (
                                <Icon as={ArrowUp} size="sm" />
                            ) : header.column.getIsSorted() === 'desc' ? (
                                <Icon as={ArrowDown} size="sm" />
                            ) : (
                                <Icon
                                    as={ArrowUpDown}
                                    size="sm"
                                    className="opacity-0 group-hover:opacity-50"
                                />
                            )}
                        </button>
                    ) : (
                        flexRender(header.column.columnDef.header, header.getContext())
                    )}

                    {/* Column Divider */}
                    {showDivider && (
                        <div className="absolute right-0 top-3 bottom-3 w-px bg-gray-200 dark:bg-gray-700" />
                    )}

                    {/* Column Resizer */}
                    {header.column.getCanResize() && (
                        <div
                            onMouseDown={header.getResizeHandler()}
                            onTouchStart={header.getResizeHandler()}
                            className={`absolute right-0 top-0 h-full w-1 cursor-col-resize select-none touch-none hover:bg-blue-500 ${header.column.getIsResizing() ? 'bg-blue-500' : ''
                                }`}
                            style={{
                                transform: header.column.getIsResizing()
                                    ? `translateX(${tableState?.columnSizingInfo?.deltaOffset || 0}px)`
                                    : '',
                            }}
                        />
                    )}
                </div>
            )}
        </th>
    );
}
