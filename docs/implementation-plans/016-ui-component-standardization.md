# UI Component Library Standardization Implementation Plan

**Created:** January 19, 2026  
**Status:** In Progress  
**Priority:** HIGH  
**Estimated Duration:** 5 weeks  
**Breaking Changes:** YES (acceptable - unreleased code)

## 🎯 Objective

Systematically migrate from raw DOM elements to reusable UI components across the entire frontend codebase. Complete deferred Phase 6 items from [015-component-refactoring.md](015-component-refactoring.md), create 8 new essential components (Select, Textarea, FileInput, Link, ToggleButton, List, Table primitives), enhance 3 existing components (Button, Input, IconButton), and establish component architecture standards.

## ✅ Progress Update (as of January 20, 2026)

- **Phase 0:** Complete (CommonComponentProps + architecture standards documented).
- **Phase 1:** Modal migrations + ActionMenu + FormField adoptions complete. Modal test pass status not re-verified; `showCloseButton` prop tests not yet added.
- **Phase 2:** Partially complete. Textarea + FileInput implemented with stories/tests and ImportWatchlistModal uses FileInput. Select is currently a basic native select (not HeadlessUI) with no stories/tests; TablePagination still uses native select.
- **Phases 3–7:** Not started.

## 📊 Current State Analysis

### Raw DOM Element Audit Results
- **159+ raw `<button>` elements** across pages and components
- **51 raw `<input>` elements** that should use Input component
- **Multiple `<ul>`, `<ol>`, `<li>` lists** without semantic component wrappers
- **Raw table elements** (`<table>`, `<thead>`, `<tr>`, `<td>`, `<th>`) in TanStack Table integration
- **Direct react-router-dom `<Link>` usage** without styling abstraction (5+ locations)

### Existing UI Components (39 total)
**Core Interactive:**
- Button.tsx ✅ (needs `as` prop enhancement)
- IconButton.tsx ✅ (needs tooltip/badge props)
- Input.tsx ✅ (needs clearable/password/counter features)
- Checkbox.tsx ✅
- Radio.tsx ✅

**Dropdowns/Menus:**
- Dropdown.tsx ✅
- DropdownItem.tsx ✅
- ActionMenu.tsx ✅ (needs adoption campaign)
- AnimatedDropdown.tsx ✅

**Modals/Dialogs:**
- Modal.tsx ❌ (deleted)
- StandardModal.tsx ✅ (now has `showCloseButton` prop)

**Display:**
- Alert.tsx, Badge.tsx, Card.tsx, EmptyState.tsx, Icon.tsx, KeyboardShortcut.tsx, PriceDisplay.tsx, Skeleton.tsx, Stack.tsx, StatusBanner.tsx, Text.tsx ✅

**Forms:**
- FormField.tsx ✅ (needs adoption campaign)

### Deferred Phase 6 Items (Priority)
1. ✅ **Modal Migrations** - Completed for all 5 watchlist modals
2. ✅ **ActionMenu Adoption** - WatchlistCard now uses ActionMenu
3. ✅ **FormField Adoption** - Create/Edit modals + FilterPanel updated

### Missing Core Components (8)
1. ⚠️ **Select** - Basic native select exists; HeadlessUI version not implemented
2. ✅ **Textarea** - Implemented
3. ✅ **FileInput** - Implemented
4. ❌ **Link** - Not implemented
5. ❌ **ToggleButton** - Not implemented
6. ❌ **List/ListItem** - Not implemented
7. ❌ **Table Primitives** - Not implemented

### Missing Standards
- ✅ `CommonComponentProps` interface added
- ✅ Composition depth guidelines documented
- ✅ Dropdown usage documentation added
- ⚠️ Inconsistent component prop patterns across codebase (remaining)

## 🎯 Target State

### Metrics After Completion
- **Raw `<button>` elements**: 159+ → <5 (97% reduction)
- **Raw `<input>` elements**: 51 → <3 (94% reduction)
- **Raw list elements**: 10+ → 0 (100% reduction)
- **Raw table elements**: All wrapped in semantic components
- **Total UI Components**: 39 → 47 (+8 new components)
- **Modal boilerplate lines**: 5 modals × 80 lines = 400 lines eliminated
- **FormField pattern lines**: 5+ fields × 15 lines = 75+ lines eliminated
- **Component architecture docs**: Complete with standards and guidelines
- **Storybook stories**: 47 components fully documented

### Quality Standards
- ✅ All components follow `CommonComponentProps` interface
- ✅ Max composition depth: 3 levels enforced
- ✅ All new components have 80%+ test coverage
- ✅ All new components have Storybook stories
- ✅ WCAG AA accessibility compliance
- ✅ HeadlessUI integration for complex interactive components
- ✅ Comprehensive JSDoc documentation

---

## Phase 0: Architecture & Standards (Day 1)

### 0.1 Create Component Interface Standard
**Priority:** CRITICAL - Required before any component work

**New File:** `frontend/src/types/components.ts` (~80 lines)

**Content:**
```typescript
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
```

**Validation:**
- TypeScript compiles without errors
- Import successful in test file

---

### 0.2 Document Component Architecture Standards
**Priority:** CRITICAL

**Update File:** `docs/frontend-architecture.md` (add new section)

**Section: "Component Architecture Standards"**

**Content:**
```markdown
## Component Architecture Standards

### Component Composition Depth

**Rule: Maximum 3 levels of component composition**

Components should not nest custom components more than 3 levels deep to maintain:
- Debuggability (easier stack traces)
- Performance (reduced render overhead)
- Understandability (clearer data flow)

**Composition Levels:**
- **Level 1:** Direct DOM element wrappers (Link, List, Table primitives)
- **Level 2:** Components using Level 1 components (Button uses Icon)
- **Level 3:** Components using Level 2 components (ToggleButton uses IconButton uses Icon)

**Examples:**

✅ **GOOD - 3 levels:**
```tsx
// ToggleButton (Level 3) → IconButton (Level 2) → Icon (Level 1) → SVG element
<ToggleButton icon={Pin} isActive={isPinned} onToggle={togglePin} />
```

✅ **GOOD - 2 levels:**
```tsx
// Button (Level 2) → Icon (Level 1) → SVG element
<Button leftIcon={Plus}>Create</Button>
```

❌ **BAD - 4+ levels:**
```tsx
// SuperButton → ToggleButton → IconButton → Icon → SVG
// Too deep! Extract to separate pattern or refactor
```

### Component Interface Consistency

All form components (Input, Select, Textarea, FileInput) MUST implement `CommonComponentProps`:
- `size`: Visual size variant
- `variant`: Functional/style variant
- `disabled`: Disabled state
- `error`: Error message string
- `helperText`: Helper text below input
- `className`: Additional CSS classes

### Dropdown Component Usage Guide

| Component | Use Case | Example |
|-----------|----------|---------|
| **Select** | Form input dropdown (single/multi select) | "Select country", "Choose tags" |
| **Dropdown** | Generic dropdown container | Custom dropdown with any content |
| **ActionMenu** | List of 3+ actions with icons | "Edit", "Share", "Delete" menu |
| **AnimatedDropdown** | Complex custom dropdown content with animations | Search results with categories |

**Selection Guide:**
1. Form input? → `Select`
2. Action list (3+ items)? → `ActionMenu`
3. Custom content with animations? → `AnimatedDropdown`
4. Generic dropdown container? → `Dropdown`

### HeadlessUI Integration

Use HeadlessUI for complex interactive components requiring:
- Accessibility (ARIA, focus management, keyboard navigation)
- Complex state management (open/close, selection, focus)
- Transition/animation support

**Components using HeadlessUI:**
- StandardModal (Dialog)
- Select (Listbox)
- ActionMenu (Menu)
- Dropdown (Menu)

### Component Prop Naming Conventions

**Boolean Props:**
- Use `is` prefix for state: `isOpen`, `isActive`, `isLoading`
- Use `has` prefix for capability: `hasError`, `hasIcon`
- Use `show` prefix for visibility: `showCloseButton`, `showCount`
- Use `disabled` for disabled state (not `isDisabled`)

**Handler Props:**
- Use `on` prefix: `onClick`, `onChange`, `onToggle`, `onClose`
- Be specific: `onFileSelect` not `onSelect`, `onToggle` not `onChange`

**Component Props:**
- Use `as` for polymorphic rendering: `as="a"`, `as="button"`
- Use `variant` for visual/functional variants: `variant="primary"`
- Use `size` for size variants: `size="md"`

### Accessibility Requirements

All new components MUST include:
- Semantic HTML when possible (not `<div role="button">`)
- ARIA labels for icon-only buttons: `aria-label="Close modal"`
- ARIA attributes for state: `aria-expanded`, `aria-selected`, `aria-checked`
- Keyboard navigation support (Tab, Enter, Space, Escape, Arrow keys)
- Focus indicators (`:focus-visible` styles)
- Screen reader announcements for dynamic changes
- Color contrast ratio ≥ 4.5:1 (WCAG AA)

### Testing Requirements

All new components MUST include:
- **Unit Tests** (`.test.tsx` file alongside component)
  - Rendering with all prop variants
  - User interactions (click, keyboard, hover)
  - Edge cases (empty, error, loading states)
  - Accessibility (ARIA, keyboard navigation, focus)
  - 80%+ code coverage
- **Storybook Stories** (`.stories.tsx` file)
  - Default variant
  - All size variants
  - All state variants (disabled, error, loading)
  - Interactive examples
  - Accessibility addon enabled

### Styling Conventions

- Use `class-variance-authority` (CVA) for variant systems
- Use `cn()` utility for className merging
- Support dark mode with Tailwind dark: prefix
- Use Tailwind CSS classes (avoid inline styles)
- Keep responsive design: mobile-first approach
- Maintain consistent spacing scale (Tailwind defaults)
```

