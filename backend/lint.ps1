#!/usr/bin/env pwsh
# Lint script for Windows PowerShell
# Runs golangci-lint with optional auto-fix

param(
    [switch]$Fix,
    [switch]$Verbose,
    [string]$Config = ".golangci.yml"
)

Write-Host "🔍 Running golangci-lint..." -ForegroundColor Cyan

# Check if golangci-lint is installed
$lintCmd = Get-Command golangci-lint -ErrorAction SilentlyContinue
if (-not $lintCmd) {
    Write-Host "❌ golangci-lint is not installed!" -ForegroundColor Red
    Write-Host ""
    Write-Host "To install on Windows:" -ForegroundColor Yellow
    Write-Host "  Using Go:" -ForegroundColor Gray
    Write-Host "    go install github.com/golangci/golangci-lint/cmd/golangci-lint@latest" -ForegroundColor Gray
    Write-Host "  Or using Scoop:" -ForegroundColor Gray
    Write-Host "    scoop install golangci-lint" -ForegroundColor Gray
    Write-Host "  Or using Chocolatey:" -ForegroundColor Gray
    Write-Host "    choco install golangci-lint" -ForegroundColor Gray
    exit 1
}

# Build command arguments
$args = @("run")

if ($Fix) {
    $args += "--fix"
    Write-Host "🔧 Auto-fix mode enabled" -ForegroundColor Yellow
}

if ($Verbose) {
    $args += "--verbose"
}

$args += "--config", $Config

# Run linter
Write-Host "Running: golangci-lint $($args -join ' ')" -ForegroundColor Gray
Write-Host ""

& golangci-lint $args

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ Linting passed!" -ForegroundColor Green
    exit 0
}
else {
    Write-Host ""
    Write-Host "❌ Linting failed with $LASTEXITCODE issue(s)" -ForegroundColor Red
    exit $LASTEXITCODE
}
