import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import SignUpForm from '@/components/auth/SignUpForm';

// SignUpForm submits through the `signUp` server action (not the Supabase
// browser client). Mock the action module. `resendVerificationEmail` is pulled
// in by the hook but unused by these tests.
const mockSignUp = jest.fn();
const mockResend = jest.fn();

jest.mock('@/app/auth/actions', () => ({
  signUp: (...args: unknown[]) => mockSignUp(...args),
  resendVerificationEmail: (...args: unknown[]) => mockResend(...args),
}));

function fillValidForm() {
  fireEvent.change(screen.getByLabelText(/email/i), {
    target: { value: 'student@example.com' },
  });
  fireEvent.change(screen.getByLabelText(/^password$/i), {
    target: { value: 'test123_student' },
  });
  fireEvent.change(screen.getByLabelText(/confirm password/i), {
    target: { value: 'test123_student' },
  });
  fireEvent.change(screen.getByLabelText(/first name/i), {
    target: { value: 'John' },
  });
  fireEvent.change(screen.getByLabelText(/last name/i), {
    target: { value: 'Doe' },
  });
}

describe('SignUpForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render sign up form with all required fields', () => {
      render(<SignUpForm />);

      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/first name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/last name/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /^sign up$/i })).toBeInTheDocument();
    });

    it('should render link to sign in page', () => {
      render(<SignUpForm />);

      const signInLink = screen.getByText(/already have an account/i);
      expect(signInLink).toBeInTheDocument();
    });

    it('should render password strength indicator once a password is entered', async () => {
      render(<SignUpForm />);

      const passwordInput = screen.getByLabelText(/^password$/i);
      fireEvent.change(passwordInput, { target: { value: 'abc' } });

      await waitFor(() => {
        expect(screen.getByText(/at least 6 characters/i)).toBeInTheDocument();
      });
    });
  });

  describe('Form Validation', () => {
    it('should show error for invalid email format', async () => {
      render(<SignUpForm />);

      const emailInput = screen.getByLabelText(/email/i);
      fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
      fireEvent.blur(emailInput);

      await waitFor(() => {
        expect(screen.getByText(/valid email required/i)).toBeInTheDocument();
      });
    });

    it('should show error for password shorter than the minimum length', async () => {
      render(<SignUpForm />);

      const passwordInput = screen.getByLabelText(/^password$/i);
      fireEvent.change(passwordInput, { target: { value: '12345' } });
      fireEvent.blur(passwordInput);

      await waitFor(() => {
        expect(screen.getByText(/password must be at least 8 characters/i)).toBeInTheDocument();
      });
    });

    it('should show error when first name is missing', async () => {
      render(<SignUpForm />);

      const firstNameInput = screen.getByLabelText(/first name/i);
      fireEvent.change(firstNameInput, { target: { value: '' } });
      fireEvent.blur(firstNameInput);

      await waitFor(() => {
        expect(screen.getByText(/first name is required/i)).toBeInTheDocument();
      });
    });

    it('should show error when last name is missing', async () => {
      render(<SignUpForm />);

      const lastNameInput = screen.getByLabelText(/last name/i);
      fireEvent.change(lastNameInput, { target: { value: '' } });
      fireEvent.blur(lastNameInput);

      await waitFor(() => {
        expect(screen.getByText(/last name is required/i)).toBeInTheDocument();
      });
    });

    it('should not submit form with validation errors', async () => {
      render(<SignUpForm />);

      const submitButton = screen.getByRole('button', { name: /^sign up$/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockSignUp).not.toHaveBeenCalled();
      });
    });
  });

  describe('Form Submission', () => {
    it('should call the signUp action with the entered data', async () => {
      mockSignUp.mockResolvedValue({ success: true });

      render(<SignUpForm />);
      fillValidForm();

      fireEvent.click(screen.getByRole('button', { name: /^sign up$/i }));

      await waitFor(() => {
        expect(mockSignUp).toHaveBeenCalledWith(
          'John',
          'Doe',
          'student@example.com',
          'test123_student',
          'test123_student'
        );
      });
    });

    it('should show a verification message on successful sign up', async () => {
      mockSignUp.mockResolvedValue({ success: true });

      render(<SignUpForm />);
      fillValidForm();

      fireEvent.click(screen.getByRole('button', { name: /^sign up$/i }));

      await waitFor(() => {
        expect(screen.getByText(/verification email sent/i)).toBeInTheDocument();
      });
    });

    it('should show the error message returned by the action', async () => {
      mockSignUp.mockResolvedValue({ error: 'User already registered' });

      render(<SignUpForm />);
      fillValidForm();

      fireEvent.click(screen.getByRole('button', { name: /^sign up$/i }));

      await waitFor(() => {
        expect(screen.getByText(/user already registered/i)).toBeInTheDocument();
      });
    });

    it('should show a user-friendly error when the email already exists', async () => {
      mockSignUp.mockResolvedValue({
        error: 'This email is already registered. Please sign in instead.',
      });

      render(<SignUpForm />);
      fillValidForm();

      fireEvent.click(screen.getByRole('button', { name: /^sign up$/i }));

      await waitFor(() => {
        expect(
          screen.getByText(/this email is already registered\. please sign in instead/i)
        ).toBeInTheDocument();
      });
    });

    it('should disable submit button while submitting', async () => {
      mockSignUp.mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve({ success: true }), 100))
      );

      render(<SignUpForm />);
      fillValidForm();

      const submitButton = screen.getByRole('button', { name: /^sign up$/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(submitButton).toBeDisabled();
      });
    });

    it('should show loading state while submitting', async () => {
      mockSignUp.mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve({ success: true }), 100))
      );

      render(<SignUpForm />);
      fillValidForm();

      fireEvent.click(screen.getByRole('button', { name: /^sign up$/i }));

      await waitFor(() => {
        expect(screen.getByText(/signing up/i)).toBeInTheDocument();
      });
    });
  });
});
