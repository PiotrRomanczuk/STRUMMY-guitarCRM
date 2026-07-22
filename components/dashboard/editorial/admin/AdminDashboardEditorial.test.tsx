/**
 * Shell-level render coverage for AdminDashboardEditorial: platform pulse
 * stats, pending invites, and the LockedAccountsCard widget (the only
 * sub-widget of this shell that currently lacks its own coverage —
 * AdminDashboardInsights/AIAssistantCard are tested elsewhere).
 *
 * @see components/dashboard/editorial/admin/AdminDashboardEditorial.tsx
 * @see components/dashboard/editorial/admin/LockedAccountsCard.tsx
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';

import type { AdminPendingInvite, PlatformPulse } from '@/lib/services/admin-dashboard-queries';
import type { LockedAccount } from '@/app/actions/admin/lockout';

const mockUnlockAccount = jest.fn();
jest.mock('@/app/actions/admin/lockout', () => ({
  unlockAccount: (...args: unknown[]) => mockUnlockAccount(...args),
}));

import { AdminDashboardEditorial } from './AdminDashboardEditorial';

// Local time components (not a 'Z' ISO literal) so the relative-timestamp
// math behaves the same regardless of the machine/CI timezone running the
// suite.
const NOW = new Date(2026, 6, 20, 10, 0, 0);

const PULSE: PlatformPulse = {
  totalUsers: 128,
  totalStudents: 100,
  totalTeachers: 20,
  totalSongs: 340,
  totalLessons: 512,
};

const INVITES: AdminPendingInvite[] = [
  {
    id: 'invite-1',
    email: 'new.teacher@example.com',
    createdAt: new Date(2026, 6, 20, 8, 0, 0).toISOString(), // < 1 day ago
  },
  {
    id: 'invite-2',
    email: 'pending.student@example.com',
    createdAt: new Date(2026, 5, 1).toISOString(), // well over 14 days ago
  },
];

const LOCKED_ACCOUNTS: LockedAccount[] = [
  {
    id: 'user-9',
    email: 'locked.user@example.com',
    fullName: 'Marta Kowalska',
    failedLoginAttempts: 5,
    lockedUntil: new Date(2026, 6, 21, 12, 0, 0).toISOString(),
  },
];

const baseProps = {
  pulse: PULSE,
  invites: INVITES,
  lockedAccounts: LOCKED_ACCOUNTS,
  now: NOW,
};

describe('AdminDashboardEditorial', () => {
  beforeEach(() => {
    mockUnlockAccount.mockReset();
    mockUnlockAccount.mockResolvedValue({ success: true });
  });

  it('renders the platform pulse stats', () => {
    render(<AdminDashboardEditorial {...baseProps} />);

    expect(screen.getByText('Admin overview')).toBeInTheDocument();
    expect(screen.getByText('The whole studio at a glance.')).toBeInTheDocument();

    expect(screen.getByText('Users')).toBeInTheDocument();
    expect(screen.getByText('128')).toBeInTheDocument();
    expect(screen.getByText('Students')).toBeInTheDocument();
    expect(screen.getByText('100')).toBeInTheDocument();
    expect(screen.getByText('Teachers')).toBeInTheDocument();
    expect(screen.getByText('20')).toBeInTheDocument();
    expect(screen.getByText('Songs')).toBeInTheDocument();
    expect(screen.getByText('340')).toBeInTheDocument();
    expect(screen.getByText('Lessons')).toBeInTheDocument();
    expect(screen.getByText('512')).toBeInTheDocument();
  });

  it('renders pending invites with relative timestamps', () => {
    render(<AdminDashboardEditorial {...baseProps} />);

    expect(screen.getByText('Pending invites')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();

    expect(screen.getByText('new.teacher@example.com')).toBeInTheDocument();
    expect(screen.getByText('today')).toBeInTheDocument();

    expect(screen.getByText('pending.student@example.com')).toBeInTheDocument();
    expect(screen.getByText('Jun 1')).toBeInTheDocument();
  });

  it('shows the no-pending-invites empty state', () => {
    render(<AdminDashboardEditorial {...baseProps} invites={[]} />);

    expect(screen.getByText('No pending invitations.')).toBeInTheDocument();
    expect(screen.queryByText('new.teacher@example.com')).not.toBeInTheDocument();
  });

  it('renders locked accounts and unlocks one on click', async () => {
    const user = userEvent.setup();
    render(<AdminDashboardEditorial {...baseProps} />);

    expect(screen.getByText('Locked accounts')).toBeInTheDocument();
    expect(screen.getByText('Marta Kowalska')).toBeInTheDocument();
    expect(screen.getByText(/5 failed attempts · locked until/)).toBeInTheDocument();

    await user.click(screen.getByTestId('unlock-account-user-9'));

    expect(mockUnlockAccount).toHaveBeenCalledWith('user-9');
  });

  it('hides the locked accounts card when there are no locked accounts', () => {
    render(<AdminDashboardEditorial {...baseProps} lockedAccounts={[]} />);

    expect(screen.queryByText('Locked accounts')).not.toBeInTheDocument();
    expect(screen.queryByTestId('locked-accounts-list')).not.toBeInTheDocument();
  });

  it('renders the coming-soon placeholder sections for dormant admin widgets', () => {
    render(<AdminDashboardEditorial {...baseProps} />);

    expect(screen.getByText('At-risk students')).toBeInTheDocument();
    expect(screen.getByText('Cohort insights')).toBeInTheDocument();
    expect(screen.getByText('Audit log')).toBeInTheDocument();
    expect(screen.getByText('Services')).toBeInTheDocument();
  });
});
