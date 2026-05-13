-- Song Progress History Trigger
--
-- Adds an AFTER UPDATE trigger on student_repertoire that writes to
-- song_status_history whenever current_status changes. Fires on both
-- write paths (lesson cascade and direct repertoire override).
--
-- SECURITY DEFINER so it can always insert into song_status_history
-- regardless of the RLS context of the calling session.

CREATE OR REPLACE FUNCTION fn_record_progress_history()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.current_status IS DISTINCT FROM NEW.current_status THEN
    INSERT INTO song_status_history (
      student_id,
      song_id,
      previous_status,
      new_status,
      changed_at
    ) VALUES (
      NEW.student_id,
      NEW.song_id,
      OLD.current_status::text,
      NEW.current_status::text,
      NOW()
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER tr_student_repertoire_record_history
  AFTER UPDATE OF current_status
  ON student_repertoire
  FOR EACH ROW
  EXECUTE FUNCTION fn_record_progress_history();
