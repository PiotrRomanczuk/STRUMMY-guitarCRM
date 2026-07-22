# Dev studio seed (`StudentDevelopment` stack)

_2026-07-19_

Populates the **dev** Supabase stack (`StudentDevelopment`, `uwh:55321`) with a realistic
small studio so song / dashboard / role views aren't empty. Reuses the existing 15 curated
songs — never creates duplicate songs, never touches the 3 real login accounts (beyond wiring
them into the graph).

## What it creates

- 11 **shadow** students (`user_id NULL`, `is_shadow`, `@seed.dev.local`) + `student@dev.local` = 12 students
- 1 shadow teacher + `teacher@dev.local` = 2 teachers
- ~45 lessons (past `COMPLETED`/`CANCELLED`, upcoming `SCHEDULED`), ~79 `lesson_songs` covering **every** song
- ~50 `student_repertoire` rows with mixed mastery (every song has ≥2 active learners)
- ~30 assignments (mixed status)

`teacher@dev.local` teaches the whole roster; `student@dev.local` gets repertoire + assignments

- lessons, so logging in as each role shows populated views.

## Run

```bash
python3 scripts/database/seeding/dev/gen-dev-studio-seed.py > scripts/database/seeding/dev/dev-studio-seed.sql
ssh uwh "docker exec -i supabase_db_StudentDevelopment psql -U postgres -v ON_ERROR_STOP=1" \
  < scripts/database/seeding/dev/dev-studio-seed.sql
```

Deterministic (fixed RNG seed) and **idempotent** — every row is tagged `seed:dev-studio`; a
re-run deletes the prior seed (and its shadow profiles) first, so counts stay stable.

## Notes

- The SQL runs under `SET session_replication_role = replica` (triggers bypassed) for the whole
  transaction. Shadow students have no `auth.users` row, but `song_status_history` / notify
  triggers FK `student_id → users` and would fail. We insert repertoire directly and set
  `lesson_teacher_number` ourselves, so no trigger is needed. Restored to `DEFAULT` before COMMIT.
- Targets the dev stack directly via `docker exec` — the repo's other seeders hardcode
  `127.0.0.1:54321` and create their own songs, so they don't fit here.

## Remove the seed

```sql
DELETE FROM assignments        WHERE description   = 'seed:dev-studio';
DELETE FROM student_repertoire WHERE teacher_notes = 'seed:dev-studio';
DELETE FROM lesson_songs       WHERE lesson_id IN (SELECT id FROM lessons WHERE notes = 'seed:dev-studio');
DELETE FROM lessons            WHERE notes         = 'seed:dev-studio';
DELETE FROM profiles           WHERE is_development = true AND email LIKE '%@seed.dev.local';
```
