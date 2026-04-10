$ErrorActionPreference = "Stop"

function Get-EnvValue {
  param(
    [string]$FilePath,
    [string]$Key
  )

  $line = Get-Content $FilePath | Where-Object { $_ -match "^${Key}=" } | Select-Object -First 1
  if (-not $line) {
    throw "No se encontró la variable '$Key' en $FilePath"
  }

  return ($line -replace "^${Key}=", "").Trim()
}

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$envFile = Join-Path (Split-Path -Parent $scriptDir) ".env"

if (-not (Test-Path $envFile)) {
  throw "No se encontró el archivo .env en $envFile"
}

$pgBin = $env:PG_BIN
if (-not $pgBin) {
  $pgBin = "C:\Program Files\PostgreSQL\17\bin"
}

$pgDump = Join-Path $pgBin "pg_dump.exe"
$psql = Join-Path $pgBin "psql.exe"

if (-not (Test-Path $pgDump)) {
  throw "No se encontró pg_dump.exe en $pgDump. Define PG_BIN o ajusta la ruta."
}

if (-not (Test-Path $psql)) {
  throw "No se encontró psql.exe en $psql. Define PG_BIN o ajusta la ruta."
}

$srcHost = Get-EnvValue -FilePath $envFile -Key "DB_HOST"
$srcPort = Get-EnvValue -FilePath $envFile -Key "DB_PORT"
$srcUser = Get-EnvValue -FilePath $envFile -Key "DB_USERNAME"
$srcPass = Get-EnvValue -FilePath $envFile -Key "DB_PASSWORD"
$srcDb = Get-EnvValue -FilePath $envFile -Key "DB_NAME"
$dstUri = Get-EnvValue -FilePath $envFile -Key "DATABASE_URL"

$backupDir = Join-Path $scriptDir "backups"
$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$cloudBackup = Join-Path $backupDir "${srcDb}_cloud_before_sync_${timestamp}.sql"
$tempDump = Join-Path $env:TEMP "nucleo_taller_local_sync_${timestamp}.sql"

New-Item -ItemType Directory -Force -Path $backupDir | Out-Null

Write-Host "Respaldando la base en la nube antes de sobrescribir..." -ForegroundColor Yellow
$backupProcess = Start-Process -FilePath $pgDump `
  -ArgumentList @($dstUri, "--no-owner", "--no-privileges") `
  -NoNewWindow `
  -RedirectStandardOutput $cloudBackup `
  -Wait `
  -PassThru

if ($backupProcess.ExitCode -ne 0) {
  throw "Falló el respaldo previo de la base en la nube."
}

Write-Host "Limpiando esquema public en la nube..." -ForegroundColor Yellow
& $psql $dstUri -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"
if ($LASTEXITCODE -ne 0) {
  throw "Falló la limpieza del esquema public en la nube."
}

Write-Host "Sincronizando base local -> nube..." -ForegroundColor Yellow
$env:PGPASSWORD = $srcPass
$dumpArgs = @(
  "-h", $srcHost,
  "-p", $srcPort,
  "-U", $srcUser,
  "-d", $srcDb,
  "--no-owner",
  "--no-privileges"
)

$proc = Start-Process -FilePath $pgDump `
  -ArgumentList $dumpArgs `
  -NoNewWindow `
  -RedirectStandardOutput $tempDump `
  -Wait `
  -PassThru

if ($proc.ExitCode -ne 0) {
  Remove-Item Env:PGPASSWORD -ErrorAction SilentlyContinue
  throw "Falló el dump de la base local."
}

& $psql $dstUri -f $tempDump
$psqlExit = $LASTEXITCODE

Remove-Item Env:PGPASSWORD -ErrorAction SilentlyContinue
Remove-Item $tempDump -Force -ErrorAction SilentlyContinue

if ($psqlExit -ne 0) {
  throw "Falló la restauración en la base cloud."
}

Write-Host "Sincronización completada. La nube ahora tiene el contenido de la base local." -ForegroundColor Green
Write-Host "Respaldo previo guardado en: $cloudBackup" -ForegroundColor Cyan
