import { markAllNotificationsAsRead, markNotificationAsRead } from '../in-app-notifications';

jest.mock('next/cache', () => ({ revalidatePath: jest.fn() }));

const mockGetUser = jest.fn();

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(() => Promise.resolve({ auth: { getUser: mockGetUser } })),
}));

const mockServiceMarkAsRead = jest.fn();
const mockServiceMarkAllAsRead = jest.fn();

jest.mock('@/lib/services/in-app-notification-service', () => ({
  getUserNotifications: jest.fn(),
  markAsRead: (...args: unknown[]) => mockServiceMarkAsRead(...args),
  markAllAsRead: (...args: unknown[]) => mockServiceMarkAllAsRead(...args),
  getUnreadCount: jest.fn(),
}));

const CALLER_ID = 'user-1';

beforeEach(() => {
  jest.clearAllMocks();
  mockGetUser.mockResolvedValue({ data: { user: { id: CALLER_ID } } });
  mockServiceMarkAsRead.mockResolvedValue(true);
  mockServiceMarkAllAsRead.mockResolvedValue(true);
});

describe('markNotificationAsRead', () => {
  it('scopes the mark-read call to the session user, not a client-supplied id', async () => {
    const result = await markNotificationAsRead('notif-1');
    expect(result).toBe(true);
    expect(mockServiceMarkAsRead).toHaveBeenCalledWith('notif-1', CALLER_ID);
  });

  it('rejects when there is no authenticated session', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });
    const result = await markNotificationAsRead('notif-1');
    expect(result).toBe(false);
    expect(mockServiceMarkAsRead).not.toHaveBeenCalled();
  });
});

describe('markAllNotificationsAsRead', () => {
  it('allows a caller marking their own notifications read', async () => {
    const result = await markAllNotificationsAsRead(CALLER_ID);
    expect(result).toBe(true);
    expect(mockServiceMarkAllAsRead).toHaveBeenCalledWith(CALLER_ID);
  });

  it('rejects a caller passing a different userId than their session', async () => {
    const result = await markAllNotificationsAsRead('someone-elses-id');
    expect(result).toBe(false);
    expect(mockServiceMarkAllAsRead).not.toHaveBeenCalled();
  });

  it('rejects when there is no authenticated session', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });
    const result = await markAllNotificationsAsRead(CALLER_ID);
    expect(result).toBe(false);
    expect(mockServiceMarkAllAsRead).not.toHaveBeenCalled();
  });
});
