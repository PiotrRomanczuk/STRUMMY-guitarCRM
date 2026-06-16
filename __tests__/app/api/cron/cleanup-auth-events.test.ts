/**
 * Regression test for GET /api/cron/cleanup-auth-events (Phase 0.4).
 *
 * Guards the 200-path and the graceful-degradation path: if `auth_events` is
 * not present in the target DB (it is restored as part of Phase 0.1), the cron
 * must skip with 200, not 500.
 */

import { NextRequest } from 'next/server';
import { GET } from '@/app/api/cron/cleanup-auth-events/route';

// Provide a constructable NextResponse (the global jest.setup mock only has .json)
jest.mock('next/server', () => {
  class MockNextResponse {
    body: unknown;
    status: number;
    constructor(body: unknown, init?: { status?: number }) {
      this.body = body;
      this.status = init?.status ?? 200;
    }
    async json() {
      return this.body;
    }
    static json(data: unknown, init?: { status?: number }) {
      return { status: init?.status ?? 200, json: async () => data };
    }
  }
  class MockNextRequest {
    url: string;
    headers: Headers;
    constructor(url: string, init?: { headers?: HeadersInit }) {
      this.url = url;
      this.headers = new Headers(init?.headers);
    }
  }
  return { NextResponse: MockNextResponse, NextRequest: MockNextRequest };
});
import { createAdminClient } from '@/lib/supabase/admin';

jest.mock('@/lib/supabase/admin', () => ({
  createAdminClient: jest.fn(),
}));

const CRON_SECRET = 'test-cron-secret';

function makeRequest(): Request {
  return new NextRequest('http://localhost/api/cron/cleanup-auth-events', {
    headers: { authorization: `Bearer ${CRON_SECRET}` },
  });
}

/**
 * Builds a Supabase delete stub: `.from().delete().lt().select()` resolves to
 * the provided result.
 */
function mockDeleteQuery(result: { data: unknown; error: unknown }): {
  from: jest.Mock;
} {
  const select = jest.fn(() => Promise.resolve(result));
  const lt = jest.fn(() => ({ select }));
  const del = jest.fn(() => ({ lt }));
  return { from: jest.fn(() => ({ delete: del })) };
}

describe('GET /api/cron/cleanup-auth-events', () => {
  const OLD_ENV = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...OLD_ENV, CRON_SECRET };
  });

  afterAll(() => {
    process.env = OLD_ENV;
  });

  it('returns 200 with deletedCount on a successful cleanup', async () => {
    (createAdminClient as jest.Mock).mockReturnValue(
      mockDeleteQuery({ data: [{ id: 'a' }, { id: 'b' }], error: null })
    );

    const res = await GET(makeRequest());
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.deletedCount).toBe(2);
  });

  it('returns 200 and skips when auth_events table is absent', async () => {
    (createAdminClient as jest.Mock).mockReturnValue(
      mockDeleteQuery({
        data: null,
        error: { code: '42P01', message: 'relation "auth_events" does not exist' },
      })
    );

    const res = await GET(makeRequest());
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.skipped).toBe(true);
    expect(body.deletedCount).toBe(0);
  });

  it('returns 200 with success:false on a non-missing-table error', async () => {
    (createAdminClient as jest.Mock).mockReturnValue(
      mockDeleteQuery({
        data: null,
        error: { code: '08006', message: 'connection failure' },
      })
    );

    const res = await GET(makeRequest());
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(false);
  });

  it('returns 401 without a valid cron secret', async () => {
    const res = await GET(new NextRequest('http://localhost/api/cron/cleanup-auth-events'));
    expect(res.status).toBe(401);
  });
});