**Validation:**
- Documentation builds successfully
- Standards are clear and actionable
- Examples are accurate

---

## Phase 1: Deferred Modal & Form Migrations (Week 1)

### 1.1 Add showCloseButton Prop to StandardModal
**Priority:** HIGH - Required for modal migrations

**File:** `frontend/src/components/ui/StandardModal.tsx`

**Changes:**
```typescript
export interface StandardModalProps extends VariantProps<typeof modalSizeVariants> {
  // ... existing props
  /** Whether to show the close button in header (default: true) */
  showCloseButton?: boolean;
}

// Update component:
export function StandardModal({
  // ... existing params
  showCloseButton = true,
}: StandardModalProps) {
  // ... existing code
  
  // In header section, conditionally render close button:
  {showCloseButton && (
    <IconButton
      icon={X}
      onClick={handleClose}
      disabled={closeDisabled}
      variant="ghost"
      size="sm"
      aria-label="Close modal"
    />
  )}
}
```

**Test Updates:** `StandardModal.test.tsx`
- Should show close button by default
- Should hide close button when `showCloseButton={false}`
- Should respect closeDisabled prop

**Storybook Updates:** `StandardModal.stories.tsx`
- Add "Without Close Button" story

---

### 1.2 Migrate CreateWatchlistModal to StandardModal
**Priority:** HIGH

**File:** `frontend/src/components/watchlist/CreateWatchlistModal.tsx`

**Before:** ~180 lines with Dialog + Transition boilerplate
**After:** ~100 lines using StandardModal wrapper

**Migration Pattern:**
```typescript
// Before:
<Transition show={isOpen}>
  <Dialog onClose={onClose}>
    <Transition.Child>{/* backdrop */}</Transition.Child>
    <Transition.Child>
      <Dialog.Panel>
        <div className="header">
          <Dialog.Title>Create Watchlist</Dialog.Title>
          <button onClick={onClose}><X /></button>
        </div>
        <div className="content">{/* form */}</div>
        <div className="footer">{/* buttons */}</div>
      </Dialog.Panel>
    </Transition.Child>
  </Dialog>
</Transition>

// After:
<StandardModal
  isOpen={isOpen}
  onClose={onClose}
  title="Create Watchlist"
  icon={FolderPlus}
  iconColor="primary"
  footer={
    <Stack direction="row" gap={3} justify="end">
      <Button variant="secondary" onClick={onClose}>Cancel</Button>
      <Button variant="primary" onClick={handleSubmit} loading={isCreating}>Create</Button>
    </Stack>
  }
>
  {/* form content only */}
</StandardModal>
```

**Test Updates:**
- Verify modal opens/closes correctly
- Verify form submission works
- Verify validation errors display

**Lines Saved:** ~80 lines

---

### 1.3 Migrate EditWatchlistModal to StandardModal
**Priority:** HIGH

**File:** `frontend/src/components/watchlist/EditWatchlistModal.tsx`

**Migration:** Same pattern as CreateWatchlistModal
- Icon: `Edit2`
- Footer: Cancel + Save buttons
- Content: Edit form

**Lines Saved:** ~80 lines

---

### 1.4 Migrate ShareWatchlistModal to StandardModal
**Priority:** HIGH

**File:** `frontend/src/components/watchlist/ShareWatchlistModal.tsx`

**Migration:** Same pattern
- Icon: `Share2`
- Footer: Copy Link + Close buttons
- Content: Share token input and instructions

**Lines Saved:** ~80 lines

---

### 1.5 Migrate ImportWatchlistModal to StandardModal
**Priority:** HIGH

**File:** `frontend/src/components/watchlist/ImportWatchlistModal.tsx`

**Migration:** Same pattern
- Icon: `Upload`
- Footer: Cancel + Import buttons
- Content: FileInput (will be raw `<input type="file">` temporarily until Phase 2)

**Lines Saved:** ~80 lines

---

### 1.6 Migrate ConfirmDeleteModal to StandardModal
**Priority:** HIGH

**File:** `frontend/src/components/watchlist/ConfirmDeleteModal.tsx`

**Migration:** Same pattern
- Icon: `AlertTriangle`
- `iconColor="error"`
- Footer: Cancel + Delete buttons (Delete button with `variant="danger"`)
- Content: Confirmation text

**Lines Saved:** ~80 lines

---

### 1.7 Delete Deprecated Modal.tsx
**Priority:** HIGH - Breaking change

**File:** `frontend/src/components/ui/Modal.tsx`

**Action:** Delete entire file

**Verification:**
- Search codebase for remaining imports: `grep -r "from.*Modal'" frontend/src`
- Ensure no remaining usages (all should be migrated to StandardModal)
- Update `frontend/src/components/ui/index.ts` exports (remove Modal export)

---

### 1.8 ActionMenu Adoption - WatchlistCard 3-dot Menu
**Priority:** HIGH

**File:** `frontend/src/components/watchlist/WatchlistCard.tsx`

**Current:** Raw HeadlessUI Menu.Item wrapping buttons (~25 lines)

**After:** Use ActionMenu component (~8 lines)

```typescript
const menuItems: ActionMenuItem[] = [
  { label: 'Edit', icon: Edit2, onClick: handleEdit },
  { label: 'Share', icon: Share2, onClick: handleShare },
  { label: 'Export', icon: Download, onClick: handleExport },
  { label: 'Delete', icon: Trash2, onClick: handleDelete, variant: 'destructive' },
];

<ActionMenu items={menuItems} align="right" />
```

**Lines Saved:** ~17 lines

---

### 1.9 FormField Adoption - CreateWatchlistModal
**Priority:** HIGH

**File:** `frontend/src/components/watchlist/CreateWatchlistModal.tsx`

**Current Pattern (repeated 2-3 times):**
```typescript
<Stack direction="col" gap={2}>
  <Text as="label" htmlFor="name">Name {required && '*'}</Text>
  <Input id="name" value={name} onChange={setName} />
  {error && <Text variant="error" size="sm">{error}</Text>}
</Stack>
```

**After:**
```typescript
<FormField label="Name" htmlFor="name" required error={nameError}>
  <Input id="name" value={name} onChange={setName} />
</FormField>
```

**Lines Saved:** ~15 lines per field × 2 fields = ~30 lines

---

### 1.10 FormField Adoption - EditWatchlistModal
**Priority:** HIGH

**File:** `frontend/src/components/watchlist/EditWatchlistModal.tsx`

**Same pattern as CreateWatchlistModal**

**Lines Saved:** ~30 lines

---

### 1.11 FormField Adoption - FilterPanel
**Priority:** HIGH

**File:** `frontend/src/components/table/FilterPanel.tsx`

**Current:** 4 filter fields using label + Input pattern

**After:** Use FormField wrapper for all 4 fields

**Lines Saved:** ~15 lines × 4 = ~60 lines

---

### Phase 1 Completion Checklist

**Modal Migrations:**
- [x] StandardModal has `showCloseButton` prop
- [x] CreateWatchlistModal migrated (~80 lines saved)
- [x] EditWatchlistModal migrated (~80 lines saved)
- [x] ShareWatchlistModal migrated (~80 lines saved)
- [x] ImportWatchlistModal migrated (~80 lines saved)
- [x] ConfirmDeleteModal migrated (~80 lines saved)
- [x] Modal.tsx deleted (breaking change)
- [ ] All modal tests passing

**ActionMenu Adoption:**
- [x] WatchlistCard uses ActionMenu (~17 lines saved)
- [ ] ActionMenu tests passing

**FormField Adoption:**
- [x] CreateWatchlistModal uses FormField (~30 lines saved)
- [x] EditWatchlistModal uses FormField (~30 lines saved)
- [x] FilterPanel uses FormField (~60 lines saved)

**Total Lines Saved in Phase 1:** ~537 lines

**Progress Notes:**
- `StandardModal` tests do not yet cover `showCloseButton` behavior.
- Modal and ActionMenu tests have not been re-run for verification.

---

## Phase 2: Core Form Components (Week 2)

### 2.1 Create Select Component with HeadlessUI Listbox
**Priority:** HIGH - Replaces TablePagination native select

**New File:** `frontend/src/components/ui/Select.tsx` (~150 lines)

**Interface:**
```typescript
export interface SelectOption<T = string> {
  value: T;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  disabled?: boolean;
  description?: string;
}

export interface SelectProps<T = string> extends Omit<CommonComponentProps, 'variant'> {
  /** Selected value */
  value: T;
  /** Change handler */
  onChange: (value: T) => void;
  /** Available options */
  options: SelectOption<T>[];
  /** Placeholder text when no selection */
  placeholder?: string;
  /** Whether to show search/filter input */
  searchable?: boolean;
  /** Custom empty state message */
  emptyMessage?: string;
  /** Position of dropdown */
  position?: 'bottom' | 'top';
  /** Alignment of dropdown */
  align?: 'left' | 'right';
  /** Whether to enable multi-select */
  multiple?: boolean;
  /** Max height of dropdown */
  maxHeight?: string;
}
```

**Features:**
- Wraps HeadlessUI Listbox for accessibility
- Keyboard navigation (arrow keys, type-ahead search)
- Focus management and trap
- Size variants: xs, sm, md, lg
- State variants: default, error, disabled
- Optional searchable/filterable
- Optional multi-select
- Option groups support
- Custom option rendering with icons
- ARIA attributes (role, aria-expanded, aria-selected)

