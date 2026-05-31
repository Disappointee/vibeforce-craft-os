#!/bin/sh
set -e

echo "=== Awork Remastered Backend ==="

PB_BINARY="/pb/pocketbase"
PORT="${PORT:-8080}"

echo "=== Ensuring superuser exists (CLI) ==="
"$PB_BINARY" superuser upsert "${PB_ADMIN_EMAIL:?PB_ADMIN_EMAIL must be set}" "${PB_ADMIN_PASSWORD:?PB_ADMIN_PASSWORD must be set}" || true

echo "=== Starting PocketBase (foreground) ==="
exec "$PB_BINARY" serve --http="0.0.0.0:${PORT}" --origins="${ALLOWED_ORIGINS:-*}"
