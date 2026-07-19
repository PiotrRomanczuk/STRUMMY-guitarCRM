/**
 * Regression tests for GET /api/cron/daily-report.
 *
 * Trivial route (25 lines): verifies auth gating and that the route
 * forwards the result of sendAdminSongReport() without ever 500-ing.
 */

import { NextRequest } from 'next/server';
import { GET } from '@/app/api/cron/daily-report/route';

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

jest.mock('@/app/actions/email/send-admin-report', () => ({
  sendAdminSongReport: jest.fn(),
}));

import { sendAdminSongReport } from '@/app/actions/email/send-admin-report';

const CRON_SECRET = 'test-cron-secret';

function makeRequest(): Request {
  return new NextRequest('http://localhost/api/cron/daily-report', {
    headers: { authorization: `Bearer ${CRON_SECRET}` },
  });
}

describe('GET /api/cron/daily-report', () => {
  const OLD_ENV = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...OLD_ENV, CRON_SECRET };
  });

  afterAll(() => {
    process.env = OLD_ENV;
  });

  it('returns 401 without a valid cron secret', async () => {
    const res = await GET(new NextRequest('http://localhost/api/cron/daily-report'));
    expect(res.status).toBe(401);
  });

  it('returns 200 with success:true when the report sends', async () => {
    (sendAdminSongReport as jest.Mock).mockResolvedValue({ success: true });

    const res = await GET(makeRequest());
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
  });

  it('returns 200 with success:false when the report action fails', async () => {
    (sendAdminSongReport as jest.Mock).mockResolvedValue({
      success: false,
      error: 'SMTP unavailable',
    });

    const res = await GET(makeRequest());
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(false);
    expect(body.error).toBe('SMTP unavailable');
  });

  it('returns 200 (not 500) when sendAdminSongReport throws', async () => {
    (sendAdminSongReport as jest.Mock).mockRejectedValue(new Error('boom'));

    const res = await GET(makeRequest());
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(false);
  });
});
