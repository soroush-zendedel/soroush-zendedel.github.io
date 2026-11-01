$ErrorActionPreference = "Stop"

Set-Location $PSScriptRoot

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "       LiteLLM - SHUTDOWN" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

Write-Host "`nStopping LiteLLM and PostgreSQL..." -ForegroundColor Yellow

docker compose stop

if ($LASTEXITCODE -ne 0) {
    Write-Host "`n[ERROR] Failed to stop services!" -ForegroundColor Red
    exit 1
}

Write-Host "`n[OK] All services stopped." -ForegroundColor Green

docker compose ps

Write-Host "`nLiteLLM shutdown completed." -ForegroundColor Green