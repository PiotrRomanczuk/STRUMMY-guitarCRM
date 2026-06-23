-- Fix: signup-entered names were not persisted to the profile.
-- The sign-up action stores first_name/last_name in auth user metadata, but
-- handle_new_user only read raw_user_meta_data->>'full_name' (never set by the
-- form) and ignored first_name/last_name entirely — so profiles.first_name,
-- last_name and full_name all ended up empty and the app greeted users by their
-- email instead of their name.
--
-- This rewrites handle_new_user to populate first_name, last_name and a derived
-- full_name from metadata, in both the shadow-link branch and the new-user
-- branch. full_name prefers an explicit metadata full_name (e.g. Google OAuth),
-- otherwise it is built from first + last name.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  existing_profile RECORD;
  old_profile_id uuid;
  meta_first text := new.raw_user_meta_data->>'first_name';
  meta_last  text := new.raw_user_meta_data->>'last_name';
  meta_full  text := new.raw_user_meta_data->>'full_name';
BEGIN
  RAISE NOTICE 'handle_new_user triggered for email=%, id=%', new.email, new.id;

  -- Prefer shadow profiles matched by invite_email (new flow: placeholder email + invite_email).
  -- Fall back to direct email match (legacy flow: real email on profile).
  SELECT * INTO existing_profile
  FROM public.profiles
  WHERE (invite_email = new.email AND is_shadow = true)
     OR email = new.email
  ORDER BY
    -- invite_email match wins over email match
    CASE WHEN invite_email = new.email AND is_shadow = true THEN 0 ELSE 1 END,
    created_at DESC
  LIMIT 1;

  IF existing_profile.id IS NOT NULL THEN
    old_profile_id := existing_profile.id;
    RAISE NOTICE 'Linking profile: old_id=%, new_id=%, email=%', old_profile_id, new.id, new.email;

    UPDATE public.lessons   SET student_id = new.id WHERE student_id = old_profile_id;
    UPDATE public.lessons   SET teacher_id = new.id WHERE teacher_id = old_profile_id;
    UPDATE public.assignments SET student_id = new.id WHERE student_id = old_profile_id;
    UPDATE public.assignments SET teacher_id = new.id WHERE teacher_id = old_profile_id;
    UPDATE public.user_roles  SET user_id   = new.id WHERE user_id   = old_profile_id;

    DELETE FROM public.profiles WHERE id = old_profile_id;

    INSERT INTO public.profiles (
      id, user_id, email, first_name, last_name, full_name, avatar_url, notes, phone,
      is_admin, is_teacher, is_student, is_development, created_at, updated_at
    ) VALUES (
      new.id, new.id, new.email,
      COALESCE(NULLIF(meta_first, ''), existing_profile.first_name),
      COALESCE(NULLIF(meta_last, ''), existing_profile.last_name),
      COALESCE(
        NULLIF(meta_full, ''),
        existing_profile.full_name,
        NULLIF(TRIM(CONCAT_WS(' ', meta_first, meta_last)), '')
      ),
      COALESCE(new.raw_user_meta_data->>'avatar_url', existing_profile.avatar_url),
      existing_profile.notes, existing_profile.phone,
      existing_profile.is_admin, existing_profile.is_teacher,
      existing_profile.is_student, existing_profile.is_development,
      existing_profile.created_at, now()
    );

  ELSE
    INSERT INTO public.profiles (
      id, user_id, email, first_name, last_name, full_name, avatar_url
    )
    VALUES (
      new.id, new.id, new.email,
      NULLIF(meta_first, ''),
      NULLIF(meta_last, ''),
      COALESCE(
        NULLIF(meta_full, ''),
        NULLIF(TRIM(CONCAT_WS(' ', meta_first, meta_last)), '')
      ),
      new.raw_user_meta_data->>'avatar_url'
    );
  END IF;

  RETURN new;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Error in handle_new_user for email %: % %', new.email, SQLERRM, SQLSTATE;
    RETURN new;
END;
$function$;
