import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import SignUpPage from './page';
import { useRouter } from 'next/navigation';
import { signUp as signUpAction } from '@/app/auth/actions';

// The page has been rewritten as an inline form driven by the useSignUpLogic
// hook (no longer delegates to a <SignUpForm> child) — mock the server action
// the hook calls under the hood, same pattern as SignUpForm.test.tsx.
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

jest.mock('@/app/auth/actions', () => ({
  signUp: jest.fn(),
  resendVerificationEmail: jest.fn(),
}));

function fillValidForm() {
  fireEvent.change(screen.getByLabelText(/first name/i), { target: { value: 'Jimi' } });
  fireEvent.change(screen.getByLabelText(/last name/i), { target: { value: 'Hendrix' } });
  fireEvent.change(screen.getByLabelText(/email address/i), {
    target: { value: 'jimi@experience.com' },
  });
  fireEvent.change(screen.getByLabelText(/^password$/i), { target: { value: 'Test123!pass' } });
  fireEvent.change(screen.getByLabelText(/confirm password/i), {
    target: { value: 'Test123!pass' },
  });
}

describe('SignUpPage', () => {
  const mockRouter = {
    push: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
  });

  it('renders the sign up page structure', () => {
    render(<SignUpPage />);

    expect(screen.getByText('Join Strummy')).toBeInTheDocument();
    expect(screen.getByLabelText(/first name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/last name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument();
  });

  it('handles successful sign up and shows the check-your-email confirmation', async () => {
    (signUpAction as jest.Mock).mockResolvedValue({ success: true });

    render(<SignUpPage />);
    fillValidForm();
    fireEvent.click(screen.getByRole('button', { name: /create account/i }));

    expect(await screen.findByText('Check Your Email')).toBeInTheDocument();
    expect(screen.getByText('jimi@experience.com')).toBeInTheDocument();

    // No automatic redirect — user must click the manual "Continue to Sign In" button
    expect(mockRouter.push).not.toHaveBeenCalled();
  });

  it('shows an error message when sign up fails', async () => {
    (signUpAction as jest.Mock).mockResolvedValue({ error: 'Email already registered' });

    render(<SignUpPage />);
    fillValidForm();
    fireEvent.click(screen.getByRole('button', { name: /create account/i }));

    expect(await screen.findByText('Email already registered')).toBeInTheDocument();
    expect(screen.queryByText('Check Your Email')).not.toBeInTheDocument();
  });

  it('navigates to sign in when "Continue to Sign In" is clicked', async () => {
    (signUpAction as jest.Mock).mockResolvedValue({ success: true });

    render(<SignUpPage />);
    fillValidForm();
    fireEvent.click(screen.getByRole('button', { name: /create account/i }));

    const continueButton = await screen.findByRole('button', { name: /continue to sign in/i });
    fireEvent.click(continueButton);

    await waitFor(() => expect(mockRouter.push).toHaveBeenCalledWith('/sign-in'));
  });
});
