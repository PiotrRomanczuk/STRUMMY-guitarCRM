-- Migration: drop the deprecated student_song_progress table
-- ============================================================================
-- Blueprint gap SNG-5 (docs/app-blueprint/03-songs-repertoire.md).
--
-- student_song_progress was superseded by student_repertoire in migration
-- 20260222000000 and has had no application readers since — confirmed via a
-- repo-wide search (only generated type files reference the name). It was
-- blocked on PRA-1 removing the last dangling trigger reference; PRA-1
-- (20260718210000) repointed reverse_song_progress_from_practice at
-- student_repertoire, and transfer_shadow_profile_references already guards
-- its own reference behind an information_schema existence check. The one
-- remaining reference, update_song_progress_from_practice, is not attached
-- to any trigger — dead code, dropped alongside the table.
-- ============================================================================

DROP FUNCTION IF EXISTS public.update_song_progress_from_practice() CASCADE;

DROP TABLE IF EXISTS public.student_song_progress CASCADE;
