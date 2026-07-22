/**
 * Component tests: ChordQuiz (top-level orchestrator + child render tree)
 *
 * Only chord-quiz.helpers.ts (pure logic) was covered before this file — see
 * chord-quiz.helpers.unit.test.ts. This suite renders the real component tree
 * (ChordQuiz -> useChordQuiz -> ChordQuiz.Question / ChordQuiz.Results ->
 * ChordDiagram) to verify question presentation, answer feedback, question
 * progression, results/score summary, and SRS-session persistence wiring.
 *
 * @see components/skills/ChordQuiz/ChordQuiz.tsx
 * @see tests/e2e/student/chord-quiz-srs.spec.ts (C1.1-C1.6 — real-account flow)
 */
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent, { type UserEvent } from '@testing-library/user-event';
import '@testing-library/jest-dom';

import { ChordQuiz } from './ChordQuiz';
import { submitChordQuizSession } from '@/app/actions/chord-quiz';

jest.mock('@/app/actions/chord-quiz', () => ({
  submitChordQuizSession: jest.fn(),
}));

const mockSubmit = submitChordQuizSession as jest.Mock;

// A small, stable 4-chord pool (all real CHORD_VOICINGS ids) so a "drill"
// keeps every completion test short and deterministic in length (4
// questions), while question *order* and *option shuffle* stay real/random —
// answers are resolved dynamically from the rendered chord diagram below.
const DRILL_CHORD_IDS = ['C-open', 'G-open', 'Am-open', 'E-open'];
const drill = { assignmentId: 'assignment-1', chordIds: DRILL_CHORD_IDS };

/** Reads the chord name off the diagram's accessible label ("C chord diagram"). */
function getCurrentChordName(): string {
  const diagram = screen.getByRole('img');
  const label = diagram.getAttribute('aria-label') ?? '';
  return label.replace(/ chord diagram$/, '');
}

/** The 4 answer-option buttons expose aria-pressed; nothing else on the page does. */
function getOptionButtons(): HTMLElement[] {
  return screen.getAllByRole('button', { pressed: false });
}

async function answerCurrentQuestion(user: UserEvent, choice: 'correct' | 'incorrect') {
  const chordName = getCurrentChordName();
  const options = getOptionButtons();
  const target =
    choice === 'correct'
      ? options.find((btn) => btn.textContent === chordName)
      : options.find((btn) => btn.textContent !== chordName);
  if (!target) throw new Error(`Could not find a "${choice}" option button`);
  await user.click(target);
  return chordName;
}

function clickAdvance(user: UserEvent) {
  return user.click(screen.getByRole('button', { name: /next question|see results/i }));
}

