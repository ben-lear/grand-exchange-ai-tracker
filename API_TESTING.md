# API Testing Guide

## Prerequisites

Make sure the backend is running:
```bash
cd backend
.\bin\api.exe
```

The API server runs on `http://localhost:8080`

## Health Check Endpoints

### Basic Health Check
```bash
curl http://localhost:8080/api/health
```

**Response:**
```json
{
  "status": "ok",
  "service": "OSRS Grand Exchange Tracker API",
  "timestamp": "2026-01-13T20:21:48-05:00"
}
```

### Readiness Check (Database + Redis)
```bash
curl http://localhost:8080/api/ready
```

**Response:**
```json
{
  "status": "ok",
  "database": "ok",
  "redis": "ok",
  "timestamp": "2026-01-13T20:22:15-05:00"
}
```

## Items Endpoints

### List Items (with Pagination)
```bash
# Basic list (first 20 items)
curl "http://localhost:8080/api/v1/items"

# With pagination
curl "http://localhost:8080/api/v1/items?page=1&limit=10"

# Search by name
curl "http://localhost:8080/api/v1/items?search=abyssal"

# Filter by members-only
curl "http://localhost:8080/api/v1/items?members=true"

# Sort by name descending
curl "http://localhost:8080/api/v1/items?sort=name&order=desc"

# Combined filters
curl "http://localhost:8080/api/v1/items?page=1&limit=5&search=dragon&members=true&sort=name"
```

**Response:**
```json
{
  "status": "success",
  "data": [
    {
      "id": 1,
      "item_id": 4151,
      "name": "Abyssal whip",
      "description": "A weapon from the abyss.",
      "icon_url": "https://...",
      "type": "weapon",
      "members": true,
      "created_at": "2026-01-13T...",
      "updated_at": "2026-01-13T..."
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 5,
    "total": 0,
    "total_pages": 0
  },
  "timestamp": "2026-01-13T20:22:17-05:00"
}
```

### Get Item Details
```bash
# Get Abyssal whip (ID: 4151)
curl "http://localhost:8080/api/v1/items/4151"

# Get Dragon scimitar (ID: 4587)
curl "http://localhost:8080/api/v1/items/4587"
```

**Response:**
```json
{
  "status": "success",
  "data": {
    "id": 1,
    "item_id": 4151,
    "name": "Abyssal whip",
    "description": "A weapon from the abyss.",
    "icon_url": "https://...",
    "type": "weapon",
    "members": true,
    "created_at": "2026-01-13T...",
    "updated_at": "2026-01-13T..."
  },
  "trend": {
    "current_price": 2500000,
    "current_trend": "positive",
    "today_price_change": 50000,
    "day30_change": "+5.2%",
    "day30_trend": "positive"
  },
  "timestamp": "2026-01-13T20:25:00-05:00"
}
```

## Price Endpoints

### Get Price History
```bash
# Last 30 days (default)
curl "http://localhost:8080/api/v1/items/4151/prices"

# Last 7 days
curl "http://localhost:8080/api/v1/items/4151/prices?range=7d"

# Last 90 days
curl "http://localhost:8080/api/v1/items/4151/prices?range=90d"

# Last 180 days
curl "http://localhost:8080/api/v1/items/4151/prices?range=180d"

# Last year
curl "http://localhost:8080/api/v1/items/4151/prices?range=365d"
```

**Response:**
```json
{
  "status": "success",
  "data": {
    "item_id": 4151,
    "item": { ... },
    "prices": [
      {
        "id": 1,
        "item_id": 1,
        "timestamp": 1736640000,
        "price": 2450000,
        "volume": 1250,
        "created_at": "2026-01-13T..."
      }
    ],
    "range": "30d",
    "count": 30
  },
  "timestamp": "2026-01-13T20:30:00-05:00"
}
```

### Get Chart Data
```bash
# Get chart-ready data for Recharts
curl "http://localhost:8080/api/v1/items/4151/graph?range=90d"
```

**Response:**
```json
{
  "status": "success",
  "data": {
    "item_id": 4151,
    "item": { ... },
    "chart": [
      {
        "timestamp": 1736640000,
        "date": "2026-01-12",
        "price": 2450000,
        "volume": 1250
      }
    ],
    "range": "90d"
  },
  "timestamp": "2026-01-13T20:30:00-05:00"
}
```