**CVA Variants:**
```typescript
const selectVariants = cva(
  'relative w-full rounded-lg border transition-colors',
  {
    variants: {
      size: {
        xs: 'px-2 py-1 text-xs',
        sm: 'px-3 py-1.5 text-sm',
        md: 'px-4 py-2 text-base',
        lg: 'px-5 py-2.5 text-lg',
      },
      state: {
        default: 'border-gray-300 focus:border-blue-500',
        error: 'border-red-500 focus:border-red-600',
        disabled: 'border-gray-200 bg-gray-50 cursor-not-allowed',
      },
    },
    defaultVariants: {
      size: 'md',
      state: 'default',
    },
  }
);
```

**Accessibility:**
- `role="listbox"`
- `aria-expanded` for dropdown state
- `aria-selected` for selected options
- `aria-activedescendant` for keyboard navigation
- `aria-invalid` for error state
- Focus visible styles
- Screen reader announcements

**Test File:** `Select.test.tsx` (~120 lines)
- Should render with options
- Should open/close dropdown on click
- Should select option on click
- Should handle keyboard navigation (ArrowUp, ArrowDown, Enter, Escape)
- Should filter options when searchable
- Should handle multi-select mode
- Should display error state
- Should respect disabled state
- Should call onChange with correct value
- Accessibility: ARIA attributes, keyboard support, focus management

**Storybook:** `Select.stories.tsx` (~100 lines)
- Default select
- All size variants
- With error state
- Disabled state
- Searchable select
- Multi-select mode
- With option icons
- With option descriptions
- With option groups
- Long option list (virtual scrolling)

---

### 2.2 Update TablePagination to Use Select
**Priority:** HIGH

**File:** `frontend/src/components/table/TablePagination.tsx`

**Before:** Native `<select>` element
```typescript
<select value={pageSize} onChange={handlePageSizeChange}>
  <option value={50}>50</option>
  <option value={100}>100</option>
  <option value={200}>200</option>
</select>
```

**After:** Use Select component
```typescript
<Select
  value={pageSize}
  onChange={handlePageSizeChange}
  options={[
    { value: 50, label: '50 per page' },
    { value: 100, label: '100 per page' },
    { value: 200, label: '200 per page' },
  ]}
  size="sm"
/>
```

---

### 2.3 Create Textarea Component
**Priority:** HIGH

**New File:** `frontend/src/components/ui/Textarea.tsx` (~120 lines)

**Interface:**
```typescript
export interface TextareaProps extends Omit<CommonComponentProps, 'variant'> {
  /** Text value */
  value: string;
  /** Change handler */
  onChange: (value: string) => void;
  /** Placeholder text */
  placeholder?: string;
  /** Number of visible rows */
  rows?: number;
  /** Resize behavior */
  resize?: 'none' | 'vertical' | 'horizontal' | 'both';
  /** Auto-resize to fit content */
  autoResize?: boolean;
  /** Maximum character count */
  maxLength?: number;
  /** Show character counter */
  showCount?: boolean;
  /** Minimum height (for auto-resize) */
  minHeight?: string;
  /** Maximum height (for auto-resize) */
  maxHeight?: string;
}
```

**Features:**
- Implements `CommonComponentProps`
- Size variants: sm, md, lg
- Resize control via CSS
- Auto-resize to fit content (adjusts height dynamically)
- Character counter display (e.g., "124 / 500")
- Max length enforcement
- Error state styling
- Disabled state
- Helper text below textarea

**CVA Variants:**
```typescript
const textareaVariants = cva(
  'w-full rounded-lg border transition-colors font-sans',
  {
    variants: {
      size: {
        sm: 'px-3 py-2 text-sm',
        md: 'px-4 py-2.5 text-base',
        lg: 'px-5 py-3 text-lg',
      },
      resize: {
        none: 'resize-none',
        vertical: 'resize-y',
        horizontal: 'resize-x',
        both: 'resize',
      },
      state: {
        default: 'border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20',
        error: 'border-red-500 focus:border-red-600 focus:ring-2 focus:ring-red-500/20',
        disabled: 'border-gray-200 bg-gray-50 cursor-not-allowed',
      },
    },
    defaultVariants: {
      size: 'md',
      resize: 'vertical',
      state: 'default',
    },
  }
);
```

**Auto-Resize Implementation:**
```typescript
const handleAutoResize = useCallback(() => {
  if (!autoResize || !textareaRef.current) return;
  
  const textarea = textareaRef.current;
  textarea.style.height = 'auto'; // Reset height
  const newHeight = Math.min(
    Math.max(textarea.scrollHeight, minHeightPx),
    maxHeightPx
  );
  textarea.style.height = `${newHeight}px`;
}, [autoResize, minHeightPx, maxHeightPx]);

useEffect(() => {
  handleAutoResize();
}, [value, handleAutoResize]);
```

**Test File:** `Textarea.test.tsx`
- Should render with value
- Should call onChange on input
- Should respect maxLength
- Should show character counter when enabled
- Should auto-resize when enabled
- Should respect min/max height constraints
- Should handle disabled state
- Should display error state
- Accessibility: proper labeling, focus management

**Storybook:** `Textarea.stories.tsx`
- Default textarea
- All size variants
- All resize variants
- With character counter
- Auto-resize mode
- With error
- Disabled state
- With helper text

---

### 2.4 Create FileInput Component
**Priority:** HIGH - Replaces ImportWatchlistModal file input

**New File:** `frontend/src/components/ui/FileInput.tsx` (~200 lines)

**Interface:**
```typescript
export interface FileInputProps extends Omit<CommonComponentProps, 'variant'> {
  /** File selection handler */
  onFileSelect: (files: File[]) => void;
  /** Accepted file types (e.g., ".json,.csv" or "image/*") */
  accept?: string;
  /** Allow multiple file selection */
  multiple?: boolean;
  /** Enable drag-and-drop zone */
  dropzone?: boolean;
  /** Maximum file size in bytes */
  maxSize?: number;
  /** Maximum number of files (for multiple mode) */
  maxFiles?: number;
  /** Show file preview thumbnails */
  showPreview?: boolean;
  /** Custom drag-over message */
  dragMessage?: string;
  /** Custom empty message */
  emptyMessage?: string;
}
```

**Features:**
- Drag-and-drop zone with visual feedback
- File type validation (accept prop)
- File size validation with error messages
- Multiple file support with max count limit
- File preview thumbnails (for images)
- File list display with remove buttons
- Progress indication (for future upload integration)
- Accessible file input trigger button
- Error state for invalid files

**Component Structure:**
```typescript
<div className="file-input-container">
  {/* Hidden native input */}
  <input
    ref={inputRef}
    type="file"
    accept={accept}
    multiple={multiple}
    onChange={handleFileChange}
    className="sr-only"
    id={id}
  />
  
  {/* Drag-and-drop zone */}
  <div
    className={cn('dropzone', isDragging && 'is-dragging')}
    onDragEnter={handleDragEnter}
    onDragOver={handleDragOver}
    onDragLeave={handleDragLeave}
    onDrop={handleDrop}
  >
    {selectedFiles.length === 0 ? (
      // Empty state
      <button onClick={handleTriggerClick}>
        <Icon as={Upload} />
        <span>{emptyMessage || 'Click to browse or drag files here'}</span>
      </button>
    ) : (
      // File list with previews
      <FileList files={selectedFiles} onRemove={handleRemoveFile} />
    )}
  </div>
  
  {/* Error display */}
  {error && <Text variant="error" size="sm">{error}</Text>}
  
  {/* Helper text */}
  {helperText && <Text variant="muted" size="sm">{helperText}</Text>}
</div>
```

**Validation Logic:**
```typescript
const validateFile = (file: File): string | null => {
  // File type validation
  if (accept && !matchesAccept(file.type, accept)) {
    return `File type "${file.type}" is not accepted`;
  }
  
  // File size validation
  if (maxSize && file.size > maxSize) {
    return `File size exceeds ${formatBytes(maxSize)}`;
  }
  
  return null; // Valid
};
```

**Test File:** `FileInput.test.tsx`
- Should trigger file input on click
- Should handle file selection
- Should validate file types
- Should validate file size
- Should handle multiple files
- Should respect maxFiles limit
- Should support drag-and-drop
- Should show file previews
- Should allow file removal
- Should display validation errors
- Accessibility: proper labeling, keyboard support

**Storybook:** `FileInput.stories.tsx`
- Default file input
- All size variants
- Multiple files mode
- With drag-and-drop zone
- With file type restrictions
- With file size limit
- With preview enabled
- Error states
- Disabled state

---

### 2.5 Update ImportWatchlistModal to Use FileInput
**Priority:** HIGH

**File:** `frontend/src/components/watchlist/ImportWatchlistModal.tsx`

**Before:** Native `<input type="file">`

**After:** Use FileInput component
```typescript
<FileInput
  accept=".json"
  multiple={false}
  dropzone
  maxSize={5 * 1024 * 1024} // 5MB
  onFileSelect={handleFileSelect}
  emptyMessage="Drop watchlist JSON file here or click to browse"
/>
```

---

### Phase 2 Completion Checklist

**New Components:**
- [ ] Select component created with HeadlessUI Listbox
- [ ] Select supports single/multi-select
- [ ] Select has keyboard navigation and type-ahead
- [ ] Select has Storybook stories
- [ ] Select has 80%+ test coverage
- [x] Textarea component created
- [x] Textarea supports auto-resize
- [x] Textarea has character counter
- [x] Textarea has Storybook stories
- [ ] Textarea has 80%+ test coverage
- [x] FileInput component created
- [x] FileInput supports drag-and-drop
- [x] FileInput has file validation
- [x] FileInput has Storybook stories
- [ ] FileInput has 80%+ test coverage

**Component Adoptions:**
- [ ] TablePagination uses Select component
- [x] ImportWatchlistModal uses FileInput component

**Total New Components in Phase 2:** 3