describe('ChordQuiz', () => {
  beforeEach(() => {
    mockSubmit.mockReset();
    mockSubmit.mockResolvedValue({ success: true, inserted: 1 });
  });

  it('renders the first question with a chord diagram and four answer options', () => {
    render(<ChordQuiz />);

    expect(screen.getByRole('heading', { name: /chord quiz/i })).toBeInTheDocument();
    expect(screen.getByText('Question 1 of 10')).toBeInTheDocument();

    const diagram = screen.getByRole('img');
    expect(diagram.getAttribute('aria-label')).toMatch(/chord diagram$/);

    expect(getOptionButtons()).toHaveLength(4);
    // No feedback or "next" control until an answer is picked.
    expect(screen.queryByText(/^Correct!$/)).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /next question|see results/i })
    ).not.toBeInTheDocument();
  });

  it('shows "Correct!" feedback and a Next button when the correct answer is selected', async () => {
    const user = userEvent.setup();
    render(<ChordQuiz drill={drill} />);

    const chordName = await answerCurrentQuestion(user, 'correct');

    expect(await screen.findByText('Correct!')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: chordName, exact: true })).toHaveAttribute(
      'aria-pressed',
      'true'
    );
    expect(screen.getByRole('button', { name: /next question/i })).toBeInTheDocument();
    // Options lock once revealed.
    const allOptions = screen
      .getAllByRole('button', { pressed: true })
      .concat(screen.getAllByRole('button', { pressed: false }));
    for (const option of allOptions) {
      expect(option).toBeDisabled();
    }
  });

  it('shows the correct answer and marks the picked option when an incorrect option is selected', async () => {
    const user = userEvent.setup();
    render(<ChordQuiz drill={drill} />);

    const chordName = await answerCurrentQuestion(user, 'incorrect');

    expect(await screen.findByText(`Correct answer: ${chordName}`)).toBeInTheDocument();
    expect(screen.queryByText('Correct!')).not.toBeInTheDocument();
  });

  it('advances to the next question when "Next question" is clicked', async () => {
    const user = userEvent.setup();
    render(<ChordQuiz drill={drill} />);

    expect(screen.getByText(`Question 1 of ${DRILL_CHORD_IDS.length}`)).toBeInTheDocument();
    await answerCurrentQuestion(user, 'correct');
    await clickAdvance(user);

    expect(screen.getByText(`Question 2 of ${DRILL_CHORD_IDS.length}`)).toBeInTheDocument();
    // Fresh question: answering phase reset, no stale feedback, options re-enabled.
    expect(screen.queryByText(/^Correct!$/)).not.toBeInTheDocument();
    expect(screen.queryByText(/^Correct answer:/)).not.toBeInTheDocument();
    for (const option of getOptionButtons()) {
      expect(option).toBeEnabled();
    }
  });

  it('shows the Random/Review mode toggle when due chords are supplied, and switches the pool', async () => {
    const user = userEvent.setup();
    // 5 due chords with distinct names — review mode (unlike drill mode) draws
    // distractors from the pool's own names, so it needs >= 4 unique names or
    // pickDistractors throws (matches tests/e2e/student/chord-quiz-srs.spec.ts).
    const dueChordIds = ['C-open', 'G-open', 'Am-open', 'Em-open', 'D-open'];
    render(<ChordQuiz dueChordIds={dueChordIds} />);

    // Review mode is the default whenever dueChordIds is non-empty.
    expect(screen.getByText(`Question 1 of ${dueChordIds.length}`)).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: `Review (${dueChordIds.length} due)` })
    ).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Random' }));

    expect(screen.getByText('Question 1 of 10')).toBeInTheDocument();
  });

  it('completes a drill, shows the score summary, and submits attempts for the assignment', async () => {
    const user = userEvent.setup();
    const { container } = render(<ChordQuiz drill={drill} />);

    for (let i = 0; i < DRILL_CHORD_IDS.length; i++) {
      // First question wrong, the rest correct — exercises both branches and
      // guarantees a non-zero "missed" list on the results screen.
      await answerCurrentQuestion(user, i === 0 ? 'incorrect' : 'correct');
      await clickAdvance(user);
    }

    // Results screen: score out of total. A bare digit isn't unique on this
    // screen (the "chords to review" diagrams render SVG finger-position
    // labels like "3"), so scope the assertion to the score element itself.
    await screen.findByText('Solid — drill the missed ones.');
    const scoreEl = container.querySelector('.text-5xl');
    expect(scoreEl).toHaveTextContent(`${DRILL_CHORD_IDS.length - 1} / ${DRILL_CHORD_IDS.length}`);
    expect(screen.getByText('Chords to review')).toBeInTheDocument();

    await waitFor(() => expect(mockSubmit).toHaveBeenCalledTimes(1));
    const [attempts, assignmentId] = mockSubmit.mock.calls[0];
    expect(assignmentId).toBe(drill.assignmentId);
    expect(attempts).toHaveLength(DRILL_CHORD_IDS.length);
    expect(attempts.filter((a: { is_correct: boolean }) => a.is_correct)).toHaveLength(
      DRILL_CHORD_IDS.length - 1
    );
    for (const attempt of attempts) {
      expect(DRILL_CHORD_IDS).toContain(attempt.chord_id);
      expect(typeof attempt.selected_answer).toBe('string');
      expect(typeof attempt.response_time_ms).toBe('number');
    }

    await screen.findByText('Results saved.');
    expect(screen.getByRole('link', { name: /back to assignment/i })).toHaveAttribute(
      'href',
      `/dashboard/assignments/${drill.assignmentId}`
    );
  });

  it('shows an inline error when saving the results fails', async () => {
    mockSubmit.mockResolvedValueOnce({ error: 'Network error' });
    const user = userEvent.setup();
    render(<ChordQuiz drill={drill} />);

    for (let i = 0; i < DRILL_CHORD_IDS.length; i++) {
      await answerCurrentQuestion(user, 'correct');
      await clickAdvance(user);
    }

    expect(await screen.findByText('Could not save results: Network error')).toBeInTheDocument();
  });

  it('restarts the quiz from question 1 when "Play again" is clicked', async () => {
    const user = userEvent.setup();
    render(<ChordQuiz drill={drill} />);

    for (let i = 0; i < DRILL_CHORD_IDS.length; i++) {
      await answerCurrentQuestion(user, 'correct');
      await clickAdvance(user);
    }
    // A perfect run — wait for the score copy and the async save to settle
    // before restarting, so the submit promise doesn't resolve after the test.
    await screen.findByText('Perfect round.');
    await screen.findByText('Results saved.');

    await user.click(screen.getByRole('button', { name: /play again/i }));

    expect(screen.getByText(`Question 1 of ${DRILL_CHORD_IDS.length}`)).toBeInTheDocument();
    expect(getOptionButtons()).toHaveLength(4);
  });
});
