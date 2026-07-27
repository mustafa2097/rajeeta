$ErrorActionPreference = 'Stop'
Get-Content "$PSScriptRoot/.cloud-db.env" | ForEach-Object {
  if ($_ -match '^([^=]+)=(.*)$') { Set-Item -Path "Env:$($matches[1])" -Value $matches[2] }
}
$exe = Join-Path $env:TEMP 'render-cli\cli_v2.22.0.exe'
& $exe workspace set tea-d9jntdurnols7394nid0 --confirm -o json | Out-Null

$jwt = -join ((48..57 + 65..90 + 97..122) | Get-Random -Count 48 | ForEach-Object { [char]$_ })
$refresh = -join ((48..57 + 65..90 + 97..122) | Get-Random -Count 48 | ForEach-Object { [char]$_ })

$argsList = @(
  'services','create',
  '--name','rajeeta-api',
  '--type','web_service',
  '--repo','https://github.com/mustafa2097/rajeeta',
  '--branch','main',
  '--runtime','docker',
  '--plan','free',
  '--region','frankfurt',
  '--health-check-path','/api/health',
  '--root-directory','.',
  '--env-var',"DATABASE_URL=$($env:DATABASE_URL)",
  '--env-var','NODE_ENV=production',
  '--env-var','HOST=0.0.0.0',
  '--env-var','UPLOAD_DIR=./uploads',
  '--env-var','JWT_EXPIRES_IN=15m',
  '--env-var','JWT_REFRESH_EXPIRES_IN=7d',
  '--env-var',"JWT_SECRET=$jwt",
  '--env-var',"JWT_REFRESH_SECRET=$refresh",
  '--env-var','CORS_ORIGINS=https://rajeeta-doctor.vercel.app,https://rajeeta-admin.vercel.app',
  '-o','json',
  '--confirm'
)
& $exe @argsList
