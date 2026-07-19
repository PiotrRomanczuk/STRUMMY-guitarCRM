import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import SignInPage from './page';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { signIn as signInAction } from '@/app/auth/actions';

// The page has been rewritten as an inline form (no longer delegates to a
// <SignInForm> child) and reads `?demo=true` via useSearchParams() to
// auto-fill/submit the demo account. Mock next/navigation with BOTH hooks —
// a useRouter-only mock leaves useSearchParams() undefined and crashes.
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  useSearchParams: jest.fn(),
}));

jest.mock('@/lib/supabase/client', () => ({
  createClient: jest.fn(),
}));

jest.mock('@/app/auth/actions', () => ({
  signIn: jest.fn(),
  resendVerificationEmail: jest.fn(),
}));

describe('SignInPage', () => {
  const mockRouter = {
    push: jest.fn(),
    refresh: jest.fn(),
  };
  const mockGetUser = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    (useSearchParams as jest.Mock).mockReturnValue(new URLSearchParams());
    (createClient as jest.Mock).mockReturnValue({
      auth: {
        getUser: mockGetUser,
        signInWithOAuth: jest.fn(),
      },
    });
    mockGetUser.mockResolvedValue({ data: { user: null } });
  });

  it('renders the sign in form once the auth check completes', async () => {
    render(<SignInPage />);

    expect(await screen.findByText('Sign in to Strummy')).toBeInTheDocument();
    expect(screen.getByTestId('email')).toBeInTheDocument();
    expect(screen.getByTestId('password')).toBeInTheDocument();
    expect(screen.getByTestId('signin-button')).toBeInTheDocument();
  });

  it('redirects to the dashboard if already authenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } });

    render(<SignInPage />);

    await waitFor(() => expect(mockRouter.push).toHaveBeenCalledWith('/dashboard'));
  });

  it('signs in and redirects to the dashboard on success', async () => {
    (signInAction as jest.Mock).mockResolvedValue({ success: true });

    render(<SignInPage />);
    await screen.findByTestId('signin-button');

    fireEvent.change(screen.getByTestId('email'), { target: { value: 'sarah@strummy.app' } });
    fireEvent.change(screen.getByTestId('password'), { target: { value: 'Demo2024!' } });
    fireEvent.click(screen.getByTestId('signin-button'));

    await waitFor(() =>
      expect(signInAction).toHaveBeenCalledWith('sarah@strummy.app', 'Demo2024!')
    );
    await waitFor(() => expect(mockRouter.refresh).toHaveBeenCalled());
    expect(mockRouter.push).toHaveBeenCalledWith('/dashboard');
  });

  it('shows an error message when sign in fails', async () => {
    (signInAction as jest.Mock).mockResolvedValue({ error: 'Invalid email or password' });

    render(<SignInPage />);
    await screen.findByTestId('signin-button');

    fireEvent.change(screen.getByTestId('email'), { target: { value: 'sarah@strummy.app' } });
    fireEvent.change(screen.getByTestId('password'), { target: { value: 'wrong-password' } });
    fireEvent.click(screen.getByTestId('signin-button'));

    expect(await screen.findByText('Invalid email or password')).toBeInTheDocument();
    expect(mockRouter.push).not.toHaveBeenCalledWith('/dashboard');
  });
});
