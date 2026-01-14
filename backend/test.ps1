# Test runner script for Windows PowerShell

param(
    [switch]$Coverage
)

Write-Host "`nRunning OSRS GE Tracker Backend Tests`n" -ForegroundColor Cyan

# Check if Docker is running (required for integration tests)
try {
    docker info *> $null
    if ($LASTEXITCODE -ne 0) { throw }
} catch {
    Write-Host "ERROR: Docker is not running. Please start Docker and try again." -ForegroundColor Red
    exit 1
}

if ($Coverage) {
    $coverageDir = Join-Path $PSScriptRoot "coverage"
    New-Item -ItemType Directory -Force -Path $coverageDir | Out-Null

    Write-Host "Running Backend Tests with coverage..." -ForegroundColor Yellow
    
    $coverageOut = Join-Path $coverageDir "coverage.out"
    $coverageHtml = Join-Path $coverageDir "coverage.html"
    
    go test ./... -v -count=1 -coverprofile="$coverageOut" -covermode=atomic -coverpkg=./...
    if ($LASTEXITCODE -ne 0) {
        Write-Host "`nERROR: Tests failed" -ForegroundColor Red
        exit 1
    }

    Write-Host "Generating HTML coverage report..." -ForegroundColor Yellow
    go tool cover "-html=$coverageOut" "-o=$coverageHtml"
    if ($LASTEXITCODE -ne 0) {
        Write-Host "`nERROR: Failed to generate HTML coverage report" -ForegroundColor Red
        exit 1
    }

    Write-Host "`nCoverage reports:" -ForegroundColor Green
    Write-Host "- $coverageOut" -ForegroundColor Green
    Write-Host "- $coverageHtml" -ForegroundColor Green
    
    # Display coverage summary
    Write-Host "`nCoverage Summary:" -ForegroundColor Cyan
    $coverageResult = go tool cover -func $coverageOut
    $coverageResult | Select-String "^total:"
    
    exit 0
}

Write-Host "Running Backend Tests..." -ForegroundColor Yellow

go test ./... -v -count=1

if ($LASTEXITCODE -ne 0) {
    Write-Host "`nERROR: Tests failed" -ForegroundColor Red
    exit 1
}

Write-Host "`nAll tests passed!" -ForegroundColor Green
