import { sendNotification, queueNotification, checkUserPreference } from '../notification-service';
import { createAdminClient } from '@/lib/supabase/admin';
import transporter from '@/lib/email/smtp-client';

// Mock dependencies
jest.mock('@/lib/supabase/admin', () => ({
  createAdminClient: jest.fn(),
}));

jest.mock('@/lib/email/smtp-client', () => ({
  __esModule: true,
  default: { sendMail: jest.fn() },
  isSmtpConfigured: jest.fn().mockReturnValue(true),
}));

jest.mock('@/lib/email/rate-limiter', () => ({
  checkRateLimit: jest.fn().mockResolvedValue({ allowed: true }),
  checkSystemRateLimit: jest.fn().mockResolvedValue({ allowed: true }),
}));

jest.mock('@/lib/logging/notification-logger', () => ({
  logNotificationSent: jest.fn(),
  logNotificationFailed: jest.fn(),
  logNotificationQueued: jest.fn(),
  logNotificationSkipped: jest.fn(),
  logError: jest.fn(),
}));

// Mock in-app notification service
const mockCreateInAppNotification = jest.fn();
jest.mock(
  '@/lib/services/in-app-notification-service',
  () => ({
    createInAppNotification: mockCreateInAppNotification,
  }),
  { virtual: true }
);

