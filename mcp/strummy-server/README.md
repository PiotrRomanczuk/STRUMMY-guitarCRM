# Strummy MCP Server

Local MCP server exposing Strummy domain operations to MCP clients (Claude Code, Claude Desktop, Cursor, etc.).

**Scope (v6):** Groups 1–6 — Students, Lessons, Songs catalog, Practice & feedback, Insights, Generative context. Read-only.

## Why this exists

Lets agents reach for _domain_ operations instead of writing SQL or reading the Next.js codebase each time:

- "How is Emma doing?" → `strummy_get_student` + `strummy_get_student_activity`
- "What songs is John still working on?" → `strummy_get_repertoire`
- "Who's gone quiet lately?" → `strummy_list_students` + filter by `last_completed_lesson`
- "What's on this week?" → `strummy_get_upcoming_lessons`
- "What did I cover with Marek last lesson?" → `strummy_list_lessons` → `strummy_get_lesson`
- "Find me a beginner song with D, G, and Em" → `strummy_find_songs({ level: 'beginner', contains_chords: ['D','G','Em'] })`
- "What's the song of the week?" → `strummy_song_of_the_week`
- "How much has Marek practiced this month?" → `strummy_get_practice_summary({ student_id, since_days: 30 })`
- "What did Emma practice yesterday?" → `strummy_get_practice_log({ student_id, since_days: 1 })`
- "Give me a top-line view of the studio" → `strummy_get_overview`
- "Are lessons trending up over the last 6 months?" → `strummy_lesson_trends({ months: 6 })`
- "Plan tomorrow's 30-min lesson with Marek" → `strummy_lesson_plan_context({ student_id, duration_min: 30 })` → you compose
- "Write a parent-facing progress snapshot for Emma's last month" → `strummy_progress_snapshot_context`
- "Build a 5-day practice schedule for Sarah" → `strummy_practice_schedule_context`

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

### Group 4 — Practice & feedback

| Tool                           | Purpose                                                                               |
| ------------------------------ | ------------------------------------------------------------------------------------- |
| `strummy_get_practice_log`     | Practice sessions for a student over a window (default 30d), joined to song titles.   |
| `strummy_get_practice_summary` | Aggregates: total minutes, sessions, distinct days/songs, avg per session, top songs. |

### Group 5 — Insights (agent-friendly summaries)

| Tool                    | Purpose                                                                              |
| ----------------------- | ------------------------------------------------------------------------------------ |
| `strummy_get_overview`  | Top-line counts in a window: students by status, lessons by status, songs, mastery.  |
| `strummy_lesson_trends` | Lessons bucketed by month for the last N months (default 6). Empty months filled in. |

These are intentionally simpler than the in-app analytics dashboards (`weekly-insights`, `cohort-analytics`, `teacher-performance`). They run as direct queries to keep the MCP decoupled from `lib/services/*` — for richer analytics, use the dashboard.

### Group 6 — Generative context (data-only, no LLM call)

| Tool                                | Purpose                                                                                                                   |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `strummy_lesson_plan_context`       | Bundle of inputs to compose a lesson plan: student, last 3 lessons, plateaued/ready/started songs, last 7d practice.      |
| `strummy_progress_snapshot_context` | Bundle of inputs for a parent-facing snapshot over a window: lessons, practice totals, mastered/started in range.         |
| `strummy_practice_schedule_context` | Bundle of inputs to compose a weekly schedule: repertoire bucketed plateaued/in_progress/review + suggested distribution. |

These tools **do NOT call an LLM**. They bundle the data an agent (Claude Desktop, Cursor, Claude Code) needs to compose the artifact in one roundtrip. The calling agent does the synthesis. Keeps the MCP a thin local stdio adapter and lets the smartest available LLM produce the final text.

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
- **v3:** Group 3 — Songs catalog, read-only. ✅
- **v4:** Group 4 — Practice & feedback, read-only. ✅
- **v5:** Group 5 — Insights (overview + lesson trends), read-only. ✅
- **v6 (current):** Group 6 — Generative context tools (lesson plan / snapshot / practice schedule), read-only. ✅
- **v7:** Writes (assign_song, update_repertoire_status, add_lesson_note) — only after the reads have shaken out.

See the design discussion in the PR for full v2+ tool sketch.
