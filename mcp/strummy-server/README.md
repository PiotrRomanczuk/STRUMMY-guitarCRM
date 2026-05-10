# Strummy MCP Server

Local MCP server exposing Strummy domain operations to MCP clients (Claude Code, Claude Desktop, Cursor, etc.).

**Scope (v3):** Groups 1–3 — Students, Lessons, and Songs catalog. Read-only.

## Why this exists

Lets agents reach for _domain_ operations instead of writing SQL or reading the Next.js codebase each time:

- "How is Emma doing?" → `strummy_get_student` + `strummy_get_student_activity`
- "What songs is John still working on?" → `strummy_get_repertoire`
- "Who's gone quiet lately?" → `strummy_list_students` + filter by `last_completed_lesson`
- "What's on this week?" → `strummy_get_upcoming_lessons`
- "What did I cover with Marek last lesson?" → `strummy_list_lessons` → `strummy_get_lesson`
- "Find me a beginner song with D, G, and Em" → `strummy_find_songs({ level: 'beginner', contains_chords: ['D','G','Em'] })`
- "What's the song of the week?" → `strummy_song_of_the_week`

## Tools

### Group 1 — Students

| Tool                           | Purpose                                                              |
| ------------------------------ | -------------------------------------------------------------------- |
| `strummy_get_student`          | Find one student by id/email/name + activity summary.                |
| `strummy_list_students`        | List students by `student_status` (active/archived/lead/trial/all).  |
| `strummy_get_student_activity` | Recent lessons + practice sessions for a student (default 30 days).  |
| `strummy_get_repertoire`       | A student's songs with status, ratings, last practice, song catalog. |

### Group 2 — Lessons

| Tool                           | Purpose                                                                   |
| ------------------------------ | ------------------------------------------------------------------------- |
| `strummy_get_lesson`           | A single lesson with detail + lesson_songs joined to song catalog.        |
| `strummy_list_lessons`         | Lesson summaries (no notes body); filter by student/teacher/status/range. |
| `strummy_get_upcoming_lessons` | SCHEDULED lessons in the next N days (default 7), with student summaries. |

### Group 3 — Songs catalog

| Tool                       | Purpose                                                                                  |
| -------------------------- | ---------------------------------------------------------------------------------------- |
| `strummy_find_songs`       | Search the catalog by query / level / key / category / contains_chords. Excludes drafts. |
| `strummy_get_song`         | Full song detail + parsed chord array + attached videos + students-learning count.       |
| `strummy_song_of_the_week` | Current song of the week (today within active range), optionally with recent history.    |

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

- **v1:** Group 1 — Students, read-only. ✅
- **v2:** Group 2 — Lessons, read-only. ✅
- **v3 (current):** Group 3 — Songs catalog, read-only. ✅
- **v4:** Group 4 — Practice & feedback.
- **v5:** Group 5 — Insights (cohort, weekly, teacher performance).
- **v6:** Group 6 — Generative tools wrapping skills (lesson plans, snapshots).
- **v7:** Writes (assign_song, update_repertoire_status, add_lesson_note) — only after the reads have shaken out.

See the design discussion in the PR for full v2+ tool sketch.
