$ErrorActionPreference = "Stop"

# Sincroniza la base cloud definida en DATABASE_URL hacia la base local DB_*

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

$srcUri = Get-EnvValue -FilePath $envFile -Key "DATABASE_URL"
$dstUser = Get-EnvValue -FilePath $envFile -Key "DB_USERNAME"
$dstPass = Get-EnvValue -FilePath $envFile -Key "DB_PASSWORD"
$dstHost = Get-EnvValue -FilePath $envFile -Key "DB_HOST"
$dstPort = Get-EnvValue -FilePath $envFile -Key "DB_PORT"
$dstDb = Get-EnvValue -FilePath $envFile -Key "DB_NAME"
$dstUri = "postgresql://${dstUser}:${dstPass}@${dstHost}:${dstPort}/${dstDb}"
$checkConn = "postgresql://${dstUser}:${dstPass}@${dstHost}:${dstPort}/postgres"

Write-Host "Verificando que la base local exista..." -ForegroundColor Yellow
$exists = & $psql $checkConn -tAc "SELECT 1 FROM pg_database WHERE datname = '$dstDb'"
if (-not $exists) {
  & $psql $checkConn -c "CREATE DATABASE ""$dstDb"";"
  if ($LASTEXITCODE -ne 0) {
    throw "No se pudo crear la base local '$dstDb'."
  }
}

Write-Host "Limpiando esquema local..." -ForegroundColor Yellow
& $psql $dstUri -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"
if ($LASTEXITCODE -ne 0) {
  throw "Falló la limpieza del esquema local."
}

Write-Host "Sincronizando base cloud -> local..." -ForegroundColor Yellow
& $pgDump $srcUri --no-owner --no-privileges | & $psql $dstUri
if ($LASTEXITCODE -ne 0) {
  throw "Falló la sincronización cloud -> local."
}

Write-Host "Sincronización completada." -ForegroundColor Green
