-- ============================================================================
-- Migration: Student status-only UPDATE policy on assignments
-- Date: 2026-06-16
-- Spec: docs/specs/03-assignments.md (Divergence / Behavior)
-- ============================================================================
-- Problem: `assignments_update_policy` (migration 20251208000001) admits only
-- admin/teacher. A student moving their own assignment to in_progress/completed
-- runs through RLS as the student and 403s at the DB even though the app layer
-- (updateAssignmentStatus / PATCH student branch) allows it.
--
-- Fix: add a dedicated permissive UPDATE policy scoped to the owning student.
-- RLS is row-level, not column-level, so the *column* restriction (status-only)
-- is enforced at the application layer (server action + PATCH handler), per
-- ADR-0001. WITH CHECK keeps the row owned by the same student (no reassignment).
-- ============================================================================

DROP POLICY IF EXISTS "assignments_student_status_update" ON assignments;

CREATE POLICY "assignments_student_status_update"
ON assignments FOR UPDATE
TO authenticated
USING (student_id = auth.uid())
WITH CHECK (student_id = auth.uid());

COMMENT ON POLICY "assignments_student_status_update" ON assignments IS
  'Allows a student to UPDATE their own assignment row (status transitions). Column-scope (status-only) is enforced in the app layer; WITH CHECK prevents reassigning student_id.';
