import { z } from 'zod';

/**
 * Shared strong password schema: 8+ chars, at least one letter and one number
 */
export const StrongPasswordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[a-zA-Z]/, 'Password must contain at least one letter')
  .regex(/[0-9]/, 'Password must contain at least one number');

/**
 * Schema for user sign-in form validation.
 * Validates email format and minimum password length.
 */
export const SignInSchema = z.object({
  email: z.string().email('Valid email required'),
  password: z.string().min(6, 'Password is required'),
});

/**
 * Schema for user sign-up form validation.
 * Validates user details and ensures password confirmation matches.
 */
export const SignUpSchema = z
  .object({
    firstName: z.string().min(1, 'First name is required').max(100, 'First name too long'),
    lastName: z.string().min(1, 'Last name is required').max(100, 'Last name too long'),
    email: z.string().email('Valid email required'),
    password: StrongPasswordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

/**
 * Schema for forgot password form validation.
 * Validates that a proper email address is provided for password reset.
 */
export const ForgotPasswordSchema = z.object({
  email: z.string().email('Valid email required'),
});

/**
 * Schema for reset password form validation.
 * Validates new password requirements and ensures confirmation matches.
 */
export const ResetPasswordSchema = z
  .object({
    password: StrongPasswordSchema,
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

/** Type inferred from SignInSchema for form data */
export type SignInFormData = z.infer<typeof SignInSchema>;

/** Type inferred from SignUpSchema for form data */
export type SignUpFormData = z.infer<typeof SignUpSchema>;

/** Type inferred from ForgotPasswordSchema for form data */
export type ForgotPasswordFormData = z.infer<typeof ForgotPasswordSchema>;

/** Type inferred from ResetPasswordSchema for form data */
export type ResetPasswordFormData = z.infer<typeof ResetPasswordSchema>;
