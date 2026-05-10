'use client';

import { Button } from '@/components/ui/button';
import { type ChordQuizAttemptInput } from '@/schemas/ChordQuizAttemptSchema';
import { ChordDiagram } from './ChordDiagram';
import { type QuizQuestion } from './chord-quiz.helpers';

interface ChordQuizResultsProps {
  questions: QuizQuestion[];
  attempts: ChordQuizAttemptInput[];
  score: number;
  submitState: 'idle' | 'submitting' | 'saved' | 'error';
  submitError: string | null;
  onRestart: () => void;
}

export function ChordQuizResults({
  questions,
  attempts,
  score,
  submitState,
  submitError,
  onRestart,
}: ChordQuizResultsProps) {
  const total = questions.length;
  const missed = questions
    .map((q, i) => ({ q, attempt: attempts[i] }))
    .filter(({ attempt }) => attempt && !attempt.is_correct);

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="text-center">
        <div className="text-5xl font-semibold">
          {score}
          <span className="text-muted-foreground"> / {total}</span>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          {score === total
            ? 'Perfect round.'
            : score >= total * 0.8
              ? 'Strong recall.'
              : score >= total * 0.5
                ? 'Solid — drill the missed ones.'
                : 'Keep at it. Repetition is the trick.'}
        </p>
      </div>

      <div role="status" aria-live="polite" className="text-xs text-muted-foreground">
        {submitState === 'submitting' && 'Saving your results…'}
        {submitState === 'saved' && 'Results saved.'}
        {submitState === 'error' && (
          <span className="text-rose-600">
            Could not save results{submitError ? `: ${submitError}` : '.'}
          </span>
        )}
      </div>

      {missed.length > 0 && (
        <div className="w-full max-w-2xl">
          <h2 className="mb-3 text-sm font-medium text-muted-foreground">Chords to review</h2>
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {missed.map(({ q, attempt }) => (
              <li
                key={q.voicing.id}
                className="flex flex-col items-center gap-1 rounded-xl border bg-card p-3"
              >
                <ChordDiagram voicing={q.voicing} size="sm" />
                <div className="text-xs text-muted-foreground">
                  You picked <span className="text-rose-600">{attempt?.selected_answer}</span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      <Button onClick={onRestart} size="lg">
        Play again
      </Button>
    </div>
  );
}
