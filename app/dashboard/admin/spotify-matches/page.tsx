import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { getUIVersion } from '@/lib/ui-version.server';
import { SpotifyMatchesClient } from '@/components/dashboard/admin/SpotifyMatchesClient';
import { SpotifyQueueV2 } from '@/components/v2/admin';

export const metadata = {
  title: 'Spotify Matches Review | Admin Dashboard',
  description: 'Review and approve pending Spotify song matches',
};

export default async function SpotifyMatchesPage() {
  const supabase = await createClient();

  // Check authentication
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/sign-in');
  }

  // Check permissions
  const { data: profile } = await supabase
    .from('user_overview')
    .select('is_admin, is_teacher')
    .eq('user_id', user.id)
    .single();

  if (!profile?.is_admin && !profile?.is_teacher) {
    redirect('/dashboard');
  }

  const uiVersion = await getUIVersion();

  if (uiVersion === 'v2') {
    return <SpotifyQueueV2 />;
  }

  return (
    <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 max-w-7xl space-y-6 sm:space-y-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Spotify Matches Review</h1>
        <p className="text-sm sm:text-base text-muted-foreground">
          Review and approve songs with confidence scores below 85%
        </p>
      </div>

      <SpotifyMatchesClient />
    </main>
  );
}
