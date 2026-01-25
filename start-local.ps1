# VocabMaster – Backend + Frontend lokal starten (Local Storage)
# Führe im Projektroot aus: .\start-local.ps1

$ErrorActionPreference = "Stop"
$root = $PSScriptRoot

Write-Host "VocabMaster – Lokaler Testmodus (Storage: local)" -ForegroundColor Cyan
Write-Host ""

$backendDir = Join-Path $root "backend"
$frontendDir = Join-Path $root "frontend"

if (-not (Test-Path (Join-Path $backendDir "node_modules"))) {
  Write-Host "Backend: npm install..." -ForegroundColor Yellow
  Push-Location $backendDir; npm install; if ($LASTEXITCODE -ne 0) { Pop-Location; exit 1 }; Pop-Location
}

if (-not (Test-Path (Join-Path $frontendDir "node_modules"))) {
  Write-Host "Frontend: npm install..." -ForegroundColor Yellow
  Push-Location $frontendDir; npm install; if ($LASTEXITCODE -ne 0) { Pop-Location; exit 1 }; Pop-Location
}

Write-Host "Starte Backend (Port 3000)..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$backendDir'; `$env:STORAGE_MODE='local'; npm run start" -PassThru | Out-Null

Start-Sleep -Seconds 2

Write-Host "Starte Frontend (Port 5173)..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$frontendDir'; npm run dev" -PassThru | Out-Null

Write-Host ""
Write-Host "Backend:  http://localhost:3000" -ForegroundColor Cyan
Write-Host "Frontend: http://localhost:5173" -ForegroundColor Cyan
Write-Host "Daten:    backend/data/*.json (Local Storage)" -ForegroundColor Gray
Write-Host ""
Write-Host "Zum Beenden: Beide PowerShell-Fenster schließen." -ForegroundColor Gray
