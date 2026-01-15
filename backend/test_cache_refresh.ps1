# Test script for cache refresh parameter
$itemId = 4151  # Abyssal whip
$period = "7d"
$baseUrl = "http://localhost:8080/api/v1/prices/history/$itemId"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Cache Refresh Parameter Test" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Test 1: First request (should fetch from DB and cache it)
Write-Host "Test 1: First request (should fetch from DB and cache it)" -ForegroundColor Yellow
Write-Host "URL: $baseUrl" -ForegroundColor Gray
$response1 = Invoke-RestMethod -Uri "$baseUrl`?period=$period" -Method Get
Write-Host "Data points returned: $($response1.data.Count)" -ForegroundColor Green
Write-Host ""

# Test 2: Second request without refresh (should hit cache)
Write-Host "Test 2: Second request without refresh (should hit cache)" -ForegroundColor Yellow
Write-Host "URL: $baseUrl" -ForegroundColor Gray
$response2 = Invoke-RestMethod -Uri "$baseUrl`?period=$period" -Method Get
Write-Host "Data points returned: $($response2.data.Count)" -ForegroundColor Green
Write-Host ""

# Check backend logs for cache hit
Write-Host "Checking backend logs for cache activity..." -ForegroundColor Cyan
docker-compose logs backend --tail 10 | Select-String -Pattern "cache|Returning price history"
Write-Host ""

# Test 3: Request with refresh=true (should bypass cache)
Write-Host "Test 3: Request with refresh=true (should bypass cache)" -ForegroundColor Yellow
Write-Host "URL: $baseUrl`?refresh=true" -ForegroundColor Gray
$response3 = Invoke-RestMethod -Uri "$baseUrl`?period=$period&refresh=true" -Method Get
Write-Host "Data points returned: $($response3.data.Count)" -ForegroundColor Green
Write-Host ""

# Check backend logs for cache bypass
Write-Host "Checking backend logs for cache bypass..." -ForegroundColor Cyan
docker-compose logs backend --tail 10 | Select-String -Pattern "Bypassing cache|refresh"
Write-Host ""

# Test 4: Request after refresh (should get updated cache)
Write-Host "Test 4: Request after refresh (should get updated cache)" -ForegroundColor Yellow
Write-Host "URL: $baseUrl" -ForegroundColor Gray
$response4 = Invoke-RestMethod -Uri "$baseUrl`?period=$period" -Method Get
Write-Host "Data points returned: $($response4.data.Count)" -ForegroundColor Green
Write-Host ""

# Verify cache key exists in Redis
Write-Host "Checking Redis cache key..." -ForegroundColor Cyan
$cacheKey = "price:history:$($itemId):$period"
Write-Host "Cache key: $cacheKey" -ForegroundColor Gray
docker exec osrs-ge-redis redis-cli EXISTS "$cacheKey"
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Test Summary:" -ForegroundColor Cyan
Write-Host "  - All requests returned data: $($response1.data.Count -gt 0 -and $response2.data.Count -gt 0 -and $response3.data.Count -gt 0)" -ForegroundColor $(if ($response1.data.Count -gt 0) { "Green" } else { "Red" })
Write-Host "  - Consistent data points: $($response1.data.Count -eq $response2.data.Count -and $response2.data.Count -eq $response3.data.Count)" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
