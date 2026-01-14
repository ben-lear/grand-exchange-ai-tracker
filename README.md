# OSRS Grand Exchange Tracker

A full-stack application for tracking and visualizing **Old School RuneScape (OSRS)** Grand Exchange item prices and market trends.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Go Version](https://img.shields.io/badge/Go-1.22+-00ADD8?logo=go)
![React](https://img.shields.io/badge/React-18-61DAFB?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178C6?logo=typescript)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?logo=postgresql)

## 📋 Overview

This application polls the official OSRS Grand Exchange API every minute, stores pricing data in PostgreSQL, and presents it through a modern React-based frontend. The main interface is a comprehensive data table displaying all ~15,000 tradeable items with advanced filtering, sorting, and export capabilities.

### Key Features

- **📊 Real-time Price Tracking** - Polls all OSRS items every 1 minute
- **📈 Interactive Price Charts** - Time-series visualization with Recharts
- **🔍 Advanced Search & Filtering** - Filter by name, category, price range, volume
- **📋 Comprehensive Data Table** - View all items with sortable columns
- **💾 Data Persistence** - Historical data preserved across restarts
- **⚡ High Performance** - Redis caching for sub-200ms responses
- **📱 Responsive Design** - Works on desktop and mobile

## 🛠️ Tech Stack

### Backend
| Technology | Purpose |
|------------|---------|
| Go 1.22+ | Primary language |
| Fiber v2 | HTTP framework |
| GORM | PostgreSQL ORM |
| Redis 7 | Caching layer |
| Robfig Cron v3 | Job scheduler |
| Uber Zap | Structured logging |
| Resty v2 | HTTP client |

### Frontend
| Technology | Purpose |
|------------|---------|
| React 18 | UI framework |
| TypeScript 5 | Type safety |
| Vite 5 | Build tool |
| TanStack Query v5 | Data fetching & caching |
| TanStack Table v8 | Data table with virtual scroll |
| Recharts v2 | Price charts |
| Zustand v4 | State management |
| TailwindCSS v3 | Styling |

### Testing
| Technology | Purpose |
|------------|---------|
| Vitest | Unit testing |
| Playwright | E2E testing |
| Testing Library | Component testing |

## 🚀 Quick Start

### Prerequisites

- Docker & Docker Compose
- Go 1.22+ (for local development)
- Node.js 20+ (for local development)

### Using Docker (Recommended)

```bash
# Clone the repository
git clone https://github.com/yourusername/osrs-ge-tracker.git
cd osrs-ge-tracker

# Start all services
docker-compose up -d

# View logs
docker-compose logs -f
```

The application will be available at:
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8080/api/v1
- **Health Check**: http://localhost:8080/health

### Local Development

#### Backend

```bash
cd backend

# Install dependencies
go mod download

# Copy environment file
cp .env.example .env

# Run database migrations
go run cmd/migrate/main.go

# Start the server (with hot reload)
air
```

#### Frontend

```bash
cd frontend

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Start development server
npm run dev
```

## 📁 Project Structure

```
osrs-ge-tracker/
├── backend/
│   ├── cmd/
│   │   └── api/
│   │       └── main.go           # Application entry point
│   ├── internal/
│   │   ├── config/               # Configuration management
│   │   ├── database/             # Database connections
│   │   ├── models/               # Data models
│   │   ├── repository/           # Data access layer
│   │   ├── services/             # Business logic
│   │   ├── handlers/             # HTTP handlers
│   │   ├── middleware/           # HTTP middleware
│   │   └── scheduler/            # Cron jobs
│   ├── migrations/               # SQL migrations
│   └── tests/                    # Test files
├── frontend/
│   ├── src/
│   │   ├── api/                  # API client
│   │   ├── components/           # React components
│   │   ├── hooks/                # Custom hooks
│   │   ├── pages/                # Page components
│   │   ├── stores/               # Zustand stores
│   │   ├── types/                # TypeScript types
│   │   └── utils/                # Utility functions
│   └── tests/                    # Test files
├── docker-compose.yml
└── README.md
```

## 🔌 API Endpoints

### Items
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/items` | List all items (paginated) |
| GET | `/api/v1/items/:id` | Get item by ID |
| GET | `/api/v1/items/search?q=` | Search items by name |

### Prices
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/prices/current` | Get current prices (all items) |
| GET | `/api/v1/prices/current/:id` | Get current price for item |
| GET | `/api/v1/prices/history/:id` | Get historical prices |
| GET | `/api/v1/prices/batch?ids=` | Get prices for multiple items |

### Query Parameters for History
- `period`: `24h`, `7d`, `30d`, `90d`, `1y`, `all`
- `sample`: `true` for sampled data (150 points)

## ⚙️ Configuration

### Backend Environment Variables

```env
# Server
PORT=8080
ENV=development

# Database
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_USER=osrs_tracker
POSTGRES_PASSWORD=your_password
POSTGRES_DB=osrs_ge_tracker

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# OSRS API
OSRS_BULK_DUMP_URL=https://chisel.weirdgloop.org/gazproj/gazbot/os_dump.json
OSRS_HISTORY_API_URL=https://api.weirdgloop.org/exchange/history/osrs

# Scheduler
PRICE_POLL_INTERVAL=@every 1m
HISTORICAL_SYNC_INTERVAL=@every 1h
```

### Frontend Environment Variables

```env
VITE_API_BASE_URL=http://localhost:8080/api/v1
```

## 🧪 Testing

### Backend

```bash
cd backend

# Run all tests
go test ./...

# Run with coverage
go test -cover ./...

# Run specific package tests
go test ./internal/services/...
```

### Frontend

```bash
cd frontend

# Run unit tests
npm run test

# Run with coverage
npm run test:coverage

# Run E2E tests
npm run test:e2e

# Run E2E with UI
npm run test:e2e:ui
```

## 📊 Data Sources

This application uses the following OSRS APIs:

| API | URL | Purpose |
|-----|-----|---------|
| Bulk Dump | `chisel.weirdgloop.org/gazproj/gazbot/os_dump.json` | Current prices (all items) |
| Historical | `api.weirdgloop.org/exchange/history/osrs/*` | Price history |
| Item Detail | `secure.runescape.com/m=itemdb_oldschool/api/*` | Item metadata |

**Note**: Always use `m=itemdb_oldschool` for OSRS data, not `m=itemdb_rs` (RS3).

## 🔄 Data Flow

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   OSRS API      │────▶│    Backend      │────▶│   PostgreSQL    │
│ (Bulk Dump)     │     │    (Go/Fiber)   │     │   (Persistent)  │
└─────────────────┘     └────────┬────────┘     └─────────────────┘
                                 │
                                 ▼
                        ┌─────────────────┐
                        │     Redis       │
                        │    (Cache)      │
                        └────────┬────────┘
                                 │
                                 ▼
                        ┌─────────────────┐
                        │    Frontend     │
                        │  (React/Vite)   │
                        └─────────────────┘
```

## 📈 Performance

- **API Response Time**: < 200ms (p95)
- **Database Query Time**: < 50ms (p95)
- **Frontend Page Load**: < 2s
- **Cache Hit Rate**: > 95%
- **Items Supported**: ~15,000

## 🗺️ Roadmap

- [x] Core backend with price polling
- [x] React frontend with data table
- [x] Historical price charts
- [ ] WebSocket for real-time updates
- [ ] Price alerts
- [ ] Portfolio tracking
- [ ] Mobile app (React Native)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## ⚠️ Disclaimer

This project is not affiliated with Jagex Ltd. Old School RuneScape is a trademark of Jagex Ltd. All game data is retrieved from publicly available APIs maintained by the community.

---

Built with ❤️ for the OSRS community