**Progress Notes:**
- `Select` is currently a basic native select; HeadlessUI Listbox version and tests/stories are pending.
- `TablePagination` still uses a native `<select>`.
- Textarea/FileInput tests exist, but 80% coverage has not been verified.

---

## Phase 3: IconButton Enhancements & Adoption (Week 2-3)

### 3.1 Add Tooltip and Badge Props to IconButton
**Priority:** HIGH - Breaking change (new required prop handling)

**File:** `frontend/src/components/ui/IconButton.tsx`

**Interface Updates:**
```typescript
export interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  // ... existing props
  
  /** Tooltip text or element to display on hover */
  tooltip?: string | React.ReactNode;
  /** Tooltip position */
  tooltipPosition?: 'top' | 'bottom' | 'left' | 'right';
  /** Badge content (number or dot indicator) */
  badge?: number | 'dot';
  /** Badge color variant */
  badgeColor?: 'primary' | 'success' | 'warning' | 'error';
}
```

**Implementation:**
```typescript
export function IconButton({
  icon,
  variant = 'default',
  size = 'md',
  tooltip,
  tooltipPosition = 'top',
  badge,
  badgeColor = 'primary',
  className,
  ...props
}: IconButtonProps) {
  const buttonContent = (
    <button className={cn(iconButtonVariants({ variant, size }), className)} {...props}>
      <Icon as={icon} size={size} />
      {badge && (
        <span className={cn('badge', badgeVariants({ color: badgeColor }))}>
          {badge === 'dot' ? null : badge}
        </span>
      )}
    </button>
  );
  
  if (tooltip) {
    return (
      <Tooltip content={tooltip} position={tooltipPosition}>
        {buttonContent}
      </Tooltip>
    );
  }
  
  return buttonContent;
}
```

**New Badge CVA:**
```typescript
const badgeVariants = cva(
  'absolute -top-1 -right-1 rounded-full text-xs font-medium',
  {
    variants: {
      color: {
        primary: 'bg-blue-600 text-white',
        success: 'bg-green-600 text-white',
        warning: 'bg-yellow-600 text-white',
        error: 'bg-red-600 text-white',
      },
      type: {
        dot: 'w-2 h-2',
        count: 'min-w-[18px] h-[18px] px-1 flex items-center justify-center',
      },
    },
  }
);
```

**Note:** Requires Tooltip component (use simple title attribute as fallback if no Tooltip component exists)

**Test Updates:** `IconButton.test.tsx`
- Should render with tooltip
- Should show badge when provided
- Should render badge as dot when badge="dot"
- Should apply badge color variants
- Tooltip positioning works correctly

**Storybook Updates:** `IconButton.stories.tsx`
- Add "With Tooltip" story
- Add "With Badge" stories (count and dot)
- Add "With Tooltip and Badge" combined story

---

### 3.2 Replace Raw Buttons with IconButton - StatusBanner
**Priority:** HIGH

**File:** `frontend/src/components/ui/StatusBanner.tsx`

**Current:** Raw `<button>` for close button

**After:** Use IconButton
```typescript
<IconButton
  icon={X}
  onClick={onClose}
  variant="ghost"
  size="sm"
  aria-label="Close banner"
/>
```

---

### 3.3 Replace Raw Buttons with IconButton - PinCell
**Priority:** HIGH

**File:** `frontend/src/components/table/cells/PinCell.tsx`

**Current:** Raw `<button>` with conditional icon color

**After:** Use IconButton (temporary - will be replaced with ToggleButton in Phase 4)
```typescript
<IconButton
  icon={Pin}
  onClick={handleTogglePin}
  variant={isPinned ? 'primary' : 'ghost'}
  size="sm"
  aria-label={isPinned ? 'Unpin item' : 'Pin item'}
  className={isPinned ? 'text-blue-600' : 'text-gray-400'}
/>
```

---

### 3.4 Replace Raw Buttons with IconButton - FavoriteCell
**Priority:** HIGH

**File:** `frontend/src/components/table/cells/FavoriteCell.tsx`

**Current:** Raw `<button>` with conditional fill

**After:** Use IconButton (temporary - will be replaced with ToggleButton in Phase 4)
```typescript
<IconButton
  icon={Star}
  onClick={handleToggleFavorite}
  variant={isFavorited ? 'primary' : 'ghost'}
  size="sm"
  aria-label={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
  className={isFavorited ? 'text-yellow-500 fill-yellow-500' : 'text-gray-400'}
/>
```

---

### 3.5 Replace Raw Buttons with IconButton - Header Mobile Menu
**Priority:** HIGH

**File:** `frontend/src/components/layout/Header.tsx`

**Current:** Raw `<button>` for mobile menu toggle

**After:** Use IconButton
```typescript
<IconButton
  icon={isMobileMenuOpen ? X : Menu}
  onClick={toggleMobileMenu}
  variant="ghost"
  size="md"
  aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
  className="lg:hidden"
/>
```

---

### 3.6 Replace Raw Buttons with IconButton - RecentSearchItem
**Priority:** HIGH

**File:** `frontend/src/components/search/RecentSearchItem.tsx`

**Current:** Raw `<button>` for remove action

**After:** Use IconButton
```typescript
<IconButton
  icon={X}
  onClick={handleRemove}
  variant="ghost"
  size="xs"
  aria-label="Remove from recent searches"
/>
```

---

### Phase 3 Completion Checklist

**IconButton Enhancements:**
- [ ] IconButton has tooltip prop
- [ ] IconButton has badge props (count and dot)
- [ ] IconButton tests updated
- [ ] IconButton stories updated

**IconButton Adoptions (6 locations):**
- [ ] StatusBanner uses IconButton
- [ ] PinCell uses IconButton (temporary)
- [ ] FavoriteCell uses IconButton (temporary)
- [ ] Header mobile menu uses IconButton
- [ ] RecentSearchItem uses IconButton
- [ ] All affected tests passing

**Note:** StandardModal already uses IconButton for close button (updated in Phase 1)

---

## Phase 4: Link, ToggleButton, and Pattern Extraction (Week 3)

### 4.1 Create Link Component
**Priority:** HIGH - 5+ direct react-router-dom Link usages

**New File:** `frontend/src/components/ui/Link.tsx` (~80 lines)

**Interface:**
```typescript
export interface LinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  /** Link destination (internal path or external URL) */
  to: string;
  /** Visual variant */
  variant?: 'default' | 'primary' | 'muted' | 'danger';
  /** Whether link is external (opens in new tab) */
  external?: boolean;
  /** Whether to show underline */
  underline?: 'none' | 'hover' | 'always';
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Additional CSS classes */
  className?: string;
  /** Child content */
  children: React.ReactNode;
}
```

**Features:**
- Wraps react-router-dom Link for internal routes
- Uses native `<a>` for external URLs
- Variant styling (color coding)
- Underline control
- Size variants
- Auto-adds `target="_blank"` and `rel="noopener noreferrer"` for external links
- Composition Level 1 (wraps DOM element)

**CVA Variants:**
```typescript
const linkVariants = cva(
  'transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500',
  {
    variants: {
      variant: {
        default: 'text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300',
        primary: 'text-blue-600 hover:text-blue-700 font-medium',
        muted: 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100',
        danger: 'text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300',
      },
      size: {
        sm: 'text-sm',
        md: 'text-base',
        lg: 'text-lg',
      },
      underline: {
        none: 'no-underline',
        hover: 'no-underline hover:underline',
        always: 'underline',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
      underline: 'hover',
    },
  }
);
```

**Implementation:**
```typescript
export function Link({
  to,
  variant = 'default',
  size = 'md',
  underline = 'hover',
  external = false,
  className,
  children,
  ...props
}: LinkProps) {
  const isExternal = external || to.startsWith('http');
  
  const linkClasses = cn(linkVariants({ variant, size, underline }), className);
  
  if (isExternal) {
    return (
      <a
        href={to}
        target="_blank"
        rel="noopener noreferrer"
        className={linkClasses}
        {...props}
      >
        {children}
      </a>
    );
  }
  
  return (
    <RouterLink to={to} className={linkClasses} {...props}>
      {children}
    </RouterLink>
  );
}
```

**Test File:** `Link.test.tsx`
- Should render react-router Link for internal paths
- Should render anchor tag for external URLs
- Should add target="_blank" for external links
- Should add rel="noopener noreferrer" for external links
- Should apply variant styles
- Should handle underline variants
- Should apply size variants
- Accessibility: proper focus indicators

**Storybook:** `Link.stories.tsx`
- Internal link
- External link
- All variants
- All underline modes
- All sizes

---

### 4.2 Update Link Usages - Footer
**Priority:** HIGH

**File:** `frontend/src/components/layout/Footer.tsx`

**Before:** Direct react-router-dom Link with inline styles

**After:** Use Link component with variants
```typescript
// Internal links
<Link to="/about" variant="muted">About</Link>
<Link to="/privacy" variant="muted">Privacy</Link>

// External links
<Link to="https://github.com/..." external variant="muted">GitHub</Link>
```

---

### 4.3 Update Link Usages - Header
**Priority:** HIGH

**File:** `frontend/src/components/layout/Header.tsx`

**After:** Use Link component
```typescript
<Link to="/" variant="primary" className="text-xl font-bold">
  OSRS GE Tracker
</Link>
```

---

### 4.4 Update Link Usages - ItemDisplay
**Priority:** HIGH

**File:** `frontend/src/components/common/ItemDisplay.tsx`

**After:** Use Link component for item name linking

---

### 4.5 Update Link Usages - ItemNameCell
**Priority:** HIGH

**File:** `frontend/src/components/table/cells/ItemNameCell.tsx`

**After:** Use Link component for clickable item names

