'use client';

import { useCallback, useRef, useState } from 'react';
import { submitChordQuizSession } from '@/app/actions/chord-quiz';
import { type ChordQuizAttemptInput, QUIZ_SESSION_LENGTH } from '@/schemas/ChordQuizAttemptSchema';
import { ChordQuizQuestion } from './ChordQuiz.Question';
import { ChordQuizResults } from './ChordQuiz.Results';
import { useChordQuiz } from './useChordQuiz';

type SubmitState = 'idle' | 'submitting' | 'saved' | 'error';

export function ChordQuiz() {
  const quiz = useChordQuiz({ questionCount: QUIZ_SESSION_LENGTH });
  const [submitState, setSubmitState] = useState<SubmitState>('idle');
  const [submitError, setSubmitError] = useState<string | null>(null);
  const submittedRef = useRef(false);

  const submitSession = useCallback((attempts: ChordQuizAttemptInput[]) => {
    if (submittedRef.current || attempts.length === 0) return;
    submittedRef.current = true;
    setSubmitState('submitting');
    setSubmitError(null);

    submitChordQuizSession(attempts)
      .then((result) => {
        if ('error' in result) {
          setSubmitState('error');
          setSubmitError(result.error);
        } else {
          setSubmitState('saved');
        }
      })
      .catch((err: unknown) => {
        setSubmitState('error');
        setSubmitError(err instanceof Error ? err.message : 'Unknown error');
      });
  }, []);

  const handleNext = useCallback(() => {
    const isLast = quiz.currentIndex + 1 >= quiz.questions.length;
    quiz.next();
    if (isLast) {
      // Use the just-collected attempts including the final one set in selectAnswer.
      submitSession(quiz.attempts);
    }
  }, [quiz, submitSession]);

  const handleRestart = useCallback(() => {
    submittedRef.current = false;
    setSubmitState('idle');
    setSubmitError(null);
    quiz.restart();
  }, [quiz]);

  return (
    <section className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-6">
      <header className="text-center">
        <h1 className="text-2xl font-semibold tracking-tight">Chord Quiz</h1>
        <p className="text-sm text-muted-foreground">Name the chord shown in the diagram.</p>
      </header>

      {quiz.phase !== 'finished' && quiz.current && (
        <ChordQuizQuestion
          question={quiz.current}
          questionNumber={quiz.currentIndex + 1}
          totalQuestions={quiz.questions.length}
          selected={quiz.selected}
          revealed={quiz.phase === 'reveal'}
          onSelect={quiz.selectAnswer}
          onNext={handleNext}
        />
      )}

      {quiz.phase === 'finished' && (
        <ChordQuizResults
          questions={quiz.questions}
          attempts={quiz.attempts}
          score={quiz.score}
          submitState={submitState}
          submitError={submitError}
          onRestart={handleRestart}
        />
      )}
    </section>
  );
}
