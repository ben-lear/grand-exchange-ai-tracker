# 014: UI Component Library Expansion Plan

## Overview

This document outlines the comprehensive plan for expanding our UI component library beyond the existing Button component. The goal is to eliminate duplicate code patterns, ensure consistent styling, and establish a robust design system foundation.

## Current State Analysis

### ✅ Completed Components
- **Button Component**: Comprehensive button library with 11 variants, type-safe with class-variance-authority
  - Location: `src/components/ui/Button.tsx`
  - Variants: primary, secondary, destructive, ghost, menu, toolbar, active, inactive, error, close
  - Sizes: xs, sm, base, lg, xl, 2xl
  - **Status**: ✅ Complete (11 files migrated)

### 📊 Code Duplication Analysis

Based on codebase analysis, the following patterns appear frequently and should be extracted:

1. **Input Fields**: ~15-20 instances of similar input styling
2. **Badges/Tags**: ~8-10 instances (P2P/F2P, status indicators)
3. **Cards**: ~5-7 instances of card layouts
4. **Checkbox/Radio Controls**: ~6-8 instances
5. **Dropdown/Popover**: ~4-6 instances
6. **Loading States**: ~3-5 instances
7. **Alert/Notification**: ~3-4 instances

## Component Implementation Plan

### Phase 1: Form Components (HIGH IMPACT)

#### 1.1 Input Component
**Priority**: ⭐⭐⭐⭐⭐ (Very High)
**Impact**: Eliminates ~15-20 duplicate input styling instances
**File**: `src/components/ui/Input.tsx`

**Current Duplicated Pattern**:
```tsx
// Found in FilterPanel.tsx, SearchInput.tsx, etc.
<input
  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
  type="text|number|email"
  placeholder="..."
  value={value}
  onChange={onChange}
/>
```

**Proposed Component**:
```tsx
interface InputProps {
  type?: 'text' | 'number' | 'email' | 'password' | 'search' | 'tel' | 'url';
  size?: 'sm' | 'base' | 'lg';
  variant?: 'default' | 'error' | 'success';
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  id?: string;
  name?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onFocus?: () => void;
  onBlur?: () => void;
  className?: string;
}
```

**Migration Target Files**:
- `FilterPanel.tsx` (4 inputs: priceMin, priceMax, volumeMin, volumeMax)
- `SearchInput.tsx` (1 specialized search input)
- Future form components

#### 1.2 Checkbox Component
**Priority**: ⭐⭐⭐⭐ (High)
**Impact**: Eliminates ~6-8 duplicate checkbox styling instances
**File**: `src/components/ui/Checkbox.tsx`

**Current Duplicated Pattern**:
```tsx
// Found in ColumnToggle.tsx, FilterPanel.tsx
<input
  type="checkbox"
  className="rounded border-gray-300 dark:border-gray-600 dark:bg-gray-700 text-blue-600 focus:ring-blue-500"
  checked={checked}
  onChange={onChange}
/>
```

**Proposed Component**:
```tsx
interface CheckboxProps {
  checked?: boolean;
  onChange?: (checked: boolean) => void;
  disabled?: boolean;
  indeterminate?: boolean;
  size?: 'sm' | 'base' | 'lg';
  label?: string;
  description?: string;
  id?: string;
  name?: string;
  className?: string;
}
```

#### 1.3 Radio Component
**Priority**: ⭐⭐⭐⭐ (High)
**Impact**: Eliminates ~3-4 duplicate radio styling instances
**File**: `src/components/ui/Radio.tsx`

**Current Duplicated Pattern**:
```tsx
// Found in FilterPanel.tsx
<input
  type="radio"
  name="members"
  className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 dark:bg-gray-700 dark:border-gray-600 focus:ring-blue-500"
  checked={checked}
  onChange={onChange}
/>
```

### Phase 2: Display Components (HIGH IMPACT)

#### 2.1 Badge Component
**Priority**: ⭐⭐⭐⭐⭐ (Very High)
**Impact**: Eliminates ~8-10 duplicate badge styling instances
**File**: `src/components/ui/Badge.tsx`

**Current Duplicated Pattern**:
```tsx
// Found in columns.tsx (P2P/F2P badges)
<span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200">
  P2P
</span>
<span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200">
  F2P
</span>
```

**Proposed Component**:
```tsx
interface BadgeProps {
  variant?: 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info';
  size?: 'sm' | 'base' | 'lg';
  children: React.ReactNode;
  className?: string;
}
```

**Migration Target Files**:
- `columns.tsx` (P2P/F2P membership badges)
- Future status indicators
- Price trend indicators

