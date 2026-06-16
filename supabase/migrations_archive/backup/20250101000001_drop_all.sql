-- Drop everything to start fresh
-- This ensures a clean slate before rebuilding step by step
-- Drop all tables (cascade to remove dependencies)
DROP TABLE IF EXISTS public.task_management CASCADE;
DROP TABLE IF EXISTS public.user_favorites CASCADE;
DROP TABLE IF EXISTS public.lesson_songs CASCADE;
DROP TABLE IF EXISTS public.lessons CASCADE;
DROP TABLE IF EXISTS public.songs CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;
-- Drop all custom types/enums
DROP TYPE IF EXISTS public.task_status CASCADE;
DROP TYPE IF EXISTS public.task_priority CASCADE;
DROP TYPE IF EXISTS public.learning_status CASCADE;
DROP TYPE IF EXISTS public.lesson_status CASCADE;
DROP TYPE IF EXISTS public.music_key CASCADE;
DROP TYPE IF EXISTS public.difficulty_level CASCADE;
-- Drop functions
DROP FUNCTION IF EXISTS public.update_updated_at_column CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_user CASCADE;
-- Note: We keep auth.users table as it's managed by Supabase Auth