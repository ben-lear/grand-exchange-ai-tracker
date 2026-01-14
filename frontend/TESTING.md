# Frontend Testing Guide

## Overview

The frontend uses **Vitest** for unit testing and **Playwright** for E2E testing. Tests are co-located with their source files following the `*.test.ts` or `*.test.tsx` pattern.

## Test Structure

### File Organization

```
src/utils/
├── formatters.ts          # Source file
├── formatters.test.ts     # Tests for formatters
├── dateUtils.ts           # Source file
├── dateUtils.test.ts      # Tests for dateUtils
├── helpers.ts             # Source file
├── helpers.test.ts        # Tests for helpers
├── cn.ts                  # Source file
└── cn.test.ts             # Tests for cn
```

**Benefits of co-location:**
- Easy to find tests for a given file
- Clear 1:1 mapping between source and tests
- Easier to maintain and refactor
- Better IDE support

## Running Tests

### Unit Tests

```bash
# Watch mode (runs tests on file changes)
npm run test

# Run once and exit
npm run test:run

# Run with coverage report
npm run test:coverage

# Run with UI
npm run test:ui
```

### E2E Tests

```bash
# Run E2E tests
npm run test:e2e

# Run with UI
npm run test:e2e:ui
```

## Coverage Reports

After running `npm run test:coverage`, coverage reports are generated in:
- **Terminal**: Summary in console
- **HTML**: `coverage/index.html` - Open in browser for detailed view
- **JSON**: `coverage/coverage-final.json` - For CI/CD integration

### Current Coverage

```
Utils Coverage (Phase 4):
├── formatters.ts: 90.38%
├── dateUtils.ts: 86.20%
├── helpers.ts: 79.61%
├── cn.ts: 100%
└── Overall: 94.89%
```

## Writing Tests

### Naming Convention

- Test files: `*.test.ts` or `*.test.tsx`
- Location: Same directory as source file
- Test suites: Use `describe()` blocks
- Test cases: Use `it()` or `test()`

### Example Test

```typescript
// formatters.test.ts
import { describe, it, expect } from 'vitest';
import { formatGP } from './formatters';

describe('formatGP', () => {
  it('formats numbers with K suffix', () => {
    expect(formatGP(50000)).toBe('50.0K');
  });

  it('handles negative numbers', () => {
    expect(formatGP(-1234567)).toBe('-1.2M');
  });
});
```

### Component Tests

```typescript
// MyComponent.test.tsx
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { MyComponent } from './MyComponent';

describe('MyComponent', () => {
  it('renders correctly', () => {
    render(<MyComponent />);
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });
});
```

### Hook Tests

```typescript
// useMyHook.test.ts
import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { useMyHook } from './useMyHook';

describe('useMyHook', () => {
  it('returns expected data', async () => {
    const { result } = renderHook(() => useMyHook());
    
    await waitFor(() => {
      expect(result.current.data).toBeDefined();
    });
  });
});
```

## Test Setup

### Vitest Configuration

Located in `vitest.config.ts`:
- **Environment**: jsdom (for DOM testing)
- **Globals**: true (no need to import test functions)
- **Setup**: `src/test/setup.ts` runs before tests
- **Coverage**: v8 provider with multiple reporters

### Test Setup File

`src/test/setup.ts` contains:
- Global test utilities
- Mock configurations
- Test environment setup

## Best Practices

### 1. Test Naming

```typescript
// ✓ Good - descriptive and clear
it('formats numbers over 1 million with M suffix', () => {});

// ✗ Bad - vague
it('works correctly', () => {});
```

### 2. Test Structure

```typescript
describe('formatGP', () => {
  // Group related tests
  describe('when formatting thousands', () => {
    it('uses K suffix for values over 10K', () => {});
    it('includes decimal places', () => {});
  });

  describe('when formatting millions', () => {
    it('uses M suffix for values over 1M', () => {});
  });
});
```

### 3. Test Independence

