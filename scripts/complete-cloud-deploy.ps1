# Completes cloud wiring after Neon DB exists and Render/Vercel accounts are ready.
# Usage:
#   .\scripts\complete-cloud-deploy.ps1
# Requires: scripts/.cloud-db.env (DATABASE_URL), RENDER_API_KEY env var (optional), vercel login

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

$dbEnv = Join-Path $root 'scripts/.cloud-db.env'
if (-not (Test-Path $dbEnv)) {
  throw 'Missing scripts/.cloud-db.env — create Neon DATABASE_URL first.'
}

Get-Content $dbEnv | ForEach-Object {
  if ($_ -match '^\s*#' -or $_ -notmatch '=') { return }
  $k, $v = $_.Split('=', 2)
  Set-Item -Path "Env:$k" -Value $v
}

if (-not $env:DATABASE_URL) { throw 'DATABASE_URL missing in scripts/.cloud-db.env' }

Write-Host 'Neon DATABASE_URL loaded (hidden).'
Write-Host 'Open Render Blueprint deploy:'
Write-Host '  https://dashboard.render.com/blueprints/new?repo=https://github.com/mustafa2097/rajeeta'
Write-Host 'Set DATABASE_URL and CORS_ORIGINS on the rajeeta-api service, then continue.'
