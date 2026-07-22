/**
 * IntegrationsSection — Google Calendar connect/disconnect card on
 * `/dashboard/settings`. Verifies the audit gap flagged in
 * `docs/app-blueprint/93-design-mockup-audit.md` ("Strummy - Settings
 * Integrations.html" row — no unit test existed for this component).
 */
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

const mockPush = jest.fn();
const mockRefresh = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(() => ({ push: mockPush, refresh: mockRefresh })),
}));

const mockDisconnectGoogle = jest.fn();
jest.mock('@/app/dashboard/calendar-actions', () => ({
  disconnectGoogle: (...args: unknown[]) => mockDisconnectGoogle(...args),
}));

import { IntegrationsSection } from '@/components/settings/IntegrationsSection';

describe('IntegrationsSection', () => {
  beforeEach(() => {
    mockPush.mockReset();
    mockRefresh.mockReset();
    mockDisconnectGoogle.mockReset();
  });

  it('renders the disconnected state with a Connect button', () => {
    render(<IntegrationsSection isGoogleConnected={false} />);

    expect(screen.getByText('Not connected')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Connect Google Calendar' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /disconnect/i })).not.toBeInTheDocument();
  });

  it('renders the connected state with a Disconnect button', () => {
    render(<IntegrationsSection isGoogleConnected={true} />);

    expect(screen.getByText('Connected')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Disconnect' })).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /connect google calendar/i })
    ).not.toBeInTheDocument();
  });

  it('navigates to /api/auth/google and shows a pending label when Connect is clicked', () => {
    render(<IntegrationsSection isGoogleConnected={false} />);

    const connectButton = screen.getByRole('button', { name: 'Connect Google Calendar' });
    fireEvent.click(connectButton);

    expect(mockPush).toHaveBeenCalledWith('/api/auth/google');
    expect(screen.getByRole('button', { name: 'Connecting...' })).toBeDisabled();
  });

  it('calls disconnectGoogle and refreshes the router on success', async () => {
    mockDisconnectGoogle.mockResolvedValue({ success: true });

    render(<IntegrationsSection isGoogleConnected={true} />);

    fireEvent.click(screen.getByRole('button', { name: 'Disconnect' }));

    await waitFor(() => {
      expect(mockDisconnectGoogle).toHaveBeenCalledTimes(1);
    });

    await waitFor(() => {
      expect(mockRefresh).toHaveBeenCalled();
    });
    expect(screen.queryByText(/failed to disconnect/i)).not.toBeInTheDocument();
  });

  it('shows the returned error message when disconnectGoogle fails', async () => {
    mockDisconnectGoogle.mockResolvedValue({ success: false, error: 'Token revoke failed' });

    render(<IntegrationsSection isGoogleConnected={true} />);

    fireEvent.click(screen.getByRole('button', { name: 'Disconnect' }));

    await waitFor(() => {
      expect(screen.getByText('Token revoke failed')).toBeInTheDocument();
    });
    expect(mockRefresh).not.toHaveBeenCalled();
  });

  it('falls back to a generic error message when the action fails without an error string', async () => {
    mockDisconnectGoogle.mockResolvedValue({ success: false });

    render(<IntegrationsSection isGoogleConnected={true} />);

    fireEvent.click(screen.getByRole('button', { name: 'Disconnect' }));

    await waitFor(() => {
      expect(screen.getByText('Failed to disconnect')).toBeInTheDocument();
    });
    expect(mockRefresh).not.toHaveBeenCalled();
  });
});
