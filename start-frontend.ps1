# Nur Frontend starten (Backend muss bereits laufen)
$ErrorActionPreference = "Stop"
$root = $PSScriptRoot
$frontendDir = Join-Path $root "frontend"

if (-not (Test-Path (Join-Path $frontendDir "node_modules"))) {
  Write-Host "Frontend: npm install..." -ForegroundColor Yellow
  Push-Location $frontendDir; npm install; if ($LASTEXITCODE -ne 0) { Pop-Location; exit 1 }; Pop-Location
}

Write-Host "Starte Frontend (Port 5173)..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$frontendDir'; npm run dev"
Write-Host "Frontend: http://localhost:5173" -ForegroundColor Cyan
