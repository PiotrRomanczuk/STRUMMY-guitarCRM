-- Add isDevelopment column to profiles table
-- This column is used to identify development/test users in the system
ALTER TABLE
  public.profiles
ADD
  COLUMN IF NOT EXISTS isDevelopment BOOLEAN DEFAULT FALSE;
-- Create index for faster queries
  CREATE INDEX IF NOT EXISTS idx_profiles_isDevelopment ON public.profiles (isDevelopment);
-- Update comment
  COMMENT ON COLUMN public.profiles.isDevelopment IS 'Flag to identify development/test users for easier cleanup and filtering';