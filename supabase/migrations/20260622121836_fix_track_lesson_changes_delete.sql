-- Fix track_lesson_changes() AFTER DELETE FK violation.
-- The trigger fires AFTER the lesson is deleted, so lesson_history's FK on
-- lesson_id fails. Wrap the DELETE insert in an exception block so deletions
-- are never blocked by audit failures.

CREATE OR REPLACE FUNCTION public.track_lesson_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
    change_type_value TEXT;
    previous_data_value JSONB;
    new_data_value JSONB;
BEGIN
    IF TG_OP = 'INSERT' THEN
        change_type_value := 'created';
        previous_data_value := NULL;
        new_data_value := to_jsonb(NEW);

    ELSIF TG_OP = 'UPDATE' THEN
        IF OLD.status IS DISTINCT FROM NEW.status THEN
            IF NEW.status = 'cancelled'  THEN change_type_value := 'cancelled';
            ELSIF NEW.status = 'completed' THEN change_type_value := 'completed';
            ELSE change_type_value := 'status_changed';
            END IF;
        ELSIF OLD.scheduled_at IS DISTINCT FROM NEW.scheduled_at THEN
            change_type_value := 'rescheduled';
        ELSE
            change_type_value := 'updated';
        END IF;
        previous_data_value := to_jsonb(OLD);
        new_data_value := to_jsonb(NEW);

    ELSIF TG_OP = 'DELETE' THEN
        -- AFTER DELETE: the lesson row is already gone so the FK on
        -- lesson_history.lesson_id would fail. Best-effort: log and continue.
        BEGIN
            INSERT INTO lesson_history (lesson_id, changed_by, change_type, previous_data, new_data, changed_at)
            VALUES (OLD.id, COALESCE(auth.uid(), OLD.teacher_id), 'deleted', to_jsonb(OLD), to_jsonb(OLD), now());
        EXCEPTION WHEN OTHERS THEN
            RAISE WARNING 'track_lesson_changes DELETE audit skipped for lesson %: %', OLD.id, SQLERRM;
        END;
        RETURN OLD;
    END IF;

    INSERT INTO lesson_history (lesson_id, changed_by, change_type, previous_data, new_data, changed_at)
    VALUES (NEW.id, COALESCE(auth.uid(), NEW.teacher_id), change_type_value, previous_data_value, new_data_value, now());

    RETURN NEW;
END;
$function$;
