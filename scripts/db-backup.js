#!/usr/bin/env node

const { spawnSync } = require('child_process')
const fs = require('fs')
const path = require('path')

const ROOT_DIR = path.resolve(__dirname, '..')
const ENV_FILE = path.join(ROOT_DIR, '.env')
const BACKUP_DIR = path.join(__dirname, 'backups')

function fail(message) {
  console.error(message)
  process.exit(1)
}

function parseEnvFile(filePath) {
  if (!fs.existsSync(filePath)) {
    fail(`No se encontro el archivo .env en ${filePath}`)
  }

  const values = {}
  const lines = fs.readFileSync(filePath, 'utf8').split(/\r?\n/)

  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue

    const index = trimmed.indexOf('=')
    if (index === -1) continue

    const key = trimmed.slice(0, index).trim()
    let value = trimmed.slice(index + 1).trim()

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }

    values[key] = value
  }

  return values
}

function getBinary(env, key, executable) {
  if (process.env[key]) return process.env[key]

  const pgBin = process.env.PG_BIN || env.PG_BIN
  if (pgBin) {
    return path.join(pgBin, getExecutableName(executable))
  }

  const detected = findPostgresBinary(executable)
  if (detected) return detected

  return executable
}

function getExecutableName(executable) {
  const hasExtension = path.extname(executable) !== ''
  if (hasExtension) return executable

  return process.platform === 'win32' ? `${executable}.exe` : executable
}

function findPostgresBinary(executable) {
  const executableName = getExecutableName(executable)
  const roots =
    process.platform === 'win32'
      ? ['C:\\Program Files\\PostgreSQL']
      : ['/mnt/c/Program Files/PostgreSQL']

  for (const root of roots) {
    if (!fs.existsSync(root)) continue

    const candidates = fs
      .readdirSync(root, { withFileTypes: true })
      .filter(entry => entry.isDirectory())
      .map(entry => entry.name)
      .sort((a, b) => Number(b) - Number(a))
      .map(version => path.join(root, version, 'bin', executableName))

    const found = candidates.find(candidate => fs.existsSync(candidate))
    if (found) return found
  }

  return null
}

function getDatabaseUrl(env, { source = 'default' } = {}) {
  if (source === 'database-url') {
    if (!env.DATABASE_URL) {
      fail(`No se encontro la variable DATABASE_URL en ${ENV_FILE}`)
    }

    return env.DATABASE_URL
  }

  if (source === 'local') {
    return getLocalDatabaseUrl(env)
  }

  if (env.BACKUP_DATABASE_URL) return env.BACKUP_DATABASE_URL

  if (hasLocalDatabaseConfig(env)) return getLocalDatabaseUrl(env)

  if (env.DATABASE_URL) return env.DATABASE_URL

  fail(
    `No se encontro una conexion de base de datos. Define DB_HOST/DB_PORT/DB_USERNAME/DB_NAME o BACKUP_DATABASE_URL en ${ENV_FILE}`,
  )
}

function hasLocalDatabaseConfig(env) {
  return ['DB_HOST', 'DB_PORT', 'DB_USERNAME', 'DB_NAME'].every(key => Boolean(env[key]))
}

function getLocalDatabaseUrl(env) {
  const required = ['DB_HOST', 'DB_PORT', 'DB_USERNAME', 'DB_NAME']
  for (const key of required) {
    if (!env[key]) fail(`No se encontro la variable '${key}' en ${ENV_FILE}`)
  }

  const username = encodeURIComponent(env.DB_USERNAME)
  const password = env.DB_PASSWORD ? `:${encodeURIComponent(env.DB_PASSWORD)}` : ''
  const database = encodeURIComponent(env.DB_NAME)
  const sslMode = env.DB_SSLMODE ? `?sslmode=${encodeURIComponent(env.DB_SSLMODE)}` : ''

  return `postgresql://${username}${password}@${env.DB_HOST}:${env.DB_PORT}/${database}${sslMode}`
}

