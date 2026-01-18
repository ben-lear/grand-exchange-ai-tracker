# Implementation Plan 006: Fix CORS and Backend Connection

**Status**: 📋 Planning  
**Priority**: High  
**Estimated Effort**: 30 minutes  
**Category**: Backend Infrastructure  

## Problem Statement

Frontend development server (port 3001) cannot connect to backend API (port 8080) due to:
1. Backend server not running
2. CORS configuration issues

Console shows 13+ instances of:
```
Access to XMLHttpRequest at 'http://localhost:8080/api/v1/...' from origin 'http://localhost:3001' 
has been blocked by CORS policy: Response to preflight request doesn't pass access control check: 
The 'Access-Control-Allow-Origin' header contains the invalid value ''.
```

## Root Causes

1. **Backend Not Running**: Go backend API server needs to be started
2. **CORS Misconfiguration**: Backend CORS middleware may have empty `Access-Control-Allow-Origin` header
3. **Port Mismatch**: Frontend on 3001, backend expected on 8080

## Solution

### Step 1: Start Backend Server

```bash
cd backend
go run cmd/api/main.go
```

**Expected output:**
```
INFO: Starting server on :8080
INFO: Database connected
INFO: Redis connected
```

### Step 2: Verify CORS Middleware

Check `backend/internal/middleware/cors.go`:

```go
// Should allow frontend origin
AllowOrigins: []string{"http://localhost:3000", "http://localhost:3001"},
AllowMethods: []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
AllowHeaders: []string{"Origin", "Content-Type", "Accept"},
AllowCredentials: true,
```

**If missing port 3001**, add it to `AllowOrigins`.

### Step 3: Verify Backend Config

Check `backend/internal/config/config.go` for CORS settings:

```go
type Config struct {
    // ...
    CORSOrigins []string `mapstructure:"CORS_ORIGINS"`
}
```

Check `.env` or environment variables:
```bash
CORS_ORIGINS=http://localhost:3000,http://localhost:3001
```

### Step 4: Test Connection

1. Start backend: `cd backend && go run cmd/api/main.go`
2. In browser console, verify no more CORS errors
3. Check `/health` endpoint: `http://localhost:8080/health`
4. Verify data loads in frontend

## Acceptance Criteria

- [ ] Backend server starts without errors
- [ ] No CORS errors in browser console
- [ ] Frontend successfully fetches from `/api/v1/items`
- [ ] Frontend successfully fetches from `/api/v1/prices/current`
- [ ] Health endpoint returns 200 OK

## Testing

1. **Health Check**: Navigate to `http://localhost:8080/health` - should return JSON
2. **API Call**: Open Network tab, refresh frontend, verify API calls return 200
3. **Console**: No CORS errors in console
4. **Data Display**: Items and prices display in frontend table

## Dependencies

- PostgreSQL running (for backend database)
- Redis running (for backend cache)
- Go 1.24.0+ installed
- Backend dependencies installed (`go mod tidy`)

## Notes

- If PostgreSQL/Redis not running, use Docker: `docker-compose up -d postgres redis`
- Backend may need migrations: `cd backend && go run cmd/api/main.go migrate`
- Check backend README for detailed setup instructions

## Related Files

- `backend/internal/middleware/cors.go` - CORS middleware
- `backend/internal/config/config.go` - Configuration
- `backend/cmd/api/main.go` - Entry point
- `backend/.env` - Environment variables

## Follow-up Tasks

- Document backend startup in root README
- Add healthcheck UI component to frontend
- Create docker-compose dev profile for easier startup
- Consider using Vite proxy in development to avoid CORS
