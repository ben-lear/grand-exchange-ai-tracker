# Frontend Architecture Patterns

**Created:** January 18, 2026  
**Purpose:** Define standards and patterns for OSRS Grand Exchange Tracker frontend development

## Table of Contents

1. [Component Patterns](#component-patterns)
2. [State Management](#state-management)
3. [Error Handling](#error-handling)
4. [Form Patterns](#form-patterns)
5. [Testing Standards](#testing-standards)
6. [Accessibility](#accessibility)

---

## Component Patterns

### Pure vs Container Components

**Pure Components (Presentational):**
- Receive data via props only
- No direct API calls or store access
- Highly reusable across features
- Easy to test in isolation
- Located in `src/components/ui/` and `src/components/common/`

```typescript
// ✅ GOOD - Pure component
interface PriceDisplayProps {
  value: number;
  type: 'high' | 'low' | 'mid';
}

export function PriceDisplay({ value, type }: PriceDisplayProps) {
  return (
    <span className={getColorClass(type)}>
      {formatGold(value)}
    </span>
  );
}
```

**Container Components:**
- Handle data fetching and state management
- Connect to stores and APIs
- Compose pure components
- Located in `src/pages/` and feature-specific folders

```typescript
// ✅ GOOD - Container component
export function ItemDetailPage() {
  const { id } = useParams();
  const { data: item, isLoading } = useItem(id);
  const { data: price } = useCurrentPrice(id);
  
  if (isLoading) return <LoadingSpinner />;
  
  return (
    <div>
      <ItemHeader item={item} />
      <CurrentPriceCard price={price} />
    </div>
  );
}
```

### Composition Over Inheritance

Favor component composition with clear prop interfaces:

```typescript
// ✅ GOOD - Composable
<StatusBanner
  variant="info"
  title="Share Link Active"
  action={<Button onClick={copyLink}>Copy Link</Button>}
/>

// ❌ BAD - Prop drilling
<StatusBanner
  variant="info"
  title="Share Link Active"
  showButton
  buttonText="Copy Link"
  onButtonClick={copyLink}
  buttonVariant="primary"
/>
```

### Component Size Limit

**Rule:** Keep components under 200 lines (enforced by ESLint)

**When to split:**
- Component has multiple responsibilities
- Repeated JSX patterns (3+ times)
- Large blocks of conditional rendering
- Complex event handlers (extract to hooks)

---

## State Management

### When to Use Each Tool

**useState:** Component-local UI state
```typescript
const [isOpen, setIsOpen] = useState(false);
const [selectedIndex, setSelectedIndex] = useState(0);
```

**Zustand Stores:** Cross-component state
```typescript
// src/stores/watchlistStore.ts
interface WatchlistState {
  watchlists: Watchlist[];
  addItem: (watchlistId: string, itemId: number) => void;
}

// src/components/somewhere.tsx
const watchlists = useWatchlistStore(state => state.watchlists);
```

**TanStack Query:** Server state (API data)
```typescript
const { data, isLoading, error } = useQuery({
  queryKey: ['items', id],
  queryFn: () => fetchItem(id),
  staleTime: 5 * 60 * 1000, // 5 minutes
});
```

**Context API:** Avoid for state management
- ❌ Don't use for app-wide state (use Zustand)
- ✅ OK for dependency injection (theme, feature flags)

---

## Error Handling

### ErrorBoundary Placement

**App-level:** Catch all errors, show fallback page
```typescript
// src/App.tsx
<ErrorBoundary fallback={ErrorFallback}>
  <QueryClientProvider>
    <RouterProvider router={router} />
  </QueryClientProvider>
</ErrorBoundary>
```

**Route-level:** Catch errors per route, show fallback section
```typescript
// src/components/layout/MainLayout.tsx
<ErrorBoundary fallback={ErrorFallback} variant="section">
  <Outlet />
</ErrorBoundary>
```

**Component-level:** Wrap critical components
```typescript
<ErrorBoundary fallback={ErrorFallback} variant="inline">
  <PriceChart itemId={id} />
</ErrorBoundary>
```

### Graceful Degradation

Show partial UI when non-critical components fail:

```typescript
// ✅ GOOD - Chart fails, but metadata still displays
<ItemDetailPage>
  <ItemHeader item={item} />
  <ErrorBoundary fallback={ChartErrorFallback}>
    <PriceChart itemId={id} />
  </ErrorBoundary>
  <ItemMetadata item={item} />
</ItemDetailPage>
```

### API Error Handling

```typescript
const { data, error } = useQuery({
  queryKey: ['items'],
  queryFn: fetchItems,
  retry: 3,
  retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
});

if (error) {
  return <ErrorDisplay message={error.message} retry={refetch} />;
}
```

---

## Form Patterns

### FormField Wrapper

Standardize label, input, error, hint pattern:

```typescript
<FormField
  label="Watchlist Name"
  htmlFor="name"
  error={errors.name?.message}
  hint="Choose a unique name"
  required
>
  <Input
    id="name"
    {...register('name')}
    placeholder="My Watchlist"
  />
</FormField>
```

### Validation with Zod

```typescript
const schema = z.object({
  name: z.string().min(1, 'Name is required').max(50, 'Too long'),
  isPublic: z.boolean(),
});

const { register, handleSubmit, formState: { errors } } = useForm({
  resolver: zodResolver(schema),
});
```

---

## Testing Standards

### Unit Test Structure

**File Naming:** `ComponentName.test.tsx` next to component

**Test Blocks:**
```typescript
import { render, screen } from '@testing-library/react';
import { PriceDisplay } from './PriceDisplay';

describe('PriceDisplay', () => {
  describe('Rendering', () => {
    it('should display formatted price', () => {
      render(<PriceDisplay value={1000000} type="high" />);
      expect(screen.getByText('1.0M')).toBeInTheDocument();
    });
  });

  describe('Interactions', () => {
    it('should call onClick when clicked', async () => {
      const onClick = vi.fn();
      render(<PriceDisplay value={100} type="mid" onClick={onClick} />);
      await userEvent.click(screen.getByText('100'));
      expect(onClick).toHaveBeenCalledOnce();
    });
  });

  describe('Edge Cases', () => {
    it('should handle zero value', () => {
      render(<PriceDisplay value={0} type="low" />);
      expect(screen.getByText('0')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA label', () => {
      render(<PriceDisplay value={500} type="high" />);
      expect(screen.getByLabelText(/high price/i)).toBeInTheDocument();
    });
  });
});
```

### Coverage Target

**Minimum:** 80% per component
- Branches: 80%
- Functions: 80%
- Lines: 80%
- Statements: 80%

### Storybook Requirements

**Every UI component needs:**
- Default story
- All variant stories (sizes, colors, states)
- Edge case stories (long text, empty, errors)
- Interactive stories (actions, forms)

```typescript
import type { Meta, StoryObj } from '@storybook/react';
import { PriceDisplay } from './PriceDisplay';

const meta: Meta<typeof PriceDisplay> = {
  title: 'UI/PriceDisplay',
  component: PriceDisplay,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
  argTypes: {
    value: { control: 'number' },
    type: { control: 'select', options: ['high', 'low', 'mid'] },
  },
};

export default meta;
type Story = StoryObj<typeof PriceDisplay>;

export const High: Story = {
  args: { value: 1500000, type: 'high' },
};

export const Low: Story = {
  args: { value: 1200000, type: 'low' },
};
```

---

## Accessibility

### ARIA Patterns

**Buttons:**
```typescript
<button
  aria-label="Pin item to top of table"
  aria-pressed={isPinned}
  onClick={togglePin}
>
  <Pin className={isPinned ? 'text-blue-500' : 'text-gray-400'} />
</button>
```

**Modals:**
```typescript
<Dialog
  open={isOpen}
  onClose={onClose}
  aria-labelledby="modal-title"
  aria-describedby="modal-description"
>
  <DialogTitle id="modal-title">Create Watchlist</DialogTitle>
  <DialogDescription id="modal-description">
    Enter a name for your new watchlist
  </DialogDescription>
</Dialog>
```

**Live Regions:**
```typescript
<div aria-live="polite" aria-atomic="true">
  {itemCount} items loaded
</div>
```

### Keyboard Navigation

**Required for:**
- Dropdowns (Arrow keys, Enter, Escape)
- Modals (Tab trapping, Escape to close)
- Tables (Arrow keys for row navigation)
- Search (Ctrl+K to open, Escape to close)

```typescript
useEffect(() => {
  function handleKeyDown(e: KeyboardEvent) {
    if (e.key === 'Escape') onClose();
    if (e.key === 'Enter') onSelect();
    if (e.key === 'ArrowDown') moveDown();
    if (e.key === 'ArrowUp') moveUp();
  }
  
  window.addEventListener('keydown', handleKeyDown);
  return () => window.removeEventListener('keydown', handleKeyDown);
}, [onClose, onSelect, moveDown, moveUp]);
```

### Screen Reader Support

- All images need `alt` text
- Icon buttons need `aria-label`
- Form inputs need `<label>` or `aria-labelledby`
- Error messages linked via `aria-describedby`

---

## Performance Best Practices

### Memoization

```typescript
// Expensive computation
const chartData = useMemo(
  () => processRawData(rawData),
  [rawData]
);

// Callback stability
const handleClick = useCallback(
  () => addItem(itemId),
  [itemId, addItem]
);
```

### Virtual Scrolling

```typescript
// For large lists (1000+ items)
const virtualizer = useVirtualizer({
  count: items.length,
  getScrollElement: () => parentRef.current,
  estimateSize: () => 50,
});
```

### Code Splitting

```typescript
// Lazy load heavy components
const PriceChart = lazy(() => import('./components/charts/PriceChart'));

<Suspense fallback={<LoadingSpinner />}>
  <PriceChart itemId={id} />
</Suspense>
```

---

## File Organization

```
src/
├── components/
│   ├── ui/              # Pure UI components (Button, Input, etc.)
│   ├── common/          # Shared business components (ErrorBoundary, ItemIcon)
│   ├── table/           # Table-specific components
│   ├── charts/          # Chart-specific components
│   ├── forms/           # Form-specific components
│   └── [feature]/       # Feature-specific components
├── hooks/               # Shared custom hooks
├── stores/              # Zustand stores
├── pages/               # Route components (container)
├── api/                 # API client and utilities
├── utils/               # Helper functions
├── types/               # TypeScript types
└── test/                # Test utilities and mocks
```

---

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

See [components.ts](../frontend/src/types/components.ts) for complete interface definitions.

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
- Support dark mode with Tailwind `dark:` prefix
- Use Tailwind CSS classes (avoid inline styles)
- Keep responsive design: mobile-first approach
- Maintain consistent spacing scale (Tailwind defaults)

---

## Further Reading

- [React Documentation](https://react.dev/)
- [TanStack Query Guide](https://tanstack.com/query/latest/docs/react/overview)
- [Zustand Documentation](https://github.com/pmndrs/zustand)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [Component Refactoring Plan](./implementation-plans/015-component-refactoring.md)

---

**Document Version:** 1.0  
**Last Updated:** January 18, 2026
