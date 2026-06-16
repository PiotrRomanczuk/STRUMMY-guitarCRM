/**
 * Regression test for GET /api/cron/weekly-digest (Phase 0.4).
 *
 * Guards the 200-path and the graceful-degradation path: when
 * `notification_preferences` is not yet present in the target DB (it is
 * restored as part of Phase 0.1), the cron must skip with 200, not 500.
 */

import { NextRequest } from 'next/server';
import { GET } from '@/app/api/cron/weekly-digest/route';

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
import { queueNotification } from '@/lib/services/notification-service';

jest.mock('@/lib/supabase/admin', () => ({
  createAdminClient: jest.fn(),
}));

jest.mock('@/lib/services/notification-service', () => ({
  queueNotification: jest.fn(),
}));

const CRON_SECRET = 'test-cron-secret';

function makeRequest(): Request {
  return new NextRequest('http://localhost/api/cron/weekly-digest', {
    headers: { authorization: `Bearer ${CRON_SECRET}` },
  });
}

/**
 * Builds a chainable Supabase query stub whose terminal `await` resolves to
 * the provided result. The preferences query chains
 * `.from().select().eq().eq().eq()` and is then awaited.
 */
function mockPreferencesQuery(result: { data: unknown; error: unknown }): { from: jest.Mock } {
  const thenable = {
    eq: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    then: (resolve: (v: unknown) => void) => resolve(result),
  };
  return { from: jest.fn(() => thenable) };
}

describe('GET /api/cron/weekly-digest', () => {
  const OLD_ENV = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...OLD_ENV, CRON_SECRET };
  });

  afterAll(() => {
    process.env = OLD_ENV;
  });

  it('returns 200 and skips when notification_preferences table is absent', async () => {
    (createAdminClient as jest.Mock).mockReturnValue(
      mockPreferencesQuery({
        data: null,
        error: { code: '42P01', message: 'relation "notification_preferences" does not exist' },
      })
    );

    const res = await GET(makeRequest());
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.skipped).toBe(true);
    expect(queueNotification).not.toHaveBeenCalled();
  });

  it('returns 200 with success:false on a non-missing-table error', async () => {
    (createAdminClient as jest.Mock).mockReturnValue(
      mockPreferencesQuery({
        data: null,
        error: { code: '08006', message: 'connection failure' },
      })
    );

    const res = await GET(makeRequest());
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(false);
  });

  it('returns 200 with count 0 when there are no recipients', async () => {
    (createAdminClient as jest.Mock).mockReturnValue(
      mockPreferencesQuery({ data: [], error: null })
    );

    const res = await GET(makeRequest());
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.count).toBe(0);
  });

  it('returns 401 without a valid cron secret', async () => {
    const res = await GET(new NextRequest('http://localhost/api/cron/weekly-digest'));
    expect(res.status).toBe(401);
  });
});
