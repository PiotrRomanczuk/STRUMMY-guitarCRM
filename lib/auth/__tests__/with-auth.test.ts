import type { User } from '@supabase/supabase-js';
import type { AuthResult } from '../api-auth';

// --- Mocks ---

const mockAuthenticateRequest = jest.fn<Promise<AuthResult>, [Request]>();
jest.mock('@/lib/auth/api-auth', () => ({
  authenticateRequest: (...args: [Request]) => mockAuthenticateRequest(...args),
}));

const mockSingle = jest.fn();
const mockEq = jest.fn();
const mockSelect = jest.fn();
const mockFrom = jest.fn();

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(() =>
    Promise.resolve({
      from: mockFrom,
    }),
  ),
}));

// Wire up the fluent chain
function setupProfileQuery(data: Record<string, unknown> | null, error: unknown = null) {
  mockSingle.mockReturnValue(Promise.resolve({ data, error }));
  mockEq.mockReturnValue({ single: mockSingle });
  mockSelect.mockReturnValue({ eq: mockEq });
  mockFrom.mockReturnValue({ select: mockSelect });
}

// --- Helpers ---

function makeFakeUser(overrides?: Partial<User>): User {
  return {
    id: 'user-123',
    email: 'test@example.com',
    app_metadata: {},
    user_metadata: {},
    aud: 'authenticated',
    created_at: '2024-01-01T00:00:00Z',
    ...overrides,
  } as User;
}

function makeFakeRequest(): Request {
  return new Request('http://localhost/api/test', { method: 'GET' });
}

// Import after mocks are set up
import { withAuth } from '../with-auth';
import { NextResponse } from 'next/server';

// --- Tests ---

describe('withAuth', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('authentication', () => {
    it('returns 401 when user is not authenticated', async () => {
      mockAuthenticateRequest.mockResolvedValue({
        user: null,
        error: 'Unauthorized - no valid session or API key',
        status: 401,
      });

      const handler = jest.fn();
      const response = await withAuth(makeFakeRequest(), handler);

      expect(response.status).toBe(401);
      const body = await response.json();
      expect(body.error).toBe('Unauthorized - no valid session or API key');
      expect(handler).not.toHaveBeenCalled();
    });

    it('returns the status from authenticateRequest on failure', async () => {
      mockAuthenticateRequest.mockResolvedValue({
        user: null,
        error: 'User not found',
        status: 404,
      });

      const handler = jest.fn();
      const response = await withAuth(makeFakeRequest(), handler);

      expect(response.status).toBe(404);
    });

    it('calls handler with authenticated user when no role required', async () => {
      const fakeUser = makeFakeUser();
      mockAuthenticateRequest.mockResolvedValue({
        user: fakeUser,
        status: 200,
      });

      const expectedResponse = NextResponse.json({ items: [] });
      const handler = jest.fn().mockResolvedValue(expectedResponse);

      const response = await withAuth(makeFakeRequest(), handler);

      expect(handler).toHaveBeenCalledWith(fakeUser);
      expect(response).toBe(expectedResponse);
    });

    it('uses "Unauthorized" as fallback error message', async () => {
      mockAuthenticateRequest.mockResolvedValue({
        user: null,
        error: undefined,
        status: 401,
      });

      const handler = jest.fn();
      const response = await withAuth(makeFakeRequest(), handler);

      const body = await response.json();
      expect(body.error).toBe('Unauthorized');
    });
  });

  describe('role-based authorization', () => {
    const fakeUser = makeFakeUser();

    beforeEach(() => {
      mockAuthenticateRequest.mockResolvedValue({
        user: fakeUser,
        status: 200,
      });
    });

    it('returns 403 when user lacks the required admin role', async () => {
      setupProfileQuery({ is_admin: false });

      const handler = jest.fn();
      const response = await withAuth(makeFakeRequest(), handler, { requiredRole: 'admin' });

      expect(response.status).toBe(403);
      const body = await response.json();
      expect(body.error).toBe('Forbidden. admin role required.');
      expect(handler).not.toHaveBeenCalled();
    });

    it('calls handler when user has required admin role', async () => {
      setupProfileQuery({ is_admin: true });

      const expectedResponse = NextResponse.json({ ok: true });
      const handler = jest.fn().mockResolvedValue(expectedResponse);

      const response = await withAuth(makeFakeRequest(), handler, { requiredRole: 'admin' });

      expect(handler).toHaveBeenCalledWith(fakeUser);
      expect(response).toBe(expectedResponse);
    });

    it('checks the correct column for teacher role', async () => {
      setupProfileQuery({ is_teacher: true });

      const handler = jest.fn().mockResolvedValue(NextResponse.json({}));
      await withAuth(makeFakeRequest(), handler, { requiredRole: 'teacher' });

      expect(mockSelect).toHaveBeenCalledWith('is_teacher');
      expect(handler).toHaveBeenCalled();
    });

    it('checks the correct column for student role', async () => {
      setupProfileQuery({ is_student: true });

      const handler = jest.fn().mockResolvedValue(NextResponse.json({}));
      await withAuth(makeFakeRequest(), handler, { requiredRole: 'student' });

      expect(mockSelect).toHaveBeenCalledWith('is_student');
      expect(handler).toHaveBeenCalled();
    });

    it('returns 403 when profile is not found', async () => {
      setupProfileQuery(null, { message: 'No rows found' });

      const handler = jest.fn();
      const response = await withAuth(makeFakeRequest(), handler, { requiredRole: 'admin' });

      expect(response.status).toBe(403);
      expect(handler).not.toHaveBeenCalled();
    });

    it('queries profiles table with the correct user id', async () => {
      const user = makeFakeUser({ id: 'specific-user-id' });
      mockAuthenticateRequest.mockResolvedValue({ user, status: 200 });
      setupProfileQuery({ is_admin: true });

      const handler = jest.fn().mockResolvedValue(NextResponse.json({}));
      await withAuth(makeFakeRequest(), handler, { requiredRole: 'admin' });

      expect(mockFrom).toHaveBeenCalledWith('profiles');
      expect(mockEq).toHaveBeenCalledWith('id', 'specific-user-id');
    });

    it('does not query profiles when no role is required', async () => {
      const handler = jest.fn().mockResolvedValue(NextResponse.json({}));
      await withAuth(makeFakeRequest(), handler);

      expect(mockFrom).not.toHaveBeenCalled();
    });
  });
});
