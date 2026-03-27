#!/usr/bin/env bash
#
# send-to-strummy.sh — Create a song in Strummy from a Spotify URL
#
# Usage:
#   ./scripts/send-to-strummy.sh <spotify_url>
#   ./scripts/send-to-strummy.sh                  # reads from clipboard
#   ./scripts/send-to-strummy.sh --debug <url>    # dry-run (no DB insert)
#
# Environment:
#   STRUMMY_API_KEY   — required, your gcrm_... API key
#   STRUMMY_BASE_URL  — optional, defaults to http://localhost:3000

set -euo pipefail

# --- Config ---
API_KEY="${STRUMMY_API_KEY:-}"
BASE_URL="${STRUMMY_BASE_URL:-http://localhost:3000}"
DEBUG_MODE=false

# --- Parse args ---
if [[ "${1:-}" == "--debug" ]]; then
  DEBUG_MODE=true
  shift
fi

SPOTIFY_URL="${1:-}"

# If no URL provided, try clipboard
if [[ -z "$SPOTIFY_URL" ]]; then
  if command -v pbpaste &>/dev/null; then
    SPOTIFY_URL=$(pbpaste)
    echo "📋 Read from clipboard: $SPOTIFY_URL"
  else
    echo "❌ No URL provided and clipboard not available"
    echo "Usage: $0 [--debug] <spotify_url>"
    exit 1
  fi
fi

# Validate it looks like a Spotify URL
if [[ ! "$SPOTIFY_URL" =~ spotify ]]; then
  echo "❌ Does not look like a Spotify URL: $SPOTIFY_URL"
  exit 1
fi

if [[ -z "$API_KEY" ]]; then
  echo "❌ STRUMMY_API_KEY not set"
  echo "Export it: export STRUMMY_API_KEY=gcrm_your_key_here"
  exit 1
fi

echo "🎵 Spotify URL: $SPOTIFY_URL"
echo "🌐 Target: $BASE_URL"
echo ""

if $DEBUG_MODE; then
  # --- Debug mode: dry run ---
  echo "🔍 Debug mode (dry run)..."
  RESPONSE=$(curl -s "$BASE_URL/api/song/from-spotify/debug?url=$(python3 -c "import urllib.parse; print(urllib.parse.quote('$SPOTIFY_URL', safe=''))")" \
    -H "Authorization: Bearer $API_KEY")

  # Parse and display each step
  echo "$RESPONSE" | python3 -c "
import sys, json

data = json.load(sys.stdin)
steps = data.get('steps', [])

if not steps:
    print('❌ No pipeline steps returned')
    if 'error' in data:
        print(f'   Error: {data[\"error\"]}')
    sys.exit(1)

icons = {'success': '✅', 'error': '❌', 'skipped': '⚠️'}

for i, step in enumerate(steps, 1):
    icon = icons.get(step['status'], '❓')
    ms = step.get('durationMs', 0)
    print(f'{icon} Step {i}: {step[\"name\"]} ({ms}ms)')

    if step.get('output'):
        for k, v in step['output'].items():
            if k.startswith('_'):
                continue
            val = str(v)[:80]
            print(f'   {k}: {val}')

    if step.get('error'):
        print(f'   ⚠️  {step[\"error\"]}')

    print()

passed = sum(1 for s in steps if s['status'] == 'success')
total = len(steps)
print(f'Pipeline: {passed}/{total} steps passed')
"
else
  # --- Create mode ---
  echo "📤 Creating song..."
  HTTP_CODE=$(curl -s -o /tmp/strummy-response.json -w "%{http_code}" \
    "$BASE_URL/api/song/from-spotify" \
    -H "Authorization: Bearer $API_KEY" \
    -H "Content-Type: application/json" \
    -d "{\"spotify_url\": \"$SPOTIFY_URL\"}")

  RESPONSE=$(cat /tmp/strummy-response.json)

  case "$HTTP_CODE" in
    201)
      echo "$RESPONSE" | python3 -c "
import sys, json
d = json.load(sys.stdin)
s = d['song']
print(f'✅ Created: {s[\"title\"]} by {s[\"author\"]}')
print(f'   Draft: {s[\"is_draft\"]}')
print(f'   Spotify: {s[\"spotify_link_url\"]}')
if s.get('cover_image_url'):
    print(f'   Cover: {s[\"cover_image_url\"][:60]}...')
if s.get('tempo'):
    print(f'   Tempo: {s[\"tempo\"]} BPM')
if s.get('key'):
    print(f'   Key: {s[\"key\"]}')
if s.get('release_year'):
    print(f'   Year: {s[\"release_year\"]}')
print(f'   ID: {s[\"id\"]}')
"
      ;;
    400)
      echo "❌ Bad request: $(echo "$RESPONSE" | python3 -c "import sys,json; print(json.load(sys.stdin).get('error','unknown'))")"
      ;;
    401)
      echo "❌ Unauthorized — check your STRUMMY_API_KEY"
      ;;
    403)
      echo "❌ Forbidden — your account needs teacher or admin role"
      ;;
    409)
      echo "⚠️  Song already exists in Strummy"
      ;;
    502)
      echo "❌ Spotify API error — couldn't fetch track data"
      ;;
    *)
      echo "❌ HTTP $HTTP_CODE: $RESPONSE"
      ;;
  esac

  rm -f /tmp/strummy-response.json
fi
