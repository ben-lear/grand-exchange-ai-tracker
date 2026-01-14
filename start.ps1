# OSRS GE Tracker - Quick Start Script

# Store the original location
$originalLocation = Get-Location

Write-Host "🎮 OSRS Grand Exchange Tracker - Development Setup" -ForegroundColor Cyan
Write-Host "=" * 60

# Check if .env files exist
$backendEnv = Test-Path "backend/.env"
$frontendEnv = Test-Path "frontend/.env"

if (-not $backendEnv) {
    Write-Host "⚠️  Backend .env not found. Creating from template..." -ForegroundColor Yellow
    Copy-Item "backend/.env.example" "backend/.env"
    Write-Host "✅ Created backend/.env (please update with your settings)" -ForegroundColor Green
}

if (-not $frontendEnv) {
    Write-Host "⚠️  Frontend .env not found. Creating from template..." -ForegroundColor Yellow
    Copy-Item "frontend/.env.example" "frontend/.env"
    Write-Host "✅ Created frontend/.env" -ForegroundColor Green
}

# Menu
Write-Host "`n📋 Select an option:" -ForegroundColor Cyan
Write-Host "1. Start with Docker (Recommended)"
Write-Host "2. Start Backend Only (Local Go)"
Write-Host "3. Start Frontend Only (Local npm)"
Write-Host "4. Install Dependencies"
Write-Host "5. Run Tests"
Write-Host "6. Build Production"
Write-Host "7. Check Docker Status"
Write-Host "8. Clean `& Reset"
Write-Host "0. Exit"

$choice = Read-Host "`nEnter your choice"

switch ($choice) {
    "1" {
        Write-Host "`n🐳 Starting all services with Docker..." -ForegroundColor Cyan
        docker-compose up -d
        Write-Host "`n✅ Services started!" -ForegroundColor Green
        Write-Host "Frontend: http://localhost:5173"
        Write-Host "Backend:  http://localhost:8080"
        Write-Host "PostgreSQL: localhost:5432"
        Write-Host "Redis: localhost:6379"
        Write-Host "`nTo view logs: docker-compose logs -f"
    }
    "2" {
        Write-Host "`n🚀 Starting Backend..." -ForegroundColor Cyan
        try {
            Set-Location backend
            go run cmd/api/main.go
        }
        finally {
            Set-Location $originalLocation
        }
    }
    "3" {
        Write-Host "`n🚀 Starting Frontend..." -ForegroundColor Cyan
        try {
            Set-Location frontend
            npm run dev
        }
        finally {
            Set-Location $originalLocation
        }
    }
    "4" {
        Write-Host "`n📦 Installing Dependencies..." -ForegroundColor Cyan
        
        Write-Host "Backend (Go)..."
        try {
            Set-Location backend
            go mod tidy
            go mod download
            Set-Location $originalLocation
            
            Write-Host "`nFrontend (npm)..."
            Set-Location frontend
            npm install
            Set-Location $originalLocation
            
            Write-Host "`n✅ Dependencies installed!" -ForegroundColor Green
        }
        catch {
            Write-Host "`n❌ Error installing dependencies: $_" -ForegroundColor Red
            Set-Location $originalLocation
        }
    }
    "5" {
        Write-Host "`n🧪 Running Tests..." -ForegroundColor Cyan
        
        Write-Host "Backend Tests..."
        try {
            Set-Location backend
            go test ./...
            Set-Location $originalLocation
            
            Write-Host "`nFrontend Tests..."
            Set-Location frontend
            npm run test
            Set-Location $originalLocation
        }
        catch {
            Write-Host "`n❌ Error running tests: $_" -ForegroundColor Red
            Set-Location $originalLocation
        }
    }
    "6" {
        Write-Host "`n🔨 Building for Production..." -ForegroundColor Cyan
        
        try {
            Write-Host "Building Backend..."
            Set-Location backend
            go build -o bin/server.exe ./cmd/api
            Set-Location $originalLocation
            
            Write-Host "`nBuilding Frontend..."
            Set-Location frontend
            npm run build
            Set-Location $originalLocation
            
            Write-Host "`n✅ Build complete!" -ForegroundColor Green
            Write-Host "Backend binary: backend/bin/server.exe"
            Write-Host "Frontend dist: frontend/dist/"
        }
        catch {
            Write-Host "`n❌ Build failed: $_" -ForegroundColor Red
            Set-Location $originalLocation
        }
    }
    "7" {
        Write-Host "`n📊 Checking Docker Status..." -ForegroundColor Cyan
        docker-compose ps
        Write-Host "`nTo view logs: docker-compose logs -f [service-name]"
        Write-Host "Services: postgres, redis, backend, frontend"
    }
    "8" {
        Write-Host "`n🧹 Cleaning project..." -ForegroundColor Yellow
        $confirm = Read-Host "This will remove all containers, volumes, and build artifacts. Continue? (y/N)"
        if ($confirm -eq "y") {
            docker-compose down -v
            Remove-Item -Recurse -Force backend/bin -ErrorAction SilentlyContinue
            Remove-Item -Recurse -Force frontend/dist -ErrorAction SilentlyContinue
            Remove-Item -Recurse -Force frontend/node_modules -ErrorAction SilentlyContinue
            Write-Host "✅ Cleaned!" -ForegroundColor Green
        }
    }
    "0" {
        Write-Host "`n👋 Goodbye!" -ForegroundColor Cyan
        exit
    }
    default {
        Write-Host "`n❌ Invalid choice" -ForegroundColor Red
    }
}

Write-Host "`n" -NoNewline
