# Push zu GitHub Repository
# Fuehre dieses Skript in PowerShell aus

Write-Host "Verbinde lokales Repository mit GitHub..." -ForegroundColor Cyan
Write-Host ""

# Zum Projektordner wechseln
Set-Location "c:\Users\Robin\Desktop\Projekt2"

# Pruefe ob bereits ein Remote existiert
$remoteExists = git remote get-url origin 2>$null
if ($LASTEXITCODE -eq 0) {
    Write-Host "Remote 'origin' existiert bereits. Entferne alten Remote..." -ForegroundColor Yellow
    git remote remove origin
}

# GitHub Repository verbinden
Write-Host "Verbinde mit GitHub Repository..." -ForegroundColor Yellow
git remote add origin https://github.com/FLaMeWoRKz/Learnapp.git
Write-Host "Repository verbunden" -ForegroundColor Green
Write-Host ""

# Remote URL anzeigen
Write-Host "Remote URL:" -ForegroundColor Cyan
git remote -v
Write-Host ""

# Code zu GitHub pushen
Write-Host "Pushe Code zu GitHub..." -ForegroundColor Yellow
git push -u origin main
Write-Host ""

if ($LASTEXITCODE -eq 0) {
    Write-Host "Erfolg! Code wurde zu GitHub gepusht!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Naechste Schritte:" -ForegroundColor Cyan
    Write-Host "1. Gehe zu https://github.com/FLaMeWoRKz/Learnapp" -ForegroundColor White
    Write-Host "2. Pruefe ob alle Dateien hochgeladen wurden" -ForegroundColor White
    Write-Host "3. Dann koennen wir mit Vercel Deployment fortfahren" -ForegroundColor White
} else {
    Write-Host "Fehler beim Pushen. Bitte pruefe die Fehlermeldung oben." -ForegroundColor Red
}

Write-Host ""
