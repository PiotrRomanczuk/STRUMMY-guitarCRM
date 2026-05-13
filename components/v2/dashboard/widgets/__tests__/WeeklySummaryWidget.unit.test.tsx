import { render, screen } from '@testing-library/react';
import { WeeklySummaryWidget } from '../WeeklySummaryWidget';
import type { WeeklySummary } from '@/types/teacher-dashboard-v2';

function makeSummary(overrides: Partial<WeeklySummary> = {}): WeeklySummary {
  return {
    lessonsTaught: 0,
    lessonsScheduled: 0,
    assignmentsCreated: 0,
    assignmentsCompleted: 0,
    ...overrides,
  };
}

describe('WeeklySummaryWidget', () => {
  it('renders all four stat tiles', () => {
    render(
      <WeeklySummaryWidget
        summary={makeSummary({
          lessonsTaught: 3,
          lessonsScheduled: 2,
          assignmentsCreated: 5,
          assignmentsCompleted: 4,
        })}
      />
    );
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText('4')).toBeInTheDocument();
    expect(screen.getByText('Taught')).toBeInTheDocument();
    expect(screen.getByText('Remaining')).toBeInTheDocument();
    expect(screen.getByText('Created')).toBeInTheDocument();
    expect(screen.getByText('Completed')).toBeInTheDocument();
  });

  it('shows plural summary line when taught > 1', () => {
    render(<WeeklySummaryWidget summary={makeSummary({ lessonsTaught: 4 })} />);
    expect(screen.getByText("You've taught 4 lessons this week.")).toBeInTheDocument();
  });

  it('shows singular summary line when taught = 1', () => {
    render(<WeeklySummaryWidget summary={makeSummary({ lessonsTaught: 1 })} />);
    expect(screen.getByText("You've taught 1 lesson this week.")).toBeInTheDocument();
  });

  it('shows quiet fallback when no lessons taught', () => {
    render(<WeeklySummaryWidget summary={makeSummary({ lessonsTaught: 0 })} />);
    expect(
      screen.getByText('No lessons taught yet this week — a quiet start.')
    ).toBeInTheDocument();
  });
});
