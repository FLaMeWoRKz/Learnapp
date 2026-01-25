# Backend: npm install + audit
Set-Location $PSScriptRoot
Write-Host "Installing dependencies..." -ForegroundColor Cyan
npm install
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
Write-Host "`nRunning npm audit..." -ForegroundColor Cyan
npm audit
Write-Host "`nDone." -ForegroundColor Green
