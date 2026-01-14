# OSRS Grand Exchange Tracker - Quick Reference

## Quick Start

### Prerequisites Check
```powershell
# Windows
.\setup.ps1

# Linux/Mac
chmod +x setup.sh
./setup.sh
```

### Start Services
```bash
# Start PostgreSQL and Redis
docker-compose up -d postgres redis

# Check status
docker-compose ps
```

### Backend Setup
```bash
cd backend
cp .env.example .env
go mod download
go run cmd/api/main.go
```

### Frontend Setup
```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

## Essential Commands

### Docker
```bash
docker-compose up -d          # Start all services
docker-compose down           # Stop all services
docker-compose ps             # Check status
docker-compose logs -f        # View logs
docker-compose restart        # Restart services
```

### Backend
```bash
cd backend
make help          # Show all commands
make deps          # Download dependencies
make run           # Run application
make build         # Build binary
make test          # Run tests
```

### Frontend
```bash
cd frontend
npm run dev        # Start dev server (port 3000)
npm run build      # Build for production
npm run preview    # Preview production build
npm run lint       # Run linter
```

## Access Points

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8080
- **PostgreSQL**: localhost:5432
  - Database: `osrs_ge_tracker`
  - User: `postgres`
  - Password: `postgres`
- **Redis**: localhost:6379

## Project URLs

- **OSRS API**: https://secure.runescape.com/m=itemdb_oldschool/api
- **OSRS Wiki API Docs**: https://runescape.wiki/w/Application_programming_interface

## Troubleshooting

### Port Already in Use
```bash
# Windows - Find and kill process on port 8080
netstat -ano | findstr :8080
taskkill /PID <PID> /F

# Linux/Mac
lsof -ti:8080 | xargs kill -9
```

### Docker Issues
```bash
# Reset Docker environment
docker-compose down -v
docker-compose up -d

# View logs
docker-compose logs postgres
docker-compose logs redis
```

### Database Connection Issues
1. Ensure PostgreSQL is running: `docker-compose ps`
2. Check connection in `.env` file
3. Test connection: `docker-compose exec postgres psql -U postgres -d osrs_ge_tracker`

## Development Workflow

1. Start Docker services
2. Start backend in one terminal
3. Start frontend in another terminal
4. Make changes and test
5. Commit when ready

## Environment Variables

### Backend (.env)
- `PORT` - Server port (default: 8080)
- `DB_HOST` - PostgreSQL host
- `DB_PORT` - PostgreSQL port
- `REDIS_HOST` - Redis host
- `OSRS_API_BASE_URL` - OSRS API endpoint

### Frontend (.env)
- `VITE_API_URL` - Backend API URL

## Next Steps

After setup is complete:
1. Implement OSRS API client in backend
2. Create API endpoints for items and prices
3. Implement data fetching scheduler
4. Build React components for item list and charts
5. Add search and filtering functionality
