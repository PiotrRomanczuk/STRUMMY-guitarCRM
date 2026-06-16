-- ============================================================================
-- Migration: security_invoker for v_teacher_lesson_trends (Phase 0.5)
-- ============================================================================
-- Audit finding (docs/specs/00-phase-0-restore-truth.md §0.5):
--   v_teacher_lesson_trends was created in
--   20260209000000_mv_teacher_performance.sql WITHOUT an explicit
--   `security_invoker` flag. A view defaults to SECURITY DEFINER semantics
--   (runs with the view owner's privileges), so it bypasses the querying
--   user's RLS policies — a student could read every teacher's lesson trends.
--
--   For contrast, v_lesson_counts_per_teacher (017_views.sql:12) already sets
--   `WITH (security_invoker = true)`.
--
-- Fix: recreate the view WITH (security_invoker = true) so it runs with the
--   caller's privileges and RLS on `profiles`/`lessons` is enforced. The
--   SELECT body is copied verbatim from the original migration.
--
-- Note: materialized views (mv_dashboard_stats, mv_song_popularity,
--   mv_teacher_performance) bypass RLS by nature and are handled separately.
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

COMMENT ON VIEW v_teacher_lesson_trends IS 'Monthly lesson trends per teacher for the last 12 months (security_invoker: enforces caller RLS)';
