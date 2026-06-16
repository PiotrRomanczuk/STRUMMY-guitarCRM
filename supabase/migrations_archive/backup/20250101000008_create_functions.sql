CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, username, email, firstname, lastname)
  VALUES (
    NEW.id,
    COALESCE(
      NEW.raw_user_meta_data ->> 'username',
      'user_' || substring(NEW.id::text, 1, 8)
    ),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'firstname', NULL),
    COALESCE(NEW.raw_user_meta_data ->> 'lastname', NULL)
  );
  RETURN NEW;
END;
$$;
