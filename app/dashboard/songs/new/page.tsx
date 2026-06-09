import '@/app/design-preview/editorial-tokens.css';

import { Fraunces, Geist, Geist_Mono } from 'next/font/google';
import Link from 'next/link';
import { redirect } from 'next/navigation';

import { SongFormEditorial } from '@/components/songs/editorial/form/SongFormEditorial';
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

export default async function NewSongPage() {
  const { user, isAdmin, isTeacher } = await getUserWithRolesSSR();
  if (!user) {
    redirect('/sign-in?redirect=/dashboard/songs/new');
  }
  if (!isAdmin && !isTeacher) {
    redirect('/dashboard');
  }

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
          <div style={{ marginBottom: 22 }}>
            <Link
              href="/dashboard/songs"
              style={{
                fontFamily: 'var(--mono)',
                fontSize: 11,
                color: 'var(--ink-4)',
                textDecoration: 'none',
                textTransform: 'uppercase',
                letterSpacing: '.14em',
              }}
            >
              ← Songs
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
              Add a song
            </h1>
            <p
              style={{
                margin: 0,
                fontSize: 14,
                color: 'var(--ink-3)',
                lineHeight: 1.55,
              }}
            >
              The basics — title, author, level, key. Cover art, audio, lyrics, and tab notation get
              attached after the song lands in your library.
            </p>
          </div>
          <SongFormEditorial />
        </div>
      </div>
    </div>
  );
}
