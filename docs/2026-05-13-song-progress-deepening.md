# Song Progress — Implementation Plan

Branch: `refactor/STRUM-song-progress-deepening`

## Goal

Make the Song Progress module explicit and consistent. Currently the cascade trigger is invisible to application code, the status enum has drifted between DB and app, a deprecated write path still exists, and Progress History is not being written. This plan closes all four gaps with no frontend changes.

## Critical files

| File                                                        | Change                                            |
| ----------------------------------------------------------- | ------------------------------------------------- |
| `supabase/migrations/<timestamp>_song_progress_cleanup.sql` | New migration (see Step 1)                        |
| `schemas/LessonSchema.ts`                                   | Remove `slow_tempo` from `SongStatusEnum`         |
| `schemas/StudentRepertoireSchema.ts`                        | Remove `slow_tempo` from `SongProgressStatusEnum` |
| `types/LessonSongs.ts`                                      | Remove `SLOW_TEMPO` from `SongStatus` enum        |
| `app/api/student/song-status/route.ts`                      | Delete entirely                                   |
| `app/api/student/song-status-history/route.ts`              | Keep — read path, no changes                      |

---

## Step 1 — Migration

One migration file, two operations:

### 1a — Remove `slow_tempo` from enum

```sql
-- Postgres cannot ALTER ENUM to remove a value directly.
-- Create new enum, swap columns, drop old.

ALTER TYPE song_progress_status RENAME TO song_progress_status_old;

CREATE TYPE song_progress_status AS ENUM (
  'to_learn',
  'started',
  'remembered',
  'with_author',
  'mastered'
);

-- Swap on lesson_songs
ALTER TABLE lesson_songs
  ALTER COLUMN status TYPE song_progress_status
  USING status::text::song_progress_status;

-- Swap on student_repertoire
ALTER TABLE student_repertoire
  ALTER COLUMN current_status TYPE song_progress_status
  USING current_status::text::song_progress_status;

DROP TYPE song_progress_status_old;
```

> Verify no rows have `status = 'slow_tempo'` before running:
> `SELECT COUNT(*) FROM lesson_songs WHERE status = 'slow_tempo';`
> `SELECT COUNT(*) FROM student_repertoire WHERE current_status = 'slow_tempo';`

### 1b — Add Progress History trigger

```sql
CREATE OR REPLACE FUNCTION fn_record_progress_history()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.current_status IS DISTINCT FROM NEW.current_status THEN
    INSERT INTO song_status_history (
      student_id,
      song_id,
      previous_status,
      new_status,
      changed_at
    ) VALUES (
      NEW.student_id,
      NEW.song_id,
      OLD.current_status,
      NEW.current_status,
      NOW()
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER tr_student_repertoire_record_history
  AFTER UPDATE OF current_status
  ON student_repertoire
  FOR EACH ROW
  EXECUTE FUNCTION fn_record_progress_history();
```

---

## Step 2 — Align schemas and types

### `schemas/LessonSchema.ts`

Remove `'slow_tempo'` from `SongStatusEnum` (or wherever the status enum is exported from this file).

### `schemas/StudentRepertoireSchema.ts`

Remove `'slow_tempo'` from any status enum defined here.

### `types/LessonSongs.ts`

Remove `SLOW_TEMPO = "slow_tempo"` from the `SongStatus` TypeScript enum.

After these changes, DB enum and application types agree on exactly 5 values.

---

## Step 3 — Delete deprecated write path

Delete `app/api/student/song-status/route.ts` entirely.

Then grep for any remaining imports or callers:

```bash
grep -rn "song-status" app/ lib/ --include="*.ts" | grep -v "song-status-history" | grep -v "node_modules"
```

Remove any dead references found.

---

## Verification

1. **Pre-migration check** — confirm zero `slow_tempo` rows in both tables (query above).

2. **Migration runs clean** — `supabase db push` (local) with no errors.

3. **Type check passes** — `npm run build` (or `tsc --noEmit`) with no type errors after schema/type changes.

4. **History trigger fires** — in local Supabase, update a `student_repertoire.current_status` manually and verify a row appears in `song_status_history`.

5. **Both write paths recorded** — set `lesson_songs.status` for a lesson (cascade path) and also call `updateRepertoireEntryAction` directly; confirm both produce history rows.

6. **Deleted route returns 404** — `curl -X PUT /api/student/song-status` should 404.

7. **History read route still works** — `GET /api/student/song-status-history` returns data.

---

## What does NOT change

- `fn_sync_lesson_song_to_repertoire` cascade trigger — untouched
- `app/actions/repertoire.ts` `updateRepertoireEntryAction` — untouched (regression allowed by design; timestamp logic needed for direct path)
- `app/api/student/song-status-history/route.ts` — read-only, untouched
- All lesson song write routes — untouched
- Any frontend components — out of scope

---

## Future work (A2)

When lesson context in history is needed: extend `fn_record_progress_history` to accept `lesson_id` as a column on `student_repertoire` (set transiently by the cascade trigger before the history trigger fires), or move history writing into `fn_sync_lesson_song_to_repertoire` directly and add a separate trigger for the direct-override path.
