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

  if (uiVersion === 'v2') {
    const supabase = await createClient();
    const { data: songs } = await supabase
      .from('songs')
      .select('id, title, author, level, key, chords, youtube_url, ultimate_guitar_link, gallery_images, created_at, updated_at')
      .order('created_at', { ascending: false });

    return (
      <SongListPageV2
        initialSongs={(songs || []) as SongWithStatus[]}
        isTeacher={isAdmin || isTeacher}
      />
    );
  }

  return (
    <div className="container mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 lg:py-8 max-w-7xl space-y-8">
      <SongList searchParams={searchParams} />
      <SongRequestQueue />
    </div>
  );
}
