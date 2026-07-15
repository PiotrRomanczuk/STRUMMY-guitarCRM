-- ============================================================================
-- Migration: Fix song soft-delete cascade to deactivate student_repertoire
-- Guitar CRM
-- ============================================================================
-- Previously, soft_delete_song_with_cascade() removed lesson_songs junction
-- rows but never touched student_repertoire, and hardcoded
-- `favorite_assignments_removed: 0`. That left repertoire entries pointing at a
-- soft-deleted song still marked is_active = true, so they surfaced in active
-- repertoire views and aggregates.
--
-- We DEACTIVATE (is_active = false) rather than delete these rows: song
-- soft-delete is reversible and repertoire carries real progress/practice
-- history we must not destroy. The function now returns the actual count of
-- deactivated rows via the existing `favorite_assignments_removed` key
-- (consumed as `userFavoritesDeleted` in app/api/song/handlers.ts).
-- ============================================================================

CREATE OR REPLACE FUNCTION soft_delete_song_with_cascade(song_uuid UUID, user_uuid UUID)
RETURNS JSON AS $$
DECLARE
    song_record RECORD;
    lesson_assignments_count INTEGER;
    repertoire_deactivated_count INTEGER;
    result JSON;
BEGIN
    -- Check if song exists and is not already deleted
    SELECT * INTO song_record FROM songs WHERE id = song_uuid AND deleted_at IS NULL;
    IF NOT FOUND THEN
        RETURN json_build_object('success', false, 'error', 'Song not found or already deleted');
    END IF;

    -- Check for active lesson assignments
    IF has_active_lesson_assignments(song_uuid) THEN
        RETURN json_build_object('success', false, 'error', 'Cannot delete song with active lesson assignments');
    END IF;

    -- Count related records before deletion
    SELECT COUNT(*) INTO lesson_assignments_count FROM lesson_songs WHERE song_id = song_uuid;

    -- Soft delete the song
    UPDATE songs SET deleted_at = NOW() WHERE id = song_uuid;

    -- Cascade: Remove lesson song assignments (hard delete since they're junction records)
    DELETE FROM lesson_songs WHERE song_id = song_uuid;

    -- Cascade: Deactivate student repertoire entries for this song.
    -- Preserve the rows (progress/practice history) but hide them from active
    -- views, since a soft-deleted song must not surface as active repertoire.
    UPDATE student_repertoire
        SET is_active = false, updated_at = NOW()
        WHERE song_id = song_uuid AND is_active = true;
    GET DIAGNOSTICS repertoire_deactivated_count = ROW_COUNT;

    -- Return success with counts
    RETURN json_build_object(
        'success', true,
        'lesson_assignments_removed', lesson_assignments_count,
        'favorite_assignments_removed', repertoire_deactivated_count
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
