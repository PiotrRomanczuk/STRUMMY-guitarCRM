/**
 * @jest-environment node
 *
 * User API [id] Route Tests
 * Regression tests for STRUM-253: PUT must not clobber role flags
 * when the client sends a partial payload.
 */

import { PUT } from '@/app/api/users/[id]/route';
import { createAdminClient } from '@/lib/supabase/admin';
import { withApiAuth } from '@/lib/auth/withApiAuth';

jest.mock('@/lib/supabase/admin', () => ({
  createAdminClient: jest.fn(),
}));

jest.mock('@/lib/auth/withApiAuth', () => ({
  withApiAuth: jest.fn(),
}));

jest.mock('@/lib/logger', () => ({
  logger: { error: jest.fn(), info: jest.fn(), warn: jest.fn() },
}));

const targetUserId = '00000000-0000-0000-0000-0000000000aa';

interface UpdateCall {
  payload: Record<string, unknown>;
}

function buildSupabaseMock(updateCalls: UpdateCall[]) {
  const returnedRow = { id: targetUserId, full_name: 'Updated' };

  const builder = {
    select: jest.fn().mockReturnThis(),
    update: jest.fn((payload: Record<string, unknown>) => {
      updateCalls.push({ payload });
      return builder;
    }),
    eq: jest.fn().mockReturnThis(),
    single: jest.fn().mockResolvedValue({ data: returnedRow, error: null }),
  };

  return {
    from: jest.fn().mockReturnValue(builder),
  };
}

function makeRequest(body: Record<string, unknown>): Request {
  return new Request('http://localhost/api/users/' + targetUserId, {
    method: 'PUT',
    headers: { 'content-type': 'application/json', Authorization: 'Bearer mock-token' },
    body: JSON.stringify(body),
  });
}

const paramsPromise = Promise.resolve({ id: targetUserId });

const mockAdminContext = {
  user: { id: 'admin-id' },
  roles: { isAdmin: true, isTeacher: false, isStudent: false },
};

describe('PUT /api/users/[id] - partial payload (STRUM-253)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (withApiAuth as jest.Mock).mockImplementation(async (_req: unknown, handler: (ctx: unknown, req?: unknown) => Promise<Response>) => {
      return handler(mockAdminContext, _req);
    });
  });

  it('does not include role flags when client omits them', async () => {
    const calls: UpdateCall[] = [];
    (createAdminClient as jest.Mock).mockReturnValue(buildSupabaseMock(calls));

    const res = await PUT(makeRequest({ full_name: 'New Name' }), {
      params: paramsPromise,
    });

    expect(res.status).toBe(200);
    expect(calls).toHaveLength(1);
    const payload = calls[0].payload;
    expect(payload).toHaveProperty('full_name', 'New Name');
    expect(payload).toHaveProperty('updated_at');
    expect(payload).not.toHaveProperty('is_admin');
    expect(payload).not.toHaveProperty('is_teacher');
    expect(payload).not.toHaveProperty('is_student');
    expect(payload).not.toHaveProperty('is_parent');
    expect(payload).not.toHaveProperty('is_active');
    expect(payload).not.toHaveProperty('parent_id');
  });

  it('includes role flags only when explicitly provided (incl. false)', async () => {
    const calls: UpdateCall[] = [];
    (createAdminClient as jest.Mock).mockReturnValue(buildSupabaseMock(calls));

    const res = await PUT(makeRequest({ isAdmin: false, isTeacher: true }), {
      params: paramsPromise,
    });

    expect(res.status).toBe(200);
    const payload = calls[0].payload;
    expect(payload).toHaveProperty('is_admin', false);
    expect(payload).toHaveProperty('is_teacher', true);
    expect(payload).not.toHaveProperty('is_student');
    expect(payload).not.toHaveProperty('full_name');
  });

  it('rejects empty payload (no updatable fields)', async () => {
    const calls: UpdateCall[] = [];
    (createAdminClient as jest.Mock).mockReturnValue(buildSupabaseMock(calls));

    const res = await PUT(makeRequest({}), { params: paramsPromise });

    expect(res.status).toBe(400);
    expect(calls).toHaveLength(0);
  });

  it('derives full_name from firstName/lastName only when provided', async () => {
    const calls: UpdateCall[] = [];
    (createAdminClient as jest.Mock).mockReturnValue(buildSupabaseMock(calls));

    const res = await PUT(makeRequest({ firstName: 'Ada', lastName: 'Lovelace' }), {
      params: paramsPromise,
    });

    expect(res.status).toBe(200);
    expect(calls[0].payload).toHaveProperty('full_name', 'Ada Lovelace');
  });
});