### Get Current Price Trend
```bash
curl "http://localhost:8080/api/v1/items/4151/trend"
```

**Response:**
```json
{
  "status": "success",
  "data": {
    "item": { ... },
    "trend": {
      "id": 1,
      "item_id": 1,
      "current_price": 2500000,
      "current_trend": "positive",
      "today_price_change": 50000,
      "today_trend": "positive",
      "day30_change": "+5.2%",
      "day30_trend": "positive",
      "day90_change": "+12.8%",
      "day90_trend": "positive",
      "day180_change": "-2.3%",
      "day180_trend": "negative",
      "updated_at": "2026-01-13T..."
    }
  },
  "timestamp": "2026-01-13T20:35:00-05:00"
}
```

## Statistics Endpoints

### Get Trending Items
```bash
# Top 10 trending items (default 24h)
curl "http://localhost:8080/api/v1/stats/trending"

# Top 20 trending items in last hour
curl "http://localhost:8080/api/v1/stats/trending?limit=20&timeframe=1h"

# Top 5 trending items in last 7 days
curl "http://localhost:8080/api/v1/stats/trending?limit=5&timeframe=7d"
```

**Timeframes:** `1h`, `6h`, `24h`, `7d`

**Response:**
```json
{
  "status": "success",
  "data": [
    {
      "item": { ... },
      "current_price": 2500000,
      "current_trend": "positive",
      "day30_change": "+15.5%",
      "day30_trend": "positive"
    }
  ],
  "timeframe": "24h",
  "timestamp": "2026-01-13T20:40:00-05:00"
}
```

### Get Biggest Movers (Gainers/Losers)
```bash
# Top 10 gainers in last 24 hours
curl "http://localhost:8080/api/v1/stats/biggest-movers?direction=gainers"

# Top 10 losers in last 24 hours
curl "http://localhost:8080/api/v1/stats/biggest-movers?direction=losers"

# Top 20 gainers in last 7 days
curl "http://localhost:8080/api/v1/stats/biggest-movers?direction=gainers&limit=20&timeframe=7d"

# Top 5 losers in last 30 days
curl "http://localhost:8080/api/v1/stats/biggest-movers?direction=losers&limit=5&timeframe=30d"
```

**Directions:** `gainers`, `losers`  
**Timeframes:** `1h`, `6h`, `24h`, `7d`, `30d`

**Response:**
```json
{
  "status": "success",
  "data": [
    {
      "item": { ... },
      "current_price": 2500000,
      "current_trend": "positive",
      "today_price_change": 150000,
      "today_trend": "positive",
      "day30_change": "+25.8%",
      "day30_trend": "positive"
    }
  ],
  "direction": "gainers",
  "timeframe": "24h",
  "timestamp": "2026-01-13T20:45:00-05:00"
}
```

## Error Responses

### 404 Not Found
```json
{
  "status": "error",
  "message": "Item not found",
  "code": 404
}
```

### 400 Bad Request
```json
{
  "status": "error",
  "message": "Invalid item ID",
  "code": 400
}
```

### 500 Internal Server Error
```json
{
  "status": "error",
  "message": "Failed to retrieve items",
  "code": 500
}
```

## PowerShell Examples

If using PowerShell, use `Invoke-RestMethod`:

```powershell
# Health check
Invoke-RestMethod -Uri "http://localhost:8080/api/health"

# List items
Invoke-RestMethod -Uri "http://localhost:8080/api/v1/items?page=1&limit=10"

# Get item detail
Invoke-RestMethod -Uri "http://localhost:8080/api/v1/items/4151"

# Get price history
Invoke-RestMethod -Uri "http://localhost:8080/api/v1/items/4151/prices?range=30d"

# Get trending items
Invoke-RestMethod -Uri "http://localhost:8080/api/v1/stats/trending?limit=10"
```

## Note on Empty Data

Currently, the database is empty until Phase 3 (Scheduled Tasks) is implemented. The scheduled jobs will:
- Fetch the OSRS item catalog
- Update item details periodically
- Collect price history data
- Calculate price trends

After Phase 3, all endpoints will return real OSRS Grand Exchange data!
