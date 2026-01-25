# PowerShell-Skript zum Pushen aller Änderungen zu GitHub
# Führe dieses Skript in PowerShell aus: .\push-all-changes.ps1

Write-Host "🚀 Push zu GitHub wird vorbereitet..." -ForegroundColor Cyan
Write-Host ""

# Zum Projektverzeichnis wechseln
$projectPath = "c:\Users\Robin\Desktop\Projekt2"
Set-Location $projectPath

# Prüfe ob Git-Repository existiert
if (-not (Test-Path ".git")) {
    Write-Host "❌ Kein Git-Repository gefunden. Initialisiere..." -ForegroundColor Red
    git init
    git branch -M main
}

# Prüfe ob Remote existiert
$remoteExists = git remote get-url origin 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "📡 Remote 'origin' nicht gefunden. Füge hinzu..." -ForegroundColor Yellow
    git remote add origin https://github.com/FLaMeWoRKz/Learnapp.git
} else {
    Write-Host "✅ Remote 'origin' existiert bereits" -ForegroundColor Green
}

# Git-Status prüfen
Write-Host "`n📊 Git-Status prüfen..." -ForegroundColor Yellow
git status
Write-Host ""

# Alle Änderungen hinzufügen
Write-Host "➕ Alle Änderungen hinzufügen..." -ForegroundColor Yellow
git add .
Write-Host "✅ Dateien hinzugefügt" -ForegroundColor Green

# Commit erstellen
Write-Host "`n💾 Commit erstellen..." -ForegroundColor Yellow
$commitMessage = "Gastzugang hinzugefügt, Deployment-Fixes und alle Features implementiert"
git commit -m $commitMessage

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Commit erfolgreich" -ForegroundColor Green
} else {
    Write-Host "⚠️ Keine Änderungen zum Committen oder Commit fehlgeschlagen" -ForegroundColor Yellow
}

# Zu GitHub pushen
Write-Host "`n📤 Zu GitHub pushen..." -ForegroundColor Yellow
git push -u origin main

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n✅ Push erfolgreich abgeschlossen!" -ForegroundColor Green
    Write-Host "`n🔗 Repository: https://github.com/FLaMeWoRKz/Learnapp" -ForegroundColor Cyan
    Write-Host "`n📝 Nächste Schritte:" -ForegroundColor Yellow
    Write-Host "1. Prüfe das Repository auf GitHub" -ForegroundColor White
    Write-Host "2. Vercel sollte automatisch neu deployen" -ForegroundColor White
    Write-Host "3. Falls nicht, gehe zu Vercel → Deployments → Redeploy" -ForegroundColor White
} else {
    Write-Host "`n❌ Push fehlgeschlagen. Bitte prüfe die Fehlermeldung oben." -ForegroundColor Red
    Write-Host "`n💡 Mögliche Lösungen:" -ForegroundColor Yellow
    Write-Host "- Prüfe ob du Zugriff auf das Repository hast" -ForegroundColor White
    Write-Host "- Prüfe ob der Branch 'main' existiert" -ForegroundColor White
    Write-Host "- Versuche: git push -u origin main --force (Vorsicht: überschreibt Remote!)" -ForegroundColor White
}

Write-Host ""
