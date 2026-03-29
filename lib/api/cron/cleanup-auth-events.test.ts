/**
 * Cleanup Auth Events Cron Job Tests
 *
 * Tests for the GDPR-compliant auth_events cleanup cron endpoint
 */

// Mock NextResponse from next/server
jest.mock('next/server', () => {
  class MockNextResponse {
    private body: string | null;
    private options: { status?: number };

    constructor(body: string | null, options: { status?: number } = {}) {
      this.body = body;
      this.options = options;
    }

    get status() {
      return this.options.status || 200;
    }

    async text() {
      return this.body || '';
    }

    async json() {
      return JSON.parse(this.body || '{}');
    }

    static json(data: unknown, options: { status?: number } = {}) {
      return new MockNextResponse(JSON.stringify(data), options);
    }
  }

  return {
    NextResponse: MockNextResponse,
  };
});

// Mock Sentry before logger import
jest.mock('@sentry/nextjs', () => ({
  addBreadcrumb: jest.fn(),
  captureException: jest.fn(),
  captureMessage: jest.fn(),
}));

// Mock createAdminClient
const mockSelect = jest.fn();
const mockLt = jest.fn().mockReturnValue({ select: mockSelect });
const mockDelete = jest.fn().mockReturnValue({ lt: mockLt });
const mockFrom = jest.fn().mockReturnValue({ delete: mockDelete });

jest.mock('@/lib/supabase/admin', () => ({
  createAdminClient: () => ({ from: mockFrom }),
}));

import { GET } from '@/app/api/cron/cleanup-auth-events/route';

describe('Cleanup Auth Events Cron API', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...originalEnv };
    process.env.CRON_SECRET = 'test-cron-secret-12345';

    // Reset mock chain
    mockSelect.mockResolvedValue({ data: [], error: null });
    mockLt.mockReturnValue({ select: mockSelect });
    mockDelete.mockReturnValue({ lt: mockLt });
    mockFrom.mockReturnValue({ delete: mockDelete });
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  function createMockRequest(authHeader?: string): Request {
    const headers: Record<string, string> = {};
    if (authHeader) {
      headers['authorization'] = authHeader;
    }

    return {
      headers: {
        get: (name: string) => headers[name.toLowerCase()] || null,
      },
      method: 'GET',
      url: 'http://localhost:3000/api/cron/cleanup-auth-events',
    } as unknown as Request;
  }

  describe('Authentication', () => {
    it('should return 401 when no authorization header is provided', async () => {
      const response = await GET(createMockRequest());
      expect(response.status).toBe(401);
    });

    it('should return 401 when authorization header is invalid', async () => {
      const response = await GET(createMockRequest('Bearer wrong-secret'));
      expect(response.status).toBe(401);
    });

    it('should return 500 when CRON_SECRET is not configured', async () => {
      delete process.env.CRON_SECRET;
      const response = await GET(
        createMockRequest('Bearer test-cron-secret-12345')
      );
      expect(response.status).toBe(500);
    });

    it('should not call database when unauthorized', async () => {
      const response = await GET(createMockRequest('Bearer wrong'));
      expect(response.status).toBe(401);
      expect(mockFrom).not.toHaveBeenCalled();
    });
  });

  describe('Cleanup Logic', () => {
    it('should delete auth events older than 90 days', async () => {
      const deletedRows = [{ id: 'a' }, { id: 'b' }, { id: 'c' }];
      mockSelect.mockResolvedValue({ data: deletedRows, error: null });

      const response = await GET(
        createMockRequest('Bearer test-cron-secret-12345')
      );
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.deletedCount).toBe(3);
      expect(json.retentionDays).toBe(90);
      expect(json.cutoffDate).toBeDefined();
      expect(json.timestamp).toBeDefined();
    });

    it('should query the auth_events table', async () => {
      await GET(createMockRequest('Bearer test-cron-secret-12345'));

      expect(mockFrom).toHaveBeenCalledWith('auth_events');
    });

    it('should filter by occurred_at with an ISO date string', async () => {
      await GET(createMockRequest('Bearer test-cron-secret-12345'));

      expect(mockLt).toHaveBeenCalledWith(
        'occurred_at',
        expect.stringMatching(/^\d{4}-\d{2}-\d{2}T/)
      );
    });

    it('should use a cutoff date approximately 90 days ago', async () => {
      const before = new Date();
      before.setDate(before.getDate() - 90);

      await GET(createMockRequest('Bearer test-cron-secret-12345'));

      const after = new Date();
      after.setDate(after.getDate() - 90);

      const passedCutoff = mockLt.mock.calls[0][1] as string;
      const cutoffDate = new Date(passedCutoff);

      expect(cutoffDate.getTime()).toBeGreaterThanOrEqual(
        before.getTime() - 5000
      );
      expect(cutoffDate.getTime()).toBeLessThanOrEqual(
        after.getTime() + 5000
      );
    });

    it('should return deletedCount 0 when no old events exist', async () => {
      mockSelect.mockResolvedValue({ data: [], error: null });

      const response = await GET(
        createMockRequest('Bearer test-cron-secret-12345')
      );
      const json = await response.json();

      expect(json.success).toBe(true);
      expect(json.deletedCount).toBe(0);
    });

    it('should handle null data response gracefully', async () => {
      mockSelect.mockResolvedValue({ data: null, error: null });

      const response = await GET(
        createMockRequest('Bearer test-cron-secret-12345')
      );
      const json = await response.json();

      expect(json.success).toBe(true);
      expect(json.deletedCount).toBe(0);
    });
  });

  describe('Error Handling', () => {
    it('should return 500 when database delete fails', async () => {
      mockSelect.mockResolvedValue({
        data: null,
        error: { message: 'DB connection failed', code: '500' },
      });

      const response = await GET(
        createMockRequest('Bearer test-cron-secret-12345')
      );
      const json = await response.json();

      expect(response.status).toBe(500);
      expect(json.success).toBe(false);
      expect(json.error).toBe('Database deletion failed');
    });

    it('should return 500 on unexpected error', async () => {
      mockFrom.mockImplementation(() => {
        throw new Error('Connection refused');
      });

      const response = await GET(
        createMockRequest('Bearer test-cron-secret-12345')
      );
      const json = await response.json();

      expect(response.status).toBe(500);
      expect(json.success).toBe(false);
      expect(json.error).toBe('Internal server error');
    });
  });
});
