-- ============================================================================
-- MIGRATION DISABLED - BMS-218
-- ============================================================================
-- This migration references the `user_history` table which does not exist.
-- The table will be created in BMS-219, after which this migration can be enabled.
-- See: https://linear.app/bms95/issue/BMS-219
-- ============================================================================

/*
-- Function to track user profile changes
CREATE OR REPLACE FUNCTION track_user_changes()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- INSERT: New user created
  IF (TG_OP = 'INSERT') THEN
    INSERT INTO user_history (
      user_id,
      changed_by,
      change_type,
      previous_data,
      new_data
    ) VALUES (
      NEW.id,
      auth.uid(),
      'created',
      NULL,
      to_jsonb(NEW)
    );
    RETURN NEW;
  END IF;

  -- UPDATE: User profile modified
  IF (TG_OP = 'UPDATE') THEN
    DECLARE
      v_change_type TEXT := 'updated';
    BEGIN
      -- Check for role flag changes instead of non-existent 'role' column
      IF (OLD.is_admin IS DISTINCT FROM NEW.is_admin) OR
         (OLD.is_teacher IS DISTINCT FROM NEW.is_teacher) OR
         (OLD.is_student IS DISTINCT FROM NEW.is_student) THEN
        v_change_type := 'role_changed';
      ELSIF (OLD.is_active IS DISTINCT FROM NEW.is_active) THEN
        v_change_type := 'status_changed';
      END IF;

      INSERT INTO user_history (
        user_id,
        changed_by,
        change_type,
        previous_data,
        new_data
      ) VALUES (
        NEW.id,
        auth.uid(),
        v_change_type,
        to_jsonb(OLD),
        to_jsonb(NEW)
      );
    END;
    RETURN NEW;
  END IF;

  -- DELETE: User deleted
  IF (TG_OP = 'DELETE') THEN
    INSERT INTO user_history (
      user_id,
      changed_by,
      change_type,
      previous_data,
      new_data
    ) VALUES (
      OLD.id,
      auth.uid(),
      'deleted',
      to_jsonb(OLD),
      NULL
    );
    RETURN OLD;
  END IF;

  RETURN NULL;
END;
$$;

-- Create trigger for profiles table
DROP TRIGGER IF EXISTS trigger_track_user_changes ON profiles;
CREATE TRIGGER trigger_track_user_changes
  AFTER INSERT OR UPDATE OR DELETE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION track_user_changes();

-- Add comment
COMMENT ON FUNCTION track_user_changes() IS 'Automatically tracks all changes to user profiles';
*/
