import { CHORD_VOICINGS, ALL_CHORD_NAMES } from '../chord-voicings';
import { getChordNotes } from '../chords';
import { STANDARD_TUNING, getNoteAtFret, type NoteName } from '../notes';

/**
 * Compute the actual sounding notes from a voicing's frets array.
 * Mute markers (null) are skipped.
 */
function notesFromVoicing(frets: ReadonlyArray<number | null>): NoteName[] {
  return frets
    .map((fret, stringIndex) => {
      if (fret === null) return null;
      const openNote = STANDARD_TUNING[stringIndex];
      return getNoteAtFret(openNote, fret);
    })
    .filter((n): n is NoteName => n !== null);
}

describe('CHORD_VOICINGS data integrity', () => {
  it('has at least 25 voicings', () => {
    expect(CHORD_VOICINGS.length).toBeGreaterThanOrEqual(25);
  });

  it('every voicing has unique id', () => {
    const ids = CHORD_VOICINGS.map((v) => v.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('every voicing has 6 frets and 6 fingers', () => {
    for (const v of CHORD_VOICINGS) {
      expect(v.frets).toHaveLength(6);
      expect(v.fingers).toHaveLength(6);
    }
  });

  it('mute markers are aligned between frets and fingers', () => {
    for (const v of CHORD_VOICINGS) {
      v.frets.forEach((f, i) => {
        if (f === null) {
          expect(v.fingers[i]).toBeNull();
        }
      });
    }
  });

  it('frets are non-negative integers when not muted', () => {
    for (const v of CHORD_VOICINGS) {
      for (const f of v.frets) {
        if (f !== null) {
          expect(Number.isInteger(f)).toBe(true);
          expect(f).toBeGreaterThanOrEqual(0);
          expect(f).toBeLessThanOrEqual(15);
        }
      }
    }
  });

  it('finger numbers are 0-4 when present', () => {
    for (const v of CHORD_VOICINGS) {
      for (const f of v.fingers) {
        if (f !== null) {
          expect([0, 1, 2, 3, 4]).toContain(f);
        }
      }
    }
  });
});

describe('CHORD_VOICINGS musical correctness', () => {
  it.each(CHORD_VOICINGS.map((v) => [v.id, v] as const))(
    '%s contains only chord tones (matches its interval set)',
    (_id, v) => {
      const expected = new Set(getChordNotes(v.root, v.chordKey));
      const actual = new Set(notesFromVoicing(v.frets));
      // Every sounding note must be a chord tone.
      for (const note of actual) {
        expect(expected.has(note)).toBe(true);
      }
    }
  );

  it.each(CHORD_VOICINGS.map((v) => [v.id, v] as const))(
    '%s sounds the root somewhere',
    (_id, v) => {
      const actual = notesFromVoicing(v.frets);
      expect(actual).toContain(v.root);
    }
  );
});

describe('ALL_CHORD_NAMES', () => {
  it('contains at least 4 distinct names (needed for distractors)', () => {
    expect(ALL_CHORD_NAMES.length).toBeGreaterThanOrEqual(4);
  });
});
