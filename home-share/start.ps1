# Home Share — Quick Start (Windows)
# Run from home-share folder: .\start.ps1

Write-Host "`n🏠 Home Share — Starting...`n" -ForegroundColor Cyan

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $root

# Show local IP
Write-Host "Your IP addresses:" -ForegroundColor Yellow
Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.IPAddress -notlike '127.*' -and $_.PrefixOrigin -ne 'WellKnown' } | ForEach-Object {
    Write-Host "  http://$($_.IPAddress):3847" -ForegroundColor Green
}

Write-Host "`nStarting server + web...`n" -ForegroundColor Cyan
npm run dev
