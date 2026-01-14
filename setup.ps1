# OSRS Grand Exchange Tracker - Setup Script
# This script helps you set up the development environment

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "OSRS GE Tracker - Setup Script" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check prerequisites
Write-Host "Checking prerequisites..." -ForegroundColor Yellow
Write-Host ""

# Check Go
$goVersion = $null
try {
    $goVersion = go version 2>$null
    Write-Host "✓ Go is installed: $goVersion" -ForegroundColor Green
} catch {
    Write-Host "✗ Go is NOT installed" -ForegroundColor Red
    Write-Host "  Please install Go 1.22+ from: https://golang.org/doc/install" -ForegroundColor Yellow
}

# Check Node.js
$nodeVersion = $null
try {
    $nodeVersion = node --version 2>$null
    Write-Host "✓ Node.js is installed: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "✗ Node.js is NOT installed" -ForegroundColor Red
    Write-Host "  Please install Node.js 20+ from: https://nodejs.org/" -ForegroundColor Yellow
}

# Check Docker
$dockerVersion = $null
try {
    $dockerVersion = docker --version 2>$null
    Write-Host "✓ Docker is installed: $dockerVersion" -ForegroundColor Green
} catch {
    Write-Host "✗ Docker is NOT installed" -ForegroundColor Red
    Write-Host "  Please install Docker Desktop from: https://www.docker.com/products/docker-desktop/" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan

if ($goVersion -and $nodeVersion -and $dockerVersion) {
    Write-Host ""
    Write-Host "All prerequisites are installed!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Cyan
    Write-Host "1. Start Docker services:" -ForegroundColor White
    Write-Host "   docker-compose up -d postgres redis" -ForegroundColor Gray
    Write-Host ""
    Write-Host "2. Setup backend:" -ForegroundColor White
    Write-Host "   cd backend" -ForegroundColor Gray
    Write-Host "   cp .env.example .env" -ForegroundColor Gray
    Write-Host "   go mod download" -ForegroundColor Gray
    Write-Host "   go run cmd/api/main.go" -ForegroundColor Gray
    Write-Host ""
    Write-Host "3. Setup frontend (in a new terminal):" -ForegroundColor White
    Write-Host "   cd frontend" -ForegroundColor Gray
    Write-Host "   cp .env.example .env" -ForegroundColor Gray
    Write-Host "   npm install" -ForegroundColor Gray
    Write-Host "   npm run dev" -ForegroundColor Gray
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "Please install missing prerequisites and run this script again." -ForegroundColor Yellow
    Write-Host ""
}
