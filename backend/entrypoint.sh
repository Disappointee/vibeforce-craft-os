#!/bin/sh
set -e

echo "=== Vibeforce Flow OS Backend ==="

PB_BINARY="${PB_BINARY:-/pb/pocketbase}"
PORT="${PORT:-8080}"

# CORS-Fail-fast (Audit Block 5, P2): Konkrete Origins sind Pflicht.
# Entscheidung: Fail-fast statt unsicherem Default. Die Compose-Stacks setzen
# ALLOWED_ORIGINS immer (dev: localhost:3000/3001, prod: konkrete Domainliste);
# ein unset oder '*' enthaltender Wert deutet auf Fehlkonfiguration hin und soll
# den Container stoppen, statt PocketBase mit offener CORS-Policy ('*') zu starten.
: "${ALLOWED_ORIGINS:?ALLOWED_ORIGINS must be set (comma-separated concrete origins)}"
case "$ALLOWED_ORIGINS" in
    *"*"*)
        echo "ERROR: ALLOWED_ORIGINS must not contain '*': $ALLOWED_ORIGINS" >&2
        exit 1
        ;;
esac

echo "=== Ensuring superuser exists (CLI) ==="
"$PB_BINARY" superuser upsert "${PB_ADMIN_EMAIL:?PB_ADMIN_EMAIL must be set}" "${PB_ADMIN_PASSWORD:?PB_ADMIN_PASSWORD must be set}" || true

echo "=== Starting PocketBase (foreground) ==="
exec "$PB_BINARY" serve --http="0.0.0.0:${PORT}" --origins="${ALLOWED_ORIGINS}"
