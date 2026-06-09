#!/usr/bin/env bash
# Apply Gmail SMTP to the production Supabase project's Auth config.
#
# Reads ALL credentials from environment variables — nothing inline:
#   SUPABASE_PAT          Supabase Personal Access Token (sbp_...)
#                         Generate at https://supabase.com/dashboard/account/tokens
#                         Revoke immediately after this script succeeds.
#   GMAIL_USER            The Gmail address used as SMTP user + From address.
#   GMAIL_APP_PASSWORD    The 16-char Gmail app password (no spaces or spaces ok).
#
# Both Gmail vars usually live in your Vercel env. Pull them locally with:
#   vercel env pull .env.local
# then source the file before running this script:
#   set -a; source .env.local; set +a
#
# Usage:
#   export SUPABASE_PAT='sbp_xxxxx...'
#   set -a; source .env.local; set +a
#   bash scripts/apply-prod-smtp.sh
#
# Idempotent — safe to re-run. Does a GET first, then PATCH, then GET to confirm.

set -euo pipefail

PROJECT_REF="zmlluqqqwrfhygvpfqka"
API="https://api.supabase.com/v1/projects/${PROJECT_REF}/config/auth"

err() { printf '\033[31m[fail]\033[0m %s\n' "$1" >&2; exit 1; }
ok()  { printf '\033[32m[ok]\033[0m   %s\n' "$1"; }
inf() { printf '       %s\n' "$1"; }

: "${SUPABASE_PAT:?Missing SUPABASE_PAT — see top of file}"
: "${GMAIL_USER:?Missing GMAIL_USER — try: set -a; source .env.local; set +a}"
: "${GMAIL_APP_PASSWORD:?Missing GMAIL_APP_PASSWORD — try: set -a; source .env.local; set +a}"

# Strip spaces from app password (Google shows it with spaces; SMTP wants none)
GMAIL_APP_PASSWORD_CLEAN="${GMAIL_APP_PASSWORD// /}"

ok "PAT in env (${#SUPABASE_PAT} chars)"
ok "GMAIL_USER = ${GMAIL_USER}"
ok "GMAIL_APP_PASSWORD set (${#GMAIL_APP_PASSWORD_CLEAN} chars after stripping spaces)"

# 1. Read-only GET to validate the PAT + show baseline
inf ""
inf "→ GET current auth config to validate PAT..."
BEFORE=$(curl -sS -w '\n%{http_code}' -H "Authorization: Bearer ${SUPABASE_PAT}" "${API}")
BEFORE_BODY=$(printf '%s' "$BEFORE" | sed '$d')
BEFORE_CODE=$(printf '%s' "$BEFORE" | tail -n1)
[ "$BEFORE_CODE" = "200" ] || err "GET returned ${BEFORE_CODE}: $(printf '%s' "$BEFORE_BODY" | head -c 400)"
ok "PAT works (HTTP 200)"

inf ""
inf "Current SMTP-relevant fields on prod:"
printf '%s' "$BEFORE_BODY" | python3 -c "
import json, sys
c = json.load(sys.stdin)
keys = ['smtp_admin_email','smtp_host','smtp_port','smtp_user','smtp_pass','smtp_sender_name','smtp_max_frequency']
for k in keys:
    v = c.get(k)
    if k == 'smtp_pass' and v: v = '<set, '+str(len(v))+' chars>'
    print(f'  {k:25s} {v if v is not None else \"(unset)\"}')"

# 2. PATCH the SMTP fields
inf ""
inf "→ PATCH with Gmail SMTP fields..."
PAYLOAD=$(python3 -c "
import json, os
print(json.dumps({
    'smtp_admin_email': os.environ['GMAIL_USER'],
    'smtp_host': 'smtp.gmail.com',
    'smtp_port': '587',
    'smtp_user': os.environ['GMAIL_USER'],
    'smtp_pass': os.environ['GMAIL_APP_PASSWORD_CLEAN'],
    'smtp_sender_name': 'Strummy',
    'smtp_max_frequency': 60,
}))
" GMAIL_USER="$GMAIL_USER" GMAIL_APP_PASSWORD_CLEAN="$GMAIL_APP_PASSWORD_CLEAN")

PATCH=$(curl -sS -w '\n%{http_code}' -X PATCH \
  -H "Authorization: Bearer ${SUPABASE_PAT}" \
  -H "Content-Type: application/json" \
  -d "$PAYLOAD" \
  "${API}")
PATCH_BODY=$(printf '%s' "$PATCH" | sed '$d')
PATCH_CODE=$(printf '%s' "$PATCH" | tail -n1)
[ "$PATCH_CODE" = "200" ] || err "PATCH returned ${PATCH_CODE}: $(printf '%s' "$PATCH_BODY" | head -c 400)"
ok "PATCH 200"

# 3. GET again to confirm
inf ""
inf "→ GET again to confirm settings landed..."
AFTER=$(curl -sS -H "Authorization: Bearer ${SUPABASE_PAT}" "${API}")
printf '%s' "$AFTER" | python3 -c "
import json, sys
c = json.load(sys.stdin)
keys = ['smtp_admin_email','smtp_host','smtp_port','smtp_user','smtp_pass','smtp_sender_name','smtp_max_frequency']
for k in keys:
    v = c.get(k)
    if k == 'smtp_pass' and v: v = '<set, '+str(len(v))+' chars>'
    print(f'  {k:25s} {v if v is not None else \"(unset)\"}')"

inf ""
ok "Done. Revoke the PAT now at https://supabase.com/dashboard/account/tokens"
