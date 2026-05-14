-- Drop FK on user_history.user_id to allow profile deletion.
-- The track_user_changes AFTER DELETE trigger inserts into user_history using
-- OLD.id as user_id, but the RESTRICT FK blocked it because the profile is
-- already gone by the time the AFTER trigger fires. user_history is an audit
-- log and does not need referential integrity — deleted user IDs are preserved
-- for historical record.
ALTER TABLE user_history
  DROP CONSTRAINT IF EXISTS user_history_user_id_fkey;
