# Development Workflow Instructions

This file describes the **preferred local development workflow** for the OSRS Grand Exchange Tracker project.

---

## 🎯 Standard Development Pattern

**Backend + Infrastructure in Docker | Frontend running locally in dev mode**

This pattern provides:
- Hot-reloading for frontend development (Vite)
- Stable backend/database/cache infrastructure in containers
- Fast frontend iteration without container rebuild overhead

---

## Quick Start Commands

### 1. Start Backend Infrastructure (Docker)
S
```powershell
# From project root
docker-compose up -d postgres redis backend
```

This starts:
- **PostgreSQL** on `localhost:5432`
- **Redis** on `localhost:6379`
- **Backend API** on `localhost:8080`

### 2. Start Frontend Locally (Dev Mode)

```powershell
# From project root
cd frontend
npm run dev
```

Frontend runs on `http://localhost:3000` with hot-reload enabled.

---

## Verification Commands

### Check All Services Are Running

```powershell
# Backend health check (should return 200)
(Invoke-WebRequest -Uri http://localhost:8080/api/v1/health -UseBasicParsing).StatusCode

# Frontend (should return 200)
(Invoke-WebRequest -Uri http://localhost:3000 -UseBasicParsing).StatusCode

# Docker container status
docker-compose ps
```

### View Backend Logs

```powershell
docker-compose logs -f backend
```

---

## Stopping Services

### Stop Docker Services

```powershell
docker-compose down
```

### Stop Frontend

Press `Ctrl+C` in the terminal running `npm run dev`.

---

## Full Commands Reference

| Task | Command |
|------|---------|
| Start all Docker services (no frontend) | `docker-compose up -d postgres redis backend` |
| Start frontend dev server | `cd frontend && npm run dev` |
| Rebuild backend container | `docker-compose build backend` |
| View backend logs | `docker-compose logs -f backend` |
| Stop all Docker services | `docker-compose down` |
| Stop and remove volumes | `docker-compose down -v` |
| Check backend health | `curl http://localhost:8080/api/v1/health` |

---

## Environment Details

### Backend Container Environment
- **API URL**: `http://localhost:8080`
- **CORS Origins**: `http://localhost:3000` (allows frontend)
- **Database**: PostgreSQL at `postgres:5432` (internal Docker network)
- **Cache**: Redis at `redis:6379` (internal Docker network)

### Frontend Local Environment
- **Dev Server**: `http://localhost:3000`
- **API Base URL**: `http://localhost:8080/api/v1` (configured in `.env` or `VITE_API_BASE_URL`)
- **Hot Reload**: Enabled via Vite

---

## Troubleshooting

### Backend not connecting to database
```powershell
# Ensure postgres is healthy
docker-compose ps
# Restart backend after postgres is ready
docker-compose restart backend
```

### Frontend can't reach backend (CORS errors)
- Verify backend is running: `curl http://localhost:8080/api/v1/health`
- Check CORS_ORIGINS includes `http://localhost:3000`

### Need to reset database
```powershell
docker-compose down -v
docker-compose up -d postgres redis backend
```

---

## For AI Assistant Reference

When the user says any of these:
- "Start dev environment"
- "Run the app locally"
- "Start backend in docker, frontend locally"
- "Standard dev setup"

Execute this workflow:
1. `docker-compose up -d postgres redis backend` (from project root)
2. `cd frontend && npm run dev` (in separate terminal)
3. Verify with health checks

**Do NOT** start the frontend Docker container - always use `npm run dev` for frontend development.
