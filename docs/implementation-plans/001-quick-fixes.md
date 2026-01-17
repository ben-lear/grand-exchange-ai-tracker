# 001: Quick Fixes

**Priority:** Critical  
**Effort:** XS (< 1 hour)  
**Status:** ✅ Complete

## Overview

Collection of simple one-line fixes that can be done quickly without architectural changes.

## Tasks

### 1.1 Fix API Status Link URL
- **File:** `frontend/src/components/layout/Footer.tsx` (line 64)
- **Current:** `href="/api/health"` — links to frontend route, returns error
- **Fix:** Use env var to build backend URL:
  ```tsx
  href={`${import.meta.env.VITE_API_BASE_URL?.replace('/api/v1', '')}/health`}
  target="_blank"
  rel="noopener noreferrer"
  ```
- **Note:** Also add `target="_blank"` to open in new tab (it's a JSON endpoint)

### 1.2 Fix GitHub Repository Link
- **File:** `frontend/src/components/layout/Footer.tsx` (line 81)
- **Current:** `href="https://github.com"`
- **Fix:** Update to actual repo URL:
  ```tsx
  href="https://github.com/ben-lear/grand-exchange-ai-tracker"
  ```

### 1.3 Add React Router v7 Future Flags
- **File:** `frontend/src/App.tsx` (line 13)
- **Current:** `<BrowserRouter>`
- **Fix:** Add future flags to suppress warnings and prepare for v7:
  ```tsx
  <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
  ```

### 1.4 Fix Health Endpoint Documentation
- **File:** `.github/copilot-instructions.md`
- **Current:** Docs show `GET /health` under REST Endpoints (correct)
- **Action:** Verify no references to `/api/v1/health` exist — if found, update to `/health`
- **Status:** Likely already correct, just needs verification

## Testing

- [ ] API Status link opens in new tab and shows health JSON
- [ ] GitHub link opens `https://github.com/ben-lear/grand-exchange-ai-tracker`
- [ ] No React Router warnings in browser console
- [ ] Documentation matches implementation

## Dependencies

None

## Risks

None — all changes are isolated one-liners