function getDatabaseName(databaseUrl) {
  try {
    const parsed = new URL(databaseUrl)
    const name = decodeURIComponent(parsed.pathname.replace(/^\//, ''))
    return name || 'database'
  } catch (_error) {
    return 'database'
  }
}

function timestamp() {
  const now = new Date()
  const pad = value => String(value).padStart(2, '0')

  return [
    now.getFullYear(),
    pad(now.getMonth() + 1),
    pad(now.getDate()),
    '_',
    pad(now.getHours()),
    pad(now.getMinutes()),
    pad(now.getSeconds()),
  ].join('')
}

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    stdio: 'inherit',
    ...options,
  })

  if (result.error) {
    fail(`No se pudo ejecutar '${command}'. Verifica que PostgreSQL este en PATH o define PG_BIN.`)
  }

  if (result.status !== 0) {
    process.exit(result.status || 1)
  }
}

function runCapture(command, args) {
  const result = spawnSync(command, args, {
    encoding: 'utf8',
  })

  if (result.error) {
    fail(`No se pudo ejecutar '${command}'. Verifica que PostgreSQL este en PATH o define PG_BIN.`)
  }

  if (result.status !== 0) {
    fail(result.stderr || result.stdout || `El comando '${command}' fallo.`)
  }

  return result.stdout
}

function createBackup({ label = 'backup', source = 'default' } = {}) {
  const env = parseEnvFile(ENV_FILE)
  const databaseUrl = getDatabaseUrl(env, { source })
  const databaseName = getDatabaseName(databaseUrl)
  const pgDump = getBinary(env, 'PG_DUMP_BIN', 'pg_dump')

  fs.mkdirSync(BACKUP_DIR, { recursive: true })

  const backupFile = path.join(BACKUP_DIR, `${databaseName}_${label}_${timestamp()}.dump`)
  const tempBackupFile = `${backupFile}.tmp`

  console.log(`Creando backup completo de '${databaseName}'...`)
  run(pgDump, [
    databaseUrl,
    '--format=custom',
    '--blobs',
    '--no-owner',
    '--no-privileges',
    '--file',
    tempBackupFile,
  ])

  fs.renameSync(tempBackupFile, backupFile)
  console.log(`Backup creado: ${backupFile}`)
  return backupFile
}

function isRestorableBackup(file) {
  return file.endsWith('.dump') && !file.includes('_before_apply_')
}

function findLatestBackup() {
  if (!fs.existsSync(BACKUP_DIR)) return null

  const backups = fs
    .readdirSync(BACKUP_DIR)
    .filter(isRestorableBackup)
    .map(file => path.join(BACKUP_DIR, file))
    .sort((a, b) => fs.statSync(b).mtimeMs - fs.statSync(a).mtimeMs)

  return backups[0] || null
}

function getBackupSummary(backupFile, pgRestore) {
  const list = runCapture(pgRestore, ['--list', backupFile])
  const lines = list.split(/\r?\n/)
  const tableNames = lines
    .map(line => {
      const match = line.match(/ TABLE (?:DATA )?(\S+) (\S+) /)
      if (!match) return null

      return match[2]
    })
    .filter(Boolean)
  const uniqueTableNames = [...new Set(tableNames)]
  const userTableNames = uniqueTableNames.filter(
    tableName => !['migrations', 'typeorm_metadata'].includes(tableName),
  )

  return {
    tableCount: lines.filter(line => / TABLE /.test(line)).length,
    tableDataCount: lines.filter(line => / TABLE DATA /.test(line)).length,
    userTableCount: userTableNames.length,
    userTableNames,
  }
}

function assertBackupLooksComplete(backupFile, pgRestore, args) {
  if (args.includes('--allow-empty')) return

  const summary = getBackupSummary(backupFile, pgRestore)

  if (summary.tableCount === 0) {
    fail(
      [
        `El backup seleccionado no contiene tablas: ${backupFile}`,
        'Probablemente estas intentando aplicar un backup preventivo o vacio.',
        'Pasa un backup creado con npm run backup:create usando --file, o usa --allow-empty si realmente quieres restaurar una base vacia.',
      ].join('\n'),
    )
  }

  if (summary.userTableCount === 0 && !args.includes('--allow-migrations-only')) {
    fail(
      [
        `El backup seleccionado solo contiene tablas internas de migracion: ${backupFile}`,
        'Eso suele pasar cuando se aplica un backup preventivo creado en una base vacia o recien migrada.',
        'Crea el backup desde la maquina/base que SI tiene los datos y vuelve a ejecutar npm run backup:apply.',
        'Si los datos estan en DATABASE_URL, usa npm run backup:create:database-url.',
      ].join('\n'),
    )
  }

  if (summary.tableDataCount === 0) {
    console.warn(`Advertencia: el backup seleccionado no contiene TABLE DATA: ${backupFile}`)
  }
}

