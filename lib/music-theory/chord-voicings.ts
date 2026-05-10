import { type NoteName } from './notes';

/**
 * Standard chord-box voicing.
 *
 * `frets` is indexed string 6 (low E) -> string 1 (high E), matching STANDARD_TUNING.
 *   - integer >= 0: fret played (0 = open)
 *   - null: muted string ("x")
 * `fingers` mirrors `frets`:
 *   - 1..4: fretting finger (1 = index)
 *   - 0: open
 *   - null: muted, or no finger info needed
 * `baseFret` is the lowest visible fret in the diagram (1 for open chords).
 * `barre`, when present, paints a single-finger barre across `fromString`..`toString`
 * (string indexes match `frets` — 0 = low E, 5 = high e).
 */
export interface ChordVoicing {
  id: string;
  /** Display name shown to the student, e.g. "Am", "G", "F#m", "Cmaj7". */
  name: string;
  /** Root note from CHROMATIC_NOTES — used for cross-checking against chord intervals. */
  root: NoteName;
  /** Key into CHORD_DEFINITIONS (e.g. "major", "minor", "dominant7"). */
  chordKey: string;
  frets: ReadonlyArray<number | null>;
  fingers: ReadonlyArray<number | null>;
  baseFret: number;
  barre?: { fret: number; fromString: number; toString: number };
}

/**
 * 30 voicings: open chords + a few barre + common 7ths.
 * Hand-curated, validated by chord-voicings.unit.test.ts against getChordNotes().
 */
