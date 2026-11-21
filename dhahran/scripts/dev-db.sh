#!/usr/bin/env bash
# Start a throw-away local PostgreSQL for development and tests when Docker is
# not available (uses the system PostgreSQL binaries). With Docker, prefer:
#   docker compose up -d db
# Data lives in .pgdata/ (git-ignored). Synthetic data only.
set -euo pipefail
PORT="${PGPORT_LOCAL:-54329}"
DIR="$(cd "$(dirname "$0")/.." && pwd)/.pgdata"
BIN="$(dirname "$(command -v initdb 2>/dev/null || ls /usr/lib/postgresql/*/bin/initdb | tail -1)")"
run() { if [ "$(id -u)" = "0" ]; then su postgres -c "$*"; else bash -c "$*"; fi; }

if [ ! -d "$DIR" ]; then
  mkdir -p "$DIR"
  [ "$(id -u)" = "0" ] && chown postgres "$DIR"
  run "$BIN/initdb -D '$DIR' -U reshape --auth=trust -E UTF8 >/dev/null"
fi
if ! run "$BIN/pg_ctl -D '$DIR' status" >/dev/null 2>&1; then
  run "$BIN/pg_ctl -D '$DIR' -o '-p $PORT -c listen_addresses=127.0.0.1 -c unix_socket_directories=/tmp' -l '$DIR/server.log' -w start >/dev/null"
fi
for db in reshape_dev reshape_test; do
  run "$BIN/psql -h 127.0.0.1 -p $PORT -U reshape -d postgres -tc \"select 1 from pg_database where datname='$db'\"" | grep -q 1 \
    || run "$BIN/createdb -h 127.0.0.1 -p $PORT -U reshape $db"
done
echo "postgresql://reshape@127.0.0.1:$PORT/reshape_dev"
