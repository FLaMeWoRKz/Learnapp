# PowerShell-Skript zum Pushen der GitHub-Fallback-Änderungen
# Führe dieses Skript in PowerShell aus: .\push-github-fix.ps1

Write-Host "🚀 Committe und pushe GitHub-Fallback-Änderungen..." -ForegroundColor Cyan
Write-Host ""

# Zum Projektverzeichnis wechseln
$projectPath = "c:\Users\Robin\Desktop\Projekt2"
Set-Location $projectPath

# Prüfe Git-Status
Write-Host "📊 Git-Status prüfen..." -ForegroundColor Yellow
git status
Write-Host ""

# Alle Änderungen hinzufügen
Write-Host "➕ Alle Änderungen hinzufügen..." -ForegroundColor Yellow
git add .
Write-Host "✅ Dateien hinzugefügt" -ForegroundColor Green

# Zeige was committed wird
Write-Host "`n📋 Dateien die committed werden:" -ForegroundColor Yellow
git status --short
Write-Host ""

# Commit erstellen
Write-Host "💾 Commit erstellen..." -ForegroundColor Yellow
$commitMessage = "GitHub-Fallback für Vokabeln-Import hinzugefügt, erweiterte Pfadsuche und Debug-Logging"
git commit -m $commitMessage

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Commit erfolgreich" -ForegroundColor Green
} else {
    Write-Host "⚠️ Keine Änderungen zum Committen" -ForegroundColor Yellow
}

# Zu GitHub pushen
Write-Host "`n📤 Zu GitHub pushen..." -ForegroundColor Yellow
git push origin main

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n✅ Push erfolgreich abgeschlossen!" -ForegroundColor Green
    Write-Host "`n🔗 Repository: https://github.com/FLaMeWoRKz/Learnapp" -ForegroundColor Cyan
    Write-Host "`n📝 Nächste Schritte:" -ForegroundColor Yellow
    Write-Host "1. Railway sollte automatisch neu deployen" -ForegroundColor White
    Write-Host "2. Prüfe Railway Logs nach dem automatischen Import" -ForegroundColor White
    Write-Host "3. Suche nach:" -ForegroundColor White
    Write-Host "   - '🌐 Versuche CSV-Daten von GitHub zu laden...'" -ForegroundColor Gray
    Write-Host "   - '✅ GitHub-Import abgeschlossen: X Vokabeln importiert'" -ForegroundColor Gray
    Write-Host "   - Oder: '📂 CSV-Datei gefunden: [Pfad]' (falls lokal gefunden)" -ForegroundColor Gray
} else {
    Write-Host "`n❌ Push fehlgeschlagen. Bitte prüfe die Fehlermeldung oben." -ForegroundColor Red
}

Write-Host ""
