import { CHORD_VOICINGS, type ChordVoicing } from '@/lib/music-theory/chord-voicings';

export interface QuizQuestion {
  voicing: ChordVoicing;
  /** 4 chord names; one of them equals voicing.name. */
  options: string[];
}

/**
 * Pick `n` chord-name distractors from `pool` that are not equal to `correctName`.
 * Throws if the pool can't supply enough unique distractors.
 */
export function pickDistractors(
  correctName: string,
  pool: ReadonlyArray<string>,
  n: number,
  rng: () => number = Math.random
): string[] {
  const candidates = Array.from(new Set(pool)).filter((name) => name !== correctName);
  if (candidates.length < n) {
    throw new Error(
      `Cannot pick ${n} distractors: pool only has ${candidates.length} candidates other than "${correctName}"`
    );
  }
  return shuffle(candidates, rng).slice(0, n);
}

/**
 * Build a quiz session of `count` questions. Voicings are sampled without
 * replacement from `pool`, so no chord repeats within a session.
 * Each question gets 3 unique distractors plus the correct answer, shuffled.
 */
export function buildSession(
  count: number,
  pool: ReadonlyArray<ChordVoicing> = CHORD_VOICINGS,
  rng: () => number = Math.random
): QuizQuestion[] {
  if (count > pool.length) {
    throw new Error(
      `Cannot build session of ${count} questions from a pool of ${pool.length} voicings`
    );
  }
  const allNames = Array.from(new Set(pool.map((v) => v.name)));
  const sampled = shuffle(pool, rng).slice(0, count);
  return sampled.map((voicing) => {
    const distractors = pickDistractors(voicing.name, allNames, 3, rng);
    const options = shuffle([voicing.name, ...distractors], rng);
    return { voicing, options };
  });
}

/** Fisher-Yates shuffle, non-mutating. */
export function shuffle<T>(arr: ReadonlyArray<T>, rng: () => number = Math.random): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
