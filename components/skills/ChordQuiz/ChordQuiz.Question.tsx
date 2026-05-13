'use client';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ChordDiagram } from './ChordDiagram';
import { type QuizQuestion } from './chord-quiz.helpers';

interface ChordQuizQuestionProps {
  question: QuizQuestion;
  questionNumber: number;
  totalQuestions: number;
  selected: string | null;
  /** True after the user has picked an answer; reveals correct/incorrect colors. */
  revealed: boolean;
  onSelect: (option: string) => void;
  onNext: () => void;
}

export function ChordQuizQuestion({
  question,
  questionNumber,
  totalQuestions,
  selected,
  revealed,
  onSelect,
  onNext,
}: ChordQuizQuestionProps) {
  const correct = question.voicing.name;

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="text-sm text-muted-foreground">
        Question {questionNumber} of {totalQuestions}
      </div>

      <div className="rounded-2xl border bg-card p-6">
        <ChordDiagram voicing={question.voicing} size="lg" hideName />
      </div>

      <div className="grid w-full max-w-md grid-cols-2 gap-3">
        {question.options.map((option) => {
          const isSelected = selected === option;
          const isCorrect = option === correct;
          const variant = !revealed
            ? 'outline'
            : isCorrect
              ? 'default'
              : isSelected
                ? 'destructive'
                : 'outline';
          return (
            <Button
              key={option}
              variant={variant}
              size="lg"
              disabled={revealed}
              onClick={() => onSelect(option)}
              aria-pressed={isSelected}
              className={cn(
                'h-14 text-lg font-medium',
                revealed && isCorrect && 'ring-2 ring-emerald-500',
                revealed && isSelected && !isCorrect && 'ring-2 ring-rose-500'
              )}
            >
              {option}
            </Button>
          );
        })}
      </div>

      {revealed && (
        <div className="flex flex-col items-center gap-2">
          <p
            className={cn(
              'text-base font-medium',
              selected === correct ? 'text-emerald-600' : 'text-rose-600'
            )}
          >
            {selected === correct ? 'Correct!' : `Correct answer: ${correct}`}
          </p>
          <Button onClick={onNext} size="lg">
            {questionNumber === totalQuestions ? 'See results' : 'Next question'}
          </Button>
        </div>
      )}
    </div>
  );
}
