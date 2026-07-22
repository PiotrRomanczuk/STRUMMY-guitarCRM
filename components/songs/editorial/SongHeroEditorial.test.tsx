/**
 * SongHeroEditorial's "Edit song" link is gated behind `canEdit` (teacher/admin
 * only — wired from `isAdmin || isTeacher` in app/dashboard/songs/[id]/page.tsx).
 * This locks in that the link renders when allowed, points at the right route,
 * and — critically — stays absent by default so students never see it.
 */
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { SongHeroEditorial } from './SongHeroEditorial';
import type { Song } from '@/components/songs/types';

const SONG = { id: 'song-abc', title: 'Wonderwall' } as Song;

describe('SongHeroEditorial — edit link gating', () => {
  it('renders no "Edit song" link when canEdit is omitted (students)', () => {
    render(<SongHeroEditorial song={SONG} chordTokens={[]} />);
    expect(screen.queryByRole('link', { name: 'Edit song' })).not.toBeInTheDocument();
  });

  it('renders no "Edit song" link when canEdit is false', () => {
    render(<SongHeroEditorial song={SONG} chordTokens={[]} canEdit={false} />);
    expect(screen.queryByRole('link', { name: 'Edit song' })).not.toBeInTheDocument();
  });

  it('renders an "Edit song" link to the edit route when canEdit is true', () => {
    render(<SongHeroEditorial song={SONG} chordTokens={[]} canEdit />);
    const link = screen.getByRole('link', { name: 'Edit song' });
    expect(link).toHaveAttribute('href', '/dashboard/songs/song-abc/edit');
  });
});