#### 2.2 Card Component
**Priority**: ⭐⭐⭐⭐ (High)
**Impact**: Eliminates ~5-7 duplicate card layout instances
**File**: `src/components/ui/Card.tsx`

**Current Duplicated Pattern**:
```tsx
// Found in ErrorDisplay.tsx and other components
<div className="rounded-lg border border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950 p-4">
  <div className="flex items-start gap-3">
    {/* Content */}
  </div>
</div>
```

**Proposed Component**:
```tsx
interface CardProps {
  variant?: 'default' | 'outlined' | 'elevated' | 'error' | 'warning' | 'success';
  padding?: 'none' | 'sm' | 'base' | 'lg';
  children: React.ReactNode;
  className?: string;
}

interface CardHeaderProps {
  children: React.ReactNode;
  className?: string;
}

interface CardContentProps {
  children: React.ReactNode;
  className?: string;
}

interface CardFooterProps {
  children: React.ReactNode;
  className?: string;
}
```

### Phase 3: Interactive Components (MEDIUM IMPACT)

#### 3.1 Dropdown/Popover Component
**Priority**: ⭐⭐⭐ (Medium)
**Impact**: Eliminates ~4-6 duplicate dropdown styling instances
**File**: `src/components/ui/Popover.tsx`

**Current Duplicated Pattern**:
```tsx
// Found in ColumnToggle.tsx, ExportButton.tsx
<div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg shadow-lg z-50">
  {/* Content */}
</div>
```

**Note**: We already have `Dropdown.tsx`, but it may need enhancement and wider adoption.

#### 3.2 Modal Component
**Priority**: ⭐⭐⭐ (Medium)
**Impact**: Future-proofing for settings page, confirmations, etc.
**File**: `src/components/ui/Modal.tsx`

**Proposed Component**:
```tsx
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  size?: 'sm' | 'base' | 'lg' | 'xl' | 'full';
  showCloseButton?: boolean;
  children: React.ReactNode;
  className?: string;
}

interface ModalHeaderProps {
  children: React.ReactNode;
  className?: string;
}

interface ModalBodyProps {
  children: React.ReactNode;
  className?: string;
}

interface ModalFooterProps {
  children: React.ReactNode;
  className?: string;
}
```

### Phase 4: Feedback Components (LOW-MEDIUM IMPACT)

#### 4.1 Alert Component
**Priority**: ⭐⭐ (Low-Medium)
**Impact**: Eliminates ~3-4 duplicate alert styling instances
**File**: `src/components/ui/Alert.tsx`

**Current Duplicated Pattern**:
```tsx
// Found in ErrorDisplay.tsx
<div className="rounded-lg border border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950 p-4" role="alert">
  <div className="flex items-start gap-3">
    <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
    <div className="flex-1 min-w-0">
      <h3 className="font-semibold text-red-900 dark:text-red-100 mb-1">Error Title</h3>
      <p className="text-sm text-red-800 dark:text-red-200">Error message</p>
    </div>
  </div>
</div>
```

**Proposed Component**:
```tsx
interface AlertProps {
  variant?: 'info' | 'success' | 'warning' | 'error';
  size?: 'sm' | 'base' | 'lg';
  title?: string;
  description?: string;
  icon?: React.ReactNode;
  showIcon?: boolean;
  onClose?: () => void;
  children?: React.ReactNode;
  className?: string;
}
```

#### 4.2 Loading Component Enhancement
**Priority**: ⭐⭐ (Low-Medium)
**Impact**: Enhance existing Loading component
**File**: `src/components/ui/Spinner.tsx` (new) + enhance existing Loading

**Current State**: We have `Loading.tsx` but it could be expanded.

**Proposed Enhancement**:
```tsx
interface SpinnerProps {
  size?: 'xs' | 'sm' | 'base' | 'lg' | 'xl';
  color?: 'primary' | 'secondary' | 'current';
  className?: string;
}

interface LoadingProps {
  variant?: 'spinner' | 'dots' | 'pulse';
  size?: 'sm' | 'base' | 'lg';
  text?: string;
  className?: string;
}
```

#### 4.3 Skeleton Component
**Priority**: ⭐⭐ (Low-Medium)
**Impact**: Better loading states throughout app
**File**: `src/components/ui/Skeleton.tsx`

**Proposed Component**:
```tsx
interface SkeletonProps {
  variant?: 'text' | 'circular' | 'rectangular';
  width?: string | number;
  height?: string | number;
  lines?: number; // For text variant
  className?: string;
}
```

