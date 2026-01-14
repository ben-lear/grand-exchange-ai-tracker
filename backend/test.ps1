# Test runner script for Windows PowerShell

param(
    [switch]$Fast,
    [switch]$Coverage
)

Write-Host "`nRunning OSRS GE Tracker Backend Tests`n" -ForegroundColor Cyan

$tags = @()
if (-not $Fast) {
    $tags += "-tags=slow"
}

# Docker is only required for the slow-tagged suite.
if (-not $Fast) {
    try {
        docker info *> $null
        if ($LASTEXITCODE -ne 0) { throw }
    } catch {
        Write-Host "ERROR: Docker is not running. Please start Docker and try again." -ForegroundColor Red
        exit 1
    }
}

if ($Coverage) {
    $coverageDir = Join-Path $PSScriptRoot "coverage"
    New-Item -ItemType Directory -Force -Path $coverageDir | Out-Null

    function Invoke-CoverageRun {
        param(
            [string]$Label,
            [string[]]$TestTags,
            [string]$OutProfile,
            [string]$OutHtml
        )

        Write-Host "Running Backend Tests ($Label) with coverage..." -ForegroundColor Yellow
        
        $testArgs = @("./...", "-v", "-count=1", "-coverprofile=$OutProfile", "-covermode=atomic", "-coverpkg=./...")
        if ($TestTags) {
            $testArgs += $TestTags
        }
        
        go test @testArgs
        if ($LASTEXITCODE -ne 0) {
            Write-Host "`nERROR: $Label tests failed" -ForegroundColor Red
            exit 1
        }

        Write-Host "Generating HTML coverage report..." -ForegroundColor Yellow
        go tool cover "-html=$OutProfile" "-o=$OutHtml"
        if ($LASTEXITCODE -ne 0) {
            Write-Host "`nERROR: Failed to generate $Label HTML coverage report" -ForegroundColor Red
            exit 1
        }
    }

    if ($Fast) {
        $fastOut = Join-Path $coverageDir "fast.out"
        $fastHtml = Join-Path $coverageDir "fast.html"

        Invoke-CoverageRun -Label "fast" `
            -TestTags @() `
            -OutProfile $fastOut `
            -OutHtml $fastHtml

        Write-Host "`nCoverage reports:" -ForegroundColor Green
        Write-Host "- $fastOut" -ForegroundColor Green
        Write-Host "- $fastHtml" -ForegroundColor Green
        exit 0
    }

    # Standard validation: run BOTH fast and full suites.
    # Coverage is generated for both test types.
    $fastOut = Join-Path $coverageDir "fast.out"
    $fastHtml = Join-Path $coverageDir "fast.html"
    $fullOut = Join-Path $coverageDir "full.out"
    $fullHtml = Join-Path $coverageDir "full.html"

    Invoke-CoverageRun -Label "fast" `
        -TestTags @() `
        -OutProfile $fastOut `
        -OutHtml $fastHtml

    # Full suite (includes slow-tagged tests) requires Docker.
    try {
        docker info *> $null
        if ($LASTEXITCODE -ne 0) { throw }
    } catch {
        Write-Host "ERROR: Docker is not running. Please start Docker and try again." -ForegroundColor Red
        exit 1
    }

    Invoke-CoverageRun -Label "full suite" `
        -TestTags @("-tags=slow") `
        -OutProfile $fullOut `
        -OutHtml $fullHtml

    Write-Host "`nCoverage reports:" -ForegroundColor Green
    Write-Host "- $fastOut" -ForegroundColor Green
    Write-Host "- $fastHtml" -ForegroundColor Green
    Write-Host "- $fullOut" -ForegroundColor Green
    Write-Host "- $fullHtml" -ForegroundColor Green
    exit 0
}

if ($Fast) {
    Write-Host "Running Backend Tests (fast suite)..." -ForegroundColor Yellow
} else {
    Write-Host "Running Backend Tests (full suite)..." -ForegroundColor Yellow
}

go test ./... -v -count=1 @tags

if ($LASTEXITCODE -ne 0) {
    Write-Host "`nERROR: Tests failed" -ForegroundColor Red
    exit 1
}

Write-Host "`nAll tests passed!" -ForegroundColor Green
