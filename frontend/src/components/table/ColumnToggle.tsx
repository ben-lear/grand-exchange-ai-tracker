import { useOnClickOutside } from '@/hooks/useOnClickOutside';
import { ALL_COLUMNS, useColumnVisibilityStore } from '@/stores/useColumnVisibilityStore';
import { Check, Columns } from 'lucide-react';
import { useRef, useState } from 'react';

interface ColumnInfo {
    id: string;
    label: string;
    required?: boolean;
}

// Map IDs to labels
const COLUMN_INFO: Record<string, string> = {
    name: 'Item',
    highPrice: 'High Price',
    lowPrice: 'Low Price',
    avgPrice: 'Avg Price',
    members: 'Members',
    buyLimit: 'Buy Limit',
    highAlch: 'High Alch',
};

const AVAILABLE_COLUMNS: ColumnInfo[] = ALL_COLUMNS.map(id => ({
    id,
    label: COLUMN_INFO[id] || id,
    required: id === 'name'
}));

export function ColumnToggle() {
    const [isOpen, setIsOpen] = useState(false);
    const { visibleColumns, toggleColumn, showAll, resetToDefaults } = useColumnVisibilityStore();
    const ref = useRef<HTMLDivElement>(null);

    useOnClickOutside(ref, () => setIsOpen(false));

    return (
        <div className="relative" ref={ref}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 px-3 py-2 text-sm border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
                aria-label="Toggle column visibility"
                title="Toggle visible columns"
            >
                <Columns className="w-4 h-4" />
                <span className="hidden sm:inline">Columns</span>
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg shadow-lg z-50">
                    <div className="p-2">
                        <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2 px-2">Toggle Columns</div>

                        <div className="space-y-1">
                            {AVAILABLE_COLUMNS.map((column) => (
                                <label
                                    key={column.id}
                                    className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer text-gray-700 dark:text-gray-300"
                                >
                                    <input
                                        type="checkbox"
                                        checked={visibleColumns.includes(column.id)}
                                        onChange={() => toggleColumn(column.id)}
                                        disabled={column.required}
                                        className="rounded border-gray-300 dark:border-gray-600 dark:bg-gray-700 text-blue-600 focus:ring-blue-500"
                                    />
                                    <span className="text-sm">{column.label}</span>
                                    {visibleColumns.includes(column.id) && (
                                        <Check className="w-4 h-4 ml-auto text-blue-600 dark:text-blue-400" />
                                    )}
                                </label>
                            ))}
                        </div>

                        <div className="border-t dark:border-gray-700 mt-2 pt-2 flex gap-2">
                            <button
                                onClick={showAll}
                                className="flex-1 text-xs px-2 py-1 border dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
                            >
                                Show All
                            </button>
                            <button
                                onClick={resetToDefaults}
                                className="flex-1 text-xs px-2 py-1 border dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
                            >
                                Reset
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
