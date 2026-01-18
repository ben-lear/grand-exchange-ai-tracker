# Implementation Plan 006: Fix CORS and Backend Connection

**Status**: ✅ Completed  
**Priority**: High  
**Estimated Effort**: 30 minutes  
**Category**: Backend Infrastructure  

## Problem Statement

Frontend development server (port 3000) can experience CORS issues when the `CORS_ORIGINS` environment variable contains multiple comma-separated origins. The backend was wrapping the entire string as a single array element instead of splitting it into multiple origins.

## Root Cause

In `backend/cmd/api/main.go`, the CORS middleware was receiving:
```go
AllowedOrigins: []string{cfg.CorsOrigins}  // ❌ Wrong - wraps "origin1,origin2" as single element
```

When `cfg.CorsOrigins = "http://localhost:3000,http://localhost:3001"`, this created:
```go
[]string{"http://localhost:3000,http://localhost:3001"}  // Invalid - single malformed origin
```

Instead of:
```go
[]string{"http://localhost:3000", "http://localhost:3001"}  // ✅ Correct - two separate origins
```

## Solution Implemented

### Fixed CORS Origin Parsing

Updated `backend/cmd/api/main.go` to properly split comma-separated CORS origins:

```go
// Parse CORS origins - split comma-separated string into slice
// Supports both single origin ("*") and multiple ("http://localhost:3000,http://localhost:3001")
var corsOrigins []string
if cfg.CorsOrigins != "" {
    if cfg.CorsOrigins == "*" {
        corsOrigins = []string{"*"}
    } else {
        // Split by comma and trim whitespace from each origin
        origins := strings.Split(cfg.CorsOrigins, ",")
        for _, origin := range origins {
            trimmed := strings.TrimSpace(origin)
            if trimmed != "" {
                corsOrigins = append(corsOrigins, trimmed)
            }
        }
    }
}

app.Use(middleware.NewCORSMiddleware(middleware.CORSConfig{
    AllowedOrigins: corsOrigins,
}))
```

### Configuration Support

The fix supports multiple configuration formats:
- Single origin: `CORS_ORIGINS=*` → `[]string{"*"}`
- Single specific origin: `CORS_ORIGINS=http://localhost:3000` → `[]string{"http://localhost:3000"}`
- Multiple origins: `CORS_ORIGINS=http://localhost:3000,http://localhost:3001` → `[]string{"http://localhost:3000", "http://localhost:3001"}`
- With whitespace: `CORS_ORIGINS=http://localhost:3000, http://localhost:3001` → whitespace trimmed automatically

## Acceptance Criteria

- [x] Backend properly parses comma-separated CORS origins
- [x] No CORS errors when `CORS_ORIGINS` contains multiple origins
- [x] Supports wildcard (`*`) for development
- [x] Supports single and multiple origins with proper whitespace handling
- [x] Frontend successfully fetches from all API endpoints

## Testing Results

Tested with Vite dev server (port 3000):
- ✅ Dashboard loads all items and prices
- ✅ Item detail pages load with price history charts
- ✅ SSE connections work for real-time updates
- ✅ No CORS errors in browser console
- ✅ All API endpoints return proper CORS headers

## Notes

### Vite Proxy Configuration

Frontend has a Vite proxy configured in `vite.config.ts`:
```typescript
server: {
  port: 3000,
  proxy: {
    '/api': {
      target: 'http://localhost:8080',
      changeOrigin: true,
    },
  },
}
```

However, the frontend is configured to make requests directly to `http://localhost:8080/api/v1` via `VITE_API_BASE_URL`. For CORS-free development, you could:
- Use the proxy by setting `VITE_API_BASE_URL=/api/v1` (requests go through Vite proxy)
- Continue direct requests with proper CORS configuration (current approach)

### Environment Variables

Default backend CORS setting is `CORS_ORIGINS=*` (allows all origins). For production, set specific origins:
```bash
CORS_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
```

## Related Files

- ✅ `backend/cmd/api/main.go` - CORS origin parsing
- ✅ `backend/internal/middleware/cors.go` - CORS middleware
- ✅ `backend/internal/config/config.go` - Configuration
- ✅ `frontend/vite.config.ts` - Vite proxy config
- ✅ `frontend/src/api/client.ts` - API client base URL

## Follow-up Tasks

- ✅ Fixed CORS origin parsing
- 📋 Document CORS configuration in backend README
- 📋 Add example `.env` file with CORS examples
- 📋 Consider adding CORS origin validation at startup
