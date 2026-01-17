# 010: Mobile Improvements

**Priority:** Future/Backlog  
**Effort:** M (4-8 hours)  
**Status:** Not Started

## Overview

Improve the mobile experience with better navigation, responsive table, and touch gestures.

## Current State

- Mobile menu toggle exists in Header
- No mobile navigation drawer implemented
- Table not optimized for small screens
- No touch gestures

## Tasks

### 10.1 Implement Mobile Navigation Drawer
- **Location:** `frontend/src/components/layout/MobileNav.tsx`
- **Features:**
  - Slide-in drawer from left
  - Navigation links
  - Close on outside click or swipe
  - Animate open/close

### 10.2 Wire Mobile Menu to UIStore
- **File:** `frontend/src/components/layout/MainLayout.tsx`
- **Change:** Render MobileNav when `mobileMenuOpen` is true

### 10.3 Optimize Table for Mobile
- **File:** `frontend/src/components/table/ItemsTable.tsx`
- **Options:**
  - Card view for mobile (stack instead of columns)
  - Horizontal scroll with sticky first column
  - Hide less important columns on small screens

### 10.4 Create MobileItemCard Component
- **Location:** `frontend/src/components/table/MobileItemCard.tsx`
- **Display:** Item info in card format for narrow screens

### 10.5 Add Touch Gestures
- **Library:** Consider `react-swipeable` or native touch events
- **Gestures:**
  - Swipe left/right for pagination
  - Swipe to dismiss notifications
  - Pull to refresh

### 10.6 Improve Touch Targets
- **Files:** Various components
- **Change:** Ensure all buttons/links are at least 44x44px on mobile

### 10.7 Add Responsive Breakpoints
- **File:** `tailwind.config.js`
- **Verify:** Proper breakpoints for sm/md/lg/xl

## Components to Create

```
frontend/src/components/layout/
├── MobileNav.tsx
└── index.ts (update)

frontend/src/components/table/
├── MobileItemCard.tsx
└── index.ts (update)
```

## Testing

- [ ] Mobile nav opens/closes correctly
- [ ] Table is usable on phone-sized screens
- [ ] Touch targets are appropriately sized
- [ ] Swipe gestures work smoothly
- [ ] No horizontal overflow issues

## Dependencies

- UIStore (mobileMenuOpen state exists)
- Optional: react-swipeable for gestures

## Design Notes

- Test on actual mobile devices, not just browser dev tools
- Consider iOS safe areas
- Ensure text remains readable
- Prioritize most important data on small screens
