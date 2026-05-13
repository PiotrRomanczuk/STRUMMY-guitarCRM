import { getUserSettings, saveUserSettings } from '../settings';
import type { UserSettings } from '@/schemas/SettingsSchema';

jest.mock('@/lib/getUserWithRolesSSR', () => ({
  getUserWithRolesSSR: jest.fn(() => Promise.resolve({ isDevelopment: false })),
}));

jest.mock('next/cache', () => ({
  revalidatePath: jest.fn(),
}));

const mockGetUser = jest.fn();
const mockSelectSingle = jest.fn();
const mockSelectEq = jest.fn();
const mockSelect = jest.fn();
const mockUpsertSingle = jest.fn();
const mockUpsertSelect = jest.fn();
const mockUpsert = jest.fn();
const mockFrom = jest.fn();

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(() =>
    Promise.resolve({
      auth: { getUser: mockGetUser },
      from: mockFrom,
    })
  ),
}));

const USER_ID = 'aaaaaaaa-1111-4111-8111-111111111111';

const dbRow = {
  id: 'row-1',
  user_id: USER_ID,
  theme: 'dark',
  language: 'pl',
  timezone: 'Europe/Warsaw',
  profile_visibility: 'private',
  show_email: true,
  show_last_seen: false,
  font_scheme: 'sans',
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-05-01T00:00:00Z',
};

beforeEach(() => {
  jest.clearAllMocks();
  mockGetUser.mockResolvedValue({
    data: { user: { id: USER_ID } },
    error: null,
  });
  mockSelectSingle.mockResolvedValue({ data: dbRow, error: null });
  mockSelectEq.mockReturnValue({ single: mockSelectSingle });
  mockSelect.mockReturnValue({ eq: mockSelectEq });

  mockUpsertSingle.mockResolvedValue({ data: dbRow, error: null });
  mockUpsertSelect.mockReturnValue({ single: mockUpsertSingle });
  mockUpsert.mockReturnValue({ select: mockUpsertSelect });

  mockFrom.mockReturnValue({ select: mockSelect, upsert: mockUpsert });
});

describe('getUserSettings', () => {
  it('returns Unauthorized when no user is in session', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });
    expect(await getUserSettings(USER_ID)).toEqual({
      success: false,
      error: 'Unauthorized',
    });
  });

  it('refuses to fetch settings for another user', async () => {
    const result = await getUserSettings('different-user');
    expect(result.success).toBe(false);
    expect(result.error).toMatch(/other user/);
  });

  it('returns DEFAULT settings when no row is found (PGRST116)', async () => {
    mockSelectSingle.mockResolvedValue({
      data: null,
      error: { code: 'PGRST116' },
    });
    const result = await getUserSettings(USER_ID);
    expect(result.success).toBe(true);
    expect(result.settings?.theme).toBe('system');
    expect(result.settings?.language).toBe('en');
    expect(result.settings?.profileVisibility).toBe('public');
  });

  it('maps snake_case row to camelCase UserSettings', async () => {
    const result = await getUserSettings(USER_ID);
    expect(result.success).toBe(true);
    expect(result.settings).toMatchObject({
      theme: 'dark',
      language: 'pl',
      timezone: 'Europe/Warsaw',
      profileVisibility: 'private',
      showEmail: true,
      showLastSeen: false,
    });
  });

  it('hardcodes notification preferences (DB does not store them yet)', async () => {
    const result = await getUserSettings(USER_ID);
    expect(result.settings).toMatchObject({
      emailNotifications: true,
      pushNotifications: false,
      lessonReminders: true,
    });
  });

  it('translates a non-PGRST116 error into a friendly message', async () => {
    mockSelectSingle.mockResolvedValue({
      data: null,
      error: { code: 'OTHER', message: 'oops' },
    });
    expect(await getUserSettings(USER_ID)).toEqual({
      success: false,
      error: 'Failed to fetch user settings',
    });
  });
});

describe('saveUserSettings', () => {
  const update: UserSettings = {
    emailNotifications: true,
    pushNotifications: false,
    lessonReminders: true,
    theme: 'dark',
    language: 'pl',
    timezone: 'Europe/Warsaw',
    profileVisibility: 'private',
    showEmail: true,
    showLastSeen: false,
  };

  it('blocks the test account in development', async () => {
    const { getUserWithRolesSSR } = jest.requireMock('@/lib/getUserWithRolesSSR');
    getUserWithRolesSSR.mockResolvedValueOnce({ isDevelopment: true });
    const result = await saveUserSettings(update);
    expect(result.success).toBe(false);
    expect(mockUpsert).not.toHaveBeenCalled();
  });

  it('returns Unauthorized when no user is in session', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });
    expect(await saveUserSettings(update)).toEqual({
      success: false,
      error: 'Unauthorized',
    });
  });

  it('upserts on user_id with snake_case columns and ignores notification fields', async () => {
    const result = await saveUserSettings(update);
    expect(result.success).toBe(true);
    expect(mockUpsert).toHaveBeenCalledTimes(1);
    const [payload, opts] = mockUpsert.mock.calls[0];
    expect(payload).toEqual({
      user_id: USER_ID,
      theme: 'dark',
      language: 'pl',
      timezone: 'Europe/Warsaw',
      profile_visibility: 'private',
      show_email: true,
      show_last_seen: false,
    });
    expect(opts).toEqual({ onConflict: 'user_id' });
  });

  it('returns the round-tripped settings via rowToSettings', async () => {
    const result = await saveUserSettings(update);
    expect(result.settings).toMatchObject({
      theme: 'dark',
      profileVisibility: 'private',
    });
  });

  it('surfaces a friendly error when upsert fails', async () => {
    mockUpsertSingle.mockResolvedValue({
      data: null,
      error: { message: 'denied' },
    });
    expect(await saveUserSettings(update)).toEqual({
      success: false,
      error: 'Failed to save user settings',
    });
  });
});
