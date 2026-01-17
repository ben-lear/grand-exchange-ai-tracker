# 008: Price Change Indicators

**Priority:** Medium  
**Effort:** S (1-4 hours)  
**Status:** Not Started

## Overview

Add visual indicators showing price changes to help traders spot opportunities quickly.

## Features

- Green/red arrows for price direction
- Percentage change display
- Color-coded price cells
- Optional: Mini sparkline charts

## Tasks

### 8.1 Calculate Price Changes
- **Location:** `frontend/src/utils/priceUtils.ts` (create if needed)
- **Functions:**
  - `calculatePriceChange(currentPrice, previousPrice)`
  - `formatPriceChange(change)` - returns "+5.2%" or "-3.1%"
  - `getPriceDirection(change)` - returns 'up' | 'down' | 'stable'

### 8.2 Create PriceChangeIndicator Component
- **Location:** `frontend/src/components/common/PriceChangeIndicator.tsx`
- **Props:** `change: number`, `showPercentage?: boolean`
- **Display:** Arrow icon + optional percentage

### 8.3 Add Indicators to Items Table
- **File:** `frontend/src/components/table/ItemsTable.tsx`
- **Change:** Add PriceChangeIndicator next to price columns
- **Note:** May need to fetch/calculate previous prices

### 8.4 Add Indicators to Item Detail
- **File:** `frontend/src/pages/ItemDetailPage.tsx`
- **Change:** Show 24h change prominently

### 8.5 Color-Code Price Cells (Optional)
- **File:** `frontend/src/components/table/ItemsTable.tsx`
- **Change:** Add subtle green/red background to price cells based on change

## Data Requirements

**Note:** This may require backend changes or additional API calls to get:
- Previous price for comparison (24h ago, 1h ago, etc.)
- Or calculate from existing timeseries data

## Components to Create

```
frontend/src/components/common/
├── PriceChangeIndicator.tsx
└── index.ts (update)

frontend/src/utils/
├── priceUtils.ts (create)
└── index.ts (update)
```

## Testing

- [ ] Positive changes show green up arrow
- [ ] Negative changes show red down arrow
- [ ] Zero/minimal changes show neutral indicator
- [ ] Percentage calculations are accurate
- [ ] Works on both table and detail page

## Dependencies

- May need backend endpoint for historical comparison
- lucide-react icons (already installed)

## Design Notes

- Use TrendingUp/TrendingDown icons from lucide-react
- Green: #22c55e, Red: #ef4444
- Keep indicators subtle to not overwhelm the UI
