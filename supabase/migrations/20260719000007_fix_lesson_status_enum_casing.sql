-- ============================================================================
-- Migration: Fix lesson_status enum casing drift
-- Date: 2026-07-19
-- ============================================================================
-- Every migration that creates lesson_status (003_enums.sql,
-- 20251107121500_create_enums.sql) and every write-side consumer
-- (schemas/LessonSchema.ts's LessonStatusEnum, LessonForm.Fields.tsx's
-- status dropdown, app/actions/lesson-edit.ts, app/dashboard/lessons/
-- recurring-actions.ts) use uppercase values ('SCHEDULED', 'IN_PROGRESS',
-- 'COMPLETED', 'CANCELLED'). This local dev database's actual enum had
-- drifted to lowercase out-of-band — no migration in this repo ever created
-- lowercase labels — silently breaking every lesson insert/update on this
-- environment (masked in tests because the mocked-Supabase Jest suites
-- never touch the real enum, and only a couple of read/display call sites
-- — lib/services/lessons-queries.ts's STATUS_LABELS/STATUS_COLOURS,
-- app/dashboard/lessons/page.tsx's STATUS_KEYS — were ever patched
-- defensively to also accept lowercase).
--
-- RENAME VALUE is metadata-only: existing rows keep the same underlying
-- enum OID, so this is a zero-downtime, zero-data-loss, instant rename
-- that brings the enum back in line with every migration and every
-- write-side consumer in the repo. The lowercase branches in the
-- display-layer maps above are left in place as a harmless no-op fallback
-- rather than touched here (out of scope for this fix).
-- ============================================================================

ALTER TYPE lesson_status RENAME VALUE 'scheduled' TO 'SCHEDULED';
ALTER TYPE lesson_status RENAME VALUE 'in_progress' TO 'IN_PROGRESS';
ALTER TYPE lesson_status RENAME VALUE 'completed' TO 'COMPLETED';
ALTER TYPE lesson_status RENAME VALUE 'cancelled' TO 'CANCELLED';
