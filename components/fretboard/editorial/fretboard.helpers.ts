import {
  CHROMATIC_NOTES,
  getNoteAtFret,
  getSemitoneDistance,
  getIntervalName,
  formatNote,
  SCALE_DEFINITIONS,
  CHORD_DEFINITIONS,
  type NoteName,
} from '@/lib/music-theory';

// Strings shown top-to-bottom: high E (string 1) down to low E (string 6).
export const DISPLAY_STRINGS: NoteName[] = ['E', 'B', 'G', 'D', 'A', 'E'];
export const FRET_COUNT = 12;
export const FRET_MARKERS = new Set([3, 5, 7, 9]);
export const DOUBLE_MARKER = 12;

export type FretMode = 'scale' | 'chord' | 'off';

export interface FretState {
  key: NoteName;
  mode: FretMode;
  scaleKey: string;
  chordKey: string;
}

export interface AnnotatedCell {
  note: NoteName;
  active: boolean;
  isRoot: boolean;
  interval: string; // R, b3, 5, … relative to the root
}

/**
 * Annotate the visible board (6 strings × frets 1..FRET_COUNT) with each
 * cell's note, whether it belongs to the active scale/chord, root flag, and
 * interval name relative to the root.
 */
export function annotateBoard(root: NoteName, activeNotes: NoteName[]): AnnotatedCell[][] {
  const activeSet = new Set(activeNotes);
  return DISPLAY_STRINGS.map((open) => {
    const cells: AnnotatedCell[] = [];
    for (let fret = 1; fret <= FRET_COUNT; fret++) {
      const note = getNoteAtFret(open, fret);
      cells.push({
        note,
        active: activeSet.has(note),
        isRoot: note === root,
        interval: getIntervalName(getSemitoneDistance(root, note)),
      });
    }
    return cells;
  });
}

/** The label shown in a cell: interval name or (enharmonic) note name. */
export function cellLabel(cell: AnnotatedCell, showIntervals: boolean, useFlats: boolean): string {
  return showIntervals ? cell.interval : formatNote(cell.note, useFlats);
}

const FLAT_TO_SHARP: Record<string, string> = {
  Db: 'C#',
  Eb: 'D#',
  Gb: 'F#',
  Ab: 'G#',
  Bb: 'A#',
};

/** Normalize a raw key string (sharp or flat) to a canonical chromatic note. */
export function normalizeKey(raw: string): NoteName | null {
  const cleaned = raw.charAt(0).toUpperCase() + raw.slice(1);
  const sharp = FLAT_TO_SHARP[cleaned] ?? cleaned;
  return (CHROMATIC_NOTES as readonly string[]).includes(sharp) ? (sharp as NoteName) : null;
}

/** Parse fretboard state from a URL query string, falling back per-field. */
export function parseStateFromSearch(search: string, fallback: FretState): FretState {
  const params = new URLSearchParams(search);
  const key = (params.get('key') && normalizeKey(params.get('key')!)) || fallback.key;
  const rawMode = params.get('mode');
  const mode: FretMode = rawMode === 'chord' || rawMode === 'off' ? rawMode : fallback.mode;
  const scaleParam = params.get('scale');
  const chordParam = params.get('chord');
  return {
    key,
    mode,
    scaleKey: scaleParam && SCALE_DEFINITIONS[scaleParam] ? scaleParam : fallback.scaleKey,
    chordKey: chordParam && CHORD_DEFINITIONS[chordParam] ? chordParam : fallback.chordKey,
  };
}

/** Serialize fretboard state to a URL query string (e.g. `?key=A&mode=scale&scale=…`). */
export function stateToSearch(state: FretState): string {
  const params = new URLSearchParams();
  params.set('key', state.key);
  params.set('mode', state.mode);
  if (state.mode === 'scale') params.set('scale', state.scaleKey);
  if (state.mode === 'chord') params.set('chord', state.chordKey);
  return `?${params.toString()}`;
}
