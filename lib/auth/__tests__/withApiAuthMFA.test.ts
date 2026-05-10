/**
 * @jest-environment node
 *
 * Locks `auth:mfa-bypass-impossible`: a session that has only verified the
 * password (aal1) cannot reach a route guarded by withApiAuthMFA when the
 * user has MFA enrolled (nextLevel === 'aal2'). The gate is opt-in;
 * existing withApiAuth routes are unchanged.
 */

import { NextResponse } from 'next/server';

const mockAuthenticateRequest = jest.fn();
jest.mock('@/lib/auth/api-auth', () => ({
  authenticateRequest: (...args: unknown[]) => mockAuthenticateRequest(...args),
}));

const mockLoadAuthedProfile = jest.fn();
jest.mock('@/lib/auth/loadAuthedProfile', () => ({
  loadAuthedProfile: (...args: unknown[]) => mockLoadAuthedProfile(...args),
  hasRole: (
    roles: { isAdmin?: boolean; isTeacher?: boolean; isStudent?: boolean },
    required: 'admin' | 'teacher' | 'student'
  ) => roles[`is${required[0].toUpperCase()}${required.slice(1)}` as keyof typeof roles] === true,
}));

const mockGetAAL = jest.fn();
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(() =>
    Promise.resolve({
      auth: {
        mfa: { getAuthenticatorAssuranceLevel: mockGetAAL },
      },
    })
  ),
}));

import { withApiAuthMFA } from '../withApiAuthMFA';

const USER = { id: 'aaaaaaaa-1111-4111-8111-111111111111', email: 'a@b.test' };
const PROFILE = {
  user: USER,
  roles: { isAdmin: false, isTeacher: true, isStudent: false },
  flags: { isParent: false, isDevelopment: false },
};

function makeRequest(headers: Record<string, string> = {}) {
  return new Request('http://localhost/api/secret', { headers });
}

const handler = jest.fn(async () => NextResponse.json({ ok: true }, { status: 200 }));

beforeEach(() => {
  jest.clearAllMocks();
  mockAuthenticateRequest.mockResolvedValue({ user: USER, status: 200 });
  mockLoadAuthedProfile.mockResolvedValue(PROFILE);
  mockGetAAL.mockResolvedValue({
    data: { currentLevel: 'aal2', nextLevel: 'aal2' },
    error: null,
  });
});

describe('withApiAuthMFA', () => {
  it('forwards the call when the session is at aal2 (MFA verified)', async () => {
    const res = await withApiAuthMFA(makeRequest(), handler);
    expect(res.status).toBe(200);
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('forwards the call when the user has no MFA enrolled (nextLevel === aal1)', async () => {
    mockGetAAL.mockResolvedValueOnce({
      data: { currentLevel: 'aal1', nextLevel: 'aal1' },
      error: null,
    });
    const res = await withApiAuthMFA(makeRequest(), handler);
    expect(res.status).toBe(200);
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('returns 401 mfa_required when MFA is enrolled but the session is aal1', async () => {
    mockGetAAL.mockResolvedValueOnce({
      data: { currentLevel: 'aal1', nextLevel: 'aal2' },
      error: null,
    });
    const res = await withApiAuthMFA(makeRequest(), handler);
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.code).toBe('mfa_required');
    expect(handler).not.toHaveBeenCalled();
  });

  it('bypasses the MFA gate for API-key callers (Bearer header)', async () => {
    const res = await withApiAuthMFA(makeRequest({ Authorization: 'Bearer sk_live_abc' }), handler);
    expect(res.status).toBe(200);
    expect(handler).toHaveBeenCalledTimes(1);
    // The MFA AAL lookup should NOT have run for an API-key caller.
    expect(mockGetAAL).not.toHaveBeenCalled();
  });

  it('returns 401 when the underlying auth fails (passes through withApiAuth)', async () => {
    mockAuthenticateRequest.mockResolvedValueOnce({
      user: null,
      error: 'Unauthorized',
      status: 401,
    });
    const res = await withApiAuthMFA(makeRequest(), handler);
    expect(res.status).toBe(401);
    expect(handler).not.toHaveBeenCalled();
    expect(mockGetAAL).not.toHaveBeenCalled();
  });

  it('returns 403 when no profile is loaded (passes through withApiAuth)', async () => {
    mockLoadAuthedProfile.mockResolvedValueOnce(null);
    const res = await withApiAuthMFA(makeRequest(), handler);
    expect(res.status).toBe(403);
    expect(handler).not.toHaveBeenCalled();
    expect(mockGetAAL).not.toHaveBeenCalled();
  });

  it('returns 403 when requiredRole is not satisfied (passes through withApiAuth)', async () => {
    mockLoadAuthedProfile.mockResolvedValueOnce({
      ...PROFILE,
      roles: { isAdmin: false, isTeacher: false, isStudent: true },
    });
    const res = await withApiAuthMFA(makeRequest(), handler, {
      requiredRole: 'admin',
    });
    expect(res.status).toBe(403);
    expect(handler).not.toHaveBeenCalled();
  });

  it('surfaces a 500 when the AAL lookup itself errors', async () => {
    mockGetAAL.mockResolvedValueOnce({
      data: null,
      error: { message: 'supabase down' },
    });
    const res = await withApiAuthMFA(makeRequest(), handler);
    expect(res.status).toBe(500);
    expect(handler).not.toHaveBeenCalled();
  });
});
