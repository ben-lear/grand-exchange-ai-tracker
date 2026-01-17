# 011: Loading & Error States

**Priority:** Future/Backlog  
**Effort:** S (1-4 hours)  
**Status:** Not Started

## Overview

Improve perceived performance and error handling with skeleton loaders, error boundaries, and better feedback.

## Current State

- Basic loading state exists
- No skeleton loaders
- No error boundaries
- Limited error feedback

## Tasks

### 11.1 Create Skeleton Components
- **Location:** `frontend/src/components/common/Skeleton.tsx`
- **Variants:**
  - `TableRowSkeleton` - Mimics item row shape
  - `CardSkeleton` - For item detail cards
  - `ChartSkeleton` - For price charts

### 11.2 Add Skeletons to Dashboard
- **File:** `frontend/src/pages/DashboardPage.tsx`
- **Change:** Show skeleton rows while loading instead of spinner

### 11.3 Add Skeletons to Item Detail
- **File:** `frontend/src/pages/ItemDetailPage.tsx`
- **Change:** Show skeleton for item info and chart while loading

### 11.4 Create Error Boundary Component
- **Location:** `frontend/src/components/common/ErrorBoundary.tsx`
- **Features:**
  - Catch React errors
  - Show friendly error message
  - "Try again" button
  - Log errors to console/service

### 11.5 Wrap App in Error Boundary
- **File:** `frontend/src/App.tsx` or `main.tsx`
- **Change:** Wrap routes in ErrorBoundary

### 11.6 Create Error Fallback Components
- **Location:** `frontend/src/components/common/ErrorFallback.tsx`
- **Variants:**
  - Full page error
  - Section/component error
  - Inline error message

### 11.7 Add Retry Logic to API Hooks
- **Files:** `frontend/src/hooks/useItems.ts`, `frontend/src/hooks/usePrices.ts`
- **Change:** Add retry option to TanStack Query config
- **Also:** Show retry button on failure

### 11.8 Improve Toast Notifications
- **Files:** Various
- **Change:** Use Sonner toasts for:
  - API errors
  - Network failures
  - Successful actions (refresh, export, etc.)

## Components to Create

```
frontend/src/components/common/
├── Skeleton.tsx
├── TableRowSkeleton.tsx
├── ErrorBoundary.tsx
├── ErrorFallback.tsx
└── index.ts (update)
```

## Testing

- [ ] Skeletons show during loading
- [ ] Skeletons match actual content layout
- [ ] Error boundary catches crashes
- [ ] Retry button works
- [ ] Toast notifications appear for errors
- [ ] Offline state handled gracefully

## Dependencies

- Sonner (already installed)
- TanStack Query retry options

## Design Notes

- Skeletons should pulse/animate
- Match skeleton colors to theme
- Keep error messages user-friendly
- Log detailed errors for debugging
- Consider offline detection
