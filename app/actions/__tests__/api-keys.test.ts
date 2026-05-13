import { getApiKeys, createApiKey, revokeApiKey } from '../api-keys';

jest.mock('@/lib/getUserWithRolesSSR', () => ({
  getUserWithRolesSSR: jest.fn(() => Promise.resolve({ isDevelopment: false })),
}));

jest.mock('next/cache', () => ({
  revalidatePath: jest.fn(),
}));

jest.mock('@/lib/api-keys', () => ({
  generateApiKey: jest.fn(() => 'plain-test-key-aBc123'),
  hashApiKey: jest.fn((key: string) => `hashed:${key}`),
}));

const mockGetUser = jest.fn();
const mockOrder = jest.fn();
const mockEq = jest.fn();
const mockSelect = jest.fn();
const mockInsert = jest.fn();
const mockDeleteEqEq2 = jest.fn();
const mockDeleteEq = jest.fn();
const mockDelete = jest.fn();
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

beforeEach(() => {
  jest.clearAllMocks();
  mockGetUser.mockResolvedValue({
    data: { user: { id: USER_ID } },
    error: null,
  });

  // .from().select().eq().order()  → list keys
  mockOrder.mockResolvedValue({ data: [{ id: 'k1', name: 'Key' }], error: null });
  mockEq.mockReturnValue({ order: mockOrder });
  mockSelect.mockReturnValue({ eq: mockEq });

  // .from().insert(...)
  mockInsert.mockResolvedValue({ error: null });

  // .from().delete().eq().eq()
  mockDeleteEqEq2.mockResolvedValue({ error: null });
  mockDeleteEq.mockReturnValue({ eq: mockDeleteEqEq2 });
  mockDelete.mockReturnValue({ eq: mockDeleteEq });

  mockFrom.mockReturnValue({
    select: mockSelect,
    insert: mockInsert,
    delete: mockDelete,
  });
});

describe('getApiKeys', () => {
  it('returns Unauthorized when no user is in session', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });
    expect(await getApiKeys()).toEqual({
      success: false,
      error: 'Unauthorized',
    });
  });

  it('scopes the query to the current user_id and orders newest first', async () => {
    const result = await getApiKeys();
    expect(result.success).toBe(true);
    expect(mockFrom).toHaveBeenCalledWith('api_keys');
    expect(mockEq).toHaveBeenCalledWith('user_id', USER_ID);
    expect(mockOrder).toHaveBeenCalledWith('created_at', { ascending: false });
  });

  it('translates a database failure into a generic error', async () => {
    mockOrder.mockResolvedValueOnce({
      data: null,
      error: { message: 'oops' },
    });
    expect(await getApiKeys()).toEqual({
      success: false,
      error: 'Failed to fetch API keys',
    });
  });
});

describe('createApiKey', () => {
  it('blocks the test account in development', async () => {
    const { getUserWithRolesSSR } = jest.requireMock('@/lib/getUserWithRolesSSR');
    getUserWithRolesSSR.mockResolvedValueOnce({ isDevelopment: true });
    const result = await createApiKey('My key');
    expect(result.success).toBe(false);
    expect(mockInsert).not.toHaveBeenCalled();
  });

  it('returns Unauthorized when no user is in session', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });
    expect(await createApiKey('My key')).toEqual({
      success: false,
      error: 'Unauthorized',
    });
  });

  it('persists only the hash, never the plain key', async () => {
    const result = await createApiKey('Mobile app');
    expect(result.success).toBe(true);
    expect(result.apiKey).toBe('plain-test-key-aBc123');
    expect(mockInsert).toHaveBeenCalledWith({
      user_id: USER_ID,
      name: 'Mobile app',
      key_hash: 'hashed:plain-test-key-aBc123',
      is_active: true,
    });
  });

  it('does not return the plain key when insertion fails', async () => {
    mockInsert.mockResolvedValueOnce({ error: { message: 'oops' } });
    const result = await createApiKey('Mobile app');
    expect(result.success).toBe(false);
    expect(result.apiKey).toBeUndefined();
  });
});

describe('revokeApiKey', () => {
  it('blocks the test account in development', async () => {
    const { getUserWithRolesSSR } = jest.requireMock('@/lib/getUserWithRolesSSR');
    getUserWithRolesSSR.mockResolvedValueOnce({ isDevelopment: true });
    const result = await revokeApiKey('key-id');
    expect(result.success).toBe(false);
    expect(mockDelete).not.toHaveBeenCalled();
  });

  it('scopes the delete to id AND user_id (prevents cross-user revocation)', async () => {
    const result = await revokeApiKey('key-id-1');
    expect(result).toEqual({ success: true });
    expect(mockDeleteEq).toHaveBeenCalledWith('id', 'key-id-1');
    expect(mockDeleteEqEq2).toHaveBeenCalledWith('user_id', USER_ID);
  });

  it('returns a friendly error when delete fails', async () => {
    mockDeleteEqEq2.mockResolvedValueOnce({
      error: { message: 'rls denied' },
    });
    expect(await revokeApiKey('key-id-1')).toEqual({
      success: false,
      error: 'Failed to revoke API key',
    });
  });
});
