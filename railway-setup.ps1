# Railway CLI Setup Script
# Run this script in PowerShell to set up Railway CLI

Write-Host "=== Railway CLI Setup ===" -ForegroundColor Green
Write-Host ""

# Check if Railway CLI is installed
Write-Host "Checking Railway CLI installation..." -ForegroundColor Yellow
$railwayInstalled = Get-Command railway -ErrorAction SilentlyContinue

if (-not $railwayInstalled) {
    Write-Host "Railway CLI not found. Installing..." -ForegroundColor Yellow
    npm install -g @railway/cli
    Write-Host "✅ Railway CLI installed" -ForegroundColor Green
} else {
    Write-Host "✅ Railway CLI is already installed" -ForegroundColor Green
}

Write-Host ""
Write-Host "=== Next Steps ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Login to Railway (this will open your browser):" -ForegroundColor White
Write-Host "   railway login" -ForegroundColor Yellow
Write-Host ""
Write-Host "2. Link to your project:" -ForegroundColor White
Write-Host "   railway link -p 908ab09a-b915-4c0f-a3f1-5bca2219d999" -ForegroundColor Yellow
Write-Host ""
Write-Host "3. Verify connection:" -ForegroundColor White
Write-Host "   railway status" -ForegroundColor Yellow
Write-Host ""
Write-Host "4. Deploy your backend:" -ForegroundColor White
Write-Host "   railway up" -ForegroundColor Yellow
Write-Host ""
Write-Host "=== Alternative: Manual Setup ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "If the script doesn't work, run these commands manually:" -ForegroundColor White
Write-Host ""
Write-Host "railway login" -ForegroundColor Yellow
Write-Host "railway link -p 908ab09a-b915-4c0f-a3f1-5bca2219d999" -ForegroundColor Yellow
Write-Host "railway up" -ForegroundColor Yellow


