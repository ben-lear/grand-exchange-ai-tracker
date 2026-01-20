/**
 * Select components - accessible dropdowns with HeadlessUI Listbox
 *
 * This module provides type-safe select components:
 * - SingleSelect: For selecting a single value
 * - MultiSelect: For selecting multiple values
 *
 * @example
 * // Single select
 * import { SingleSelect } from '@/components/ui';
 * const [value, setValue] = useState<string | null>(null);
 * <SingleSelect value={value} onChange={setValue} options={options} />
 *
 * @example
 * // Multi-select
 * import { MultiSelect } from '@/components/ui';
 * const [values, setValues] = useState<string[]>([]);
 * <MultiSelect value={values} onChange={setValues} options={options} />
 */

// Re-export main components
export { MultiSelect } from './select/MultiSelect';
export { SingleSelect } from './select/SingleSelect';

// Re-export types
export type {
    BaseSelectProps, MultiSelectProps, SelectOption, SelectSize, SingleSelectProps
} from './select/selectTypes';

// Re-export styles for customization
export {
    dropdownPanelVariants,
    optionVariants, selectButtonVariants, transitionProps
} from './select/selectStyles';

// Re-export hook for custom implementations
export { useSelectBase } from './select/useSelectBase';
export type { UseSelectBaseOptions, UseSelectBaseReturn } from './select/useSelectBase';

// Legacy compatibility - deprecated, use SingleSelect or MultiSelect directly
/** @deprecated Use SingleSelect or MultiSelect instead */
export { SingleSelect as Select } from './select/SingleSelect';

