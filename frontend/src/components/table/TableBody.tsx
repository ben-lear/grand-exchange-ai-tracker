/**
 * TableBody Component
 * Renders the table body with optional virtual scrolling support
 */

import { flexRender, type Row } from '@tanstack/react-table';
import type { VirtualItem } from '@tanstack/react-virtual';
import type { ItemWithPrice } from './columns';

interface TableBodyProps {
    rows: Row<ItemWithPrice>[];
    virtualRows?: VirtualItem[];
    paddingTop?: number;
    paddingBottom?: number;
    enableVirtualization?: boolean;
}

export function TableBody({
    rows,
    virtualRows,
    paddingTop = 0,
    paddingBottom = 0,
    enableVirtualization = false,
}: TableBodyProps) {
    const rowsToRender = enableVirtualization && virtualRows
        ? virtualRows.map((vr) => rows[vr.index])
        : rows;

    return (
        <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
            {enableVirtualization && paddingTop > 0 && (
                <tr>
                    <td style={{ height: `${paddingTop}px` }} />
                </tr>
            )}
            {rowsToRender.map((row) => {
                if (!row) return null;
                return (
                    <tr
                        key={row.id}
                        className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    >
                        {row.getVisibleCells().map((cell, cellIndex) => {
                            const customClassName = (cell.column.columnDef.meta as any)?.cellClassName;
                            const baseClassName = customClassName || 'px-2';

                            return (
                                <td
                                    key={cell.id}
                                    className={`${baseClassName} py-3 text-sm text-gray-900 dark:text-gray-100 relative`}
                                    style={{ width: cell.column.getSize() }}
                                >
                                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                    {cellIndex < row.getVisibleCells().length - 1 && (
                                        <div className="absolute right-0 top-2 bottom-2 w-px bg-gray-200 dark:bg-gray-700" />
                                    )}
                                </td>
                            );
                        })}
                    </tr>
                );
            })}
            {enableVirtualization && paddingBottom > 0 && (
                <tr>
                    <td style={{ height: `${paddingBottom}px` }} />
                </tr>
            )}
        </tbody>
    );
}
