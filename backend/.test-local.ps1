# .test-local.ps1
# PowerShell script to run tests locally on Windows

Write-Host "🧪 Running OSRS GE Tracker Tests" -ForegroundColor Cyan
Write-Host ""

# Test 1: Model tests (no CGO required)
Write-Host "📦 Running Model Tests (no CGO)..." -ForegroundColor Yellow
go test ./tests/unit/models_test.go -v
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Model tests passed" -ForegroundColor Green
} else {
    Write-Host "❌ Model tests failed" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "📊 Test Summary:" -ForegroundColor Cyan
Write-Host "  ✅ Model tests: PASSED" -ForegroundColor Green
Write-Host "  ℹ️  Repository tests: Use Docker or install MinGW" -ForegroundColor Yellow
Write-Host ""
Write-Host "To run ALL tests (including repository):" -ForegroundColor Cyan
Write-Host "  docker-compose run --rm backend go test ./tests/unit/... -v" -ForegroundColor White
Write-Host ""
