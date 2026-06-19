import { getLockedAccounts, unlockAccount } from '../lockout';

jest.mock('next/cache', () => ({ revalidatePath: jest.fn() }));

const mockGetUser = jest.fn();
const mockGuardSingle = jest.fn();
const serverFrom = jest.fn();

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(() =>
    Promise.resolve({
      auth: { getUser: mockGetUser },
      from: serverFrom,
    })
  ),
}));

const adminOrder = jest.fn();
const adminUpdateEq = jest.fn();
const adminUpdate = jest.fn(() => ({ eq: adminUpdateEq }));
const adminFrom = jest.fn();

jest.mock('@/lib/supabase/admin', () => ({
  createAdminClient: jest.fn(() => ({ from: adminFrom })),
}));

const ADMIN_ID = 'admin-1';
const LOCKED_ROW = {
  id: 'p2',
  email: 'locked@example.com',
  full_name: 'Locked User',
  failed_login_attempts: 5,
  locked_until: '2999-01-01T00:00:00Z',
};

beforeEach(() => {
  jest.clearAllMocks();
  mockGetUser.mockResolvedValue({ data: { user: { id: ADMIN_ID } }, error: null });
  mockGuardSingle.mockResolvedValue({ data: { is_admin: true }, error: null });
  serverFrom.mockReturnValue({
    select: () => ({ eq: () => ({ single: mockGuardSingle }) }),
  });
  adminOrder.mockResolvedValue({ data: [LOCKED_ROW], error: null });
  adminUpdateEq.mockResolvedValue({ error: null });
  adminFrom.mockReturnValue({
    select: () => ({ gt: () => ({ order: adminOrder }) }),
    update: adminUpdate,
  });
});

describe('getLockedAccounts', () => {
  it('rejects a non-admin caller', async () => {
    mockGuardSingle.mockResolvedValue({ data: { is_admin: false }, error: null });
    const res = await getLockedAccounts();
    expect(res.success).toBe(false);
    expect(res.error).toMatch(/Admin/);
  });

  it('rejects an unauthenticated caller', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null });
    const res = await getLockedAccounts();
    expect(res.success).toBe(false);
  });

  it('returns mapped locked accounts for an admin', async () => {
    const res = await getLockedAccounts();
    expect(res.success).toBe(true);
    expect(res.accounts).toEqual([
      {
        id: 'p2',
        email: 'locked@example.com',
        fullName: 'Locked User',
        failedLoginAttempts: 5,
        lockedUntil: '2999-01-01T00:00:00Z',
      },
    ]);
  });
});

describe('unlockAccount', () => {
  it('clears both lockout counters for an admin', async () => {
    const res = await unlockAccount('p2');
    expect(res.success).toBe(true);
    expect(adminUpdate).toHaveBeenCalledWith({ failed_login_attempts: 0, locked_until: null });
  });

  it('rejects a non-admin caller', async () => {
    mockGuardSingle.mockResolvedValue({ data: { is_admin: false }, error: null });
    const res = await unlockAccount('p2');
    expect(res.success).toBe(false);
    expect(adminUpdate).not.toHaveBeenCalled();
  });

  it('requires a profileId', async () => {
    const res = await unlockAccount('');
    expect(res.success).toBe(false);
    expect(adminUpdate).not.toHaveBeenCalled();
  });
});
