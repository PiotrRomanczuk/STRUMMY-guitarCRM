-- Create profiles table
CREATE TABLE public.profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  firstname TEXT,
  lastname TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ
);
-- Basic indexes
CREATE INDEX idx_profiles_username ON public.profiles (username);
CREATE INDEX idx_profiles_email ON public.profiles (email);
-- Removed: idx_profiles_isteacher (column does not exist)
-- Deprecated: Indexes for role columns removed. Roles are now managed in public.user_roles table.