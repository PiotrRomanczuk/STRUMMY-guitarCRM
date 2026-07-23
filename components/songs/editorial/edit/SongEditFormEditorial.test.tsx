import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { SongEditFormEditorial } from './SongEditFormEditorial';

jest.mock('@/app/actions/song-edit', () => ({
  updateSongAction: jest.fn(),
}));

const song = {
  id: 's1',
  title: 'Wonderwall',
  author: 'Oasis',
  level: 'intermediate',
  key: 'Em',
  capo_fret: 2,
  tempo: 87,
  chords: 'Em7 G Dsus4 A7sus4 Cadd9',
  lyrics_with_chords: '[Em7]Today is [G]gonna be the day',
};

describe('SongEditFormEditorial', () => {
  it('pre-fills every field from the song prop', () => {
    render(<SongEditFormEditorial song={song} />);
    expect(screen.getByRole('heading', { name: 'Edit Wonderwall' })).toBeInTheDocument();
    expect(screen.getByDisplayValue('Wonderwall')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Oasis')).toBeInTheDocument();
    expect(screen.getByDisplayValue('2')).toBeInTheDocument();
    expect(screen.getByDisplayValue('87')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Em7 G Dsus4 A7sus4 Cadd9')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Save changes' })).toBeInTheDocument();
  });

  it('updates the live preview as title/author/level/key change', () => {
    render(<SongEditFormEditorial song={song} />);
    fireEvent.change(screen.getByDisplayValue('Wonderwall'), {
      target: { value: 'Wonderwall (Acoustic)' },
    });
    expect(screen.getByText('Wonderwall (Acoustic)')).toBeInTheDocument();
  });

  it('submits the hidden song id alongside the form action', () => {
    render(<SongEditFormEditorial song={song} />);
    expect(document.querySelector('input[type="hidden"][name="id"]')).toHaveValue('s1');
  });
});
