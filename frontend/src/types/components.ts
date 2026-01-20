/**
 * Common props shared across all form components
 * Ensures consistent API across Input, Select, Textarea, FileInput, etc.
 */
export interface CommonComponentProps {
    /** Size variant */
    size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
    /** Visual/functional variant (component-specific) */
    variant?: string;
    /** Disabled state */
    disabled?: boolean;
    /** Error message to display */
    error?: string;
    /** Helper text to display below input */
    helperText?: string;
    /** Additional CSS classes */
    className?: string;
}

/**
 * Props for input-like form components
 */
export interface FormInputProps extends CommonComponentProps {
    /** Input value */
    value: string | number;
    /** Change handler */
    onChange: (value: string | number) => void;
    /** Placeholder text */
    placeholder?: string;
    /** Whether the field is required */
    required?: boolean;
    /** Input name attribute */
    name?: string;
    /** Input id attribute */
    id?: string;
}

/**
 * Props for components that can be rendered as different HTML elements
 */
export type PolymorphicComponentProps<T extends React.ElementType> = {
    /** The element or component to render as */
    as?: T;
} & React.ComponentPropsWithoutRef<T>;

/**
 * Props for toggle-able components (checkbox, switch, toggle button)
 */
export interface ToggleProps extends CommonComponentProps {
    /** Whether the toggle is active/checked */
    isActive: boolean;
    /** Toggle handler */
    onToggle: (isActive: boolean) => void;
    /** Label text */
    label?: string;
}

/**
 * Props for components with icon support
 */
export interface IconComponentProps {
    /** Icon component from lucide-react */
    icon?: React.ComponentType<{ className?: string }>;
    /** Icon position (for buttons with text) */
    iconPosition?: 'left' | 'right';
    /** Icon size override */
    iconSize?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
}

/**
 * Props for list-based components
 */
export interface ListItemData<T = unknown> {
    /** Unique identifier */
    id: string | number;
    /** Display label */
    label: string;
    /** Optional icon */
    icon?: React.ComponentType<{ className?: string }>;
    /** Whether item is disabled */
    disabled?: boolean;
    /** Additional item data */
    data?: T;
}
