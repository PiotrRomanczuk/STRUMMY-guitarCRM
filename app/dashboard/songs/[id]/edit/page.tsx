import '@/app/editorial-tokens.css';

import { Fraunces, Geist, Geist_Mono } from 'next/font/google';
import { notFound, redirect } from 'next/navigation';

import { SongEditFormEditorial } from '@/components/songs/editorial/edit/SongEditFormEditorial';
import { createClient } from '@/lib/supabase/server';
import { getUserWithRolesSSR } from '@/lib/getUserWithRolesSSR';

const geist = Geist({
  subsets: ['latin'],
  variable: '--font-geist',
  weight: ['300', '400', '500', '600', '700'],
  display: 'swap',
});
const geistMono = Geist_Mono({
  subsets: ['latin'],
  variable: '--font-geist-mono',
  weight: ['400', '500'],
  display: 'swap',
});
const fraunces = Fraunces({
  subsets: ['latin'],
  variable: '--font-fraunces',
  axes: ['opsz'],
  display: 'swap',
});

type PageProps = { params: Promise<{ id: string }> };

export default async function EditSongPage({ params }: PageProps) {
  const { id } = await params;
  const { user, isAdmin, isTeacher } = await getUserWithRolesSSR();
  if (!user) redirect(`/sign-in?redirect=/dashboard/songs/${id}/edit`);
  if (!isAdmin && !isTeacher) redirect(`/dashboard/songs/${id}`);

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('songs')
    .select('id, title, author, level, key, capo_fret, tempo, chords, lyrics_with_chords')
    .eq('id', id)
    .is('deleted_at', null)
    .single();

  if (error || !data) notFound();

  return (
    <div className={`theme-editorial ${geist.variable} ${geistMono.variable} ${fraunces.variable}`}>
      <SongEditFormEditorial song={data as Parameters<typeof SongEditFormEditorial>[0]['song']} />
    </div>
  );
}
