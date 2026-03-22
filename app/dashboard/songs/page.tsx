import { SongList } from '@/components/songs';
import { getUserWithRolesSSR } from '@/lib/getUserWithRolesSSR';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { StudentSongsPageClient } from '@/components/songs/student/StudentSongsPageClient';
import { SongRequestButton } from '@/components/songs/requests/SongRequestButton';
import { SongRequestQueue } from '@/components/songs/requests/SongRequestQueue';
import { SongListPageV2 } from '@/components/v2/songs/SongListPage';
import { getUIVersion } from '@/lib/ui-version.server';
import type { SongWithStatus } from '@/components/songs/types';

type Props = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function SongsPage(props: Props) {
  const searchParams = await props.searchParams;
  const [{ user, isAdmin, isTeacher, isStudent }, uiVersion] = await Promise.all([
    getUserWithRolesSSR(),
    getUIVersion(),
  ]);

  if (!user) {
    redirect('/sign-in');
  }

  // v2 handles all roles via isTeacher prop — students get read-only
  if (uiVersion === 'v2') {
    const supabase = await createClient();
    const isTeacherOrAdmin = isAdmin || isTeacher;

    // Scope songs: teachers see songs from their lessons, students see songs from their lessons
    const lessonFilter = isTeacherOrAdmin
      ? supabase
          .from('lesson_songs')
          .select('song_id, lessons!inner(teacher_id)')
          .eq('lessons.teacher_id', user.id)
      : supabase
          .from('lesson_songs')
          .select('song_id, lessons!inner(student_id)')
          .eq('lessons.student_id', user.id);

    const { data: lessonSongLinks } = await lessonFilter;
    const scopedSongIds = [...new Set((lessonSongLinks ?? []).map((r) => r.song_id))];

    const { data: songs } = scopedSongIds.length > 0
      ? await supabase
          .from('songs')
          .select('id, title, author, level, key, chords, category, tempo, release_year, capo_fret, strumming_pattern, youtube_url, spotify_link_url, ultimate_guitar_link, cover_image_url, gallery_images, lyrics_with_chords, created_at, updated_at')
          .in('id', scopedSongIds)
          .order('created_at', { ascending: false })
      : { data: [] };

    return (
      <SongListPageV2
        initialSongs={(songs || []) as SongWithStatus[]}
        isTeacher={isTeacherOrAdmin}
      />
    );
  }

  // v1 fallback: students get the v1 student view
  if (isStudent && !isAdmin && !isTeacher) {
    return (
      <div>
        <StudentSongsPageClient />
        <div className="px-4 sm:px-8 pb-8">
          <SongRequestButton />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 lg:py-8 max-w-7xl space-y-8">
      <SongList searchParams={searchParams} />
      <SongRequestQueue />
    </div>
  );
}