function getBackupFileFromArgs(args) {
  const fileFlagIndex = args.findIndex(arg => arg === '--file' || arg === '-f')
  if (fileFlagIndex !== -1) return args[fileFlagIndex + 1]

  return args.find(arg => !arg.startsWith('-'))
}

function applyBackup(args) {
  const env = parseEnvFile(ENV_FILE)
  const databaseUrl = getDatabaseUrl(env)
  const databaseName = getDatabaseName(databaseUrl)
  const psql = getBinary(env, 'PSQL_BIN', 'psql')
  const pgRestore = getBinary(env, 'PG_RESTORE_BIN', 'pg_restore')
  const requestedFile = getBackupFileFromArgs(args)
  const backupFile = requestedFile ? path.resolve(ROOT_DIR, requestedFile) : findLatestBackup()

  if (!backupFile || !fs.existsSync(backupFile)) {
    fail(
      requestedFile
        ? `No existe el backup: ${backupFile}`
        : `No se encontro ningun backup aplicable .dump en ${BACKUP_DIR}. Los backups *_before_apply_*.dump se ignoran por seguridad.`,
    )
  }

  const backupStats = fs.statSync(backupFile)
  if (backupStats.size === 0) {
    fail(
      [
        `El backup esta vacio: ${backupFile}`,
        'Ese archivo no se puede restaurar. Genera otro backup desde la maquina que tiene los datos reales con npm run backup:create.',
      ].join('\n'),
    )
  }

  assertBackupLooksComplete(backupFile, pgRestore, args)

  if (process.env.SKIP_BACKUP_BEFORE_APPLY !== 'true') {
    createBackup({ label: 'before_apply', source: 'default' })
  }

  console.log(`Limpiando esquema public de '${databaseName}'...`)
  run(psql, [databaseUrl, '-v', 'ON_ERROR_STOP=1', '-c', 'DROP SCHEMA IF EXISTS public CASCADE; CREATE SCHEMA public;'])

  console.log(`Aplicando backup: ${backupFile}`)
  run(pgRestore, [
    '--dbname',
    databaseUrl,
    '--no-owner',
    '--no-privileges',
    '--verbose',
    backupFile,
  ])

  console.log(`Backup aplicado sobre '${databaseName}'.`)
}

function listBackups() {
  if (!fs.existsSync(BACKUP_DIR)) {
    console.log(`No existe el directorio de backups: ${BACKUP_DIR}`)
    return
  }

  const files = fs
    .readdirSync(BACKUP_DIR)
    .filter(file => file.endsWith('.dump'))
    .map(file => {
      const filePath = path.join(BACKUP_DIR, file)
      const stats = fs.statSync(filePath)
      const kind = isRestorableBackup(file) ? 'aplicable' : 'preventivo'

      return { file, stats, kind }
    })
    .sort((a, b) => b.stats.mtimeMs - a.stats.mtimeMs)

  if (files.length === 0) {
    console.log(`No hay backups .dump en ${BACKUP_DIR}`)
    return
  }

  for (const { file, stats, kind } of files) {
    console.log(`${kind.padEnd(10)} ${String(stats.size).padStart(10)} bytes  ${file}`)
  }
}

function printHelp() {
  console.log(`
Uso:
  npm run backup:create
  npm run backup:create:local
  npm run backup:create:database-url
  npm run backup:apply
  npm run backup:apply -- --file scripts/backups/archivo.dump
  npm run backup:list

Variables opcionales:
  PG_BIN=/ruta/a/postgresql/bin
  PG_DUMP_BIN=/ruta/a/pg_dump
  PG_RESTORE_BIN=/ruta/a/pg_restore
  PSQL_BIN=/ruta/a/psql
  BACKUP_DATABASE_URL=postgresql://usuario:password@host:5432/base
  SKIP_BACKUP_BEFORE_APPLY=true

Opciones de apply:
  --allow-empty
  --allow-migrations-only
`)
}

const [command, ...args] = process.argv.slice(2)

if (command === 'create') {
  createBackup()
} else if (command === 'create:local') {
  createBackup({ source: 'local' })
} else if (command === 'create:database-url') {
  createBackup({ source: 'database-url', label: 'database_url_backup' })
} else if (command === 'apply') {
  applyBackup(args)
} else if (command === 'list') {
  listBackups()
} else {
  printHelp()
  process.exit(command ? 1 : 0)
}