export const CHORD_VOICINGS: ReadonlyArray<ChordVoicing> = [
  // --- Open major chords ---
  {
    id: 'C-open',
    name: 'C',
    root: 'C',
    chordKey: 'major',
    frets: [null, 3, 2, 0, 1, 0],
    fingers: [null, 3, 2, 0, 1, 0],
    baseFret: 1,
  },
  {
    id: 'A-open',
    name: 'A',
    root: 'A',
    chordKey: 'major',
    frets: [null, 0, 2, 2, 2, 0],
    fingers: [null, 0, 1, 2, 3, 0],
    baseFret: 1,
  },
  {
    id: 'G-open',
    name: 'G',
    root: 'G',
    chordKey: 'major',
    frets: [3, 2, 0, 0, 0, 3],
    fingers: [2, 1, 0, 0, 0, 3],
    baseFret: 1,
  },
  {
    id: 'E-open',
    name: 'E',
    root: 'E',
    chordKey: 'major',
    frets: [0, 2, 2, 1, 0, 0],
    fingers: [0, 2, 3, 1, 0, 0],
    baseFret: 1,
  },
  {
    id: 'D-open',
    name: 'D',
    root: 'D',
    chordKey: 'major',
    frets: [null, null, 0, 2, 3, 2],
    fingers: [null, null, 0, 1, 3, 2],
    baseFret: 1,
  },

  // --- Open minor chords ---
  {
    id: 'Am-open',
    name: 'Am',
    root: 'A',
    chordKey: 'minor',
    frets: [null, 0, 2, 2, 1, 0],
    fingers: [null, 0, 2, 3, 1, 0],
    baseFret: 1,
  },
  {
    id: 'Em-open',
    name: 'Em',
    root: 'E',
    chordKey: 'minor',
    frets: [0, 2, 2, 0, 0, 0],
    fingers: [0, 2, 3, 0, 0, 0],
    baseFret: 1,
  },
  {
    id: 'Dm-open',
    name: 'Dm',
    root: 'D',
    chordKey: 'minor',
    frets: [null, null, 0, 2, 3, 1],
    fingers: [null, null, 0, 2, 3, 1],
    baseFret: 1,
  },

  // --- Open 7th chords ---
  {
    id: 'A7-open',
    name: 'A7',
    root: 'A',
    chordKey: 'dominant7',
    frets: [null, 0, 2, 0, 2, 0],
    fingers: [null, 0, 2, 0, 3, 0],
    baseFret: 1,
  },
  {
    id: 'B7-open',
    name: 'B7',
    root: 'B',
    chordKey: 'dominant7',
    frets: [null, 2, 1, 2, 0, 2],
    fingers: [null, 2, 1, 3, 0, 4],
    baseFret: 1,
  },
  {
    id: 'C7-open',
    name: 'C7',
    root: 'C',
    chordKey: 'dominant7',
    frets: [null, 3, 2, 3, 1, 0],
    fingers: [null, 3, 2, 4, 1, 0],
    baseFret: 1,
  },
  {
    id: 'D7-open',
    name: 'D7',
    root: 'D',
    chordKey: 'dominant7',
    frets: [null, null, 0, 2, 1, 2],
    fingers: [null, null, 0, 2, 1, 3],
    baseFret: 1,
  },
  {
    id: 'E7-open',
    name: 'E7',
    root: 'E',
    chordKey: 'dominant7',
    frets: [0, 2, 0, 1, 0, 0],
    fingers: [0, 2, 0, 1, 0, 0],
    baseFret: 1,
  },
  {
    id: 'G7-open',
    name: 'G7',
    root: 'G',
    chordKey: 'dominant7',
    frets: [3, 2, 0, 0, 0, 1],
    fingers: [3, 2, 0, 0, 0, 1],
    baseFret: 1,
  },
  {
    id: 'Am7-open',
    name: 'Am7',
    root: 'A',
    chordKey: 'minor7',
    frets: [null, 0, 2, 0, 1, 0],
    fingers: [null, 0, 2, 0, 1, 0],
    baseFret: 1,
  },
  {
    id: 'Em7-open',
    name: 'Em7',
    root: 'E',
    chordKey: 'minor7',
    frets: [0, 2, 0, 0, 0, 0],
    fingers: [0, 2, 0, 0, 0, 0],
    baseFret: 1,
  },
  {
    id: 'Dm7-open',
    name: 'Dm7',
    root: 'D',
    chordKey: 'minor7',
    frets: [null, null, 0, 2, 1, 1],
    fingers: [null, null, 0, 2, 1, 1],
    baseFret: 1,
  },
  {
    id: 'Cmaj7-open',
    name: 'Cmaj7',
    root: 'C',
    chordKey: 'major7',
    frets: [null, 3, 2, 0, 0, 0],
    fingers: [null, 3, 2, 0, 0, 0],
    baseFret: 1,
  },
  {
    id: 'Dmaj7-open',
    name: 'Dmaj7',
    root: 'D',
    chordKey: 'major7',
    frets: [null, null, 0, 2, 2, 2],
    fingers: [null, null, 0, 1, 2, 3],
    baseFret: 1,
  },
  {
    id: 'Fmaj7-open',
    name: 'Fmaj7',
    root: 'F',
    chordKey: 'major7',
    frets: [null, null, 3, 2, 1, 0],
    fingers: [null, null, 3, 2, 1, 0],
    baseFret: 1,
  },

  // --- Suspended ---
  {
    id: 'Dsus4-open',
    name: 'Dsus4',
    root: 'D',
    chordKey: 'sus4',
    frets: [null, null, 0, 2, 3, 3],
    fingers: [null, null, 0, 1, 2, 3],
    baseFret: 1,
  },
  {
    id: 'Asus2-open',
    name: 'Asus2',
    root: 'A',
    chordKey: 'sus2',
    frets: [null, 0, 2, 2, 0, 0],
    fingers: [null, 0, 1, 2, 0, 0],
    baseFret: 1,
  },

  // --- Power chords (rock essentials) ---
  {
    id: 'E5-power',
    name: 'E5',
    root: 'E',
    chordKey: 'power',
    frets: [0, 2, 2, null, null, null],
    fingers: [0, 1, 2, null, null, null],
    baseFret: 1,
  },
  {
    id: 'A5-power',
    name: 'A5',
    root: 'A',
    chordKey: 'power',
    frets: [null, 0, 2, 2, null, null],
    fingers: [null, 0, 1, 2, null, null],
    baseFret: 1,
  },

  // --- Barre chords (E-shape and A-shape) ---
  {
    id: 'F-barre',
    name: 'F',
    root: 'F',
    chordKey: 'major',
    frets: [1, 3, 3, 2, 1, 1],
    fingers: [1, 3, 4, 2, 1, 1],
    baseFret: 1,
    barre: { fret: 1, fromString: 0, toString: 5 },
  },
  {
    id: 'Bm-barre',
    name: 'Bm',
    root: 'B',
    chordKey: 'minor',
    frets: [null, 2, 4, 4, 3, 2],
    fingers: [null, 1, 3, 4, 2, 1],
    baseFret: 1,
    barre: { fret: 2, fromString: 1, toString: 5 },
  },
  {
    id: 'Fsharpm-barre',
    name: 'F#m',
    root: 'F#',
    chordKey: 'minor',
    frets: [2, 4, 4, 2, 2, 2],
    fingers: [1, 3, 4, 1, 1, 1],
    baseFret: 1,
    barre: { fret: 2, fromString: 0, toString: 5 },
  },
  {
    id: 'B-barre',
    name: 'B',
    root: 'B',
    chordKey: 'major',
    frets: [null, 2, 4, 4, 4, 2],
    fingers: [null, 1, 2, 3, 4, 1],
    baseFret: 1,
    barre: { fret: 2, fromString: 1, toString: 5 },
  },
  {
    id: 'Csharpm-barre',
    name: 'C#m',
    root: 'C#',
    chordKey: 'minor',
    frets: [null, 4, 6, 6, 5, 4],
    fingers: [null, 1, 3, 4, 2, 1],
    baseFret: 4,
    barre: { fret: 4, fromString: 1, toString: 5 },
  },
  {
    id: 'Gsharpm-barre',
    name: 'G#m',
    root: 'G#',
    chordKey: 'minor',
    frets: [4, 6, 6, 4, 4, 4],
    fingers: [1, 3, 4, 1, 1, 1],
    baseFret: 4,
    barre: { fret: 4, fromString: 0, toString: 5 },
  },
];

export type ChordVoicingId = (typeof CHORD_VOICINGS)[number]['id'];

export function getVoicingById(id: string): ChordVoicing | undefined {
  return CHORD_VOICINGS.find((v) => v.id === id);
}

/** All distinct chord names — useful for distractor generation. */
export const ALL_CHORD_NAMES: ReadonlyArray<string> = Array.from(
  new Set(CHORD_VOICINGS.map((v) => v.name))
);
