# Test runner script for Windows PowerShell

Write-Host "`nRunning OSRS GE Tracker Tests`n" -ForegroundColor Cyan

# Check if Docker is running
try {
    docker info *> $null
    if ($LASTEXITCODE -ne 0) { throw }
} catch {
    Write-Host "ERROR: Docker is not running. Please start Docker and try again." -ForegroundColor Red
    exit 1
}

# Start PostgreSQL if not already running
Write-Host "Starting PostgreSQL..." -ForegroundColor Yellow
docker-compose up -d postgres

# Wait for PostgreSQL to be ready
Write-Host "Waiting for PostgreSQL to be ready..." -ForegroundColor Yellow
$timeout = 60
$counter = 0
$ready = $false

while (-not $ready -and $counter -lt $timeout) {
    try {
        $health = docker inspect osrs-ge-postgres --format='{{.State.Health.Status}}' 2>&1
        if ($health -eq 'healthy') {
            $ready = $true
        } else {
            Start-Sleep -Seconds 1
            $counter++
            if ($counter % 5 -eq 0) {
                Write-Host "  Still waiting... ($counter seconds)" -ForegroundColor Gray
            }
        }
    } catch {
        Start-Sleep -Seconds 1
        $counter++
    }
}

if (-not $ready) {
    Write-Host "ERROR: PostgreSQL failed to start within $timeout seconds" -ForegroundColor Red
    exit 1
}

Write-Host "PostgreSQL is ready`n" -ForegroundColor Green

# Set database connection for repository tests
$env:POSTGRES_HOST="localhost"
$env:POSTGRES_PORT="5432"
$env:POSTGRES_USER="osrs_tracker"
$env:POSTGRES_PASSWORD="changeme"
$env:POSTGRES_DB="osrs_ge_tracker"

# Run all tests
Write-Host "Running All Unit Tests..." -ForegroundColor Yellow
go test ./tests/unit/... -v -count=1

if ($LASTEXITCODE -ne 0) {
    Write-Host "`nERROR: Tests failed" -ForegroundColor Red
    exit 1
}

Write-Host "`nAll tests passed!" -ForegroundColor Green
