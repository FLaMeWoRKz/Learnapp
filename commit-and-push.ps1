# Commit und Push zu GitHub
# Fuehre dieses Skript in PowerShell aus

Write-Host "Stage und committe Aenderungen..." -ForegroundColor Cyan
Write-Host ""

# Zum Projektordner wechseln
Set-Location "c:\Users\Robin\Desktop\Projekt2"

# Alle Aenderungen stagen
Write-Host "Stage alle Aenderungen..." -ForegroundColor Yellow
git add -A

# Status anzeigen
Write-Host ""
Write-Host "Git Status:" -ForegroundColor Cyan
git status
Write-Host ""

# Commit erstellen
Write-Host "Erstelle Commit..." -ForegroundColor Yellow
git commit -m "Fix Vercel deployment: Update tsconfig.json and vercel.json configuration"
Write-Host ""

# Pruefe ob bereits ein Remote existiert
$remoteExists = git remote get-url origin 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "Remote 'origin' existiert nicht. Verbinde mit GitHub Repository..." -ForegroundColor Yellow
    git remote add origin https://github.com/FLaMeWoRKz/Learnapp.git
    Write-Host "Repository verbunden" -ForegroundColor Green
    Write-Host ""
}

# Code zu GitHub pushen
Write-Host "Pushe Code zu GitHub..." -ForegroundColor Yellow
git push -u origin main
Write-Host ""

if ($LASTEXITCODE -eq 0) {
    Write-Host "Erfolg! Code wurde zu GitHub gepusht!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Vercel sollte automatisch neu deployen." -ForegroundColor Cyan
} else {
    Write-Host "Fehler beim Pushen. Bitte pruefe die Fehlermeldung oben." -ForegroundColor Red
}

Write-Host ""
