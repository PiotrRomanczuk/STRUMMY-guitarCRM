/**
 * Centralized error handling utilities
 * Follows CLAUDE.md Standards (Section 2, 6)
 */

import { ZodError } from 'zod';
import { logger } from '@/lib/logger';

/**
 * Standard API error response format
 * All API routes should return errors in this format
 */
export interface ApiErrorResponse {
  error: string;
  message: string;
  details?: Record<string, string[]>;
  status?: number;
}

/**
 * API Error class for consistent error handling
 */
export class ApiError extends Error {
  constructor(
    public code: string,
    message: string,
    public status: number = 400,
    public details?: Record<string, string[]>
  ) {
    super(message);
    this.name = 'ApiError';
  }

  toResponse(): ApiErrorResponse {
    return {
      error: this.code,
      message: this.message,
      details: this.details,
      status: this.status,
    };
  }
}

/**
 * Common API errors
 */
export const ApiErrors = {
  unauthorized: () => new ApiError('UNAUTHORIZED', 'You must be logged in to perform this action', 401),
  forbidden: () => new ApiError('FORBIDDEN', 'You do not have permission to perform this action', 403),
  notFound: (resource: string) => new ApiError('NOT_FOUND', `${resource} not found`, 404),
  badRequest: (message: string) => new ApiError('BAD_REQUEST', message, 400),
  validation: (details: Record<string, string[]>) =>
    new ApiError('VALIDATION_ERROR', 'Validation failed', 400, details),
  internal: (message = 'An unexpected error occurred') =>
    new ApiError('INTERNAL_ERROR', message, 500),
};

/**
 * Supabase error codes to user-friendly messages
 */
const SUPABASE_ERROR_MESSAGES: Record<string, string> = {
  // Auth errors
  'invalid_credentials': 'Invalid email or password',
  'email_not_confirmed': 'Please verify your email address',
  'user_not_found': 'No account found with this email',
  'user_already_exists': 'An account with this email already exists',
  'weak_password': 'Password is too weak. Use at least 8 characters',
  'expired_token': 'Your session has expired. Please log in again',
  'invalid_token': 'Invalid or expired link',

  // Database errors
  '23505': 'This record already exists',
  '23503': 'Cannot delete - this record is referenced by other data',
  '23502': 'Required field is missing',
  '42501': 'You do not have permission to perform this action',
  'PGRST116': 'Record not found',
  'PGRST301': 'Request timeout - please try again',

  // Rate limiting
  'over_request_rate_limit': 'Too many requests. Please wait a moment',
  'over_email_send_rate_limit': 'Too many emails sent. Please wait before trying again',
};

/**
 * Map Supabase error to user-friendly message
 */
export function mapSupabaseError(error: { code?: string; message?: string }): string {
  if (!error) return 'An unexpected error occurred';

  // Check for known error codes
  if (error.code && SUPABASE_ERROR_MESSAGES[error.code]) {
    return SUPABASE_ERROR_MESSAGES[error.code];
  }

  // Check for error message patterns
  const message = error.message?.toLowerCase() ?? '';

  if (message.includes('duplicate key')) {
    return 'This record already exists';
  }
  if (message.includes('foreign key')) {
    return 'Cannot delete - this record is referenced by other data';
  }
  if (message.includes('not found')) {
    return 'Record not found';
  }
  if (message.includes('permission denied') || message.includes('rls')) {
    return 'You do not have permission to perform this action';
  }
  if (message.includes('timeout')) {
    return 'Request timed out. Please try again';
  }
  if (message.includes('network')) {
    return 'Network error. Please check your connection';
  }

  // Don't leak raw DB messages to clients — log them server-side instead
  if (error.message) {
    logger.warn('[API] Unmapped Supabase error', { code: error.code, message: error.message });
  }
  return 'An unexpected error occurred';
}

/**
 * Format Zod validation errors for API response
 */
export function formatZodErrors(error: ZodError): Record<string, string[]> {
  const details: Record<string, string[]> = {};

  for (const issue of error.issues) {
    const path = issue.path.join('.') || '_root';
    if (!details[path]) {
      details[path] = [];
    }
    details[path].push(issue.message);
  }

  return details;
}

/**
 * Parse Zod errors into a flat object for form display
 * Returns { fieldName: 'error message' }
 */
export function parseZodErrorsFlat(error: ZodError): Record<string, string> {
  const errors: Record<string, string> = {};

  for (const issue of error.issues) {
    const path = issue.path.join('.') || '_root';
    if (!errors[path]) {
      errors[path] = issue.message;
    }
  }

  return errors;
}

/**
 * Safe parse wrapper that returns a standard result format
 */
export function safeParse<T>(
  schema: { safeParse: (data: unknown) => { success: boolean; data?: T; error?: ZodError } },
  data: unknown
): { success: true; data: T } | { success: false; error: ApiError } {
  const result = schema.safeParse(data);

  if (result.success) {
    return { success: true, data: result.data as T };
  }

  return {
    success: false,
    error: ApiErrors.validation(formatZodErrors(result.error!)),
  };
}

/**
 * Handle API errors and return consistent response
 * Use in catch blocks of API routes
 */
export function handleApiError(error: unknown): ApiErrorResponse {
  logger.error('[API Error]', error);

  if (error instanceof ApiError) {
    return error.toResponse();
  }

  if (error instanceof ZodError) {
    return {
      error: 'VALIDATION_ERROR',
      message: 'Validation failed',
      details: formatZodErrors(error),
      status: 400,
    };
  }

  // Supabase error
  if (typeof error === 'object' && error !== null && 'code' in error) {
    const supabaseError = error as { code?: string; message?: string };
    return {
      error: supabaseError.code || 'DATABASE_ERROR',
      message: mapSupabaseError(supabaseError),
      status: 400,
    };
  }

  // Generic error
  if (error instanceof Error) {
    return {
      error: 'INTERNAL_ERROR',
      message: process.env.NODE_ENV === 'development' ? error.message : 'An unexpected error occurred',
      status: 500,
    };
  }

  return {
    error: 'INTERNAL_ERROR',
    message: 'An unexpected error occurred',
    status: 500,
  };
}

/**
 * Create a NextResponse with error
 */
export function errorResponse(error: ApiErrorResponse): Response {
  return Response.json(
    { error: error.error, message: error.message, details: error.details },
    { status: error.status || 400 }
  );
}
