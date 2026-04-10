#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="$(cd "$SCRIPT_DIR/.." && pwd)/.env"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "No se encontró el archivo .env en $ENV_FILE" >&2
  exit 1
fi

get_env_value() {
  local key="$1"
  local value
  value=$(grep -E "^${key}=" "$ENV_FILE" | head -n1 | cut -d= -f2- || true)

  if [[ -z "$value" ]]; then
    echo "No se encontró la variable '$key' en $ENV_FILE" >&2
    exit 1
  fi

  printf '%s' "$value"
}

PG_DUMP_BIN=${PG_DUMP_BIN:-"$(command -v pg_dump || true)"}
PSQL_BIN=${PSQL_BIN:-"$(command -v psql || true)"}

if [[ -z "$PG_DUMP_BIN" ]]; then
  echo "No se encontró pg_dump. Define PG_DUMP_BIN=/ruta/pg_dump" >&2
  exit 1
fi

if [[ -z "$PSQL_BIN" ]]; then
  echo "No se encontró psql. Define PSQL_BIN=/ruta/psql" >&2
  exit 1
fi

DB_HOST=$(get_env_value DB_HOST)
DB_PORT=$(get_env_value DB_PORT)
DB_USERNAME=$(get_env_value DB_USERNAME)
DB_PASSWORD=$(get_env_value DB_PASSWORD)
DB_NAME=$(get_env_value DB_NAME)
DATABASE_URL=$(get_env_value DATABASE_URL)

BACKUP_DIR="$SCRIPT_DIR/backups"
TS=$(date +%Y%m%d_%H%M%S)
CLOUD_BACKUP="$BACKUP_DIR/${DB_NAME}_cloud_before_sync_${TS}.sql.gz"

mkdir -p "$BACKUP_DIR"

echo "Respaldando la base en la nube antes de sobrescribir..."
"$PG_DUMP_BIN" "$DATABASE_URL" --no-owner --no-privileges | gzip > "$CLOUD_BACKUP"

echo "Limpiando esquema public en la nube..."
"$PSQL_BIN" "$DATABASE_URL" -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"

echo "Sincronizando base local -> nube..."
PGPASSWORD="$DB_PASSWORD" "$PG_DUMP_BIN" \
  -h "$DB_HOST" \
  -p "$DB_PORT" \
  -U "$DB_USERNAME" \
  -d "$DB_NAME" \
  --no-owner \
  --no-privileges | "$PSQL_BIN" "$DATABASE_URL"

echo "Sincronización completada. La nube ahora tiene el contenido de la base local."
echo "Respaldo previo guardado en: $CLOUD_BACKUP"
