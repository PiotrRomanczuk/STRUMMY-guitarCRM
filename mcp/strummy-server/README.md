# Strummy MCP Server

Local MCP server exposing Strummy domain operations to MCP clients (Claude Code, Claude Desktop, Cursor, etc.).

**Scope (v1):** Group 1 — Students. Read-only.

## Why this exists

Lets agents reach for _domain_ operations instead of writing SQL or reading the Next.js codebase each time:

- "How is Emma doing?" → `strummy_get_student` + `strummy_get_student_activity`
- "What songs is John still working on?" → `strummy_get_repertoire`
- "Who's gone quiet lately?" → `strummy_list_students` + filter by `last_completed_lesson`

## Tools (Group 1)

| Tool                           | Purpose                                                              |
| ------------------------------ | -------------------------------------------------------------------- |
| `strummy_get_student`          | Find one student by id/email/name + activity summary.                |
| `strummy_list_students`        | List students by `student_status` (active/archived/lead/trial/all).  |
| `strummy_get_student_activity` | Recent lessons + practice sessions for a student (default 30 days).  |
| `strummy_get_repertoire`       | A student's songs with status, ratings, last practice, song catalog. |

## Architecture

- **Transport:** stdio (local, personal use only).
- **Auth:** Supabase service-role key. **Bypasses RLS by design** — never expose this server remotely.
- **Coupling:** Queries Supabase directly. Does **not** import from `../../lib/...` so it stays decoupled from the Next.js path-alias setup. Schema drift is caught by a smoke test.
- **Files:** `<150 LOC` per file, matches the project's code style rules.

## Setup

```bash
cd mcp/strummy-server
npm install
cp .env.example .env
# fill in SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY (use the LOCAL keys for dev)
npm run build
```

Verify it boots without crashing:

```bash
npm start
# stays running on stdio. Ctrl-C to exit.
```

## Smoke test

Exercises every Group 1 tool against the configured Supabase. Catches schema
drift (renamed/removed columns) the moment a real query goes out:

```bash
# Make sure local Supabase is running first.
npm run smoke
```

Pass: `4 passed, 0 failed`. If a column was renamed in the DB, the matching
tool fails loudly with the underlying error.

## Wire into Claude Code

Add to the project's `.mcp.json`:

```json
{
  "mcpServers": {
    "strummy": {
      "command": "node",
      "args": ["./mcp/strummy-server/dist/index.js"],
      "env": {
        "SUPABASE_URL": "http://127.0.0.1:54321",
        "SUPABASE_SERVICE_ROLE_KEY": "${SUPABASE_SERVICE_ROLE_KEY}"
      }
    }
  }
}
```

The service-role key should come from your shell env, not be inlined in `.mcp.json` — that file is committed.

## Development

```bash
npm run dev         # tsx, hot
npm run typecheck   # tsc --noEmit
npm run build       # compile to dist/
```

## Roadmap

- **v1 (this scaffold):** Group 1 — Students, read-only.
- **v2:** Groups 2–4 — Lessons, Songs catalog, Practice & feedback.
- **v3:** Group 5 — Insights (cohort, weekly, teacher performance).
- **v4:** Group 6 — Generative tools wrapping skills (lesson plans, snapshots).
- **v5:** Writes (assign_song, update_repertoire_status, add_lesson_note) — only after the reads have shaken out.

See the design discussion in the PR for full v2+ tool sketch.
