# PowerShell-Skript zum Committen und Pushen aller Änderungen
# Führe dieses Skript in PowerShell aus: .\commit-all-changes.ps1

Write-Host "🚀 Committe und pushe alle Änderungen zu GitHub..." -ForegroundColor Cyan
Write-Host ""

# Zum Projektverzeichnis wechseln
$projectPath = "c:\Users\Robin\Desktop\Projekt2"
Set-Location $projectPath

# Prüfe ob CSV-Datei existiert
Write-Host "🔍 Prüfe ob backend/vokabeln.csv existiert..." -ForegroundColor Yellow
if (Test-Path "backend\vokabeln.csv") {
    Write-Host "✅ backend/vokabeln.csv existiert lokal" -ForegroundColor Green
    
    # Prüfe ob CSV-Datei im Repository ist (mit PowerShell Select-String)
    Write-Host "🔍 Prüfe ob vokabeln.csv im Repository ist..." -ForegroundColor Yellow
    $gitFiles = git ls-files 2>$null
    $csvInRepo = $gitFiles | Select-String "vokabeln.csv"
    
    if ($csvInRepo) {
        Write-Host "✅ vokabeln.csv ist bereits im Repository" -ForegroundColor Green
    } else {
        Write-Host "⚠️ vokabeln.csv ist NICHT im Repository. Füge hinzu..." -ForegroundColor Yellow
        git add backend/vokabeln.csv
        Write-Host "✅ backend/vokabeln.csv hinzugefügt" -ForegroundColor Green
    }
} else {
    Write-Host "❌ backend/vokabeln.csv existiert nicht lokal!" -ForegroundColor Red
    Write-Host "⚠️ Bitte stelle sicher, dass die Datei existiert!" -ForegroundColor Yellow
}
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
$commitMessage = "Automatischer Vokabeln-Import verbessert, Deployment-Fixes und alle Features"
git commit -m $commitMessage

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Commit erfolgreich" -ForegroundColor Green
} else {
    Write-Host "⚠️ Keine Änderungen zum Committen oder Commit fehlgeschlagen" -ForegroundColor Yellow
    Write-Host "   (Das ist OK, wenn bereits alles committed ist)" -ForegroundColor Gray
}

# Zu GitHub pushen
Write-Host "`n📤 Zu GitHub pushen..." -ForegroundColor Yellow
git push origin main

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n✅ Push erfolgreich abgeschlossen!" -ForegroundColor Green
    Write-Host "`n🔗 Repository: https://github.com/FLaMeWoRKz/Learnapp" -ForegroundColor Cyan
    Write-Host "`n📝 Nächste Schritte:" -ForegroundColor Yellow
    Write-Host "1. Prüfe das Repository auf GitHub" -ForegroundColor White
    Write-Host "2. Railway sollte automatisch neu deployen" -ForegroundColor White
    Write-Host "3. Prüfe Railway Logs nach dem automatischen Import" -ForegroundColor White
    Write-Host "   Suche nach: '📚 Keine Vokabeln gefunden. Starte automatischen Import...'" -ForegroundColor White
    Write-Host "   Oder: '✅ Import abgeschlossen: X Vokabeln importiert'" -ForegroundColor White
} else {
    Write-Host "`n❌ Push fehlgeschlagen. Bitte prüfe die Fehlermeldung oben." -ForegroundColor Red
    Write-Host "`n💡 Mögliche Lösungen:" -ForegroundColor Yellow
    Write-Host "- Prüfe ob du Zugriff auf das Repository hast" -ForegroundColor White
    Write-Host "- Prüfe ob der Branch 'main' existiert" -ForegroundColor White
}

Write-Host ""
