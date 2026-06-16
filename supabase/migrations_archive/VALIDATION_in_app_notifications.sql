-- ============================================================================
-- VALIDATION SCRIPT: in_app_notifications Schema
-- ============================================================================
-- This file contains validation queries to verify the in_app_notifications
-- table schema matches the TypeScript interface requirements.
--
-- DO NOT RUN THIS IN PRODUCTION - This is a testing/validation script only.
--
-- Usage:
--   Run these queries manually to verify schema correctness after migrations.

-- ============================================================================
-- 1. VERIFY TABLE EXISTS
-- ============================================================================

SELECT EXISTS (
  SELECT FROM pg_tables
  WHERE schemaname = 'public'
  AND tablename = 'in_app_notifications'
) AS table_exists;
-- Expected: true

-- ============================================================================
-- 2. VERIFY ALL COLUMNS EXIST WITH CORRECT TYPES
-- ============================================================================

SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'in_app_notifications'
ORDER BY ordinal_position;

-- Expected columns:
-- id               | uuid          | NO  | gen_random_uuid()
-- user_id          | uuid          | NO  | NULL
-- notification_type| USER-DEFINED  | NO  | NULL
-- title            | text          | NO  | NULL
-- body             | text          | NO  | NULL
-- icon             | text          | YES | NULL
-- variant          | text          | YES | 'default'::text
-- is_read          | boolean       | NO  | false
-- read_at          | timestamp...  | YES | NULL
-- action_url       | text          | YES | NULL
-- action_label     | text          | YES | NULL
-- entity_type      | text          | YES | NULL
-- entity_id        | text          | YES | NULL
-- priority         | integer       | NO  | 5
-- created_at       | timestamp...  | NO  | now()
-- updated_at       | timestamp...  | NO  | now()
-- expires_at       | timestamp...  | YES | (now() + '30 days'::interval)

-- ============================================================================
-- 3. VERIFY FOREIGN KEY CONSTRAINTS
-- ============================================================================

SELECT
  tc.constraint_name,
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_name = 'in_app_notifications';

-- Expected:
-- user_id REFERENCES profiles(id) ON DELETE CASCADE

-- ============================================================================
-- 4. VERIFY CHECK CONSTRAINTS
-- ============================================================================

SELECT
  conname AS constraint_name,
  pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'in_app_notifications'::regclass
  AND contype = 'c';

-- Expected:
-- ck_in_app_notifications_priority_range
-- CHECK ((priority >= 1) AND (priority <= 10))

-- ============================================================================
-- 5. VERIFY INDEXES
-- ============================================================================

SELECT
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'in_app_notifications'
ORDER BY indexname;

-- Expected indexes:
-- in_app_notifications_pkey (PRIMARY KEY on id)
-- ix_in_app_notifications_user_unread
-- ix_in_app_notifications_user_all
-- ix_in_app_notifications_entity
-- ix_in_app_notifications_expires

-- ============================================================================
-- 6. VERIFY RLS ENABLED
-- ============================================================================

SELECT
  tablename,
  rowsecurity
FROM pg_tables
WHERE tablename = 'in_app_notifications';

-- Expected: rowsecurity = true

-- ============================================================================
-- 7. VERIFY RLS POLICIES
-- ============================================================================

SELECT
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'in_app_notifications'
ORDER BY policyname;

-- Expected policies:
-- in_app_notifications_select_own (SELECT)
-- in_app_notifications_update_own (UPDATE)
-- in_app_notifications_service_insert (INSERT)
-- in_app_notifications_admin_all (ALL)

-- ============================================================================
-- 8. VERIFY TRIGGER EXISTS
-- ============================================================================

SELECT
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE event_object_table = 'in_app_notifications';

-- Expected:
-- tr_in_app_notifications_updated_at (BEFORE UPDATE)
-- Executes: set_updated_at()

-- ============================================================================
-- 9. VERIFY REALTIME ENABLED
-- ============================================================================

SELECT
  schemaname,
  tablename
FROM pg_publication_tables
WHERE pubname = 'supabase_realtime'
  AND tablename = 'in_app_notifications';

-- Expected: 1 row (table is published to realtime)