describe('notification-service', () => {
  let mockSupabase: {
    from: jest.Mock;
    select: jest.Mock;
    eq: jest.Mock;
    single: jest.Mock;
    maybeSingle: jest.Mock;
    insert: jest.Mock;
    update: jest.Mock;
    lt: jest.Mock;
    order: jest.Mock;
    limit: jest.Mock;
    rpc: jest.Mock;
  };

  const createMockSupabase = () => {
    const mock = {
      from: jest.fn(),
      select: jest.fn(),
      eq: jest.fn(),
      single: jest.fn(),
      // Same underlying jest.fn() as `single` — getDeliveryChannel calls
      // .maybeSingle(), and tests queue its response via
      // `single.mockResolvedValueOnce(...)` in call order; sharing the fn
      // keeps both call sites reading from one queue.
      maybeSingle: undefined as unknown as jest.Mock,
      insert: jest.fn(),
      update: jest.fn(),
      lt: jest.fn(),
      order: jest.fn(),
      limit: jest.fn(),
      rpc: jest.fn(),
    };
    mock.maybeSingle = mock.single;

    // Chain methods return the mock object itself
    mock.from.mockReturnValue(mock);
    mock.select.mockReturnValue(mock);
    mock.eq.mockReturnValue(mock);
    mock.insert.mockReturnValue(mock);
    mock.update.mockReturnValue(mock);
    mock.lt.mockReturnValue(mock);
    mock.order.mockReturnValue(mock);
    mock.limit.mockReturnValue(mock);

    return mock;
  };

  const mockRecipient = {
    id: 'user-123',
    email: 'student@example.com',
    full_name: 'John Student',
  };

  const OLD_ENV = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    mockSupabase = createMockSupabase();
    (createAdminClient as jest.Mock).mockReturnValue(mockSupabase);
    mockCreateInAppNotification.mockClear();

    // Set up environment
    process.env = { ...OLD_ENV };
    process.env.GMAIL_USER = 'test@example.com';
    process.env.NEXT_PUBLIC_APP_URL = 'https://example.com';
  });

  afterAll(() => {
    process.env = OLD_ENV;
  });

  describe('sendNotification', () => {
    it.skip('should successfully send an in-app notification', async () => {
      // Mock recipient lookup
      mockSupabase.single.mockResolvedValueOnce({
        data: mockRecipient,
        error: null,
      });

      // Mock user preference check (enabled)
      mockSupabase.single.mockResolvedValueOnce({
        data: { enabled: true },
        error: null,
      });

      // Mock delivery channel query (in_app)
      mockSupabase.single.mockResolvedValueOnce({
        data: { delivery_channel: 'in_app' },
        error: null,
      });

      // Mock in-app notification creation
      mockCreateInAppNotification.mockResolvedValue({
        id: 'notif-123',
        title: 'Lesson Tomorrow',
        body: 'You have a lesson at 3:00 PM',
      });

      const result = await sendNotification({
        type: 'lesson_reminder_24h',
        recipientUserId: 'user-123',
        templateData: {
          studentName: 'John',
          lessonDate: '2026-02-10',
          lessonTime: '3:00 PM',
        },
      });

      expect(result.success).toBe(true);
      expect(mockCreateInAppNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'lesson_reminder_24h',
          recipientUserId: 'user-123',
          title: 'Lesson Tomorrow',
        })
      );
      expect(transporter.sendMail).not.toHaveBeenCalled();
    });

    it('should successfully send an email notification', async () => {
      // Mock recipient lookup
      mockSupabase.single.mockResolvedValueOnce({
        data: mockRecipient,
        error: null,
      });

      // Mock user preference check (enabled)
      mockSupabase.single.mockResolvedValueOnce({
        data: { enabled: true },
        error: null,
      });

      // Mock delivery channel query (email)
      mockSupabase.single.mockResolvedValueOnce({
        data: { delivery_channel: 'email' },
        error: null,
      });

      // Mock log entry creation
      mockSupabase.single.mockResolvedValueOnce({
        data: { id: 'log-123' },
        error: null,
      });

      // Mock email sending
      (transporter.sendMail as jest.Mock).mockResolvedValue({ messageId: 'msg-123' });

      const result = await sendNotification({
        type: 'lesson_recap',
        recipientUserId: 'user-123',
        templateData: {
          studentName: 'John',
          lessonTitle: 'Guitar Basics',
        },
      });

      expect(result.success).toBe(true);
      expect(transporter.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'student@example.com',
        })
      );
      expect(mockCreateInAppNotification).not.toHaveBeenCalled();
    });

    it('should skip notification if user preference is disabled', async () => {
      // Mock recipient lookup
      mockSupabase.single.mockResolvedValueOnce({
        data: mockRecipient,
        error: null,
      });

      // Mock preference check - disabled
      mockSupabase.single.mockResolvedValueOnce({
        data: { enabled: false },
        error: null,
      });

      // Mock log entry creation (skipped)
      mockSupabase.single.mockResolvedValueOnce({
        data: { id: 'log-skip-123' },
        error: null,
      });

      const result = await sendNotification({
        type: 'weekly_progress_digest',
        recipientUserId: 'user-123',
        templateData: { weekStart: '2026-02-03' },
      });

      expect(result.success).toBe(true);
      expect(result.skipped).toBe(true);
      expect(transporter.sendMail).not.toHaveBeenCalled();
    });

    it('should handle recipient not found error', async () => {
      mockSupabase.single.mockResolvedValueOnce({
        data: null,
        error: { message: 'User not found' },
      });

      const result = await sendNotification({
        type: 'lesson_reminder_24h',
        recipientUserId: 'nonexistent-user',
        templateData: {},
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Recipient not found');
    });

    it('should handle email sending failure', async () => {
      // Mock recipient lookup
      mockSupabase.single.mockResolvedValueOnce({
        data: mockRecipient,
        error: null,
      });

      // Mock user preference check (enabled)
      mockSupabase.single.mockResolvedValueOnce({
        data: { enabled: true },
        error: null,
      });

      // Mock delivery channel query (email)
      mockSupabase.single.mockResolvedValueOnce({
        data: { delivery_channel: 'email' },
        error: null,
      });

      // Mock log entry creation
      mockSupabase.single.mockResolvedValueOnce({
        data: { id: 'log-123' },
        error: null,
      });

      // Mock email sending failure
      (transporter.sendMail as jest.Mock).mockRejectedValue(new Error('SMTP error'));

      const result = await sendNotification({
        type: 'lesson_recap',
        recipientUserId: 'user-123',
        templateData: {},
      });

      expect(result.success).toBe(false);
    });

    it('should handle in-app notification creation failure gracefully', async () => {
      // Mock recipient lookup
      mockSupabase.single.mockResolvedValueOnce({
        data: mockRecipient,
        error: null,
      });

      // Mock user preference check (enabled)
      mockSupabase.single.mockResolvedValueOnce({
        data: { enabled: true },
        error: null,
      });

      // Mock delivery channel query (in_app)
      mockSupabase.single.mockResolvedValueOnce({
        data: { delivery_channel: 'in_app' },
        error: null,
      });

      // Mock in-app notification creation failure
      mockCreateInAppNotification.mockResolvedValue(null);

      const result = await sendNotification({
        type: 'lesson_cancelled',
        recipientUserId: 'user-123',
        templateData: {},
      });

      expect(result.success).toBe(false);
      expect(transporter.sendMail).not.toHaveBeenCalled();
    });
  });

  describe('queueNotification', () => {
    it('should successfully queue a notification', async () => {
      mockSupabase.single.mockResolvedValueOnce({
        data: { id: 'queue-123' },
        error: null,
      });

      const result = await queueNotification({
        type: 'assignment_due_reminder',
        recipientUserId: 'user-123',
        templateData: { assignmentTitle: 'Practice scales' },
        priority: 8,
        scheduledFor: new Date('2026-02-10T10:00:00Z'),
      });

      expect(result.success).toBe(true);
      expect(result.logId).toBe('queue-123');
      expect(mockSupabase.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          notification_type: 'assignment_due_reminder',
          recipient_user_id: 'user-123',
          priority: 8,
        })
      );
    });

    it('should use default priority and scheduled time', async () => {
      mockSupabase.single.mockResolvedValueOnce({
        data: { id: 'queue-456' },
        error: null,
      });

      const result = await queueNotification({
        type: 'lesson_recap',
        recipientUserId: 'user-123',
        templateData: {},
      });

      expect(result.success).toBe(true);
      expect(mockSupabase.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          priority: 5, // default
        })
      );
    });

    it('should handle queue insertion error', async () => {
      mockSupabase.single.mockResolvedValueOnce({
        data: null,
        error: { message: 'Insert failed' },
      });

      const result = await queueNotification({
        type: 'lesson_recap',
        recipientUserId: 'user-123',
        templateData: {},
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Failed to queue notification');
    });
  });

  describe('checkUserPreference', () => {
    it('should return true when preference is enabled', async () => {
      mockSupabase.single.mockResolvedValueOnce({
        data: { enabled: true },
        error: null,
      });

      const result = await checkUserPreference('user-123', 'lesson_reminder_24h');

      expect(result).toBe(true);
    });

    it('should return false when preference is disabled', async () => {
      mockSupabase.single.mockResolvedValueOnce({
        data: { enabled: false },
        error: null,
      });

      const result = await checkUserPreference('user-123', 'weekly_progress_digest');

      expect(result).toBe(false);
    });

    it('should default to true when no preference exists', async () => {
      mockSupabase.single.mockResolvedValueOnce({
        data: null,
        error: { message: 'Not found' },
      });

      const result = await checkUserPreference('user-123', 'lesson_reminder_24h');

      expect(result).toBe(true);
    });
  });
});
