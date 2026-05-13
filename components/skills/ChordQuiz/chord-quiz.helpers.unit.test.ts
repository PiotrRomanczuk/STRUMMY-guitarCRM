import { CHORD_VOICINGS } from '@/lib/music-theory/chord-voicings';
import { buildSession, pickDistractors, shuffle } from './chord-quiz.helpers';

/** Deterministic RNG for repeatable tests. Mulberry32 PRNG. */
function seededRng(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

describe('shuffle', () => {
  it('returns an array of the same length', () => {
    const out = shuffle([1, 2, 3, 4, 5], seededRng(1));
    expect(out).toHaveLength(5);
  });

  it('contains the same elements', () => {
    const input = ['a', 'b', 'c', 'd'];
    const out = shuffle(input, seededRng(2));
    expect(out.sort()).toEqual(input.slice().sort());
  });

  it('does not mutate the input', () => {
    const input = [1, 2, 3];
    const snapshot = input.slice();
    shuffle(input, seededRng(3));
    expect(input).toEqual(snapshot);
  });
});

describe('pickDistractors', () => {
  const pool = ['C', 'G', 'D', 'Am', 'Em', 'Dm', 'F', 'Bm'];

  it('returns the requested number of distractors', () => {
    const out = pickDistractors('C', pool, 3, seededRng(42));
    expect(out).toHaveLength(3);
  });

  it('never includes the correct answer', () => {
    for (let seed = 0; seed < 50; seed++) {
      const out = pickDistractors('Am', pool, 3, seededRng(seed));
      expect(out).not.toContain('Am');
    }
  });

  it('never includes duplicates', () => {
    for (let seed = 0; seed < 20; seed++) {
      const out = pickDistractors('C', pool, 3, seededRng(seed));
      expect(new Set(out).size).toBe(out.length);
    }
  });

  it('throws when the pool is too small', () => {
    expect(() => pickDistractors('C', ['C', 'G'], 3)).toThrow();
  });

  it('deduplicates pool entries before selecting', () => {
    const out = pickDistractors('C', ['G', 'G', 'D', 'A', 'E'], 3, seededRng(1));
    expect(new Set(out).size).toBe(3);
  });
});

describe('buildSession', () => {
  it('produces the requested number of questions', () => {
    const session = buildSession(10, CHORD_VOICINGS, seededRng(123));
    expect(session).toHaveLength(10);
  });

  it('every question has exactly 4 unique options', () => {
    const session = buildSession(10, CHORD_VOICINGS, seededRng(7));
    for (const q of session) {
      expect(q.options).toHaveLength(4);
      expect(new Set(q.options).size).toBe(4);
    }
  });

  it('every question contains the correct answer in options', () => {
    const session = buildSession(10, CHORD_VOICINGS, seededRng(11));
    for (const q of session) {
      expect(q.options).toContain(q.voicing.name);
    }
  });

  it('voicing ids do not repeat within a session', () => {
    const session = buildSession(10, CHORD_VOICINGS, seededRng(99));
    const ids = session.map((q) => q.voicing.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('throws when count exceeds pool size', () => {
    expect(() => buildSession(CHORD_VOICINGS.length + 1)).toThrow();
  });
});
