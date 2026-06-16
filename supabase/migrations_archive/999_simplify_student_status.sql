-- Simplify student_status enum from 5 values to 2 values: active/archived
-- Migration: 999_simplify_student_status.sql

-- Step 1: Create new simplified enum
CREATE TYPE student_status_new AS ENUM ('active', 'archived');

-- Step 2: Add temporary column with new enum
ALTER TABLE profiles ADD COLUMN student_status_new student_status_new;

-- Step 3: Migrate existing data
-- Map old values to new values:
--   'active' -> 'active'
--   'inactive', 'lead', 'trial', 'churned' -> 'archived'
UPDATE profiles
SET student_status_new = CASE
  WHEN student_status = 'active' THEN 'active'::student_status_new
  ELSE 'archived'::student_status_new
END;

-- Step 4: Drop old column and rename new one
ALTER TABLE profiles DROP COLUMN student_status;
ALTER TABLE profiles RENAME COLUMN student_status_new TO student_status;

-- Step 5: Drop old enum type
DROP TYPE IF EXISTS student_status_old CASCADE;

-- Step 6: Set default to 'archived' (safe default)
ALTER TABLE profiles ALTER COLUMN student_status SET DEFAULT 'archived'::student_status_new;
ALTER TABLE profiles ALTER COLUMN student_status SET NOT NULL;

-- Step 7: Add helpful comment
COMMENT ON COLUMN profiles.student_status IS 'Student engagement status: active (taking lessons) or archived (not currently engaged)';
