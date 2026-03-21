/**
 * Calendar Webhook Server Actions Tests
 *
 * Tests the Google Calendar webhook setup:
 * - enableCalendarWebhook - Set up calendar change notifications
 *
 * @see app/actions/calendar-webhook.ts
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import { enableCalendarWebhook } from '../calendar-webhook';

// Mock getUserWithRolesSSR
const mockGetUserWithRolesSSR = jest.fn();
jest.mock('@/lib/getUserWithRolesSSR', () => ({
  getUserWithRolesSSR: () => mockGetUserWithRolesSSR(),
}));

// Mock Supabase client
const mockInsert = jest.fn(() => Promise.resolve({ error: null }));

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(() =>
    Promise.resolve({
      from: () => ({
        insert: (data: any) => mockInsert(data),
      }),
    })
  ),
}));

// Mock Google Calendar
const mockWatchCalendar = jest.fn();

jest.mock('@/lib/google', () => ({
  watchCalendar: (userId: string, webhookUrl: string) => mockWatchCalendar(userId, webhookUrl),
}));

// Mock config
const mockGetAppConfig = jest.fn();

jest.mock('@/lib/config', () => ({
  getAppConfig: () => mockGetAppConfig(),
}));

describe('enableCalendarWebhook', () => {
  const teacherId = '123e4567-e89b-12d3-a456-426614174000';
  const originalEnv = process.env.NEXT_PUBLIC_APP_URL;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.NEXT_PUBLIC_APP_URL = 'https://example.com';
  });

  afterEach(() => {
    process.env.NEXT_PUBLIC_APP_URL = originalEnv;
  });

  it('should successfully enable webhook for teacher', async () => {
    mockGetUserWithRolesSSR.mockResolvedValue({
      user: { id: teacherId },
      isTeacher: true,
      isAdmin: false,
      isStudent: false,
      isDevelopment: false,
    });

    mockGetAppConfig.mockReturnValue({
      apiUrl: 'https://example.com/',
    });

    mockWatchCalendar.mockResolvedValue({
      channelId: 'channel-123',
      resourceId: 'resource-456',
      expiration: Date.now() + 7 * 24 * 60 * 60 * 1000,
    });

    const result = await enableCalendarWebhook();

    expect(result.success).toBe(true);
    expect(mockWatchCalendar).toHaveBeenCalledWith(
      teacherId,
      'https://example.com/api/webhooks/google-calendar'
    );
    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: teacherId,
        provider: 'google_calendar',
        channel_id: 'channel-123',
        resource_id: 'resource-456',
      })
    );
  });

  it('should reject non-teacher users', async () => {
    mockGetUserWithRolesSSR.mockResolvedValue({
      user: { id: 'student-id' },
      isTeacher: false,
      isAdmin: false,
      isStudent: true,
      isDevelopment: false,
    });

    const result = await enableCalendarWebhook();

    expect(result.success).toBe(false);
    expect(result.error).toBe('Unauthorized');
    expect(mockWatchCalendar).not.toHaveBeenCalled();
  });

  it('should reject unauthenticated users', async () => {
    mockGetUserWithRolesSSR.mockResolvedValue({
      user: null,
      isTeacher: false,
      isAdmin: false,
      isStudent: false,
      isDevelopment: false,
    });

    const result = await enableCalendarWebhook();

    expect(result.success).toBe(false);
    expect(result.error).toBe('Unauthorized');
  });

  it('should handle missing app URL from env', async () => {
    mockGetUserWithRolesSSR.mockResolvedValue({
      user: { id: teacherId },
      isTeacher: true,
      isAdmin: false,
      isStudent: false,
      isDevelopment: false,
    });

    mockGetAppConfig.mockReturnValue({
      apiUrl: null,
    });

    process.env.NEXT_PUBLIC_APP_URL = '';

    const result = await enableCalendarWebhook();

    expect(result.success).toBe(false);
    expect(result.error).toBe('Server configuration error: Missing App URL');
  });

  it('should reject localhost without ngrok', async () => {
    mockGetUserWithRolesSSR.mockResolvedValue({
      user: { id: teacherId },
      isTeacher: true,
      isAdmin: false,
      isStudent: false,
      isDevelopment: false,
    });

    mockGetAppConfig.mockReturnValue({
      apiUrl: 'http://localhost:3000',
    });

    process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000';

    const result = await enableCalendarWebhook();

    expect(result.success).toBe(false);
    expect(result.error).toContain('Google Webhooks require a public HTTPS URL');
  });

  it('should allow localhost with ngrok', async () => {
    mockGetUserWithRolesSSR.mockResolvedValue({
      user: { id: teacherId },
      isTeacher: true,
      isAdmin: false,
      isStudent: false,
      isDevelopment: false,
    });

    mockGetAppConfig.mockReturnValue({
      apiUrl: 'https://abc123.ngrok.io',
    });

    process.env.NEXT_PUBLIC_APP_URL = 'https://abc123.ngrok.io';

    mockWatchCalendar.mockResolvedValue({
      channelId: 'channel-123',
      resourceId: 'resource-456',
      expiration: Date.now() + 7 * 24 * 60 * 60 * 1000,
    });

    const result = await enableCalendarWebhook();

    expect(result.success).toBe(true);
  });

  it('should handle webhook registration failure', async () => {
    mockGetUserWithRolesSSR.mockResolvedValue({
      user: { id: teacherId },
      isTeacher: true,
      isAdmin: false,
      isStudent: false,
      isDevelopment: false,
    });

    mockGetAppConfig.mockReturnValue({
      apiUrl: 'https://example.com',
    });

    mockWatchCalendar.mockResolvedValue({
      channelId: null,
      resourceId: null,
      expiration: null,
    });

    const result = await enableCalendarWebhook();

    expect(result.success).toBe(false);
    expect(result.error).toBe('Failed to register webhook');
  });

  it('should handle database insertion error', async () => {
    mockGetUserWithRolesSSR.mockResolvedValue({
      user: { id: teacherId },
      isTeacher: true,
      isAdmin: false,
      isStudent: false,
      isDevelopment: false,
    });

    mockGetAppConfig.mockReturnValue({
      apiUrl: 'https://example.com',
    });

    mockWatchCalendar.mockResolvedValue({
      channelId: 'channel-123',
      resourceId: 'resource-456',
      expiration: Date.now() + 7 * 24 * 60 * 60 * 1000,
    });

    mockInsert.mockResolvedValueOnce({
      error: { message: 'Database error', code: '23505' },
    });

    const result = await enableCalendarWebhook();

    expect(result.success).toBe(false);
    expect(result.error).toBeTruthy();
  });

  it('should handle unexpected errors', async () => {
    mockGetUserWithRolesSSR.mockResolvedValue({
      user: { id: teacherId },
      isTeacher: true,
      isAdmin: false,
      isStudent: false,
      isDevelopment: false,
    });

    mockGetAppConfig.mockReturnValue({
      apiUrl: 'https://example.com',
    });

    mockWatchCalendar.mockRejectedValue(new Error('Network error'));

    const result = await enableCalendarWebhook();

    expect(result.success).toBe(false);
    expect(result.error).toBe('Network error');
  });

  it('should handle non-Error exceptions', async () => {
    mockGetUserWithRolesSSR.mockResolvedValue({
      user: { id: teacherId },
      isTeacher: true,
      isAdmin: false,
      isStudent: false,
      isDevelopment: false,
    });

    mockGetAppConfig.mockReturnValue({
      apiUrl: 'https://example.com',
    });

    mockWatchCalendar.mockRejectedValue('String error');

    const result = await enableCalendarWebhook();

    expect(result.success).toBe(false);
    expect(result.error).toBe('Unknown error');
  });
});