---

### 4.6 Update Link Usages - BackButton
**Priority:** HIGH

**File:** `frontend/src/components/common/BackButton.tsx`

**After:** Could potentially use Link component, but Button with onClick for navigation is also valid pattern

---

### 4.7 Create ToggleButton Component
**Priority:** HIGH - Extracted from PinCell/FavoriteCell pattern

**New File:** `frontend/src/components/ui/ToggleButton.tsx` (~100 lines)

**Interface:**
```typescript
export interface ToggleButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'onChange'> {
  /** Icon to display */
  icon: React.ComponentType<{ className?: string }>;
  /** Whether the toggle is active */
  isActive: boolean;
  /** Toggle handler */
  onToggle: (isActive: boolean) => void;
  /** Color when active */
  activeColor?: 'blue' | 'yellow' | 'green' | 'red' | 'purple';
  /** Color when inactive */
  inactiveColor?: 'gray' | 'muted';
  /** Size variant */
  size?: 'xs' | 'sm' | 'md' | 'lg';
  /** Accessible label */
  label: string;
  /** Tooltip text (optional) */
  tooltip?: string;
}
```

**Features:**
- Builds on IconButton (Composition Level 2)
- Active/inactive state styling
- Configurable colors for both states
- Fill icon when active (for star, heart icons)
- Accessibility with proper ARIA attributes
- Optional tooltip

**Implementation:**
```typescript
export function ToggleButton({
  icon,
  isActive,
  onToggle,
  activeColor = 'blue',
  inactiveColor = 'gray',
  size = 'sm',
  label,
  tooltip,
  className,
  ...props
}: ToggleButtonProps) {
  const handleClick = () => {
    onToggle(!isActive);
  };
  
  return (
    <IconButton
      icon={icon}
      onClick={handleClick}
      variant={isActive ? 'primary' : 'ghost'}
      size={size}
      aria-label={label}
      aria-pressed={isActive}
      tooltip={tooltip}
      className={cn(
        isActive ? activeColorClasses[activeColor] : inactiveColorClasses[inactiveColor],
        isActive && 'fill-current', // Fill icon when active
        className
      )}
      {...props}
    />
  );
}

const activeColorClasses = {
  blue: 'text-blue-600 dark:text-blue-400',
  yellow: 'text-yellow-500 dark:text-yellow-400',
  green: 'text-green-600 dark:text-green-400',
  red: 'text-red-600 dark:text-red-400',
  purple: 'text-purple-600 dark:text-purple-400',
};

const inactiveColorClasses = {
  gray: 'text-gray-400 dark:text-gray-500',
  muted: 'text-gray-300 dark:text-gray-600',
};
```

**Composition Depth Check:**
- Level 1: Icon (wraps SVG)
- Level 2: IconButton (uses Icon)
- Level 3: ToggleButton (uses IconButton) ✅ Max depth reached

**Test File:** `ToggleButton.test.tsx`
- Should render in inactive state by default
- Should render in active state when isActive=true
- Should call onToggle with correct value on click
- Should apply active color when active
- Should apply inactive color when inactive
- Should fill icon when active
- Should have aria-pressed attribute
- Accessibility: proper labeling, keyboard support

**Storybook:** `ToggleButton.stories.tsx`
- Inactive state
- Active state
- All active colors (blue, yellow, green, red, purple)
- All sizes
- With tooltip
- Interactive toggle demo

---

### 4.8 Replace IconButton with ToggleButton - PinCell
**Priority:** HIGH

**File:** `frontend/src/components/table/cells/PinCell.tsx`

**Before:** IconButton with conditional styling (from Phase 3)

**After:** Use ToggleButton
```typescript
<ToggleButton
  icon={Pin}
  isActive={isPinned}
  onToggle={handleTogglePin}
  activeColor="blue"
  size="sm"
  label={isPinned ? 'Unpin item' : 'Pin item'}
  tooltip={isPinned ? 'Unpin' : 'Pin to top'}
/>
```

**Lines Saved:** ~10 lines of conditional logic

---

### 4.9 Replace IconButton with ToggleButton - FavoriteCell
**Priority:** HIGH

**File:** `frontend/src/components/table/cells/FavoriteCell.tsx`

**Before:** IconButton with conditional styling (from Phase 3)

**After:** Use ToggleButton
```typescript
<ToggleButton
  icon={Star}
  isActive={isFavorited}
  onToggle={handleToggleFavorite}
  activeColor="yellow"
  size="sm"
  label={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
  tooltip={isFavorited ? 'Unfavorite' : 'Favorite'}
/>
```

**Lines Saved:** ~10 lines of conditional logic

---

### Phase 4 Completion Checklist

**Link Component:**
- [ ] Link component created
- [ ] Link wraps react-router-dom Link for internal routes
- [ ] Link uses anchor tag for external URLs
- [ ] Link auto-adds target="_blank" for external links
- [ ] Link has all variants implemented
- [ ] Link has Storybook stories
- [ ] Link has 80%+ test coverage

**Link Adoptions (5+ locations):**
- [ ] Footer uses Link component
- [ ] Header uses Link component
- [ ] ItemDisplay uses Link component
- [ ] ItemNameCell uses Link component
- [ ] BackButton updated (if applicable)

**ToggleButton Component:**
- [ ] ToggleButton component created
- [ ] ToggleButton builds on IconButton (composition level 2)
- [ ] ToggleButton has active/inactive states
- [ ] ToggleButton has configurable colors
- [ ] ToggleButton has Storybook stories
- [ ] ToggleButton has 80%+ test coverage

**ToggleButton Adoptions:**
- [ ] PinCell uses ToggleButton
- [ ] FavoriteCell uses ToggleButton

**Total New Components in Phase 4:** 2

---

## Phase 5: List and Table Primitives (Week 3-4)

### 5.1 Create List Component
**Priority:** MEDIUM

**New File:** `frontend/src/components/ui/List.tsx` (~60 lines)

**Interface:**
```typescript
export interface ListProps {
  /** List type */
  variant?: 'unordered' | 'ordered' | 'unstyled';
  /** Spacing between items */
  spacing?: 'tight' | 'normal' | 'loose';
  /** Marker style (for unordered lists) */
  marker?: 'disc' | 'circle' | 'square' | 'none';
  /** Children (ListItem components) */
  children: React.ReactNode;
  /** Additional CSS classes */
  className?: string;
}
```

**Features:**
- Composition Level 1 (wraps `<ul>` or `<ol>`)
- Variant system for ordered/unordered/unstyled
- Spacing control via CSS
- Marker customization
- Nested list support

**CVA Variants:**
```typescript
const listVariants = cva('', {
  variants: {
    spacing: {
      tight: 'space-y-1',
      normal: 'space-y-2',
      loose: 'space-y-4',
    },
    marker: {
      disc: 'list-disc',
      circle: 'list-circle',
      square: 'list-square',
      none: 'list-none',
    },
  },
  defaultVariants: {
    spacing: 'normal',
    marker: 'disc',
  },
});
```

**Implementation:**
```typescript
export function List({
  variant = 'unordered',
  spacing = 'normal',
  marker = 'disc',
  children,
  className,
}: ListProps) {
  const Component = variant === 'ordered' ? 'ol' : 'ul';
  const listMarker = variant === 'unstyled' ? 'none' : marker;
  
  return (
    <Component className={cn(listVariants({ spacing, marker: listMarker }), className)}>
      {children}
    </Component>
  );
}
```

**Test File:** `List.test.tsx`
- Should render ul by default
- Should render ol when variant="ordered"
- Should apply spacing variants
- Should apply marker variants
- Should support nested lists

**Storybook:** `List.stories.tsx`
- Unordered list
- Ordered list
- Unstyled list
- All spacing variants
- All marker variants
- Nested lists

---

### 5.2 Create ListItem Component
**Priority:** MEDIUM

**New File:** `frontend/src/components/ui/ListItem.tsx` (~40 lines)

**Interface:**
```typescript
export interface ListItemProps {
  /** Child content */
  children: React.ReactNode;
  /** Optional icon to display before content */
  icon?: React.ComponentType<{ className?: string }>;
  /** Additional CSS classes */
  className?: string;
}
```

**Features:**
- Composition Level 1 (wraps `<li>`)
- Optional icon support
- Flexible content

**Implementation:**
```typescript
export function ListItem({ children, icon: IconComponent, className }: ListItemProps) {
  return (
    <li className={cn('flex items-start gap-2', className)}>
      {IconComponent && <Icon as={IconComponent} size="sm" className="mt-0.5" />}
      <span>{children}</span>
    </li>
  );
}
```

**Test File:** `ListItem.test.tsx`
- Should render children
- Should render icon when provided
- Should apply custom className

**Storybook:** `ListItem.stories.tsx`
- Default list item
- With icon
- Long text content

---

### 5.3 Update Footer to Use List Components
**Priority:** MEDIUM

**File:** `frontend/src/components/layout/Footer.tsx`

**Before:** Raw `<ul>` and `<li>` elements

**After:** Use List and ListItem components
```typescript
<List variant="unstyled" spacing="tight">
  <ListItem><Link to="/about">About</Link></ListItem>
  <ListItem><Link to="/privacy">Privacy</Link></ListItem>
  <ListItem><Link to="/terms">Terms</Link></ListItem>
</List>
```

---

### 5.4 Update SearchDropdownContent to Use List Components
**Priority:** MEDIUM

**File:** `frontend/src/components/search/SearchDropdownContent.tsx`

**Before:** Raw `<ul>` for search results

**After:** Use List component
```typescript
<List variant="unstyled" spacing="tight">
  {results.map((result) => (
    <ListItem key={result.id}>
      <SearchResultItem item={result} />
    </ListItem>
  ))}
</List>
```

