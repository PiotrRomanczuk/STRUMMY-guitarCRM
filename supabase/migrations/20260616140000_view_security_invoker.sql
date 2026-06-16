-- ============================================================================
-- Migration: Add security_invoker to v_teacher_lesson_trends (Phase 0.5)
-- Date: 2026-06-16
-- Spec: docs/specs/00-phase-0-restore-truth.md §0.5
-- ============================================================================
-- Without WITH (security_invoker = true) a view runs as the definer
-- (postgres / service_role) and bypasses RLS. A student could query
-- v_teacher_lesson_trends and see rows for other teachers. This migration
-- recreates the view with the flag so all callers are subject to RLS.
--
-- Applied to production 2026-06-16 via prod_catchup_20260616.sql §8.
-- This migration canonicalises it for local dev and future resets.
-- ============================================================================

CREATE OR REPLACE VIEW v_teacher_lesson_trends
  WITH (security_invoker = true)
AS
SELECT
    p.id AS teacher_id,
    date_trunc('month', l.scheduled_at) AS month,

    COUNT(*) FILTER (WHERE l.status = 'COMPLETED') AS completed,
    COUNT(*) FILTER (WHERE l.status = 'CANCELLED') AS cancelled,
    COUNT(*) FILTER (WHERE l.status = 'SCHEDULED') AS scheduled,
    COUNT(*) AS total

FROM profiles p
LEFT JOIN lessons l ON l.teacher_id = p.id
    AND l.deleted_at IS NULL
    AND l.scheduled_at >= date_trunc('month', now() - interval '12 months')
    AND l.scheduled_at < date_trunc('month', now() + interval '1 month')

WHERE (p.is_teacher OR p.is_admin)
  AND p.is_active = true

GROUP BY p.id, date_trunc('month', l.scheduled_at)
ORDER BY p.id, month DESC;

COMMENT ON VIEW v_teacher_lesson_trends IS 'Monthly lesson trends per teacher for the last 12 months';
