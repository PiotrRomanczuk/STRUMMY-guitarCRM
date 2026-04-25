-- ============================================================================
-- Migration: Drop legacy pending_students table
-- ============================================================================
-- The pending_students table was the original mechanism for pre-registering
-- students before signup. It has been superseded by the shadow user system
-- (is_shadow flag on profiles). No application code references this table.

-- Drop RLS policies
DROP POLICY IF EXISTS pending_students_select ON pending_students;
DROP POLICY IF EXISTS pending_students_insert ON pending_students;
DROP POLICY IF EXISTS pending_students_update ON pending_students;
DROP POLICY IF EXISTS pending_students_delete ON pending_students;
DROP POLICY IF EXISTS "pending_students_select_policy" ON pending_students;
DROP POLICY IF EXISTS "pending_students_insert_policy" ON pending_students;

-- Drop the table
DROP TABLE IF EXISTS pending_students;