---

### 5.5 Create Table Primitive Components
**Priority:** MEDIUM - Low impact (TanStack Table handles most logic)

**New Files:**
- `frontend/src/components/ui/Table.tsx` (~40 lines)
- `frontend/src/components/ui/TableHead.tsx` (~30 lines)
- `frontend/src/components/ui/TableRow.tsx` (~30 lines)
- `frontend/src/components/ui/TableCell.tsx` (~40 lines)

**Interfaces:**
```typescript
// Table.tsx
export interface TableProps {
  children: React.ReactNode;
  variant?: 'default' | 'striped' | 'bordered';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

// TableHead.tsx
export interface TableHeadProps {
  children: React.ReactNode;
  className?: string;
}

// TableRow.tsx
export interface TableRowProps {
  children: React.ReactNode;
  hover?: boolean;
  selected?: boolean;
  className?: string;
}

// TableCell.tsx
export interface TableCellProps {
  children: React.ReactNode;
  header?: boolean;
  align?: 'left' | 'center' | 'right';
  className?: string;
}
```

**Features:**
- Composition Level 1 (wraps `<table>`, `<thead>`, `<tr>`, `<td>`, `<th>`)
- Semantic HTML wrappers with styling
- Variant system for table styles
- Maintains compatibility with TanStack Table
- Responsive design support
- Dark mode support

**CVA Variants:**
```typescript
// Table.tsx
const tableVariants = cva(
  'w-full border-collapse',
  {
    variants: {
      variant: {
        default: 'border-separate border-spacing-0',
        striped: 'border-separate border-spacing-0 [&_tbody_tr:nth-child(even)]:bg-gray-50',
        bordered: 'border border-gray-200',
      },
      size: {
        sm: 'text-sm',
        md: 'text-base',
        lg: 'text-lg',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  }
);

// TableRow.tsx
const rowVariants = cva(
  'border-b border-gray-200',
  {
    variants: {
      hover: {
        true: 'hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors',
        false: '',
      },
      selected: {
        true: 'bg-blue-50 dark:bg-blue-900/20',
        false: '',
      },
    },
    defaultVariants: {
      hover: false,
      selected: false,
    },
  }
);
```

**Implementations:**
```typescript
// Table.tsx
export function Table({ children, variant = 'default', size = 'md', className }: TableProps) {
  return (
    <table className={cn(tableVariants({ variant, size }), className)}>
      {children}
    </table>
  );
}

// TableHead.tsx
export function TableHead({ children, className }: TableHeadProps) {
  return (
    <thead className={cn('bg-gray-50 dark:bg-gray-800', className)}>
      {children}
    </thead>
  );
}

// TableRow.tsx
export function TableRow({ children, hover, selected, className }: TableRowProps) {
  return (
    <tr className={cn(rowVariants({ hover, selected }), className)}>
      {children}
    </tr>
  );
}

// TableCell.tsx
export function TableCell({ children, header, align = 'left', className }: TableCellProps) {
  const Component = header ? 'th' : 'td';
  return (
    <Component className={cn(cellVariants({ align, header }), className)}>
      {children}
    </Component>
  );
}
```

**Test Files:**
- `Table.test.tsx` - Rendering, variants, sizes
- `TableHead.test.tsx` - Rendering
- `TableRow.test.tsx` - Hover, selected states
- `TableCell.test.tsx` - Header/data cells, alignment

**Storybook Files:**
- `Table.stories.tsx` - Complete table examples with all variants
- Individual stories for TableHead, TableRow, TableCell

---

### 5.6 Update Table.tsx to Use Table Primitives
**Priority:** MEDIUM

**File:** `frontend/src/components/table/Table.tsx`

**Before:** Raw `<table>`, `<thead>`, `<tbody>`, `<tr>`, `<td>`, `<th>` elements

**After:** Use semantic table components
```typescript
import { Table as TablePrimitive, TableHead, TableRow, TableCell } from '../ui';

// In component:
<TablePrimitive variant="default" size="md" className="...">
  <TableHead>
    <TableRow>
      {headerGroups.map((headerGroup) => (
        headerGroup.headers.map((header) => (
          <TableCell key={header.id} header>
            {/* Header content */}
          </TableCell>
        ))
      ))}
    </TableRow>
  </TableHead>
  <tbody>
    {rows.map((row) => (
      <TableRow key={row.id} hover selected={row.getIsSelected()}>
        {row.getVisibleCells().map((cell) => (
          <TableCell key={cell.id}>
            {/* Cell content */}
          </TableCell>
        ))}
      </TableRow>
    ))}
  </tbody>
</TablePrimitive>
```

**Note:** Maintain TanStack Table integration - only wrap elements, don't change logic

---

### Phase 5 Completion Checklist

**List Components:**
- [ ] List component created
- [ ] ListItem component created
- [ ] List supports ordered/unordered/unstyled variants
- [ ] List supports spacing control
- [ ] List has Storybook stories
- [ ] List has 80%+ test coverage
- [ ] ListItem has Storybook stories
- [ ] ListItem has 80%+ test coverage

**List Adoptions:**
- [ ] Footer uses List components
- [ ] SearchDropdownContent uses List components

**Table Primitives:**
- [ ] Table component created
- [ ] TableHead component created
- [ ] TableRow component created
- [ ] TableCell component created
- [ ] All table primitives have variants
- [ ] All table primitives have Storybook stories
- [ ] All table primitives have 80%+ test coverage

**Table Adoptions:**
- [ ] Table.tsx uses table primitives
- [ ] TanStack Table integration maintained

**Total New Components in Phase 5:** 6 (List, ListItem, Table, TableHead, TableRow, TableCell)

---

## Phase 6: Component Enhancements - Breaking Changes (Week 4)

### 6.1 Add Polymorphic `as` Prop to Button
**Priority:** HIGH - Breaking change (potentially changes render output)

**File:** `frontend/src/components/ui/Button.tsx`

**Interface Updates:**
```typescript
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  // ... existing props
  
  /** Render as different element (e.g., 'a' for links) */
  as?: 'button' | 'a';
  /** Link href (when as="a") */
  href?: string;
  /** Whether link is external (when as="a") */
  external?: boolean;
  /** Full width variant */
  fullWidth?: boolean;
}
```

**CVA Updates:**
```typescript
const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-lg font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed',
  {
    variants: {
      // ... existing variants
      fullWidth: {
        true: 'w-full',
        false: '',
      },
    },
    defaultVariants: {
      // ... existing defaults
      fullWidth: false,
    },
  }
);
```

**Implementation:**
```typescript
export function Button({
  as = 'button',
  href,
  external,
  variant = 'default',
  size = 'md',
  fullWidth = false,
  leftIcon: LeftIcon,
  rightIcon: RightIcon,
  loading,
  children,
  className,
  ...props
}: ButtonProps) {
  const Component = as;
  const buttonClasses = cn(buttonVariants({ variant, size, fullWidth }), className);
  
  const content = (
    <>
      {loading && <LoadingSpinner size={size} />}
      {!loading && LeftIcon && <Icon as={LeftIcon} size={size} />}
      {children}
      {RightIcon && <Icon as={RightIcon} size={size} />}
    </>
  );
  
  if (as === 'a') {
    const isExternal = external || href?.startsWith('http');
    return (
      <a
        href={href}
        target={isExternal ? '_blank' : undefined}
        rel={isExternal ? 'noopener noreferrer' : undefined}
        className={buttonClasses}
        {...(props as React.AnchorHTMLAttributes<HTMLAnchorElement>)}
      >
        {content}
      </a>
    );
  }
  
  return (
    <button
      className={buttonClasses}
      {...(props as React.ButtonHTMLAttributes<HTMLButtonElement>)}
    >
      {content}
    </button>
  );
}
```

**Test Updates:** `Button.test.tsx`
- Should render as button by default
- Should render as anchor when as="a"
- Should add href when as="a"
- Should add target="_blank" for external links
- Should apply fullWidth variant
- Should maintain all existing functionality

**Storybook Updates:** `Button.stories.tsx`
- Add "As Link" stories
- Add "Full Width" stories
- Show use cases for button vs link rendering

**Usage Example:**
```typescript
// Button as link
<Button as="a" href="/items/123" variant="primary">View Item</Button>

// External link
<Button as="a" href="https://example.com" external variant="secondary">
  External Link
</Button>

// Full width button
<Button fullWidth variant="primary">Submit Form</Button>
```

---

### 6.2 Add Enhanced Props to Input
**Priority:** HIGH - Breaking change (adds new sub-components)

**File:** `frontend/src/components/ui/Input.tsx`

**Interface Updates:**
```typescript
export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  // ... existing props
  
  /** Show clear button (X icon) when input has value */
  clearable?: boolean;
  /** Callback when clear button clicked */
  onClear?: () => void;
  /** Show character counter (current / max) */
  showCount?: boolean;
  /** Maximum character count (for counter display) */
  maxCount?: number;
  /** Show password visibility toggle (for type="password") */
  showPasswordToggle?: boolean;
}
```

**State Management:**
```typescript
const [showPassword, setShowPassword] = useState(false);

// For password toggle
const inputType = type === 'password' && showPassword ? 'text' : type;
```

