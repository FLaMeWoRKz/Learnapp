# Git Setup Script fuer VocabMaster Projekt
# Fuehre dieses Skript in PowerShell aus

Write-Host "Git Setup fuer VocabMaster Projekt" -ForegroundColor Cyan
Write-Host ""

# Zum Projektordner wechseln
Set-Location "c:\Users\Robin\Desktop\Projekt2"

# Git-Identitaet konfigurieren
Write-Host "Konfiguriere Git-Identitaet..." -ForegroundColor Yellow
git config --global user.name "FLaMeWoRKz"
git config --global user.email "robin.reich55@googlemail.com"
Write-Host "Git-Identitaet konfiguriert" -ForegroundColor Green
Write-Host ""

# Pruefe ob bereits ein Repository existiert
if (Test-Path ".git") {
    Write-Host "Git Repository bereits initialisiert" -ForegroundColor Green
} else {
    Write-Host "Initialisiere Git Repository..." -ForegroundColor Yellow
    git init
    Write-Host "Git Repository initialisiert" -ForegroundColor Green
}

Write-Host ""

# Dateien hinzufuegen
Write-Host "Fuege Dateien hinzu..." -ForegroundColor Yellow
git add .
Write-Host "Dateien hinzugefuegt" -ForegroundColor Green
Write-Host ""

# Commit erstellen
Write-Host "Erstelle Commit..." -ForegroundColor Yellow
git commit -m "Initial commit: VocabMaster Projekt"
Write-Host "Commit erstellt" -ForegroundColor Green
Write-Host ""

# Branch auf main setzen
Write-Host "Setze Branch auf main..." -ForegroundColor Yellow
git branch -M main
Write-Host "Branch auf main gesetzt" -ForegroundColor Green
Write-Host ""

# Status anzeigen
Write-Host "Git Status:" -ForegroundColor Cyan
git status
Write-Host ""

Write-Host "Git Setup abgeschlossen!" -ForegroundColor Green
Write-Host ""
Write-Host "Naechste Schritte:" -ForegroundColor Cyan
Write-Host "1. Erstelle ein Repository auf GitHub.com" -ForegroundColor White
Write-Host "2. Fuehre dann aus:" -ForegroundColor White
Write-Host "   git remote add origin https://github.com/FLaMeWoRKz/REPO-NAME.git" -ForegroundColor Gray
Write-Host "   git push -u origin main" -ForegroundColor Gray
Write-Host ""
