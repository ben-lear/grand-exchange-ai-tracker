# OSRS Grand Exchange Tracker

A full-stack application for tracking and visualizing Old School RuneScape (OSRS) Grand Exchange item prices and trends.

## Tech Stack

### Backend
- **Language**: Go 1.22
- **Framework**: Fiber (high-performance HTTP framework)
- **Database**: PostgreSQL 16
- **Caching**: Redis 7
- **ORM**: GORM
- **Scheduler**: Robfig Cron
- **Logging**: Uber Zap
- **HTTP Client**: Resty

### Frontend
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Routing**: React Router v6
- **Data Fetching**: TanStack Query (React Query)
- **Charts**: Recharts
- **State Management**: Zustand
- **Forms**: React Hook Form + Zod
- **Styling**: TailwindCSS
- **Notifications**: Sonner

### Infrastructure
- **Containerization**: Docker & Docker Compose
- **Reverse Proxy**: Nginx

## Project Structure

```
grand-exchange-ai-tracker/
├── backend/                 # Go backend
│   ├── cmd/
│   │   └── api/            # Application entry point
│   ├── internal/
│   │   ├── api/            # HTTP handlers
│   │   ├── config/         # Configuration management
│   │   ├── models/         # Data models
│   │   ├── repository/     # Database layer
│   │   ├── scheduler/      # Cron jobs
│   │   └── services/       # Business logic
│   ├── pkg/
│   │   └── logger/         # Logging utilities
│   ├── migrations/         # Database migrations
│   ├── .env.example        # Environment variables template
│   ├── Dockerfile          # Backend Docker image
│   ├── go.mod              # Go dependencies
│   └── Makefile            # Development commands
├── frontend/               # React frontend
│   ├── src/
│   │   ├── components/     # Reusable components
│   │   ├── pages/          # Page components
│   │   ├── hooks/          # Custom React hooks
│   │   ├── services/       # API clients
│   │   ├── store/          # State management
│   │   ├── types/          # TypeScript types
│   │   └── utils/          # Utility functions
│   ├── public/             # Static assets
│   ├── .env.example        # Environment variables template
│   ├── Dockerfile          # Frontend Docker image
│   ├── nginx.conf          # Nginx configuration
│   └── package.json        # NPM dependencies
├── docker-compose.yml      # Docker services configuration
└── README.md              # This file
```

## Prerequisites

Before you begin, ensure you have the following installed:
- [Go 1.22+](https://golang.org/doc/install)
- [Node.js 20+](https://nodejs.org/) and npm
- [Docker Desktop](https://www.docker.com/products/docker-desktop/)
- [Git](https://git-scm.com/)

## Getting Started

### 1. Clone the Repository

```bash
git clone <repository-url>
cd grand-exchange-ai-tracker
```

### 2. Setup Environment Variables

#### Backend
```bash
cd backend
cp .env.example .env
# Edit .env with your configuration
```

#### Frontend
```bash
cd ../frontend
cp .env.example .env
# Edit .env with your configuration
```

### 3. Start PostgreSQL and Redis

Start the database and cache services using Docker Compose:

```bash
# From the project root
docker-compose up -d postgres redis
```

Wait for services to be healthy:
```bash
docker-compose ps
```

### 4. Setup Backend

```bash
cd backend

# Download Go dependencies
go mod download

# Run database migrations
# Note: Migrations will auto-run on first container start
# Or manually apply: psql -U postgres -d osrs_ge_tracker -f migrations/001_init_schema.sql

# Run the backend
go run cmd/api/main.go

# Or use Make commands
make deps    # Download dependencies
make run     # Run the application
make build   # Build the application
```

The backend will start on `http://localhost:8080`

### 5. Setup Frontend

```bash
cd ../frontend

# Install dependencies
npm install

# Start development server
npm run dev

# Or build for production
npm run build
npm run preview
```

The frontend will start on `http://localhost:3000`

## Development Commands

### Backend

```bash
cd backend

make help          # Show available commands
make build         # Build the application
make run           # Run the application
make test          # Run tests
make clean         # Clean build artifacts
make deps          # Download dependencies
make docker-up     # Start Docker containers
make docker-down   # Stop Docker containers
make docker-logs   # View Docker logs
```

### Frontend

```bash
cd frontend

npm run dev        # Start development server
npm run build      # Build for production
npm run preview    # Preview production build
npm run lint       # Run ESLint
```

## Docker Deployment

To run the entire stack in Docker:

1. Uncomment the `backend` and `frontend` services in `docker-compose.yml`
2. Run:

```bash
docker-compose up -d
```

This will start:
- PostgreSQL on port 5432
- Redis on port 6379
- Backend API on port 8080
- Frontend on port 3000

## API Endpoints (To Be Implemented)

- `GET /api/health` - Health check
- `GET /api/items` - List all tracked items
- `GET /api/items/:id` - Get item details
- `GET /api/items/:id/prices` - Get price history
- `GET /api/items/:id/graph` - Get graph data for charts
- `GET /api/categories` - List item categories
- `POST /api/items/:id/watch` - Add item to watchlist

## Database Schema

### Tables
- **items** - OSRS item information
- **price_history** - Historical price data points
- **price_trends** - Current price trends and statistics

See [migrations/001_init_schema.sql](backend/migrations/001_init_schema.sql) for full schema.

## OSRS API Reference

This application uses the Old School RuneScape Grand Exchange API:
- Base URL: `https://secure.runescape.com/m=itemdb_oldschool/api`
- Documentation: https://runescape.wiki/w/Application_programming_interface

Key endpoints:
- `/catalogue/items.json?category=1&alpha={letter}&page={page}` - List items
- `/catalogue/detail.json?item={itemId}` - Item details
- `/graph/{itemId}.json` - Price history (180 days)

## Contributing

1. Create a feature branch
2. Make your changes
3. Run tests and linting
4. Submit a pull request

## License

[MIT License](LICENSE)

## Notes

- The OSRS API has rate limiting - respect the API usage guidelines
- This project uses OSRS data (not RS3) - note the `m=itemdb_oldschool` in API URLs
- Price data is updated periodically via background scheduler
- All timestamps are stored as Unix milliseconds
