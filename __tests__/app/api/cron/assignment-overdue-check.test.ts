/**
 * Regression tests for GET /api/cron/assignment-overdue-check.
 *
 * Guards auth gating, the empty-result path, the happy path (marks
 * overdue assignments and queues an alert per assignment), and graceful
 * degradation on a DB error and a single failed queueNotification call.
 */

import { NextRequest } from 'next/server';
import { GET } from '@/app/api/cron/assignment-overdue-check/route';

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

jest.mock('@/lib/supabase/admin', () => ({
  createAdminClient: jest.fn(),
}));

jest.mock('@/lib/services/notification-service', () => ({
  queueNotification: jest.fn(),
}));

import { createAdminClient } from '@/lib/supabase/admin';
import { queueNotification } from '@/lib/services/notification-service';

const CRON_SECRET = 'test-cron-secret';

function makeRequest(): Request {
  return new NextRequest('http://localhost/api/cron/assignment-overdue-check', {
    headers: { authorization: `Bearer ${CRON_SECRET}` },
  });
}

/**
 * Builds a Supabase client stub covering both queries the route makes:
 * `.from('assignments').select(...).in().lt()` to find overdue assignments,
 * then `.from('assignments').update(...).in()` to mark them overdue.
 */
function mockAssignmentsClient(selectResult: { data: unknown; error: unknown }) {
  const lt = jest.fn().mockResolvedValue(selectResult);
  const inSelect = jest.fn(() => ({ lt }));
  const select = jest.fn(() => ({ in: inSelect }));

  const inUpdate = jest.fn().mockResolvedValue({ data: null, error: null });
  const update = jest.fn(() => ({ in: inUpdate }));

  return {
    from: jest.fn(() => ({ select, update })),
    __update: update,
    __inUpdate: inUpdate,
  };
}

describe('GET /api/cron/assignment-overdue-check', () => {
  const OLD_ENV = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...OLD_ENV, CRON_SECRET };
  });

  afterAll(() => {
    process.env = OLD_ENV;
  });

  it('returns 401 without a valid cron secret', async () => {
    const res = await GET(new NextRequest('http://localhost/api/cron/assignment-overdue-check'));
    expect(res.status).toBe(401);
  });

  it('returns 200 with count 0 when there are no overdue assignments', async () => {
    const client = mockAssignmentsClient({ data: [], error: null });
    (createAdminClient as jest.Mock).mockReturnValue(client);

    const res = await GET(makeRequest());
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.count).toBe(0);
    expect(client.__update).not.toHaveBeenCalled();
    expect(queueNotification).not.toHaveBeenCalled();
  });

  it('marks overdue assignments and queues an alert for each', async () => {
    const tenDaysAgo = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString();
    const client = mockAssignmentsClient({
      data: [
        {
          id: 'a1',
          title: 'Practice scales',
          due_date: tenDaysAgo,
          student_id: 'student-1',
          student_profile: { id: 'student-1', email: 's1@test.com', full_name: 'Student One' },
        },
      ],
      error: null,
    });
    (createAdminClient as jest.Mock).mockReturnValue(client);
    (queueNotification as jest.Mock).mockResolvedValue({ success: true });

    const res = await GET(makeRequest());
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.queued).toBe(1);
    expect(body.failed).toBe(0);
    expect(body.total).toBe(1);
    // Assignment status is flipped to overdue in the DB
    expect(client.__update).toHaveBeenCalledWith({ status: 'overdue' });
    expect(client.__inUpdate).toHaveBeenCalledWith('id', ['a1']);
    expect(queueNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'assignment_overdue_alert',
        recipientUserId: 'student-1',
        templateData: expect.objectContaining({
          daysOverdue: expect.any(Number),
        }),
      })
    );
    const call = (queueNotification as jest.Mock).mock.calls[0][0];
    expect(call.templateData.daysOverdue).toBeGreaterThanOrEqual(9);
  });

  it('counts a failed queueNotification without failing the whole batch', async () => {
    const client = mockAssignmentsClient({
      data: [
        {
          id: 'a1',
          title: 'Practice scales',
          due_date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
          student_id: 'student-1',
          student_profile: null,
        },
      ],
      error: null,
    });
    (createAdminClient as jest.Mock).mockReturnValue(client);
    (queueNotification as jest.Mock).mockRejectedValue(new Error('Queue unavailable'));

    const res = await GET(makeRequest());
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.queued).toBe(0);
    expect(body.failed).toBe(1);
  });

  it('returns 200 with success:false when fetching overdue assignments fails', async () => {
    const client = mockAssignmentsClient({ data: null, error: { message: 'connection failure' } });
    (createAdminClient as jest.Mock).mockReturnValue(client);

    const res = await GET(makeRequest());
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(false);
  });
});
