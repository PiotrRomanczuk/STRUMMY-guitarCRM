-- ============================================================================
-- Migration: Decouple lesson_history / assignment_history from their source FKs
-- ============================================================================
-- 2026-06-08
--
-- BUG: track_lesson_changes() / track_assignment_changes() are AFTER DELETE
-- triggers that INSERT a 'deleted' history row referencing OLD.id. By the time
-- they fire, the source row is already gone, so the FK check fails with:
--
--   ERROR: insert or update on table "lesson_history" violates foreign key
--          constraint "lesson_history_lesson_id_fkey"
--   PL/pgSQL function track_lesson_changes() line N at SQL statement
--   (SQLSTATE 23503)
--
-- This means deleting any lesson or assignment via the regular API path is
-- impossible — the deletion fails wholesale because of the audit trigger.
-- Surfaced by scripts/verify/index.ts crud lessons → admin DELETE cell.
--
-- WHY DROPPING THE FK IS THE RIGHT FIX:
-- Audit logs are by design decoupled from current state. The audited entity
-- can be hard-deleted, soft-deleted, or restored, and the audit trail should
-- outlive any of those operations. The previous_data JSONB already preserves
-- a full snapshot of the deleted row, so no information is lost when the
-- FK is removed. Read paths (components/logs/SystemLogs.tsx, __tests__/history/*)
-- query by lesson_id value, not via FK-enforced joins, so they're unaffected.
--
-- Alternatives considered and rejected:
--   * BEFORE DELETE trigger — works for insertion, but ON DELETE CASCADE on
--     the FK would then immediately remove the row we just wrote.
--   * DEFERRABLE INITIALLY DEFERRED — FK check still runs at commit, by which
--     time the parent row is still gone. Doesn't help.
--   * ON DELETE SET NULL + nullable lesson_id — would need lesson_id NOT NULL
--     constraint relaxed; doesn't help the immediate INSERT either, since the
--     FK is checked on INSERT regardless of ON DELETE behavior.

ALTER TABLE lesson_history
  DROP CONSTRAINT IF EXISTS lesson_history_lesson_id_fkey;

ALTER TABLE assignment_history
  DROP CONSTRAINT IF EXISTS assignment_history_assignment_id_fkey;

COMMENT ON COLUMN lesson_history.lesson_id IS
  'Lesson id at time of audit. Not FK-enforced — audit rows outlive their source. JOIN at read time and tolerate NULLs/orphans.';

COMMENT ON COLUMN assignment_history.assignment_id IS
  'Assignment id at time of audit. Not FK-enforced — audit rows outlive their source. JOIN at read time and tolerate NULLs/orphans.';