**Implementation:**
```typescript
export function Input({
  variant = 'default',
  size = 'md',
  clearable = false,
  onClear,
  showCount = false,
  maxCount,
  showPasswordToggle = false,
  leftIcon: LeftIcon,
  rightIcon: RightIcon,
  error,
  helperText,
  className,
  type = 'text',
  value,
  onChange,
  ...props
}: InputProps) {
  const [showPassword, setShowPassword] = useState(false);
  const inputType = type === 'password' && showPassword ? 'text' : type;
  
  const handleClear = () => {
    onClear?.();
    // Trigger onChange with empty value
    if (onChange) {
      const event = { target: { value: '' } } as React.ChangeEvent<HTMLInputElement>;
      onChange(event);
    }
  };
  
  const togglePasswordVisibility = () => {
    setShowPassword((prev) => !prev);
  };
  
  const hasValue = value !== undefined && value !== '';
  const currentCount = typeof value === 'string' ? value.length : 0;
  
  return (
    <div className="w-full">
      <div className={cn('relative', inputWrapperVariants({ size }))}>
        {LeftIcon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2">
            <Icon as={LeftIcon} size="sm" color="muted" />
          </div>
        )}
        
        <input
          type={inputType}
          value={value}
          onChange={onChange}
          className={cn(
            inputVariants({ variant, size }),
            LeftIcon && 'pl-10',
            (RightIcon || clearable || showPasswordToggle) && 'pr-10',
            className
          )}
          {...props}
        />
        
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {/* Clear button - composition level 2 */}
          {clearable && hasValue && (
            <IconButton
              icon={X}
              onClick={handleClear}
              variant="ghost"
              size="xs"
              aria-label="Clear input"
            />
          )}
          
          {/* Password toggle - composition level 2 */}
          {showPasswordToggle && type === 'password' && (
            <IconButton
              icon={showPassword ? EyeOff : Eye}
              onClick={togglePasswordVisibility}
              variant="ghost"
              size="xs"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            />
          )}
          
          {RightIcon && <Icon as={RightIcon} size="sm" color="muted" />}
        </div>
      </div>
      
      {/* Character counter */}
      {showCount && maxCount && (
        <div className="mt-1 text-right">
          <Text variant="muted" size="sm">
            {currentCount} / {maxCount}
          </Text>
        </div>
      )}
      
      {/* Error message */}
      {error && (
        <Text variant="error" size="sm" className="mt-1">
          {error}
        </Text>
      )}
      
      {/* Helper text */}
      {helperText && !error && (
        <Text variant="muted" size="sm" className="mt-1">
          {helperText}
        </Text>
      )}
    </div>
  );
}
```

**Composition Depth Check:**
- Level 1: Icon (wraps SVG)
- Level 2: IconButton (uses Icon) - used inside Input
- Input is Level 1 (wraps `<input>`)
- ✅ Max depth 2 (within limit)

**Test Updates:** `Input.test.tsx`
- Should show clear button when clearable and has value
- Should call onClear when clear button clicked
- Should show character counter when enabled
- Should show password toggle for password inputs
- Should toggle password visibility on icon click
- Should maintain all existing functionality

**Storybook Updates:** `Input.stories.tsx`
- Add "Clearable" story
- Add "With Character Counter" story
- Add "Password with Toggle" story
- Add combined features story

---

### Phase 6 Completion Checklist

**Button Enhancements:**
- [ ] Button has `as` prop for polymorphic rendering
- [ ] Button supports as="button" and as="a"
- [ ] Button has `fullWidth` variant
- [ ] Button auto-adds target="_blank" for external links
- [ ] Button tests updated
- [ ] Button stories updated

**Input Enhancements:**
- [ ] Input has `clearable` prop with clear button
- [ ] Input has `showCount` prop with character counter
- [ ] Input has `showPasswordToggle` for password inputs
- [ ] Input clear button uses IconButton (composition level 2)
- [ ] Input password toggle uses IconButton (composition level 2)
- [ ] Input tests updated
- [ ] Input stories updated

**Composition Depth Verification:**
- [ ] All enhanced components respect max depth 3 rule
- [ ] No components exceed composition depth limit

---

## Phase 7: Documentation & Storybook Completion (Week 5)

### 7.1 Create Storybook Stories - New Components

**Priority:** HIGH - Required for component documentation

**Stories to Create:**

1. **Select.stories.tsx** (~100 lines)
   - Default
   - All sizes
   - With error
   - Disabled
   - Searchable
   - Multi-select
   - With icons
   - With descriptions
   - Option groups
   - Long list with virtual scrolling

2. **Textarea.stories.tsx** (~80 lines)
   - Default
   - All sizes
   - All resize variants
   - With character counter
   - Auto-resize
   - With error
   - Disabled
   - With helper text

3. **FileInput.stories.tsx** (~90 lines)
   - Default
   - All sizes
   - Multiple files
   - With drag-and-drop
   - File type restrictions
   - File size limits
   - With preview
   - Error states
   - Disabled

4. **Link.stories.tsx** (~60 lines)
   - Internal link
   - External link
   - All variants
   - All underline modes
   - All sizes

5. **ToggleButton.stories.tsx** (~70 lines)
   - Inactive state
   - Active state
   - All active colors
   - All sizes
   - With tooltip
   - Interactive demo

6. **List.stories.tsx** (~80 lines)
   - Unordered
   - Ordered
   - Unstyled
   - All spacing variants
   - All marker variants
   - Nested lists
   - With icons

7. **Table Primitives.stories.tsx** (~100 lines)
   - Simple table
   - Striped table
   - Bordered table
   - With hover rows
   - With selected rows
   - All sizes
   - Sortable headers
   - Empty state

**Story Template:**
```typescript
import type { Meta, StoryObj } from '@storybook/react';
import { Component } from './Component';

const meta: Meta<typeof Component> = {
  title: 'UI/Component',
  component: Component,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    // Define controls
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    // Default props
  },
};

export const Variant: Story = {
  args: {
    // Variant props
  },
};
```

---

### 7.2 Add JSDoc Comments - All Components

**Priority:** HIGH

**Components to Document:**

All new/updated components should have comprehensive JSDoc:

**Template:**
```typescript
/**
 * Component description - what it does and when to use it
 * 
 * @example
 * ```tsx
 * <Component
 *   prop1="value1"
 *   prop2="value2"
 * >
 *   Content
 * </Component>
 * ```
 */
export interface ComponentProps {
  /** Prop description */
  prop1: string;
  
  /** Prop description with more detail */
  prop2: number;
}

/**
 * Component implementation documentation
 * 
 * Features:
 * - Feature 1
 * - Feature 2
 * - Feature 3
 * 
 * Accessibility:
 * - ARIA attribute usage
 * - Keyboard navigation support
 * 
 * @param props - Component props
 * @returns React element
 */
export function Component(props: ComponentProps) {
  // Implementation
}
```

**Apply to:**
- [ ] Select.tsx
- [ ] Textarea.tsx
- [ ] FileInput.tsx
- [ ] Link.tsx
- [ ] ToggleButton.tsx
- [ ] List.tsx
- [ ] ListItem.tsx
- [ ] Table.tsx
- [ ] TableHead.tsx
- [ ] TableRow.tsx
- [ ] TableCell.tsx
- [ ] Button.tsx (update)
- [ ] Input.tsx (update)
- [ ] IconButton.tsx (update)
- [ ] StandardModal.tsx (update)

---

### 7.3 Update Frontend Architecture Documentation

**Priority:** HIGH

**File:** `docs/frontend-architecture.md`

**Sections to Add/Update:**

1. **Component Standards** (already added in Phase 0)
   - Review and refine based on implementation learnings

2. **UI Component Library Reference**
```markdown
## UI Component Library

### Form Components

#### Input
Text input with support for icons, clearable, password toggle, and character counter.

**Usage:**
```tsx
<Input
  value={text}
  onChange={setText}
  placeholder="Enter text..."
  clearable
  leftIcon={Search}
/>
```

**Props:** See [Input.tsx](../frontend/src/components/ui/Input.tsx)

#### Select
Dropdown select input with search, multi-select, and keyboard navigation.

**Usage:**
```tsx
<Select
  value={selected}
  onChange={setSelected}
  options={options}
  searchable
/>
```

**Props:** See [Select.tsx](../frontend/src/components/ui/Select.tsx)

[... continue for all components ...]
```

3. **Dropdown Usage Guide** (from Phase 0)
```markdown
## When to Use Which Dropdown

| Scenario | Component | Rationale |
|----------|-----------|-----------|
| Form select input | Select | Proper form semantics, accessibility |
| 3+ actions with icons | ActionMenu | Consistent action pattern |
| Complex animated content | AnimatedDropdown | Full control over animations |
| Generic dropdown | Dropdown | Flexible container |

**Examples:**

**Form Input:**
```tsx
<FormField label="Country">
  <Select
    options={countries}
    value={selectedCountry}
    onChange={setSelectedCountry}
  />
</FormField>
```

**Action Menu:**
```tsx
<ActionMenu
  items={[
    { label: 'Edit', icon: Edit2, onClick: handleEdit },
    { label: 'Delete', icon: Trash2, onClick: handleDelete, variant: 'destructive' },
  ]}
/>
```
```

4. **Component Composition Guidelines**
```markdown
## Component Composition Guidelines

### Maximum Depth Rule

Components should not exceed **3 levels of composition**.

**Enforcement:**
- Code review checklist item
- Consider ESLint plugin for automated checking (future)

**Examples:**

✅ **Level 3 (Maximum):**
```
ToggleButton (uses IconButton (uses Icon (wraps SVG)))
```

✅ **Level 2:**
```
Button (uses Icon (wraps SVG))
Input (uses IconButton (uses Icon))
```

❌ **Level 4+ (Not Allowed):**
```
SuperComponent → ToggleButton → IconButton → Icon → SVG
```

**Why This Rule:**
- Easier debugging (shorter call stacks)
- Better performance (less render overhead)
- Clearer data flow (fewer prop layers)
- Simpler testing (less mocking needed)

**When You Hit the Limit:**
- Extract to separate component
- Use composition instead of nesting
- Reconsider if abstraction is necessary
```

