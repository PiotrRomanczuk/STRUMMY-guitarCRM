/**
 * SM-2 spaced repetition for chord quiz.
 * Simplified: binary quality (correct/incorrect) instead of 0–5 scale.
 *
 * Reference: https://www.supermemo.com/en/blog/application-of-a-computer-to-improve-the-results-obtained-in-working-with-the-supermemo-method
 */

export interface SRSCard {
  repetitions: number;
  interval_days: number;
  ease_factor: number;
}

export interface SRSState extends SRSCard {
  next_review_at: string;
  last_reviewed_at: string;
}

const MIN_EASE = 1.3;
export const DEFAULT_EASE = 2.5;

/**
 * Compute next SRS state after answering a chord.
 * Pass `nowMs` explicitly so callers can control time (testable).
 */
export function computeNextSRSState(current: SRSCard, isCorrect: boolean, nowMs: number): SRSState {
  const nowIso = new Date(nowMs).toISOString();

  if (!isCorrect) {
    return {
      repetitions: 0,
      interval_days: 1,
      ease_factor: Math.max(MIN_EASE, current.ease_factor - 0.2),
      last_reviewed_at: nowIso,
      next_review_at: addDaysIso(nowMs, 1),
    };
  }

  let nextInterval: number;
  if (current.repetitions === 0) {
    nextInterval = 1;
  } else if (current.repetitions === 1) {
    nextInterval = 6;
  } else {
    nextInterval = Math.round(current.interval_days * current.ease_factor);
  }

  return {
    repetitions: current.repetitions + 1,
    interval_days: nextInterval,
    ease_factor: current.ease_factor,
    last_reviewed_at: nowIso,
    next_review_at: addDaysIso(nowMs, nextInterval),
  };
}

/** Default state for a chord that has never been reviewed — due immediately. */
export function newSRSCard(nowMs: number): SRSState {
  const nowIso = new Date(nowMs).toISOString();
  return {
    repetitions: 0,
    interval_days: 1,
    ease_factor: DEFAULT_EASE,
    next_review_at: nowIso,
    last_reviewed_at: nowIso,
  };
}

function addDaysIso(nowMs: number, days: number): string {
  const d = new Date(nowMs);
  d.setDate(d.getDate() + days);
  return d.toISOString();
}
