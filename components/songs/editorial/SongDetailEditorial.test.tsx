/**
 * Shell tests for SongDetailEditorial — the page-level component behind
 * /dashboard/songs/[id]. SongHeroEditorial has its own dedicated test
 * (SongHeroEditorial.test.tsx) covering the full "Edit song" link render
 * matrix in isolation, so this suite only smoke-checks that the hero renders
 * and that the shell forwards `canEdit` correctly. The rest focuses on what
 * the shell itself owns: role-gated sidebar content (Usage/Learners for
 * staff vs. Your Progress for students), the chords card, related songs, and
 * whether the Production tab switcher mounts at all (teacher/admin only).
 */
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

import { SongDetailEditorial } from './SongDetailEditorial';
import type { Song } from '@/components/songs/types';
import type {
  RelatedSongRow,
  SongLearner,
  SongUsageStats,
} from '@/lib/services/song-detail-queries';

const SONG = {
  id: 'song-abc',
  title: 'Wonderwall',
  author: 'Oasis',
  level: 'beginner',
  key: 'Em',
  chords: 'C G Am F',
  capo_fret: 2,
  tempo: 87,
  duration_ms: 258000,
  release_year: 1995,
  cover_image_url: null,
} as Song;

const STATS: SongUsageStats = {
  assignedTo: 5,
  usedInLessons: 12,
  inLibrarySince: '2026-01-15T00:00:00Z',
  avgMastery: 62,
};

const LEARNERS: SongLearner[] = [
  {
    studentId: 'student-1',
    fullName: 'Emma Smith',
    email: 'emma@strummy.app',
    status: 'started',
    totalPracticeMinutes: 90,
    lastPracticedAt: '2026-07-01T00:00:00Z',
  },
];

const RELATED: RelatedSongRow[] = [
  { id: 'song-related-1', title: 'Blackbird', author: 'The Beatles', songKey: 'D' },
];

describe('SongDetailEditorial shell', () => {
  it('renders the song title via the hero (smoke check)', () => {
    render(
      <SongDetailEditorial
        song={SONG}
        stats={STATS}
        learners={LEARNERS}
        related={RELATED}
        canSeeProduction={false}
      />
    );
    expect(screen.getByRole('heading', { name: 'Wonderwall' })).toBeInTheDocument();
  });

  it('renders the parsed chord tokens from the song in the chords card', () => {
    render(
      <SongDetailEditorial
        song={SONG}
        stats={STATS}
        learners={LEARNERS}
        related={RELATED}
        canSeeProduction={false}
      />
    );
    expect(screen.getByText('C')).toBeInTheDocument();
    expect(screen.getByText('G')).toBeInTheDocument();
    expect(screen.getByText('Am')).toBeInTheDocument();
    expect(screen.getByText('F')).toBeInTheDocument();
  });

  it('teacher/admin view: renders Usage + Learners cards and mounts the tab switcher', () => {
    render(
      <SongDetailEditorial
        song={SONG}
        stats={STATS}
        learners={LEARNERS}
        related={RELATED}
        canSeeProduction
      />
    );
    expect(screen.getByText('Usage')).toBeInTheDocument();
    expect(screen.getByText('Students')).toBeInTheDocument();
    expect(screen.getByText('Emma S.')).toBeInTheDocument();
    expect(screen.queryByText('Progress')).not.toBeInTheDocument();
    expect(screen.getByRole('tablist')).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Overview' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Production' })).toBeInTheDocument();
  });

  it('student view: renders Your Progress card and does not mount the tab switcher', () => {
    render(
      <SongDetailEditorial
        song={SONG}
        stats={STATS}
        learners={LEARNERS}
        related={RELATED}
        canSeeProduction={false}
      />
    );
    expect(screen.getByText('Progress')).toBeInTheDocument();
    expect(screen.queryByText('Usage')).not.toBeInTheDocument();
    expect(screen.queryByText('Students')).not.toBeInTheDocument();
    expect(screen.queryByRole('tablist')).not.toBeInTheDocument();
  });

  it('renders related songs linking to their own detail page', () => {
    render(
      <SongDetailEditorial
        song={SONG}
        stats={STATS}
        learners={LEARNERS}
        related={RELATED}
        canSeeProduction={false}
      />
    );
    const link = screen.getByRole('link', { name: /Blackbird/ });
    expect(link).toHaveAttribute('href', '/dashboard/songs/song-related-1');
  });

  it('omits the "Edit song" link by default (canEdit not passed — students)', () => {
    render(
      <SongDetailEditorial
        song={SONG}
        stats={STATS}
        learners={LEARNERS}
        related={RELATED}
        canSeeProduction={false}
      />
    );
    expect(screen.queryByRole('link', { name: 'Edit song' })).not.toBeInTheDocument();
  });

  it('forwards canEdit to the hero, rendering an "Edit song" link to the edit route', () => {
    render(
      <SongDetailEditorial
        song={SONG}
        stats={STATS}
        learners={LEARNERS}
        related={RELATED}
        canSeeProduction
        canEdit
      />
    );
    const link = screen.getByRole('link', { name: 'Edit song' });
    expect(link).toHaveAttribute('href', '/dashboard/songs/song-abc/edit');
  });
});
