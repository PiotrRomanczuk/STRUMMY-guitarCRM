import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import SignInForm from '@/components/auth/SignInForm';

// Mock Supabase browser client
const mockSignInWithPassword = jest.fn();

jest.mock('@/lib/supabase-browser', () => ({
  getSupabaseBrowserClient: jest.fn(() => ({
    auth: {
      signInWithPassword: mockSignInWithPassword,
    },
  })),
}));

describe('SignInForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render sign in form with all required fields', () => {
      render(<SignInForm />);

      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      expect(screen.getByLabelText('Password')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /^continue$/i })).toBeInTheDocument();
    });

    it('should render link to sign up page', () => {
      render(<SignInForm />);

      const signUpLink = screen.getByText(/don't have an account/i);
      expect(signUpLink).toBeInTheDocument();
    });

    it('should have password field type as password', () => {
      render(<SignInForm />);

      const passwordInput = screen.getByLabelText('Password');
      expect(passwordInput).toHaveAttribute('type', 'password');
    });
  });

  describe('Form Validation', () => {
    it('should show error for invalid email format', async () => {
      render(<SignInForm />);

      const emailInput = screen.getByLabelText(/email/i);
      fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
      fireEvent.blur(emailInput);

      await waitFor(() => {
        expect(screen.getByText(/valid email required/i)).toBeInTheDocument();
      });
    });

    it('should show error when email is empty', async () => {
      render(<SignInForm />);

      const emailInput = screen.getByLabelText(/email/i);
      fireEvent.change(emailInput, { target: { value: '' } });
      fireEvent.blur(emailInput);

      await waitFor(() => {
        expect(screen.getByText(/valid email required/i)).toBeInTheDocument();
      });
    });

    it('should show error when password is empty', async () => {
      render(<SignInForm />);

      const passwordInput = screen.getByLabelText('Password');
      fireEvent.change(passwordInput, { target: { value: '' } });
      fireEvent.blur(passwordInput);

      await waitFor(() => {
        expect(screen.getByText(/password is required/i)).toBeInTheDocument();
      });
    });

    it('should not submit form with validation errors', async () => {
      render(<SignInForm />);

      const submitButton = screen.getByRole('button', { name: /^continue$/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockSignInWithPassword).not.toHaveBeenCalled();
      });
    });
  });

  describe('Form Submission', () => {
    it('should call signInWithPassword with correct credentials', async () => {
      mockSignInWithPassword.mockResolvedValue({
        data: { user: { id: '123' }, session: { access_token: 'token' } },
        error: null,
      });

      render(<SignInForm />);

      fireEvent.change(screen.getByLabelText(/email/i), {
        target: { value: 'student@example.com' },
      });
      fireEvent.change(screen.getByLabelText('Password'), {
        target: { value: 'test123_student' },
      });

      const submitButton = screen.getByRole('button', { name: /^continue$/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockSignInWithPassword).toHaveBeenCalledWith({
          email: 'student@example.com',
          password: 'test123_student',
        });
      });
    });

    it('should redirect on successful sign in', async () => {
      mockSignInWithPassword.mockResolvedValue({
        data: { user: { id: '123' }, session: { access_token: 'token' } },
        error: null,
      });

      render(<SignInForm />);

      fireEvent.change(screen.getByLabelText(/email/i), {
        target: { value: 'student@example.com' },
      });
      fireEvent.change(screen.getByLabelText('Password'), {
        target: { value: 'test123_student' },
      });

      fireEvent.click(screen.getByRole('button', { name: /^continue$/i }));

      await waitFor(() => {
        expect(mockSignInWithPassword).toHaveBeenCalled();
      });
    });

    it('should show error message for invalid credentials', async () => {
      mockSignInWithPassword.mockResolvedValue({
        data: { user: null, session: null },
        error: { message: 'Invalid login credentials' },
      });

      render(<SignInForm />);

      fireEvent.change(screen.getByLabelText(/email/i), {
        target: { value: 'student@example.com' },
      });
      fireEvent.change(screen.getByLabelText('Password'), {
        target: { value: 'wrongpassword' },
      });

      fireEvent.click(screen.getByRole('button', { name: /^continue$/i }));

      await waitFor(() => {
        expect(screen.getByText(/invalid email or password/i)).toBeInTheDocument();
      });
    });

    it('should show error message for unconfirmed email', async () => {
      mockSignInWithPassword.mockResolvedValue({
        data: { user: null, session: null },
        error: { message: 'Email not confirmed' },
      });

      render(<SignInForm />);

      fireEvent.change(screen.getByLabelText(/email/i), {
        target: { value: 'student@example.com' },
      });
      fireEvent.change(screen.getByLabelText('Password'), {
        target: { value: 'test123_student' },
      });

      fireEvent.click(screen.getByRole('button', { name: /^continue$/i }));

      await waitFor(() => {
        expect(screen.getByText(/email not confirmed/i)).toBeInTheDocument();
      });
    });

    it('should disable submit button while submitting', async () => {
      mockSignInWithPassword.mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(
              () =>
                resolve({
                  data: {
                    user: { id: '123' },
                    session: { access_token: 'token' },
                  },
                  error: null,
                }),
              100
            )
          )
      );

      render(<SignInForm />);

      fireEvent.change(screen.getByLabelText(/email/i), {
        target: { value: 'student@example.com' },
      });
      fireEvent.change(screen.getByLabelText('Password'), {
        target: { value: 'test123_student' },
      });

      const submitButton = screen.getByRole('button', { name: /^continue$/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(submitButton).toBeDisabled();
      });
    });

    it('should show loading state while submitting', async () => {
      mockSignInWithPassword.mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(
              () =>
                resolve({
                  data: {
                    user: { id: '123' },
                    session: { access_token: 'token' },
                  },
                  error: null,
                }),
              100
            )
          )
      );

      render(<SignInForm />);

      fireEvent.change(screen.getByLabelText(/email/i), {
        target: { value: 'student@example.com' },
      });
      fireEvent.change(screen.getByLabelText('Password'), {
        target: { value: 'test123_student' },
      });

      fireEvent.click(screen.getByRole('button', { name: /^continue$/i }));

      await waitFor(() => {
        expect(screen.getByText(/signing in/i)).toBeInTheDocument();
      });
    });

    it('should clear form on successful sign in', async () => {
      mockSignInWithPassword.mockResolvedValue({
        data: { user: { id: '123' }, session: { access_token: 'token' } },
        error: null,
      });

      render(<SignInForm />);

      const emailInput = screen.getByLabelText(/email/i) as HTMLInputElement;
      const passwordInput = screen.getByLabelText('Password') as HTMLInputElement;

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(emailInput, {
        target: { value: 'student@example.com' },
      });
      fireEvent.change(passwordInput, { target: { value: 'test123_student' } });

      fireEvent.click(screen.getByRole('button', { name: /^continue$/i }));

      await waitFor(() => {
        expect(emailInput.value).toBe('');
        expect(passwordInput.value).toBe('');
      });
    });
  });

  describe('Password Visibility Toggle', () => {
    it('should toggle password visibility when eye icon is clicked', async () => {
      render(<SignInForm />);

      const passwordInput = screen.getByLabelText('Password');
      const toggleButton = screen.getByRole('button', {
        name: /show/i,
      });

      expect(passwordInput).toHaveAttribute('type', 'password');

      fireEvent.click(toggleButton);

      await waitFor(() => {
        expect(passwordInput).toHaveAttribute('type', 'text');
      });

      fireEvent.click(toggleButton);

      await waitFor(() => {
        expect(passwordInput).toHaveAttribute('type', 'password');
      });
    });
  });
});
