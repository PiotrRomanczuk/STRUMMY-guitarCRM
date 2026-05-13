/**
 * Daily Report Cron Job Tests
 *
 * Tests for the daily report cron endpoint
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

// Mock the sendAdminSongReport before importing the route
jest.mock('@/app/actions/email/send-admin-report', () => ({
  sendAdminSongReport: jest.fn(),
}));

import { GET } from '@/app/api/cron/daily-report/route';
import { sendAdminSongReport } from '@/app/actions/email/send-admin-report';

const mockSendAdminSongReport = sendAdminSongReport as jest.MockedFunction<
  typeof sendAdminSongReport
>;

describe('Daily Report Cron API', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...originalEnv };
    process.env.CRON_SECRET = 'test-cron-secret-12345';
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  function createMockRequest(authHeader?: string): Request {
    const headers: Record<string, string> = {};
    if (authHeader) {
      headers['authorization'] = authHeader;
    }

    // Create a mock Request object that works in Jest environment
    const mockRequest = {
      headers: {
        get: (name: string) => headers[name.toLowerCase()] || null,
      },
      method: 'GET',
      url: 'http://localhost:3000/api/cron/daily-report',
    } as unknown as Request;

    return mockRequest;
  }

  describe('Authentication', () => {
    it('should return 401 when no authorization header is provided', async () => {
      const request = createMockRequest();

      const response = await GET(request);

      expect(response.status).toBe(401);
      const text = await response.text();
      expect(text).toBe('Unauthorized');
    });

    it('should return 401 when authorization header is invalid', async () => {
      const request = createMockRequest('Bearer wrong-secret');

      const response = await GET(request);

      expect(response.status).toBe(401);
    });

    it('should return 401 when authorization header format is wrong', async () => {
      const request = createMockRequest('test-cron-secret-12345');

      const response = await GET(request);

      expect(response.status).toBe(401);
    });

    it('should return 500 when CRON_SECRET is undefined (misconfigured)', async () => {
      delete process.env.CRON_SECRET;
      const request = createMockRequest('Bearer test-cron-secret-12345');

      const response = await GET(request);

      expect(response.status).toBe(500);
    });

    it('should authenticate with correct Bearer token', async () => {
      mockSendAdminSongReport.mockResolvedValueOnce({
        success: true,
        messageId: 'test-message-id',
      });
      const request = createMockRequest('Bearer test-cron-secret-12345');

      const response = await GET(request);

      expect(response.status).toBe(200);
    });
  });

  describe('Report Generation', () => {
    beforeEach(() => {
      process.env.CRON_SECRET = 'test-cron-secret-12345';
    });

    it('should call sendAdminSongReport when authenticated', async () => {
      mockSendAdminSongReport.mockResolvedValueOnce({
        success: true,
        messageId: 'test-id',
      });
      const request = createMockRequest('Bearer test-cron-secret-12345');

      await GET(request);

      expect(mockSendAdminSongReport).toHaveBeenCalledTimes(1);
    });

    it('should return success response when report is sent', async () => {
      mockSendAdminSongReport.mockResolvedValueOnce({
        success: true,
        messageId: 'msg-123',
      });
      const request = createMockRequest('Bearer test-cron-secret-12345');

      const response = await GET(request);

      expect(response.status).toBe(200);
      const json = await response.json();
      expect(json.success).toBe(true);
    });

    it('should return 200 when report fails (cron always returns 200)', async () => {
      mockSendAdminSongReport.mockResolvedValueOnce({
        success: false,
        error: 'Failed to send email',
      });
      const request = createMockRequest('Bearer test-cron-secret-12345');

      const response = await GET(request);

      expect(response.status).toBe(200);
      const json = await response.json();
      expect(json.success).toBe(false);
      expect(json.error).toBe('Failed to send email');
    });

    it('should return 200 on unexpected error (cron always returns 200)', async () => {
      mockSendAdminSongReport.mockRejectedValueOnce(new Error('Database connection failed'));
      const request = createMockRequest('Bearer test-cron-secret-12345');

      const response = await GET(request);

      expect(response.status).toBe(200);
      const json = await response.json();
      expect(json.success).toBe(false);
      expect(json.error).toBe('Internal Server Error');
    });
  });

  describe('Edge Cases', () => {
    it('should return 500 when CRON_SECRET is empty string (misconfigured)', async () => {
      process.env.CRON_SECRET = '';
      const request = createMockRequest('Bearer ');

      const response = await GET(request);

      // Empty CRON_SECRET is a server misconfiguration
      expect(response.status).toBe(500);
    });

    it('should be case sensitive for Bearer token', async () => {
      const request = createMockRequest('bearer test-cron-secret-12345');

      const response = await GET(request);

      // 'bearer' lowercase should not match 'Bearer'
      expect(response.status).toBe(401);
    });
  });
});
