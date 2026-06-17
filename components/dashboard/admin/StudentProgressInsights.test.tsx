/**
 * Drafted by local Gemma (gemma3:12b), corrected: mock the streaming server
 * action; the Analyze button is disabled until a student is selected.
 */
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { StudentProgressInsights } from '@/components/dashboard/admin/StudentProgressInsights';

jest.mock('@/app/actions/ai', () => ({
  analyzeStudentProgressStream: jest.fn(),
}));

const students = [
  { id: 's1', full_name: 'Emma Stone' },
  { id: 's2', full_name: 'John Doe' },
];

describe('StudentProgressInsights', () => {
  it('renders the analyze button', () => {
    render(<StudentProgressInsights students={students} />);
    expect(screen.getByRole('button', { name: /analyze progress/i })).toBeInTheDocument();
  });

  it('disables analyze until a student is selected', () => {
    render(<StudentProgressInsights students={students} />);
    expect(screen.getByRole('button', { name: /analyze progress/i })).toBeDisabled();
  });
});
