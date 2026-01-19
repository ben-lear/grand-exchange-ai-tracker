/**
 * TableHeader Component
 * Renders the table header with sortable and resizable columns
 */

import type { HeaderGroup } from '@tanstack/react-table';
import type { ItemWithPrice } from './columns';
import { TableHeaderCell } from './TableHeaderCell';

interface TableHeaderProps {
    headerGroups: HeaderGroup<ItemWithPrice>[];
    tableState?: any;
}

export function TableHeader({ headerGroups, tableState }: TableHeaderProps) {
    return (
        <thead className="bg-gray-50 dark:bg-gray-800 sticky top-0 z-10">
            {headerGroups.map((headerGroup) => (
                <tr key={headerGroup.id}>
                    {headerGroup.headers.map((header, index) => (
                        <TableHeaderCell
                            key={header.id}
                            header={header}
                            showDivider={index < headerGroup.headers.length - 1}
                            tableState={tableState}
                        />
                    ))}
                </tr>
            ))}
        </thead>
    );
}
