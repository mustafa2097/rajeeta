$ErrorActionPreference = "Stop"

Set-Location $PSScriptRoot\..



function Get-LanIp {

  $wifi = Get-NetIPAddress -AddressFamily IPv4 -ErrorAction SilentlyContinue |

    Where-Object { $_.InterfaceAlias -eq 'Wi-Fi' -and $_.IPAddress -notmatch '^169\.' } |

    Select-Object -First 1

  if ($wifi) { return $wifi.IPAddress }



  $eth = Get-NetIPAddress -AddressFamily IPv4 -ErrorAction SilentlyContinue |

    Where-Object { $_.InterfaceAlias -match '^Ethernet' -and $_.IPAddress -notmatch '^169\.' } |

    Select-Object -First 1

  if ($eth) { return $eth.IPAddress }



  throw "No LAN IP found. Connect Wi-Fi or hotspot first."

}



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



$lanIp = Get-LanIp

Write-Host ""

Write-Host "Rajeeta LAN IP: $lanIp"

Write-Host "API:    http://${lanIp}:3001/api/health"

Write-Host "Doctor: http://${lanIp}:3000"

Write-Host "Admin:  http://${lanIp}:3002/admin/login"

Write-Host "App:    flutter run --dart-define=API_HOST=$lanIp"

Write-Host ""



$apiUrl = "http://${lanIp}:3001/api"

$doctorUrl = "http://${lanIp}:3000"

$adminUrl = "http://${lanIp}:3002"

$origins = "http://localhost:3000,http://127.0.0.1:3000,http://localhost:3002,http://127.0.0.1:3002,http://${lanIp}:3000,http://${lanIp}:3002"



$envFile = "apps\api\.env"

$envContent = Get-Content $envFile -Raw

if ($envContent -match 'CORS_ORIGINS="[^"]*"') {

  $envContent = $envContent -replace 'CORS_ORIGINS="[^"]*"', "CORS_ORIGINS=`"$origins`""

} else {

  $envContent += "`nCORS_ORIGINS=`"$origins`"`n"

}

Set-Content -Path $envFile -Value $envContent -NoNewline



Set-EnvLine "apps\web\.env.local" "NEXT_PUBLIC_API_URL" $apiUrl

Set-EnvLine "apps\web\.env.local" "NEXT_PUBLIC_ADMIN_URL" $adminUrl

Set-EnvLine "apps\web-admin\.env.local" "NEXT_PUBLIC_API_URL" $apiUrl

Set-EnvLine "apps\web-admin\.env.local" "NEXT_PUBLIC_DOCTOR_URL" $doctorUrl



foreach ($port in 3000, 3001, 3002) {

  $conn = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue | Select-Object -First 1

  if ($conn) {

    Stop-Process -Id $conn.OwningProcess -Force -ErrorAction SilentlyContinue

    Start-Sleep -Seconds 1

  }

}



$env:LAN_IP = $lanIp

npm run dev