## Implementation Strategy

### Migration Approach

1. **High Impact First**: Focus on Input, Badge, and Checkbox components
2. **File-by-file Migration**: Systematic approach like Button component
3. **Test Coverage**: Ensure all new components have comprehensive tests
4. **Documentation**: JSDoc comments and usage examples

### Component Library Structure

```
src/components/ui/
├── index.ts              # Central exports (existing)
├── Button.tsx            # ✅ Complete
├── Input.tsx             # 🔄 Phase 1
├── Checkbox.tsx          # 🔄 Phase 1
├── Radio.tsx             # 🔄 Phase 1
├── Badge.tsx             # 🔄 Phase 2
├── Card.tsx              # 🔄 Phase 2
├── Popover.tsx           # 🔄 Phase 3
├── Modal.tsx             # 🔄 Phase 3
├── Alert.tsx             # 🔄 Phase 4
├── Spinner.tsx           # 🔄 Phase 4
└── Skeleton.tsx          # 🔄 Phase 4
```

### Naming Conventions

- **Component files**: PascalCase (e.g., `Input.tsx`, `Badge.tsx`)
- **Props interfaces**: `{ComponentName}Props` (e.g., `InputProps`, `BadgeProps`)
- **Variants**: Descriptive names (e.g., `primary`, `secondary`, `error`)
- **Sizes**: T-shirt sizes (e.g., `xs`, `sm`, `base`, `lg`, `xl`)

### Design System Principles

1. **Consistency**: All components follow same patterns as Button
2. **Accessibility**: ARIA compliance, keyboard navigation, screen reader support
3. **Dark Mode**: Full dark theme support for all components
4. **Responsiveness**: Mobile-first approach
5. **Performance**: Minimal bundle impact, tree-shaking friendly
6. **Type Safety**: Full TypeScript integration with proper interfaces

## Priority Implementation Order

### Phase 1 (Immediate - High Impact)
1. **Input Component** - Eliminates 15-20 duplicates
2. **Badge Component** - Eliminates 8-10 duplicates  
3. **Checkbox Component** - Eliminates 6-8 duplicates

### Phase 2 (Next - Medium-High Impact)
1. **Card Component** - Layout consistency
2. **Radio Component** - Form completion

### Phase 3 (Future - Medium Impact)
1. **Modal Component** - Settings page preparation
2. **Popover Component** - Interactive elements

### Phase 4 (Enhancement - Low-Medium Impact)
1. **Alert Component** - Better error handling
2. **Loading Enhancements** - Better UX
3. **Skeleton Component** - Loading states

## Migration Targets by Component

### Input Component Migrations
- `FilterPanel.tsx`: 4 number inputs (priceMin, priceMax, volumeMin, volumeMax)
- `SearchInput.tsx`: 1 search input (may need specialized variant)

### Badge Component Migrations
- `columns.tsx`: P2P/F2P membership badges
- Future price trend indicators
- Status badges throughout app

### Checkbox Component Migrations
- `ColumnToggle.tsx`: Column visibility checkboxes
- `FilterPanel.tsx`: Filter option checkboxes
- Future form checkboxes

### Card Component Migrations
- `ErrorDisplay.tsx`: Error card container
- Future dashboard cards
- Settings page cards

## Testing Strategy

Each component should have:
- **Unit tests**: Props, variants, accessibility
- **Integration tests**: Usage in actual components
- **Visual regression**: Storybook/screenshot testing (future)

## Dependencies

- **class-variance-authority**: Already added for Button, will be used for all components
- **@headlessui/react**: May be needed for complex components (Modal, Dropdown)
- **framer-motion**: Future consideration for animations

## Success Metrics

- **Code Reduction**: Target 80%+ reduction in duplicate UI code
- **Bundle Size**: Minimal impact on bundle size (tree-shaking)
- **Developer Experience**: Faster component development
- **Consistency**: Uniform styling across all UI elements
- **Accessibility**: WCAG 2.1 AA compliance
- **Test Coverage**: >90% coverage for UI components

## Future Considerations

1. **Theming System**: CSS custom properties for easy theme switching
2. **Component Composition**: Higher-order components for complex patterns
3. **Animation Library**: Consistent micro-interactions
4. **Icon Library**: Standardized icon usage patterns
5. **Storybook**: Component documentation and testing

---

**Document Version**: 1.0  
**Created**: January 17, 2026  
**Related**: [Button Implementation](../frontend/src/components/ui/Button.tsx), [CODING_STANDARDS.md](../backend/CODING_STANDARDS.md)
