
$ErrorActionPreference = "Stop"

Set-Location $PSScriptRoot

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "       LiteLLM - STARTUP SEQUENCE" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# Step 1: Start Docker services
Write-Host "`n[1/5] Starting PostgreSQL and LiteLLM..." -ForegroundColor Yellow

docker compose up -d

if ($LASTEXITCODE -ne 0) {
    throw "Docker Compose startup failed."
}

Write-Host "[OK] Docker services started." -ForegroundColor Green

# Step 2: Show container status
Write-Host "`n[2/5] Checking containers..." -ForegroundColor Yellow

docker compose ps

if ($LASTEXITCODE -ne 0) {
    throw "Could not read container status."
}

# Step 3: Read Master Key without displaying it
Write-Host "`n[3/5] Loading authentication..." -ForegroundColor Yellow

$masterKeyLine = Get-Content "..\.env" |
    Where-Object { $_ -match '^LITELLM_MASTER_KEY=' } |
    Select-Object -First 1

if (-not $masterKeyLine) {
    throw "LITELLM_MASTER_KEY not found in .env"
}

$masterKey = $masterKeyLine -replace '^LITELLM_MASTER_KEY=', ''

# Step 4: Wait for API health
Write-Host "`n[4/5] Waiting for LiteLLM API..." -ForegroundColor Yellow

$health = $null

for ($attempt = 1; $attempt -le 30; $attempt++) {
    try {
        $health = Invoke-RestMethod `
            -Uri "http://localhost:4000/health" `
            -Headers @{ Authorization = "Bearer $masterKey" } `
            -TimeoutSec 5

        break
    }
    catch {
        Write-Host "Waiting... ($attempt/30)" -ForegroundColor DarkGray
        Start-Sleep -Seconds 2
    }
}

if (-not $health) {
    docker compose logs --tail 40 litellm
    throw "LiteLLM API did not become healthy."
}

Write-Host "[OK] LiteLLM API is healthy." -ForegroundColor Green

# Step 5: Check registered models
Write-Host "`n[5/5] Checking registered models..." -ForegroundColor Yellow

try {
    $models = Invoke-RestMethod `
        -Uri "http://localhost:4000/v1/models" `
        -Headers @{ Authorization = "Bearer $masterKey" } `
        -TimeoutSec 15

    $modelCount = @($models.data).Count

    Write-Host "[OK] API authentication successful." -ForegroundColor Green
    Write-Host "[OK] Registered models: $modelCount" -ForegroundColor Green
}
catch {
    throw "Could not retrieve registered models."
}
finally {
    Remove-Variable masterKey -ErrorAction SilentlyContinue
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "       LITELLM IS READY!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host "Dashboard/API: http://localhost:4000" -ForegroundColor Cyan
Write-Host "Models API:    http://localhost:4000/v1/models" -ForegroundColor Cyan
Write-Host ""
