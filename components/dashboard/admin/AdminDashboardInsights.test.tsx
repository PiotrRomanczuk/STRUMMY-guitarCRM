/**
 * Drafted by local Gemma (gemma3:12b), corrected: mock the streaming server
 * action as an async generator; assert the card + generate button.
 */
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { AdminDashboardInsights } from '@/components/dashboard/admin/AdminDashboardInsights';

const mockStream = jest.fn();
jest.mock('@/app/actions/ai', () => ({
  generateAdminInsightsStream: (...a: unknown[]) => mockStream(...a),
}));

const adminStats = {
  totalUsers: 25,
  totalTeachers: 1,
  totalStudents: 20,
  totalSongs: 100,
  totalLessons: 80,
  recentUsers: [],
};

beforeEach(() => {
  jest.clearAllMocks();
  // Real streaming server actions resolve to the async iterable across the
  // network boundary, so the mock returns a Promise (not a bare generator) to
  // guard against consuming the result without awaiting it.
  mockStream.mockImplementation(() =>
    Promise.resolve(
      (async function* () {
        yield 'Streamed insight';
      })()
    )
  );
});

describe('AdminDashboardInsights', () => {
  it('renders stats and the generate button', () => {
    render(<AdminDashboardInsights adminStats={adminStats} />);
    expect(screen.getByRole('button', { name: /generate ai insights/i })).toBeInTheDocument();
    expect(screen.getByText('Students')).toBeInTheDocument();
  });

  it('invokes the insights stream when generating', async () => {
    render(<AdminDashboardInsights adminStats={adminStats} />);
    fireEvent.click(screen.getByRole('button', { name: /generate ai insights/i }));
    await waitFor(() => expect(mockStream).toHaveBeenCalled());
  });

  it('renders streamed chunks (awaits the promised async iterable)', async () => {
    render(<AdminDashboardInsights adminStats={adminStats} />);
    fireEvent.click(screen.getByRole('button', { name: /generate ai insights/i }));
    await waitFor(() => expect(screen.getByText('Streamed insight')).toBeInTheDocument());
  });
});
