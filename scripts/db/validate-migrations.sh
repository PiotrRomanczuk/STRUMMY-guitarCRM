#!/bin/bash
# Non-destructive validation for the from-scratch rebuild migrations
# (docs/DATABASE_REBUILD.md). Spins up a throwaway scratch DB on the local uwh
# Postgres cluster, installs a minimal Supabase shim (supabase/tests/_shim.sql),
# applies every supabase/migrations/*.sql in order, runs a gate-test file, then
# drops the scratch DB. Never touches the real local stack database.
#
# Usage:  scripts/db/validate-migrations.sh [test-file]
#   test-file defaults to supabase/tests/wave0.sql
#
# Env overrides: PGHOST_ (default 192.168.1.75), PGPORT_ (54322), PGUSER_ (postgres),
#                PGPASSWORD (postgres).
set -euo pipefail

HOST="${PGHOST_:-192.168.1.75}"
PORT="${PGPORT_:-54322}"
USER_="${PGUSER_:-postgres}"
export PGPASSWORD="${PGPASSWORD:-postgres}"

REPO="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
MIG="$REPO/supabase/migrations"
SHIM="$REPO/supabase/tests/_shim.sql"
TESTS="${1:-$REPO/supabase/tests/wave0.sql}"
DB="strummy_rebuild_test"

PSQL="psql -h $HOST -p $PORT -U $USER_ -v ON_ERROR_STOP=1"

echo ">> (re)creating scratch DB $DB on $HOST:$PORT"
$PSQL -d postgres -q -c "drop database if exists $DB;"
$PSQL -d postgres -q -c "create database $DB;"

cleanup() { $PSQL -d postgres -q -c "drop database if exists $DB;" >/dev/null 2>&1 || true; }
trap cleanup EXIT

echo ">> installing Supabase shim"
$PSQL -d "$DB" -q -f "$SHIM"

echo ">> applying migrations in lexicographic order"
for f in $(ls "$MIG"/*.sql 2>/dev/null | sort); do
  echo "   - $(basename "$f")"
  $PSQL -d "$DB" -q -f "$f"
done

echo ">> running gate tests: $(basename "$TESTS")"
$PSQL -d "$DB" -f "$TESTS"

echo ">> OK (scratch DB dropped on exit)"