-- ============================================================================
-- 10. TEST CONSTRAINT ENFORCEMENT
-- ============================================================================

-- Test 1: Priority too low (should FAIL)
-- INSERT INTO in_app_notifications (user_id, notification_type, title, body, priority)
-- VALUES (
--   '00000000-0000-0000-0000-000000000000',
--   'lesson_reminder_24h',
--   'Test',
--   'Test',
--   0
-- );
-- Expected: ERROR - violates check constraint "ck_in_app_notifications_priority_range"

-- Test 2: Priority too high (should FAIL)
-- INSERT INTO in_app_notifications (user_id, notification_type, title, body, priority)
-- VALUES (
--   '00000000-0000-0000-0000-000000000000',
--   'lesson_reminder_24h',
--   'Test',
--   'Test',
--   11
-- );
-- Expected: ERROR - violates check constraint "ck_in_app_notifications_priority_range"

-- Test 3: Valid priority (should SUCCEED)
-- INSERT INTO in_app_notifications (user_id, notification_type, title, body, priority)
-- VALUES (
--   (SELECT id FROM profiles LIMIT 1),
--   'lesson_reminder_24h',
--   'Test Notification',
--   'This is a test notification',
--   5
-- );
-- Expected: SUCCESS

-- Cleanup test data:
-- DELETE FROM in_app_notifications WHERE title = 'Test Notification';

-- ============================================================================
-- 11. TEST RLS POLICIES
-- ============================================================================

-- Test 1: Verify users can only see their own notifications
-- SET ROLE authenticated;
-- SET request.jwt.claim.sub = '<user_id>';
-- SELECT COUNT(*) FROM in_app_notifications WHERE user_id != '<user_id>';
-- Expected: 0 rows (RLS blocks access to other users' notifications)

-- Test 2: Verify service role can insert
-- SET ROLE service_role;
-- INSERT INTO in_app_notifications (user_id, notification_type, title, body)
-- VALUES ('<user_id>', 'lesson_reminder_24h', 'Test', 'Test');
-- Expected: SUCCESS

-- ============================================================================
-- 12. PERFORMANCE VALIDATION
-- ============================================================================

-- Test 1: Unread count query (should use ix_in_app_notifications_user_unread)
EXPLAIN (ANALYZE, BUFFERS)
SELECT COUNT(*) FROM in_app_notifications
WHERE user_id = (SELECT id FROM profiles LIMIT 1)
  AND is_read = false;
-- Verify: Index Scan using ix_in_app_notifications_user_unread

-- Test 2: Notification list query (should use ix_in_app_notifications_user_all)
EXPLAIN (ANALYZE, BUFFERS)
SELECT * FROM in_app_notifications
WHERE user_id = (SELECT id FROM profiles LIMIT 1)
ORDER BY created_at DESC
LIMIT 50;
-- Verify: Index Scan using ix_in_app_notifications_user_all

-- Test 3: Entity lookup (should use ix_in_app_notifications_entity)
EXPLAIN (ANALYZE, BUFFERS)
SELECT * FROM in_app_notifications
WHERE entity_type = 'lesson'
  AND entity_id = '00000000-0000-0000-0000-000000000000';
-- Verify: Index Scan using ix_in_app_notifications_entity

-- Test 4: Cleanup query (should use ix_in_app_notifications_expires)
EXPLAIN (ANALYZE, BUFFERS)
SELECT * FROM in_app_notifications
WHERE is_read = true
  AND expires_at < now();
-- Verify: Index Scan using ix_in_app_notifications_expires

-- ============================================================================
-- VALIDATION SUMMARY
-- ============================================================================
-- [ ] Table exists with correct name
-- [ ] All 17 columns exist with correct types
-- [ ] Foreign key to profiles(id) with CASCADE delete
-- [ ] Priority check constraint (1-10)
-- [ ] 5 indexes created (1 primary + 4 performance)
-- [ ] RLS enabled
-- [ ] 4 RLS policies created
-- [ ] updated_at trigger exists
-- [ ] Realtime publication enabled
-- [ ] Constraints enforce data integrity
-- [ ] RLS policies enforce security
-- [ ] Indexes optimize query performance

-- ============================================================================
-- END VALIDATION SCRIPT
-- ============================================================================
