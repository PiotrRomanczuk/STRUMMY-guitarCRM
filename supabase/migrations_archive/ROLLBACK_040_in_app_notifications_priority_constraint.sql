-- ============================================================================
-- ROLLBACK: Migration 040 - Remove Priority Check Constraint
-- ============================================================================
-- This rollback script removes the priority check constraint added in
-- migration 040. Use this if the constraint causes issues in production.
--
-- WARNING: This will allow priority values outside 1-10 range after rollback.

-- ============================================================================
-- REMOVE CHECK CONSTRAINT
-- ============================================================================

ALTER TABLE in_app_notifications
  DROP CONSTRAINT IF EXISTS ck_in_app_notifications_priority_range;

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Verify constraint is removed:
SELECT
  conname AS constraint_name,
  pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'in_app_notifications'::regclass
  AND contype = 'c'
  AND conname = 'ck_in_app_notifications_priority_range';
-- Expected: 0 rows

-- ============================================================================
-- ROLLBACK COMPLETE
-- ============================================================================
-- The priority field will still exist but will accept any integer value.
-- The TypeScript interface will continue to enforce 1-10 range client-side.
