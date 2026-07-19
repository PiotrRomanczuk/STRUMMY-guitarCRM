/**
 * Regression tests for GET /api/cron/drive-video-scan.
 *
 * Guards auth gating, the "no admin user found" degradation path, the
 * happy path where no review is needed (no notifications sent), the
 * happy path where review is needed (notifies every admin), and
 * graceful degradation when the sync itself throws.
 */

import { NextRequest } from 'next/server';
import { GET } from '@/app/api/cron/drive-video-scan/route';

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

jest.mock('@/lib/services/drive-video-sync', () => ({
  syncDriveVideosToSongs: jest.fn(),
}));

jest.mock('@/lib/services/in-app-notification-service', () => ({
  createInAppNotification: jest.fn(),
}));

import { createAdminClient } from '@/lib/supabase/admin';
import { syncDriveVideosToSongs } from '@/lib/services/drive-video-sync';
import { createInAppNotification } from '@/lib/services/in-app-notification-service';

const CRON_SECRET = 'test-cron-secret';

function makeRequest(): Request {
  return new NextRequest('http://localhost/api/cron/drive-video-scan', {
    headers: { authorization: `Bearer ${CRON_SECRET}` },
  });
}

/**
 * Builds a Supabase admin client stub for the two `.from('profiles')` calls
 * this route makes: first `.select('id').or(...).limit(1)` (uploader lookup),
 * then (only if review is needed) `.select('id').eq('is_admin', true)`.
 */
function mockProfilesClient(opts: {
  uploader: { data: unknown; error: unknown };
  allAdmins?: { data: unknown; error: unknown };
}) {
  const uploaderChain = {
    or: jest.fn().mockReturnValue({
      limit: jest.fn().mockResolvedValue(opts.uploader),
    }),
  };
  const allAdminsChain = {
    eq: jest.fn().mockResolvedValue(opts.allAdmins ?? { data: [], error: null }),
  };

  let selectCallCount = 0;
  const select = jest.fn(() => {
    selectCallCount++;
    return selectCallCount === 1 ? uploaderChain : allAdminsChain;
  });

  return { from: jest.fn(() => ({ select })) };
}

describe('GET /api/cron/drive-video-scan', () => {
  const OLD_ENV = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...OLD_ENV, CRON_SECRET };
  });

  afterAll(() => {
    process.env = OLD_ENV;
  });

  it('returns 401 without a valid cron secret', async () => {
    const res = await GET(new NextRequest('http://localhost/api/cron/drive-video-scan'));
    expect(res.status).toBe(401);
  });

  it('returns 200 with success:false when no admin/teacher user exists', async () => {
    (createAdminClient as jest.Mock).mockReturnValue(
      mockProfilesClient({ uploader: { data: [], error: null } })
    );

    const res = await GET(makeRequest());
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(false);
    expect(body.error).toBe('No admin users found');
    expect(syncDriveVideosToSongs).not.toHaveBeenCalled();
  });

  it('does not send notifications when no videos need review', async () => {
    (createAdminClient as jest.Mock).mockReturnValue(
      mockProfilesClient({ uploader: { data: [{ id: 'admin-1' }], error: null } })
    );
    (syncDriveVideosToSongs as jest.Mock).mockResolvedValue({
      totalFiles: 10,
      matched: 10,
      reviewQueue: 0,
      unmatched: 0,
      skipped: 0,
    });

    const res = await GET(makeRequest());
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.needsReview).toBe(0);
    expect(body.notificationsSent).toBe(false);
    expect(createInAppNotification).not.toHaveBeenCalled();
  });

  it('notifies every admin when videos need review', async () => {
    (createAdminClient as jest.Mock).mockReturnValue(
      mockProfilesClient({
        uploader: { data: [{ id: 'admin-1' }], error: null },
        allAdmins: {
          data: [{ id: 'admin-1' }, { id: 'admin-2' }],
          error: null,
        },
      })
    );
    (syncDriveVideosToSongs as jest.Mock).mockResolvedValue({
      totalFiles: 10,
      matched: 6,
      reviewQueue: 3,
      unmatched: 1,
      skipped: 0,
    });
    (createInAppNotification as jest.Mock).mockResolvedValue(null);

    const res = await GET(makeRequest());
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.needsReview).toBe(4);
    expect(body.notificationsSent).toBe(true);
    expect(createInAppNotification).toHaveBeenCalledTimes(2);
    expect(createInAppNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'admin_error_alert',
        recipientUserId: 'admin-1',
        actionUrl: '/dashboard/admin/drive-videos?tab=review',
      })
    );
  });

  it('returns 200 (not 500) when syncDriveVideosToSongs throws', async () => {
    (createAdminClient as jest.Mock).mockReturnValue(
      mockProfilesClient({ uploader: { data: [{ id: 'admin-1' }], error: null } })
    );
    (syncDriveVideosToSongs as jest.Mock).mockRejectedValue(new Error('Drive API rate limited'));

    const res = await GET(makeRequest());
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(false);
    expect(body.error).toBe('Drive API rate limited');
  });
});
