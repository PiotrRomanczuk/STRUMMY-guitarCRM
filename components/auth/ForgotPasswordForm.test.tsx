import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import ForgotPasswordForm from '@/components/auth/ForgotPasswordForm';

// Mock server actions
const mockResetPassword = jest.fn();

jest.mock('@/app/auth/actions', () => ({
  resetPassword: (...args: unknown[]) => mockResetPassword(...args),
}));

describe('ForgotPasswordForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render forgot password form with email field', () => {
      render(<ForgotPasswordForm />);

      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /send reset link/i })).toBeInTheDocument();
    });

    it('should render back to sign in link', () => {
      render(<ForgotPasswordForm />);

      const backLink = screen.getByText(/back to sign in/i);
      expect(backLink).toBeInTheDocument();
    });

    it('should render instructions text', () => {
      render(<ForgotPasswordForm />);

      expect(screen.getByText(/enter your email.*reset link/i)).toBeInTheDocument();
    });
  });

  describe('Form Validation', () => {
    it('should show error for invalid email format', async () => {
      render(<ForgotPasswordForm />);

      const emailInput = screen.getByLabelText(/email/i);
      fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
      fireEvent.blur(emailInput);

      await waitFor(() => {
        expect(screen.getByText(/valid email required/i)).toBeInTheDocument();
      });
    });

    it('should show error when email is empty', async () => {
      render(<ForgotPasswordForm />);

      const emailInput = screen.getByLabelText(/email/i);
      fireEvent.change(emailInput, { target: { value: '' } });
      fireEvent.blur(emailInput);

      await waitFor(() => {
        expect(screen.getByText(/valid email required/i)).toBeInTheDocument();
      });
    });

    it('should not submit form with validation errors', async () => {
      render(<ForgotPasswordForm />);

      const submitButton = screen.getByRole('button', {
        name: /send reset link/i,
      });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockResetPassword).not.toHaveBeenCalled();
      });
    });
  });

  describe('Form Submission', () => {
    it('should call resetPassword with correct email', async () => {
      mockResetPassword.mockResolvedValue({
        data: {},
        error: null,
      });

      render(<ForgotPasswordForm />);

      fireEvent.change(screen.getByLabelText(/email/i), {
        target: { value: 'test@example.com' },
      });

      fireEvent.click(screen.getByRole('button', { name: /send reset link/i }));

      await waitFor(() => {
        expect(mockResetPassword).toHaveBeenCalledWith('test@example.com');
      });
    });

    it('should show success message on successful submission', async () => {
      mockResetPassword.mockResolvedValue({
        data: {},
        error: null,
      });

      render(<ForgotPasswordForm />);

      fireEvent.change(screen.getByLabelText(/email/i), {
        target: { value: 'test@example.com' },
      });

      fireEvent.click(screen.getByRole('button', { name: /send reset link/i }));

      await waitFor(() => {
        expect(screen.getByText(/check your email for.*reset link/i)).toBeInTheDocument();
      });
    });

    it('should show error message on failure', async () => {
      mockResetPassword.mockResolvedValue({
        data: null,
        error: 'User not found',
      });

      render(<ForgotPasswordForm />);

      fireEvent.change(screen.getByLabelText(/email/i), {
        target: { value: 'nonexistent@example.com' },
      });

      fireEvent.click(screen.getByRole('button', { name: /send reset link/i }));

      await waitFor(() => {
        expect(screen.getByText(/user not found/i)).toBeInTheDocument();
      });
    });

    it('should disable submit button while submitting', async () => {
      mockResetPassword.mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve({ data: {}, error: null }), 100))
      );

      render(<ForgotPasswordForm />);

      fireEvent.change(screen.getByLabelText(/email/i), {
        target: { value: 'test@example.com' },
      });

      const submitButton = screen.getByRole('button', {
        name: /send reset link/i,
      });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(submitButton).toBeDisabled();
      });
    });

    it('should show loading state while submitting', async () => {
      mockResetPassword.mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve({ data: {}, error: null }), 100))
      );

      render(<ForgotPasswordForm />);

      fireEvent.change(screen.getByLabelText(/email/i), {
        target: { value: 'test@example.com' },
      });

      fireEvent.click(screen.getByRole('button', { name: /send reset link/i }));

      await waitFor(() => {
        expect(screen.getByText(/sending/i)).toBeInTheDocument();
      });
    });
  });
});
