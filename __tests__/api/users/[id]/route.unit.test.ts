/**
 * @jest-environment node
 *
 * User API [id] Route Tests
 * Regression tests for STRUM-253: PUT must not clobber role flags
 * when the client sends a partial payload.
 */

import { PUT } from '@/app/api/users/[id]/route';
import { createClient } from '@/lib/supabase/server';
import { getUserWithRolesSSR } from '@/lib/getUserWithRolesSSR';

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(),
}));

jest.mock('@/lib/getUserWithRolesSSR', () => ({
  getUserWithRolesSSR: jest.fn(),
}));

jest.mock('@/lib/logger', () => ({
  logger: { error: jest.fn(), info: jest.fn(), warn: jest.fn() },
}));

const targetUserId = '00000000-0000-0000-0000-0000000000aa';

interface UpdateCall {
  payload: Record<string, unknown>;
}

function buildSupabaseMock(updateCalls: UpdateCall[]) {
  // Single returns the row after update
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
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
}

const paramsPromise = Promise.resolve({ id: targetUserId });

describe('PUT /api/users/[id] - partial payload (STRUM-253)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (getUserWithRolesSSR as jest.Mock).mockResolvedValue({
      user: { id: 'admin-id' },
      isAdmin: true,
    });
  });

  it('does not include role flags when client omits them', async () => {
    const calls: UpdateCall[] = [];
    (createClient as jest.Mock).mockResolvedValue(buildSupabaseMock(calls));

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
    (createClient as jest.Mock).mockResolvedValue(buildSupabaseMock(calls));

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
    (createClient as jest.Mock).mockResolvedValue(buildSupabaseMock(calls));

    const res = await PUT(makeRequest({}), { params: paramsPromise });

    expect(res.status).toBe(400);
    expect(calls).toHaveLength(0);
  });

  it('derives full_name from firstName/lastName only when provided', async () => {
    const calls: UpdateCall[] = [];
    (createClient as jest.Mock).mockResolvedValue(buildSupabaseMock(calls));

    const res = await PUT(makeRequest({ firstName: 'Ada', lastName: 'Lovelace' }), {
      params: paramsPromise,
    });

    expect(res.status).toBe(200);
    expect(calls[0].payload).toHaveProperty('full_name', 'Ada Lovelace');
  });
});
