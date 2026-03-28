import { SongFormGuard } from '@/components/songs';
import { getUserWithRolesSSR } from '@/lib/getUserWithRolesSSR';
import { redirect } from 'next/navigation';
import { SongFormV2 } from '@/components/v2/songs/SongForm';
import { SongFormStitch } from '@/components/v2/stitch/songs';
import { getUIVersion } from '@/lib/ui-version.server';

export default async function NewSongPage() {
  const [{ user, isAdmin, isTeacher }, uiVersion] = await Promise.all([
    getUserWithRolesSSR(),
    getUIVersion(),
  ]);
  if (!user) redirect('/sign-in');
  if (!isAdmin && !isTeacher) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div
          className="max-w-xl mx-auto p-6 bg-destructive/10 border border-destructive/20 rounded text-destructive"
          data-testid="song-form-forbidden"
        >
          You do not have permission to create songs.
        </div>
      </div>
    );
  }

  if (uiVersion === 'v3') {
    return <SongFormStitch mode="create" />;
  }

  if (uiVersion === 'v2') {
    return <SongFormV2 mode="create" />;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <SongFormGuard mode="create" />
    </div>
  );
}
