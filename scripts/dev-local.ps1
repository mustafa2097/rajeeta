$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot\..

Write-Host ""
Write-Host "Rajeeta LOCALHOST"
Write-Host "API:    http://localhost:3001/api/health"
Write-Host "Doctor: http://localhost:3000"
Write-Host "Admin:  http://localhost:3002/admin/login"
Write-Host ""

function Set-EnvLine($file, $key, $value) {
  $content = Get-Content $file -Raw -ErrorAction SilentlyContinue
  if (-not $content) { $content = "" }
  if ($content -match "(?m)^$key=.*$") {
    $content = $content -replace "(?m)^$key=.*$", "$key=$value"
  } else {
    if ($content -and -not $content.EndsWith("`n")) { $content += "`n" }
    $content += "$key=$value`n"
  }
  Set-Content -Path $file -Value $content -NoNewline
}

$origins = "http://localhost:3000,http://127.0.0.1:3000,http://localhost:3002,http://127.0.0.1:3002"
$envFile = "apps\api\.env"
$envContent = Get-Content $envFile -Raw
if ($envContent -match 'CORS_ORIGINS="[^"]*"') {
  $envContent = $envContent -replace 'CORS_ORIGINS="[^"]*"', "CORS_ORIGINS=`"$origins`""
} else {
  $envContent += "`nCORS_ORIGINS=`"$origins`"`n"
}
Set-Content -Path $envFile -Value $envContent -NoNewline

Set-EnvLine "apps\web\.env.local" "NEXT_PUBLIC_API_URL" "http://localhost:3001/api"
Set-EnvLine "apps\web\.env.local" "NEXT_PUBLIC_ADMIN_URL" "http://localhost:3002"
Set-EnvLine "apps\web-admin\.env.local" "NEXT_PUBLIC_API_URL" "http://localhost:3001/api"
Set-EnvLine "apps\web-admin\.env.local" "NEXT_PUBLIC_DOCTOR_URL" "http://localhost:3000"

foreach ($port in 3000, 3001, 3002) {
  $conn = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue | Select-Object -First 1
  if ($conn) {
    Stop-Process -Id $conn.OwningProcess -Force -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 1
  }
}

npm run dev
