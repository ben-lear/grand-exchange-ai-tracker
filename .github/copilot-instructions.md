# GitHub Copilot Instructions for OSRS Grand Exchange Tracker

## 🚨 CRITICAL RULES

### Git Operations
**NEVER commit or push code without explicit user permission.**
- Do NOT run `git commit` on your own
- Do NOT run `git push` on your own
- ALWAYS wait for the user to say "commit and push" or "push the changes" or similar explicit permission
- You MAY stage files with `git add` when preparing changes
- You MAY show `git status` and `git diff` to preview changes

## Project Overview

This is a full-stack application for tracking and visualizing **Old School RuneScape (OSRS)** Grand Exchange item prices and trends. The backend fetches data from the OSRS API, stores it in PostgreSQL, and serves it via REST API. The frontend displays interactive price charts and item information.

**IMPORTANT**: This project uses **OSRS** (Old School RuneScape) API, not RS3 (RuneScape 3). Always use `m=itemdb_oldschool` in API URLs.

## Tech Stack

### Backend
- **Language**: Go 1.22+
- **Framework**: Fiber (high-performance HTTP framework)
- **Database**: PostgreSQL 16 with GORM
- **Caching**: Redis 7
- **Scheduler**: Robfig Cron v3
- **Logging**: Uber Zap (structured JSON logging)
- **HTTP Client**: Resty v2
- **Validation**: go-playground/validator v10

### Frontend
- **Framework**: React 18 with TypeScript (strict mode)
- **Build Tool**: Vite 5
- **Routing**: React Router v6
- **Data Fetching**: TanStack Query (React Query) v5
- **Charts**: Recharts v2
- **State Management**: Zustand v4
- **Forms**: React Hook Form v7 + Zod validation
- **Styling**: TailwindCSS v3
- **Notifications**: Sonner
- **Date Utilities**: date-fns v3