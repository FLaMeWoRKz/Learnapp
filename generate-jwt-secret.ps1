# JWT Secret Generator für Railway
# Führt diesen Befehl in PowerShell aus

Write-Host "Generiere JWT Secret..." -ForegroundColor Cyan
$secret = [Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))
Write-Host ""
Write-Host "Dein JWT Secret:" -ForegroundColor Green
Write-Host $secret -ForegroundColor Yellow
Write-Host ""
Write-Host "Kopiere diesen Wert und füge ihn in Railway als JWT_SECRET ein!" -ForegroundColor Cyan
