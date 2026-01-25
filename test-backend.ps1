# Backend-Test Script
Write-Host "Teste Backend-Verbindung..." -ForegroundColor Cyan
Write-Host ""

# Test 1: Health Check
Write-Host "1. Health Check:" -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000/api/health" -Method GET
    Write-Host "   ✅ Backend läuft!" -ForegroundColor Green
    Write-Host "   Status: $($response.StatusCode)" -ForegroundColor Gray
    Write-Host "   Response: $($response.Content)" -ForegroundColor Gray
} catch {
    Write-Host "   ❌ Backend läuft NICHT oder ist nicht erreichbar!" -ForegroundColor Red
    Write-Host "   Fehler: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# Test 2: Game Route (ohne Auth - sollte 401 geben)
Write-Host "2. Game Route Test (ohne Token - sollte 401 geben):" -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000/api/game/start" -Method POST -ContentType "application/json" -Body '{"mode":"level","level":1}' -ErrorAction Stop
    Write-Host "   ⚠️  Unerwartet: Status $($response.StatusCode)" -ForegroundColor Yellow
} catch {
    if ($_.Exception.Response.StatusCode -eq 401) {
        Write-Host "   ✅ Route existiert! (401 = Authentifizierung erforderlich)" -ForegroundColor Green
    } elseif ($_.Exception.Response.StatusCode -eq 404) {
        Write-Host "   ❌ Route nicht gefunden (404)" -ForegroundColor Red
    } else {
        Write-Host "   ⚠️  Status: $($_.Exception.Response.StatusCode)" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "Falls Backend nicht läuft:" -ForegroundColor Cyan
Write-Host "1. Öffne PowerShell im backend/ Ordner" -ForegroundColor White
Write-Host "2. Führe aus: `$env:STORAGE_MODE='local'; npm run dev" -ForegroundColor White
Write-Host ""
