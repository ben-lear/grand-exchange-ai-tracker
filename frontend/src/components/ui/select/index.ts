/**
 * Select component barrel file
 *
 * Exports SingleSelect, MultiSelect, and a legacy-compatible Select facade
 */

// Main components
export { MultiSelect } from './MultiSelect';
export { SingleSelect } from './SingleSelect';

// Types
export type {
    BaseSelectProps, MultiSelectProps, SelectOption, SelectSize, SingleSelectProps
} from './selectTypes';

// Styles (for advanced customization)
export {
    dropdownPanelVariants,
    optionVariants, selectButtonVariants, transitionProps
} from './selectStyles';

// Hook (for building custom select components)
export { useSelectBase } from './useSelectBase';
export type { UseSelectBaseOptions, UseSelectBaseReturn } from './useSelectBase';

