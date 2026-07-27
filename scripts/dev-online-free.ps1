# Free online test for Rajeeta (Cloudflare quick tunnels)
# Requires: Docker Desktop, cloudflared at %LOCALAPPDATA%\cloudflared\cloudflared.exe
# Laptop must stay on while testing.

$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot\..

$cf = "$env:LOCALAPPDATA\cloudflared\cloudflared.exe"
if (-not (Test-Path $cf)) {
  throw "cloudflared missing. Install first."
}

Write-Host "Starting Postgres..."
docker compose up -d | Out-Null

# Ensure permissive CORS for random tunnel origins
$envFile = "apps\api\.env"
$content = Get-Content $envFile -Raw
if ($content -notmatch "(?m)^CORS_ALLOW_ANY=") {
  $content = $content.TrimEnd() + "`nCORS_ALLOW_ANY=1`n"
  Set-Content -Path $envFile -Value $content -NoNewline
}

Write-Host "Start API / doctor / admin in other terminals, then run tunnels:"
Write-Host "  $cf tunnel --url http://127.0.0.1:3001"
Write-Host "  $cf tunnel --url http://127.0.0.1:3000"
Write-Host "  $cf tunnel --url http://127.0.0.1:3002"
Write-Host "Put the API tunnel URL into apps/web/.env.local, apps/web-admin/.env.local, apps/patient-expo/.env as NEXT_PUBLIC_API_URL / EXPO_PUBLIC_API_URL (.../api)"
