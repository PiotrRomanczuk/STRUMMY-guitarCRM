#!/usr/bin/env bash
# Run the Strummy Bruno collection against a given env.
#
# Usage:
#   scripts/ci/run-bruno.sh [env]   # env defaults to "local"
#
# Env vars (loaded from .env.bruno.<env> if present):
#   SUPABASE_URL, SUPABASE_ANON_KEY
#   ADMIN_EMAIL, ADMIN_PASSWORD
#   TEACHER_EMAIL, TEACHER_PASSWORD
#   STUDENT_EMAIL, STUDENT_PASSWORD
#   CRON_SECRET, API_KEY

set -euo pipefail

ENV_NAME="${1:-local}"
REPO_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
COLLECTION="$REPO_ROOT/bruno/strummy"
ENV_FILE="$REPO_ROOT/.env.bruno.$ENV_NAME"
RESULTS="$REPO_ROOT/bruno-results-$ENV_NAME.json"

if [[ -f "$ENV_FILE" ]]; then
  # shellcheck disable=SC1090
  set -a; source "$ENV_FILE"; set +a
fi

if ! command -v bru >/dev/null 2>&1; then
  echo "Bruno CLI not found. Install with: npm install -g @usebruno/cli" >&2
  exit 2
fi

echo "→ Running Bruno collection ($ENV_NAME)..."
bru run "$COLLECTION" \
  --env "$ENV_NAME" \
  --reporter-json "$RESULTS" \
  || EXIT=$?
EXIT="${EXIT:-0}"

echo "→ Results: $RESULTS (exit $EXIT)"
exit "$EXIT"
