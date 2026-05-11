#!/usr/bin/env bash
#
# e2e-precheck.sh — sanity preflight for the Playwright E2E suite.
#
# Verifies the environment is ready BEFORE running `npx playwright test` so
# we don't waste 10 minutes of test runtime to discover the dev server isn't
# up. Exits non-zero on any failure.
#
# Usage: ./scripts/testing/e2e-precheck.sh [--quiet]

set -euo pipefail

QUIET=${1:-}
log()  { [[ "$QUIET" == "--quiet" ]] || echo "$@"; }
fail() { echo "❌ $1" >&2; exit 1; }
ok()   { log "✅ $1"; }

# 1. Local Supabase listening on 54321.
if ! nc -z 127.0.0.1 54321 2>/dev/null; then
  fail "Local Supabase not reachable on 127.0.0.1:54321 — run 'supabase start' first"
fi
ok "Local Supabase up on 54321"

# 2. Env vars needed by the suite.
required_vars=(
  "NEXT_PUBLIC_SUPABASE_LOCAL_URL"
  "SUPABASE_LOCAL_SERVICE_ROLE_KEY"
  "TEST_ADMIN_EMAIL"
  "TEST_TEACHER_EMAIL"
  "TEST_STUDENT_EMAIL"
)
# Source .env.local for the check.
if [ -f .env.local ]; then
  set -a
  # shellcheck disable=SC1091
  . ./.env.local
  set +a
fi
missing=()
for v in "${required_vars[@]}"; do
  [ -z "${!v-}" ] && missing+=("$v")
done
if [ ${#missing[@]} -gt 0 ]; then
  fail "Missing env vars: ${missing[*]} (set them in .env.local or tests/.env.e2e)"
fi
ok "Env vars present"

# 3. Dev server reachable (or will be started by playwright.config webServer).
if ! curl -fsS http://localhost:3000 -o /dev/null --max-time 2 2>/dev/null; then
  log "ℹ️  Dev server not running on 3000 — playwright will start one via webServer config"
else
  ok "Dev server reachable on 3000"
fi

# 4. Seed accounts exist (light check: count via service-role from the SDK).
log "ℹ️  Skipping seed-account check (run npm run seed:test-user to provision)"

ok "Preflight passed"
