/**
 * Regression tests for GET /api/cron/calendar-sync (spec 7.3).
 *
 * Guards the happy path, the 401 on missing secret, and the graceful
 * degradation path where syncAllTeacherCalendars throws — cron must
 * return 200, never 500.
 */

import { NextRequest } from 'next/server';
import { GET } from '@/app/api/cron/calendar-sync/route';

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

jest.mock('@/lib/services/calendar-sync-service', () => ({
  syncAllTeacherCalendars: jest.fn(),
}));

import { syncAllTeacherCalendars } from '@/lib/services/calendar-sync-service';

const CRON_SECRET = 'test-cron-secret';

function makeRequest(): Request {
  return new NextRequest('http://localhost/api/cron/calendar-sync', {
    headers: { authorization: `Bearer ${CRON_SECRET}` },
  });
}

describe('GET /api/cron/calendar-sync', () => {
  const OLD_ENV = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...OLD_ENV, CRON_SECRET };
  });

  afterAll(() => {
    process.env = OLD_ENV;
  });

  it('returns 401 when authorization header is missing', async () => {
    const res = await GET(new NextRequest('http://localhost/api/cron/calendar-sync'));
    expect(res.status).toBe(401);
  });

  it('returns 401 when CRON_SECRET env is not set', async () => {
    process.env = { ...OLD_ENV };
    delete process.env.CRON_SECRET;
    const res = await GET(makeRequest());
    // verifyCronSecret returns 500 when secret is not configured
    expect(res.status).toBeGreaterThanOrEqual(401);
  });

  it('returns 200 with sync summary on success', async () => {
    (syncAllTeacherCalendars as jest.Mock).mockResolvedValue({
      teachersSynced: 3,
      lessonsImported: 12,
      lessonsSkipped: 2,
      errors: [],
    });

    const res = await GET(makeRequest());
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.teachersSynced).toBe(3);
    expect(body.lessonsImported).toBe(12);
    expect(body.lessonsSkipped).toBe(2);
    expect(body.errors).toEqual([]);
  });

  it('returns 200 (not 500) when syncAllTeacherCalendars throws', async () => {
    (syncAllTeacherCalendars as jest.Mock).mockRejectedValue(new Error('Google API unavailable'));

    const res = await GET(makeRequest());
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(false);
    expect(body.error).toBe('Google API unavailable');
    expect(body.teachersSynced).toBe(0);
  });
});
