import { useOnClickOutside } from '@/hooks/useOnClickOutside';
import { ALL_COLUMNS, useColumnVisibilityStore } from '@/stores/useColumnVisibilityStore';
import { Check, Columns } from 'lucide-react';
import { useRef, useState } from 'react';
import { Button, Checkbox, Icon } from '../ui';

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
            <Button
                variant="secondary"
                size="default"
                onClick={() => setIsOpen(!isOpen)}
                aria-label="Toggle column visibility"
                title="Toggle visible columns"
                leftIcon={<Icon as={Columns} size="sm" />}
            >
                <span className="hidden sm:inline">Columns</span>
            </Button>

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
                                    <Checkbox
                                        checked={visibleColumns.includes(column.id)}
                                        onChange={() => toggleColumn(column.id)}
                                        disabled={column.required}
                                    />
                                    <span className="text-sm">{column.label}</span>
                                    {visibleColumns.includes(column.id) && (
                                        <Icon as={Check} size="sm" color="primary" className="ml-auto" />
                                    )}
                                </label>
                            ))}
                        </div>

                        <div className="border-t dark:border-gray-700 mt-2 pt-2 flex gap-2">
                            <Button
                                variant="secondary"
                                size="sm"
                                onClick={showAll}
                                className="flex-1 text-xs"
                            >
                                Show All
                            </Button>
                            <Button
                                variant="secondary"
                                size="sm"
                                onClick={resetToDefaults}
                                className="flex-1 text-xs"
                            >
                                Reset
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
