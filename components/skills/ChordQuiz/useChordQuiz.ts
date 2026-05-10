'use client';

import { useCallback, useMemo, useRef, useState } from 'react';
import { CHORD_VOICINGS } from '@/lib/music-theory/chord-voicings';
import { type ChordQuizAttemptInput } from '@/schemas/ChordQuizAttemptSchema';
import { buildSession, type QuizQuestion } from './chord-quiz.helpers';

export type QuizPhase = 'answering' | 'reveal' | 'finished';

export interface UseChordQuizOptions {
  questionCount: number;
  /** Override the chord pool — primarily for testing or future difficulty tiers. */
  pool?: typeof CHORD_VOICINGS;
}

export interface UseChordQuizState {
  questions: QuizQuestion[];
  currentIndex: number;
  current: QuizQuestion | undefined;
  phase: QuizPhase;
  selected: string | null;
  attempts: ChordQuizAttemptInput[];
  score: number;
  selectAnswer: (option: string) => void;
  next: () => void;
  restart: () => void;
}

/**
 * Owns quiz session state. Tracks per-question response time, accumulates
 * attempts in shape ready to ship to the server action.
 */
export function useChordQuiz({ questionCount, pool }: UseChordQuizOptions): UseChordQuizState {
  const [sessionKey, setSessionKey] = useState(0);
  const questions = useMemo(
    () => buildSession(questionCount, pool ?? CHORD_VOICINGS),
    // sessionKey is intentionally a dep — bumping it rebuilds the session.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [questionCount, pool, sessionKey]
  );

  const [currentIndex, setCurrentIndex] = useState(0);
  const [phase, setPhase] = useState<QuizPhase>('answering');
  const [selected, setSelected] = useState<string | null>(null);
  const [attempts, setAttempts] = useState<ChordQuizAttemptInput[]>([]);
  const questionStartRef = useRef<number>(Date.now());

  const current = questions[currentIndex];

  const selectAnswer = useCallback(
    (option: string) => {
      if (phase !== 'answering' || !current) return;
      const isCorrect = option === current.voicing.name;
      const responseTimeMs = Math.max(0, Date.now() - questionStartRef.current);
      setSelected(option);
      setPhase('reveal');
      setAttempts((prev) => [
        ...prev,
        {
          chord_id: current.voicing.id,
          selected_answer: option,
          is_correct: isCorrect,
          response_time_ms: responseTimeMs,
        },
      ]);
    },
    [phase, current]
  );

  const next = useCallback(() => {
    if (phase !== 'reveal') return;
    if (currentIndex + 1 >= questions.length) {
      setPhase('finished');
      return;
    }
    setCurrentIndex((i) => i + 1);
    setSelected(null);
    setPhase('answering');
    questionStartRef.current = Date.now();
  }, [phase, currentIndex, questions.length]);

  const restart = useCallback(() => {
    setCurrentIndex(0);
    setSelected(null);
    setPhase('answering');
    setAttempts([]);
    questionStartRef.current = Date.now();
    setSessionKey((k) => k + 1);
  }, []);

  const score = attempts.filter((a) => a.is_correct).length;

  return {
    questions,
    currentIndex,
    current,
    phase,
    selected,
    attempts,
    score,
    selectAnswer,
    next,
    restart,
  };
}
