import { getScaleNotes, getChordNotes } from '@/lib/music-theory';

import {
  annotateBoard,
  cellLabel,
  normalizeKey,
  parseStateFromSearch,
  stateToSearch,
  DISPLAY_STRINGS,
  FRET_COUNT,
  type FretState,
} from './fretboard.helpers';

const DEFAULT: FretState = {
  key: 'A',
  mode: 'scale',
  scaleKey: 'pentatonic_minor',
  chordKey: 'minor',
};

describe('annotateBoard', () => {
  it('builds a 6-string × FRET_COUNT grid', () => {
    const board = annotateBoard('A', getScaleNotes('A', 'pentatonic_minor'));
    expect(board).toHaveLength(DISPLAY_STRINGS.length);
    board.forEach((row) => expect(row).toHaveLength(FRET_COUNT));
  });

  it('flags the root, scale membership, and interval names', () => {
    const board = annotateBoard('A', getScaleNotes('A', 'pentatonic_minor'));
    // High-E string (row 0), fret 5 → A (the root).
    const rootCell = board[0][4];
    expect(rootCell.note).toBe('A');
    expect(rootCell.isRoot).toBe(true);
    expect(rootCell.active).toBe(true);
    expect(rootCell.interval).toBe('R');

    // High-E string, fret 1 → F, which is NOT in A pentatonic minor.
    const offScale = board[0][0];
    expect(offScale.note).toBe('F');
    expect(offScale.active).toBe(false);
    expect(offScale.isRoot).toBe(false);
  });

  it('marks chord tones active in chord mode', () => {
    const board = annotateBoard('A', getChordNotes('A', 'minor')); // A C E
    const cMinorThird = board[0][7]; // high-E fret 8 → C
    expect(cMinorThird.note).toBe('C');
    expect(cMinorThird.active).toBe(true);
    expect(cMinorThird.interval).toBe('b3');
  });
});

describe('cellLabel', () => {
  const board = annotateBoard('A', getScaleNotes('A', 'pentatonic_minor'));

  it('shows the note name by default and the interval when requested', () => {
    const root = board[0][4];
    expect(cellLabel(root, false, false)).toBe('A');
    expect(cellLabel(root, true, false)).toBe('R');
  });

  it('renders enharmonic flats when useFlats is on', () => {
    const cSharp = annotateBoard('A', [])[0][8]; // high-E fret 9 → C#
    expect(cSharp.note).toBe('C#');
    expect(cellLabel(cSharp, false, true)).toBe('Db');
  });
});

describe('normalizeKey', () => {
  it('accepts sharps, flats, and lowercase', () => {
    expect(normalizeKey('C')).toBe('C');
    expect(normalizeKey('c#')).toBe('C#');
    expect(normalizeKey('Db')).toBe('C#');
    expect(normalizeKey('Bb')).toBe('A#');
  });

  it('rejects nonsense', () => {
    expect(normalizeKey('H')).toBeNull();
    expect(normalizeKey('')).toBeNull();
  });
});

describe('URL state round-trip', () => {
  it('serializes scale mode and parses it back', () => {
    const state: FretState = { key: 'C', mode: 'scale', scaleKey: 'major', chordKey: 'minor' };
    const search = stateToSearch(state);
    expect(search).toContain('key=C');
    expect(search).toContain('mode=scale');
    expect(search).toContain('scale=major');
    expect(parseStateFromSearch(search, DEFAULT)).toEqual(state);
  });

  it('omits the scale param in chord mode and parses chord back', () => {
    const search = stateToSearch({
      key: 'D',
      mode: 'chord',
      scaleKey: 'major',
      chordKey: 'minor7',
    });
    expect(search).toContain('chord=minor7');
    expect(search).not.toContain('scale=');
    const parsed = parseStateFromSearch(search, DEFAULT);
    expect(parsed.mode).toBe('chord');
    expect(parsed.chordKey).toBe('minor7');
  });

  it('falls back on invalid params', () => {
    const parsed = parseStateFromSearch('?key=H&mode=bogus&scale=nope', DEFAULT);
    expect(parsed).toEqual(DEFAULT);
  });
});
