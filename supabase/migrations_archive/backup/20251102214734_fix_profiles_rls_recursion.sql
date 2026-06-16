-- Migration: Fix infinite recursion in profiles RLS policies
-- Problem: Policies that check isAdmin by querying profiles table create infinite recursion
-- Solution: Allow users to always read their own profile, use service role for admin checks
-- Drop the problematic policies that cause recursion
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update any profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can delete any profile" ON public.profiles;
DROP POLICY IF EXISTS "Teachers can view student profiles" ON public.profiles;
-- Recreate "Users can view own profile" to ensure it exists
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles FOR
SELECT
  USING (user_id = auth.uid());
-- For now, we'll handle admin/teacher checks at the application layer
  -- The client-side code will use service role key for admin operations
  -- This prevents infinite recursion while maintaining security
  -- Keep the update policy for users updating their own profile
  DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles FOR
UPDATE
  USING (user_id = auth.uid());
-- Note: Admin and teacher operations on profiles table should use service role key
  -- or be handled through API routes with proper authorization checks