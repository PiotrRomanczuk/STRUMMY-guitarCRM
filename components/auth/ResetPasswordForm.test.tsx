import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import ResetPasswordForm from '@/components/auth/ResetPasswordForm';

// Mock Supabase browser client
const mockUpdateUser = jest.fn();

jest.mock('@/lib/supabase-browser', () => ({
  getSupabaseBrowserClient: jest.fn(() => ({
    auth: {
      updateUser: mockUpdateUser,
    },
  })),
}));

describe('ResetPasswordForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render reset password form with password fields', () => {
      render(<ResetPasswordForm />);

      expect(screen.getByLabelText(/^new password$/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /reset password/i })).toBeInTheDocument();
    });

    it('should render password requirements', () => {
      render(<ResetPasswordForm />);

      expect(screen.getByText(/minimum 6 characters/i)).toBeInTheDocument();
    });
  });

  describe('Form Validation', () => {
    it('should show error for password shorter than 6 characters', async () => {
      render(<ResetPasswordForm />);

      const passwordInput = screen.getByLabelText(/^new password$/i);
      fireEvent.change(passwordInput, { target: { value: '12345' } });
      fireEvent.blur(passwordInput);

      await waitFor(() => {
        expect(screen.getByText(/password must be at least 8 characters/i)).toBeInTheDocument();
      });
    });

    it('should show error when passwords do not match', async () => {
      render(<ResetPasswordForm />);

      fireEvent.change(screen.getByLabelText(/^new password$/i), {
        target: { value: 'password123' },
      });
      fireEvent.change(screen.getByLabelText(/confirm password/i), {
        target: { value: 'different123' },
      });

      const submitButton = screen.getByRole('button', {
        name: /reset password/i,
      });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/passwords don't match/i)).toBeInTheDocument();
      });
    });

    it('should show error when new password is empty', async () => {
      render(<ResetPasswordForm />);

      const passwordInput = screen.getByLabelText(/^new password$/i);
      fireEvent.change(passwordInput, { target: { value: '' } });
      fireEvent.blur(passwordInput);

      await waitFor(() => {
        expect(screen.getByText(/password must be at least 8 characters/i)).toBeInTheDocument();
      });
    });

    it('should show error when confirm password is empty', async () => {
      render(<ResetPasswordForm />);

      const confirmInput = screen.getByLabelText(/confirm password/i);
      fireEvent.change(confirmInput, { target: { value: '' } });
      fireEvent.blur(confirmInput);

      await waitFor(() => {
        expect(screen.getByText(/please confirm your password/i)).toBeInTheDocument();
      });
    });

    it('should not submit form with validation errors', async () => {
      render(<ResetPasswordForm />);

      const submitButton = screen.getByRole('button', {
        name: /reset password/i,
      });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockUpdateUser).not.toHaveBeenCalled();
      });
    });
  });

  describe('Form Submission', () => {
    it('should call updateUser with new password on valid submission', async () => {
      mockUpdateUser.mockResolvedValue({
        data: { user: { id: '123' } },
        error: null,
      });

      render(<ResetPasswordForm />);

      fireEvent.change(screen.getByLabelText(/^new password$/i), {
        target: { value: 'newpassword123' },
      });
      fireEvent.change(screen.getByLabelText(/confirm password/i), {
        target: { value: 'newpassword123' },
      });

      fireEvent.click(screen.getByRole('button', { name: /reset password/i }));

      await waitFor(() => {
        expect(mockUpdateUser).toHaveBeenCalledWith({
          password: 'newpassword123',
        });
      });
    });

    it('should show success message on successful reset', async () => {
      mockUpdateUser.mockResolvedValue({
        data: { user: { id: '123' } },
        error: null,
      });

      render(<ResetPasswordForm />);

      fireEvent.change(screen.getByLabelText(/^new password$/i), {
        target: { value: 'newpassword123' },
      });
      fireEvent.change(screen.getByLabelText(/confirm password/i), {
        target: { value: 'newpassword123' },
      });

      fireEvent.click(screen.getByRole('button', { name: /reset password/i }));

      await waitFor(() => {
        expect(screen.getByText(/password reset successfully/i)).toBeInTheDocument();
      });
    });

    it('should show error message on reset failure', async () => {
      mockUpdateUser.mockResolvedValue({
        data: null,
        error: { message: 'Invalid reset token' },
      });

      render(<ResetPasswordForm />);

      fireEvent.change(screen.getByLabelText(/^new password$/i), {
        target: { value: 'newpassword123' },
      });
      fireEvent.change(screen.getByLabelText(/confirm password/i), {
        target: { value: 'newpassword123' },
      });

      fireEvent.click(screen.getByRole('button', { name: /reset password/i }));

      await waitFor(() => {
        expect(screen.getByText(/invalid reset token/i)).toBeInTheDocument();
      });
    });

    it('should disable submit button while submitting', async () => {
      mockUpdateUser.mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(() => resolve({ data: { user: { id: '123' } }, error: null }), 100)
          )
      );

      render(<ResetPasswordForm />);

      fireEvent.change(screen.getByLabelText(/^new password$/i), {
        target: { value: 'newpassword123' },
      });
      fireEvent.change(screen.getByLabelText(/confirm password/i), {
        target: { value: 'newpassword123' },
      });

      const submitButton = screen.getByRole('button', {
        name: /reset password/i,
      });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(submitButton).toBeDisabled();
      });
    });

    it('should show loading state while submitting', async () => {
      mockUpdateUser.mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(() => resolve({ data: { user: { id: '123' } }, error: null }), 100)
          )
      );

      render(<ResetPasswordForm />);

      fireEvent.change(screen.getByLabelText(/^new password$/i), {
        target: { value: 'newpassword123' },
      });
      fireEvent.change(screen.getByLabelText(/confirm password/i), {
        target: { value: 'newpassword123' },
      });

      fireEvent.click(screen.getByRole('button', { name: /reset password/i }));

      await waitFor(() => {
        expect(screen.getByText(/resetting/i)).toBeInTheDocument();
      });
    });
  });

  describe('Password Visibility Toggle', () => {
    it('should toggle new password visibility', async () => {
      render(<ResetPasswordForm />);

      const passwordInput = screen.getByLabelText(/^new password$/i);
      const toggleButton = screen.getAllByRole('button', {
        name: /show password/i,
      })[0];

      expect(passwordInput).toHaveAttribute('type', 'password');

      fireEvent.click(toggleButton);

      await waitFor(() => {
        expect(passwordInput).toHaveAttribute('type', 'text');
      });
    });

    it('should toggle confirm password visibility', async () => {
      render(<ResetPasswordForm />);

      const confirmInput = screen.getByLabelText(/confirm password/i);
      const toggleButton = screen.getAllByRole('button', {
        name: /show password/i,
      })[1];

      expect(confirmInput).toHaveAttribute('type', 'password');

      fireEvent.click(toggleButton);

      await waitFor(() => {
        expect(confirmInput).toHaveAttribute('type', 'text');
      });
    });
  });
});
