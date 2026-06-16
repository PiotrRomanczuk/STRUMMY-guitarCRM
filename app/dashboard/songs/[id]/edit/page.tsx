import '@/app/design-preview/editorial-tokens.css';

import { Fraunces, Geist, Geist_Mono } from 'next/font/google';
import Link from 'next/link';
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
      <div
        style={{
          background: 'var(--ivory)',
          color: 'var(--ink)',
          minHeight: '100%',
          padding: '32px 32px 64px',
        }}
      >
        <div style={{ maxWidth: 640, margin: '0 auto' }}>
          <Link
            href={`/dashboard/songs/${id}`}
            style={{
              fontFamily: 'var(--mono)',
              fontSize: 11,
              color: 'var(--ink-4)',
              textDecoration: 'none',
              textTransform: 'uppercase',
              letterSpacing: '.14em',
            }}
          >
            ← Song
          </Link>
          <h1
            style={{
              margin: '8px 0 6px',
              fontFamily: 'var(--serif)',
              fontWeight: 400,
              fontSize: 40,
              letterSpacing: '-0.02em',
              fontStyle: 'italic',
            }}
          >
            Edit {data.title ?? 'song'}
          </h1>
          <p style={{ margin: '0 0 22px', fontSize: 14, color: 'var(--ink-3)', lineHeight: 1.55 }}>
            The basics plus sections &amp; lyrics. Cover art, audio, and tab notation get edited
            from the detail view.
          </p>
          <SongEditFormEditorial
            song={data as Parameters<typeof SongEditFormEditorial>[0]['song']}
          />
        </div>
      </div>
    </div>
  );
}
