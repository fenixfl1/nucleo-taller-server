param(
  [string]$EnvFile = (Join-Path $PSScriptRoot '..\.env'),
  [string]$OutputDir = (Join-Path $PSScriptRoot '..\backups'),
  [string]$DumpFile = '',
  [string]$SourceDatabaseUrl = '',
  [string]$TargetDatabaseUrl = '',
  [switch]$SkipRestore,
  [switch]$SkipVerify,
  [switch]$PromoteCloud,
  [switch]$NoClean
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

function Write-Step {
  param([string]$Message)
  Write-Host "==> $Message" -ForegroundColor Cyan
}

function Fail {
  param([string]$Message)
  throw $Message
}

function Get-Executable {
  param([string]$Name)

  $command = Get-Command $Name -ErrorAction SilentlyContinue
  if (-not $command) {
    Fail "No se encontró '$Name' en el PATH. Instala las herramientas de PostgreSQL antes de continuar."
  }

  return $command.Source
}

function Import-DotEnv {
  param([string]$Path)

  if (-not (Test-Path $Path)) {
    Fail "No se encontró el archivo de entorno: $Path"
  }

  $values = @{}

  foreach ($rawLine in Get-Content -Path $Path) {
    $line = $rawLine.Trim()

    if (-not $line -or $line.StartsWith('#') -or -not $line.Contains('=')) {
      continue
    }

    $separatorIndex = $line.IndexOf('=')
    $key = $line.Substring(0, $separatorIndex).Trim()
    $value = $line.Substring($separatorIndex + 1).Trim()

    if (
      ($value.StartsWith('"') -and $value.EndsWith('"')) -or
      ($value.StartsWith("'") -and $value.EndsWith("'"))
    ) {
      $value = $value.Substring(1, $value.Length - 2)
    }

    $values[$key] = $value
  }

  return $values
}

function Get-FirstValue {
  param(
    [hashtable]$Map,
    [string[]]$Keys
  )

  foreach ($key in $Keys) {
    if ($Map.ContainsKey($key) -and -not [string]::IsNullOrWhiteSpace($Map[$key])) {
      return $Map[$key]
    }
  }

  return $null
}

function New-ConnectionFromUrl {
  param(
    [string]$Url,
    [string]$SslMode = ''
  )

  return @{
    Mode = 'url'
    Url = $Url
    SslMode = $SslMode
    Summary = $Url -replace '://([^:]+):[^@]+@', '://$1:***@'
  }
}

function New-ConnectionFromFields {
  param(
    [string]$Host,
    [string]$Port,
    [string]$Username,
    [string]$Password,
    [string]$Database,
    [string]$SslMode = ''
  )

  if (
    [string]::IsNullOrWhiteSpace($Host) -or
    [string]::IsNullOrWhiteSpace($Port) -or
    [string]::IsNullOrWhiteSpace($Username) -or
    [string]::IsNullOrWhiteSpace($Database)
  ) {
    return $null
  }

  return @{
    Mode = 'fields'
    Host = $Host
    Port = $Port
    Username = $Username
    Password = $Password
    Database = $Database
    SslMode = $SslMode
    Summary = "$Username@${Host}:${Port}/${Database}"
  }
}

function Resolve-SourceConnection {
  param(
    [hashtable]$EnvMap,
    [string]$OverrideDatabaseUrl
  )

  if (-not [string]::IsNullOrWhiteSpace($OverrideDatabaseUrl)) {
    return New-ConnectionFromUrl -Url $OverrideDatabaseUrl -SslMode (
      Get-FirstValue -Map $EnvMap -Keys @('LOCAL_DB_SSLMODE')
    )
  }

  $envUrl = Get-FirstValue -Map $EnvMap -Keys @(
    'LOCAL_DATABASE_URL',
    'DATABASE_URL_LOCAL',
    'LOCAL_DB_URL'
  )

  if (-not [string]::IsNullOrWhiteSpace($envUrl)) {
    return New-ConnectionFromUrl -Url $envUrl -SslMode (
      Get-FirstValue -Map $EnvMap -Keys @('LOCAL_DB_SSLMODE')
    )
  }

  $connection = New-ConnectionFromFields `
    -Host (Get-FirstValue -Map $EnvMap -Keys @('DB_HOST')) `
    -Port (Get-FirstValue -Map $EnvMap -Keys @('DB_PORT')) `
    -Username (Get-FirstValue -Map $EnvMap -Keys @('DB_USERNAME')) `
    -Password (Get-FirstValue -Map $EnvMap -Keys @('DB_PASSWORD')) `
    -Database (Get-FirstValue -Map $EnvMap -Keys @('DB_NAME')) `
    -SslMode (Get-FirstValue -Map $EnvMap -Keys @('DB_SSLMODE', 'LOCAL_DB_SSLMODE'))

  if ($null -eq $connection) {
    Fail 'No se pudo resolver la conexión local de origen desde el .env.'
  }

  return $connection
}

function Resolve-TargetConnection {
  param(
    [hashtable]$EnvMap,
    [string]$OverrideDatabaseUrl
  )

  if (-not [string]::IsNullOrWhiteSpace($OverrideDatabaseUrl)) {
    return New-ConnectionFromUrl -Url $OverrideDatabaseUrl -SslMode (
      Get-FirstValue -Map $EnvMap -Keys @('CLOUD_DB_SSLMODE', 'TARGET_DB_SSLMODE')
    )
  }

  $envUrl = Get-FirstValue -Map $EnvMap -Keys @(
    'CLOUD_DATABASE_URL',
    'DATABASE_URL_CLOUD',
    'TARGET_DATABASE_URL',
    'DATABASE_URL'
  )

  if (-not [string]::IsNullOrWhiteSpace($envUrl)) {
    return New-ConnectionFromUrl -Url $envUrl -SslMode (
      Get-FirstValue -Map $EnvMap -Keys @('CLOUD_DB_SSLMODE', 'TARGET_DB_SSLMODE')
    )
  }

  $connection = New-ConnectionFromFields `
    -Host (Get-FirstValue -Map $EnvMap -Keys @('CLOUD_DB_HOST', 'TARGET_DB_HOST')) `
    -Port (Get-FirstValue -Map $EnvMap -Keys @('CLOUD_DB_PORT', 'TARGET_DB_PORT')) `
    -Username (Get-FirstValue -Map $EnvMap -Keys @('CLOUD_DB_USERNAME', 'TARGET_DB_USERNAME')) `
    -Password (Get-FirstValue -Map $EnvMap -Keys @('CLOUD_DB_PASSWORD', 'TARGET_DB_PASSWORD')) `
    -Database (Get-FirstValue -Map $EnvMap -Keys @('CLOUD_DB_NAME', 'TARGET_DB_NAME')) `
    -SslMode (Get-FirstValue -Map $EnvMap -Keys @('CLOUD_DB_SSLMODE', 'TARGET_DB_SSLMODE'))

  if ($null -eq $connection) {
    Fail 'No se pudo resolver la conexión cloud de destino desde el .env. Define CLOUD_DATABASE_URL o CLOUD_DB_*.'
  }

  return $connection
}

function Invoke-PgCommand {
  param(
    [string]$Executable,
    [string[]]$Arguments,
    [hashtable]$Connection
  )

  $previousPassword = $env:PGPASSWORD
  $previousSslMode = $env:PGSSLMODE

  try {
    if ($Connection.Mode -eq 'fields') {
      $env:PGPASSWORD = [string]$Connection.Password
    }

    if (-not [string]::IsNullOrWhiteSpace([string]$Connection.SslMode)) {
      $env:PGSSLMODE = [string]$Connection.SslMode
    }

    & $Executable @Arguments
    if ($LASTEXITCODE -ne 0) {
      Fail "El comando '$Executable' terminó con código $LASTEXITCODE."
    }
  }
  finally {
    if ($null -eq $previousPassword) {
      Remove-Item Env:PGPASSWORD -ErrorAction SilentlyContinue
    }
    else {
      $env:PGPASSWORD = $previousPassword
    }

    if ($null -eq $previousSslMode) {
      Remove-Item Env:PGSSLMODE -ErrorAction SilentlyContinue
    }
    else {
      $env:PGSSLMODE = $previousSslMode
    }
  }
}

function Get-PsqlArgs {
  param(
    [hashtable]$Connection,
    [string]$Query
  )

  if ($Connection.Mode -eq 'url') {
    return @(
      "--dbname=$($Connection.Url)",
      '-v', 'ON_ERROR_STOP=1',
      '-At',
      '-F', '|',
      '-c', $Query
    )
  }

  return @(
    '-h', $Connection.Host,
    '-p', [string]$Connection.Port,
    '-U', $Connection.Username,
    '-d', $Connection.Database,
    '-v', 'ON_ERROR_STOP=1',
    '-At',
    '-F', '|',
    '-c', $Query
  )
}

function Get-CountMap {
  param(
    [string]$PsqlExe,
    [hashtable]$Connection,
    [string[]]$Tables
  )

  $queryParts = foreach ($table in $Tables) {
    "SELECT '$table' AS table_name, COUNT(*) AS total FROM ""$table"""
  }
  $query = ($queryParts -join ' UNION ALL ') + ';'

  $previousPassword = $env:PGPASSWORD
  $previousSslMode = $env:PGSSLMODE

  try {
    if ($Connection.Mode -eq 'fields') {
      $env:PGPASSWORD = [string]$Connection.Password
    }

    if (-not [string]::IsNullOrWhiteSpace([string]$Connection.SslMode)) {
      $env:PGSSLMODE = [string]$Connection.SslMode
    }

    $output = & $PsqlExe @(Get-PsqlArgs -Connection $Connection -Query $query)
    if ($LASTEXITCODE -ne 0) {
      Fail "No fue posible validar conteos con psql. Código $LASTEXITCODE."
    }
  }
  finally {
    if ($null -eq $previousPassword) {
      Remove-Item Env:PGPASSWORD -ErrorAction SilentlyContinue
    }
    else {
      $env:PGPASSWORD = $previousPassword
    }

    if ($null -eq $previousSslMode) {
      Remove-Item Env:PGSSLMODE -ErrorAction SilentlyContinue
    }
    else {
      $env:PGSSLMODE = $previousSslMode
    }
  }

  $result = @{}
  foreach ($line in $output) {
    if ([string]::IsNullOrWhiteSpace($line)) { continue }
    $parts = $line -split '\|', 2
    if ($parts.Length -eq 2) {
      $result[$parts[0]] = [int64]$parts[1]
    }
  }

  return $result
}

function Set-OrAppendEnvValue {
  param(
    [System.Collections.Generic.List[string]]$Lines,
    [string]$Key,
    [string]$Value
  )

  $updated = $false
  for ($i = 0; $i -lt $Lines.Count; $i++) {
    if ($Lines[$i] -match "^\s*$([regex]::Escape($Key))=") {
      $Lines[$i] = "$Key=$Value"
      $updated = $true
      break
    }
  }

  if (-not $updated) {
    $Lines.Add("$Key=$Value") | Out-Null
  }
}

function Promote-CloudConnectionInEnv {
  param(
    [string]$Path,
    [hashtable]$TargetConnection
  )

  $backupPath = "$Path.bak.$(Get-Date -Format 'yyyyMMdd_HHmmss')"
  Copy-Item -Path $Path -Destination $backupPath -Force

  $lines = [System.Collections.Generic.List[string]]::new()
  foreach ($line in Get-Content -Path $Path) {
    $lines.Add($line) | Out-Null
  }

  if ($TargetConnection.Mode -eq 'url') {
    Set-OrAppendEnvValue -Lines $lines -Key 'DATABASE_URL' -Value $TargetConnection.Url
    Set-OrAppendEnvValue -Lines $lines -Key 'DB_HOST' -Value ''
    Set-OrAppendEnvValue -Lines $lines -Key 'DB_PORT' -Value ''
    Set-OrAppendEnvValue -Lines $lines -Key 'DB_USERNAME' -Value ''
    Set-OrAppendEnvValue -Lines $lines -Key 'DB_PASSWORD' -Value ''
    Set-OrAppendEnvValue -Lines $lines -Key 'DB_NAME' -Value ''
  }
  else {
    Set-OrAppendEnvValue -Lines $lines -Key 'DATABASE_URL' -Value ''
    Set-OrAppendEnvValue -Lines $lines -Key 'DB_HOST' -Value $TargetConnection.Host
    Set-OrAppendEnvValue -Lines $lines -Key 'DB_PORT' -Value ([string]$TargetConnection.Port)
    Set-OrAppendEnvValue -Lines $lines -Key 'DB_USERNAME' -Value $TargetConnection.Username
    Set-OrAppendEnvValue -Lines $lines -Key 'DB_PASSWORD' -Value $TargetConnection.Password
    Set-OrAppendEnvValue -Lines $lines -Key 'DB_NAME' -Value $TargetConnection.Database
  }

  Set-Content -Path $Path -Value $lines -Encoding UTF8
  Write-Host "Se actualizó el .env para usar la base cloud. Backup original: $backupPath" -ForegroundColor Yellow
}

$pgDump = Get-Executable -Name 'pg_dump'
$pgRestore = Get-Executable -Name 'pg_restore'
$psql = Get-Executable -Name 'psql'

$envMap = Import-DotEnv -Path $EnvFile
$sourceConnection = Resolve-SourceConnection -EnvMap $envMap -OverrideDatabaseUrl $SourceDatabaseUrl
$targetConnection = Resolve-TargetConnection -EnvMap $envMap -OverrideDatabaseUrl $TargetDatabaseUrl

if (-not (Test-Path $OutputDir)) {
  New-Item -ItemType Directory -Path $OutputDir -Force | Out-Null
}

if ([string]::IsNullOrWhiteSpace($DumpFile)) {
  $DumpFile = Join-Path $OutputDir "nucleo_taller_$(Get-Date -Format 'yyyyMMdd_HHmmss').dump"
}
elseif (-not [System.IO.Path]::IsPathRooted($DumpFile)) {
  $DumpFile = Join-Path $OutputDir $DumpFile
}

Write-Step "Origen: $($sourceConnection.Summary)"
Write-Step "Destino: $($targetConnection.Summary)"
Write-Step "Archivo dump: $DumpFile"

$dumpArgs = @(
  '--format=custom',
  '--verbose',
  '--no-owner',
  '--no-privileges',
  "--file=$DumpFile"
)

if ($sourceConnection.Mode -eq 'url') {
  $dumpArgs += "--dbname=$($sourceConnection.Url)"
}
else {
  $dumpArgs += @(
    '-h', $sourceConnection.Host,
    '-p', [string]$sourceConnection.Port,
    '-U', $sourceConnection.Username,
    '-d', $sourceConnection.Database
  )
}

Write-Step 'Creando dump de la base local...'
Invoke-PgCommand -Executable $pgDump -Arguments $dumpArgs -Connection $sourceConnection

if (-not $SkipRestore) {
  $restoreArgs = @(
    '--verbose',
    '--no-owner',
    '--no-privileges'
  )

  if (-not $NoClean) {
    $restoreArgs += @('--clean', '--if-exists')
  }

  if ($targetConnection.Mode -eq 'url') {
    $restoreArgs += @(
      "--dbname=$($targetConnection.Url)",
      $DumpFile
    )
  }
  else {
    $restoreArgs += @(
      '-h', $targetConnection.Host,
      '-p', [string]$targetConnection.Port,
      '-U', $targetConnection.Username,
      '-d', $targetConnection.Database,
      $DumpFile
    )
  }

  Write-Step 'Restaurando dump en la base cloud...'
  Invoke-PgCommand -Executable $pgRestore -Arguments $restoreArgs -Connection $targetConnection
}

if (-not $SkipVerify) {
  $tables = @(
    'PERSON',
    'VEHICLE',
    'ARTICLE',
    'WORK_ORDER',
    'DELIVERY_RECEIPT',
    'INVENTORY_MOVEMENT',
    'SERVICE_VEHICLE'
  )

  Write-Step 'Validando conteos entre origen y destino...'
  $sourceCounts = Get-CountMap -PsqlExe $psql -Connection $sourceConnection -Tables $tables
  $targetCounts = Get-CountMap -PsqlExe $psql -Connection $targetConnection -Tables $tables

  $hasDifferences = $false
  foreach ($table in $tables) {
    $sourceCount = if ($sourceCounts.ContainsKey($table)) { $sourceCounts[$table] } else { 0 }
    $targetCount = if ($targetCounts.ContainsKey($table)) { $targetCounts[$table] } else { 0 }

    $status = if ($sourceCount -eq $targetCount) { 'OK' } else { 'DIFF' }
    if ($status -eq 'DIFF') {
      $hasDifferences = $true
    }

    Write-Host ("{0,-22} local={1,-8} cloud={2,-8} {3}" -f $table, $sourceCount, $targetCount, $status)
  }

  if ($hasDifferences) {
    Write-Warning 'Se detectaron diferencias de conteo entre la base local y la cloud.'
  }
  else {
    Write-Host 'Validación de conteos completada sin diferencias.' -ForegroundColor Green
  }
}

if ($PromoteCloud) {
  Write-Step 'Actualizando .env para apuntar a la base cloud...'
  Promote-CloudConnectionInEnv -Path $EnvFile -TargetConnection $targetConnection
}

Write-Host 'Migración finalizada.' -ForegroundColor Green