```typescript
// ✓ Good - each test is independent
it('formats 1000 as 1,000', () => {
  expect(formatNumber(1000)).toBe('1,000');
});

it('formats 1000000 as 1,000,000', () => {
  expect(formatNumber(1000000)).toBe('1,000,000');
});

// ✗ Bad - tests depend on each other
let result;
it('sets result', () => {
  result = formatNumber(1000);
});
it('checks result', () => {
  expect(result).toBe('1,000');
});
```

### 4. Edge Cases

Always test:
- Zero values
- Negative values
- Very large numbers
- Invalid input
- Boundary conditions
- Error cases

```typescript
describe('formatGP', () => {
  it('handles zero', () => {
    expect(formatGP(0)).toBe('0');
  });

  it('handles negative numbers', () => {
    expect(formatGP(-500)).toBe('-500');
  });

  it('handles very large numbers', () => {
    expect(formatGP(5000000000)).toBe('5.0B');
  });
});
```

### 5. Mocking

```typescript
import { vi } from 'vitest';

// Mock API calls
vi.mock('../api/client', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

// Mock modules
vi.mock('axios');

// Mock dates
vi.useFakeTimers();
vi.setSystemTime(new Date('2024-01-15'));
```

## Coverage Goals

- **Utilities**: 90%+ coverage (critical functions)
- **Components**: 80%+ coverage (user-facing)
- **Hooks**: 80%+ coverage (business logic)
- **API clients**: 70%+ coverage (integration points)

## Continuous Integration

Tests run automatically on:
- Pull requests
- Commits to main branch
- Before deployment

### CI Commands

```bash
# Run all checks
npm run lint
npm run test:run
npm run test:coverage
npm run build
```

## Debugging Tests

### Using Vitest UI

```bash
npm run test:ui
```

Opens a browser-based UI for:
- Running individual tests
- Viewing test results
- Debugging failures
- Checking coverage

### VSCode Debugging

Add to `.vscode/launch.json`:

```json
{
  "type": "node",
  "request": "launch",
  "name": "Debug Tests",
  "runtimeExecutable": "npm",
  "runtimeArgs": ["run", "test:run"],
  "console": "integratedTerminal"
}
```

### Console Logs

```typescript
it('debugs values', () => {
  const result = formatGP(1000);
  console.log('Result:', result); // Visible in test output
  expect(result).toBe('1,000');
});
```

## Common Patterns

### Testing Async Code

```typescript
it('fetches data', async () => {
  const result = await fetchData();
  expect(result).toBeDefined();
});
```

### Testing Error Handling

```typescript
it('throws error for invalid input', () => {
  expect(() => parseGP('invalid')).toThrow();
});
```

### Testing React Query Hooks

```typescript
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const createWrapper = () => {
  const queryClient = new QueryClient();
  return ({ children }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

it('fetches items', async () => {
  const { result } = renderHook(() => useItems(), {
    wrapper: createWrapper(),
  });

  await waitFor(() => {
    expect(result.current.data).toBeDefined();
  });
});
```

## Resources

- [Vitest Documentation](https://vitest.dev)
- [Testing Library](https://testing-library.com)
- [Playwright Documentation](https://playwright.dev)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)

## Troubleshooting

### Tests Not Running

1. Check test file naming: Must end with `.test.ts` or `.test.tsx`
2. Verify file is in correct location
3. Check imports are correct
4. Run `npm install` if dependencies are missing

### Coverage Not Generated

1. Install coverage package: `npm install -D @vitest/coverage-v8@^2.1.8`
2. Check `vitest.config.ts` has coverage configuration
3. Run with `--coverage` flag

### Flaky Tests

1. Check for timing issues (use `waitFor`)
2. Ensure tests are independent
3. Mock dates/times if time-dependent
4. Avoid relying on test execution order

## Next Steps (Phase 5)

Component tests will be added for:
- [ ] ItemsTable component
- [ ] PriceChart component
- [ ] FilterPanel component
- [ ] Layout components
- [ ] Page components

E2E tests will cover:
- [ ] Dashboard navigation
- [ ] Item search and filtering
- [ ] Item detail page
- [ ] Chart interactions
- [ ] Favorite functionality