5. **Testing Patterns**
```markdown
## Component Testing Patterns

All new components must include:

1. **Unit Tests** - 80%+ coverage
2. **Storybook Stories** - All variants documented

### Unit Test Structure

```typescript
describe('ComponentName', () => {
  describe('Rendering', () => {
    it('should render with default props', () => {});
    it('should render all variants', () => {});
  });
  
  describe('Interactions', () => {
    it('should handle user actions', () => {});
    it('should call callbacks correctly', () => {});
  });
  
  describe('Edge Cases', () => {
    it('should handle empty state', () => {});
    it('should handle error state', () => {});
  });
  
  describe('Accessibility', () => {
    it('should have proper ARIA attributes', () => {});
    it('should support keyboard navigation', () => {});
    it('should manage focus correctly', () => {});
  });
});
```

### Storybook Story Structure

```typescript
export const Default: Story = {};
export const Variants: Story = {};
export const States: Story = {};
export const Interactive: Story = {};
```
```

---

### 7.4 Create Component Migration Guide

**Priority:** MEDIUM

**New File:** `docs/component-migration-guide.md`

**Content:**
```markdown
# Component Migration Guide

Guide for migrating from raw DOM elements to UI components.

## Quick Reference

| Old Pattern | New Component | Benefit |
|-------------|---------------|---------|
| `<button>` | `Button` | Consistent styling, variants, loading |
| `<button>` (icon only) | `IconButton` | Icon sizing, tooltip, badge |
| Toggle button | `ToggleButton` | Active state management |
| `<input>` | `Input` | Error states, icons, clearable |
| `<select>` | `Select` | Accessibility, search, keyboard nav |
| `<textarea>` | `Textarea` | Auto-resize, character counter |
| `<input type="file">` | `FileInput` | Drag-and-drop, validation |
| `<Link>` (react-router) | `Link` | Consistent styling, external handling |
| `<ul>`, `<ol>`, `<li>` | `List`, `ListItem` | Spacing, markers, icons |
| `<table>`, `<tr>`, `<td>` | Table primitives | Variants, hover, selected states |

## Migration Examples

### Button Migration

**Before:**
```tsx
<button
  onClick={handleClick}
  disabled={isLoading}
  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
>
  {isLoading ? <Spinner /> : null}
  Submit
</button>
```

**After:**
```tsx
<Button
  onClick={handleClick}
  loading={isLoading}
  variant="primary"
>
  Submit
</Button>
```

**Benefits:**
- 3 lines instead of 6
- Consistent styling
- Built-in loading state
- Accessible by default

[... more examples ...]
```

---

### Phase 7 Completion Checklist

**Storybook:**
- [ ] Select has complete stories
- [ ] Textarea has complete stories
- [ ] FileInput has complete stories
- [ ] Link has complete stories
- [ ] ToggleButton has complete stories
- [ ] List has complete stories
- [ ] Table primitives have complete stories
- [ ] All stories build without errors
- [ ] Storybook accessible at localhost:6006

**Documentation:**
- [ ] All components have JSDoc comments
- [ ] JSDoc includes usage examples
- [ ] JSDoc includes prop descriptions
- [ ] Frontend architecture doc updated
- [ ] Dropdown usage guide added
- [ ] Composition guidelines added
- [ ] Testing patterns documented
- [ ] Migration guide created

**Final Verification:**
- [ ] `npm run storybook` works
- [ ] `npm run build-storybook` works
- [ ] All documentation links valid
- [ ] All code examples accurate

---

## Final Validation & Success Criteria

### Pre-Release Checklist

**Build & Tests:**
- [ ] `npm run build` succeeds (frontend)
- [ ] `npm run test` passes (all tests)
- [ ] `npm run lint` passes (no errors)
- [ ] `npm run storybook` works
- [ ] TypeScript compilation: 0 errors

**Component Verification:**
- [ ] All 8 new components created (Select, Textarea, FileInput, Link, ToggleButton, List, Table primitives)
- [ ] All 3 components enhanced (Button, Input, IconButton)
- [ ] All components have 80%+ test coverage
- [ ] All components have Storybook stories
- [ ] All components have JSDoc documentation

**Migration Verification:**
- [ ] 5 modals migrated to StandardModal (~400 lines saved)
- [ ] Modal.tsx deleted
- [ ] 3 ActionMenu adoptions complete (~17 lines saved)
- [ ] 5+ FormField adoptions complete (~120 lines saved)
- [ ] 10+ IconButton adoptions complete
- [ ] 5+ Link adoptions complete
- [ ] 2 ToggleButton adoptions complete (PinCell, FavoriteCell)
- [ ] List components adopted (Footer, SearchDropdownContent)
- [ ] Table primitives adopted (Table.tsx)

**Raw Element Audit:**
- [ ] `<button>` elements: <5 remaining (from 159+)
- [ ] `<input>` elements: <3 remaining (from 51)
- [ ] `<ul>/<ol>/<li>` elements: 0 direct usage
- [ ] `<table>` elements: All wrapped in primitives

**Standards Compliance:**
- [ ] CommonComponentProps interface created
- [ ] All form components implement CommonComponentProps
- [ ] Max composition depth (3 levels) documented
- [ ] Max composition depth enforced in all new components
- [ ] Dropdown usage guide complete

**Documentation:**
- [ ] frontend-architecture.md updated
- [ ] Component migration guide created
- [ ] All JSDoc comments complete
- [ ] All Storybook stories complete

**Accessibility:**
- [ ] All components have ARIA attributes
- [ ] All components support keyboard navigation
- [ ] All components have focus indicators
- [ ] No accessibility violations in Storybook a11y addon

### Success Metrics

| Metric | Before | Target | Actual |
|--------|--------|--------|--------|
| Raw `<button>` elements | 159+ | <5 | ___ |
| Raw `<input>` elements | 51 | <3 | ___ |
| Raw list elements | 10+ | 0 | ___ |
| UI Components | 39 | 47 | ___ |
| Lines saved (modals) | - | 400 | ___ |
| Lines saved (FormField) | - | 120 | ___ |
| Lines saved (ActionMenu) | - | 17 | ___ |
| Total lines saved | - | 537+ | ___ |
| Test coverage | - | 80%+ each | ___ |
| Storybook stories | - | 47 | ___ |
| Composition depth violations | - | 0 | ___ |

---

## Timeline Summary

| Phase | Week | Focus | Components | Lines Saved |
|-------|------|-------|------------|-------------|
| **Phase 0** | Day 1 | Architecture & Standards | 0 | 0 |
| **Phase 1** | Week 1 | Deferred Modals & Forms | 0 (migrations) | 537 |
| **Phase 2** | Week 2 | Core Form Components | 3 | 0 (prep) |
| **Phase 3** | Week 2-3 | IconButton Enhancements | 0 (enhancements) | 20 |
| **Phase 4** | Week 3 | Link & ToggleButton | 2 | 20 |
| **Phase 5** | Week 3-4 | List & Table Primitives | 6 | 0 (refactor) |
| **Phase 6** | Week 4 | Component Enhancements | 0 (enhancements) | 0 |
| **Phase 7** | Week 5 | Documentation & Storybook | 0 (docs) | 0 |
| **TOTAL** | **5 weeks** | **Full Standardization** | **+8 new, 3 enhanced** | **577+** |

---

## Dependencies & Prerequisites

### Required Packages (Already Installed)
- `@headlessui/react` - For Select (Listbox), ActionMenu, StandardModal
- `class-variance-authority` - For variant systems
- `lucide-react` - Icon library
- `react-router-dom` - For Link component
- `@storybook/react-vite` - For Storybook
- `@storybook/addon-a11y` - For accessibility testing

### No New Packages Required
All required dependencies are already installed.

---

## Risk Mitigation

### Breaking Changes
**Risk:** Breaking changes could affect existing functionality
**Mitigation:**
- Code is unreleased (acceptable to break)
- Comprehensive test suite
- Gradual rollout (phase by phase)
- Each phase validates before next begins

### Composition Depth
**Risk:** Components might exceed 3-level depth
**Mitigation:**
- Document rule clearly in Phase 0
- Review during implementation
- Refactor if violations found

### Performance
**Risk:** Additional component layers could slow render
**Mitigation:**
- Use React.memo for expensive components
- Profile before/after with React DevTools
- Virtual scrolling for long lists

### Accessibility
**Risk:** Custom components might lose accessibility
**Mitigation:**
- Use HeadlessUI for complex interactions
- Test with screen readers
- Use Storybook a11y addon
- Follow WCAG AA guidelines

---

## Post-Implementation Tasks

### Future Enhancements (Out of Scope)
1. **Visual Regression Testing** - See separate plan
2. **Component Generator CLI** - Template-based component creation
3. **VS Code Snippets** - Quick component insertion
4. **Design Token System** - Centralized styling variables
5. **Figma Integration** - Design-to-code workflow

### Maintenance
- Review composition depth quarterly
- Update documentation as patterns evolve
- Gather component usage analytics
- Refine based on developer feedback

---

## References

- [015-component-refactoring.md](015-component-refactoring.md) - Phase 6 deferred items
- [Button.tsx](../frontend/src/components/ui/Button.tsx) - Reference implementation
- [HeadlessUI Docs](https://headlessui.com/) - For Listbox, Dialog, Menu
- [class-variance-authority](https://cva.style/) - Variant system
- [Storybook Docs](https://storybook.js.org/docs/react) - Story writing
- [WCAG 2.1 AA](https://www.w3.org/WAI/WCAG21/quickref/) - Accessibility guidelines

---

**Document Version:** 1.0  
**Last Updated:** January 19, 2026  
**Status:** Planning  
**Next Review:** After Phase 1 completion  
**Maintainer:** Development Team
