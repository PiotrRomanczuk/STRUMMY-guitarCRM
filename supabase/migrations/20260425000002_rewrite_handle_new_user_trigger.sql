-- ============================================================================
-- Migration: Rewrite handle_new_user trigger for shadow user linking
-- ============================================================================
-- Previous trigger (20251217000002) matched shadow users by email, but shadow
-- users have placeholder emails (shadow_<uuid>@placeholder.com) so the match
-- never worked. This rewrite:
--   1. Matches by profiles.email (admin-created users with real emails)
--   2. Matches by profiles.invite_email (shadow users who were invited)
--   3. Uses transfer_shadow_profile_references() for comprehensive FK transfer
--   4. Properly handles profile swap with temp-email strategy

-- Drop existing trigger first
DROP TRIGGER IF EXISTS trigger_handle_new_user ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  existing_profile RECORD;
  old_profile_id UUID;
  temp_email TEXT;
  transfer_result JSONB;
BEGIN
  RAISE NOTICE 'handle_new_user triggered for email=%, id=%', new.email, new.id;

  -- Step 1: Look for an existing profile to link
  -- Priority 1: Non-shadow profile with matching email (admin-created user)
  -- Priority 2: Shadow profile with matching invite_email (invited student)
  -- Priority 3: Shadow profile with matching email (edge case: admin set real email on shadow)
  SELECT * INTO existing_profile
  FROM public.profiles
  WHERE (
    (email = new.email AND NOT is_shadow)
    OR (invite_email = new.email AND is_shadow)
    OR (email = new.email AND is_shadow)
  )
    AND id != new.id
  ORDER BY
    CASE
      WHEN email = new.email AND NOT is_shadow THEN 1
      WHEN invite_email = new.email AND is_shadow THEN 2
      WHEN email = new.email AND is_shadow THEN 3
    END
  LIMIT 1;

  IF existing_profile.id IS NOT NULL THEN
    -- Existing profile found - link it to the new auth user
    old_profile_id := existing_profile.id;
    temp_email := 'temp_' || new.id || '@temp.com';

    RAISE NOTICE 'Linking profile: old_id=%, new_id=%, is_shadow=%',
      old_profile_id, new.id, existing_profile.is_shadow;

    -- Step 2: Transfer all FK references from old profile to new ID
    SELECT transfer_shadow_profile_references(old_profile_id, new.id)
      INTO transfer_result;

    RAISE NOTICE 'Transfer result: %', transfer_result;

    -- Step 3: Create new profile with temp email (avoids unique constraint on email)
    INSERT INTO public.profiles (
      id,
      user_id,
      email,
      full_name,
      avatar_url,
      notes,
      phone,
      is_admin,
      is_teacher,
      is_student,
      is_development,
      is_shadow,
      student_status,
      created_at,
      updated_at
    )
    VALUES (
      new.id,
      new.id,
      temp_email,
      COALESCE(new.raw_user_meta_data->>'full_name', existing_profile.full_name),
      COALESCE(new.raw_user_meta_data->>'avatar_url', existing_profile.avatar_url),
      existing_profile.notes,
      existing_profile.phone,
      existing_profile.is_admin,
      existing_profile.is_teacher,
      existing_profile.is_student,
      existing_profile.is_development,
      false,  -- no longer a shadow user
      existing_profile.student_status,
      existing_profile.created_at,
      now()
    );

    -- Step 4: Delete old profile (CASCADE handles user_roles)
    DELETE FROM public.profiles WHERE id = old_profile_id;

    RAISE NOTICE 'Old profile deleted: id=%', old_profile_id;

    -- Step 5: Set correct email on new profile
    UPDATE public.profiles
    SET email = new.email,
        invite_email = NULL  -- clear invite_email after successful link
    WHERE id = new.id;

  ELSE
    -- No existing profile to link - create fresh
    INSERT INTO public.profiles (id, user_id, email, full_name, avatar_url)
    VALUES (
      new.id,
      new.id,
      new.email,
      new.raw_user_meta_data->>'full_name',
      new.raw_user_meta_data->>'avatar_url'
    );
  END IF;

  RETURN new;
END;
$$;

-- Recreate the trigger
CREATE TRIGGER trigger_handle_new_user
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
