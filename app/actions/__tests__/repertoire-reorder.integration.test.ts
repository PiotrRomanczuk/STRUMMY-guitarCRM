/**
 * Integration test: repertoire:sort-order-persists
 *
 * Locks the new `reorderRepertoireAction`:
 *  - auth + test-account guard
 *  - schema validates the items
 *  - cross-student input is rejected
 *  - missing ids abort before any update
 *  - per-row failure halts and returns an error (no partial reorder)
 *  - happy path issues N updates with the correct sort_order values
 */

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(),
}));

jest.mock('next/cache', () => ({
  revalidatePath: jest.fn(),
}));

jest.mock('@/lib/getUserWithRolesSSR', () => ({
  getUserWithRolesSSR: jest.fn().mockResolvedValue({
    user: { id: 'aaaaaaaa-1111-4111-8111-111111111111' },
    isAdmin: false,
    isTeacher: true,
    isStudent: false,
    isParent: false,
    isDevelopment: false,
  }),
}));

jest.mock('@/lib/auth/test-account-guard', () => ({
  guardTestAccountMutation: jest.fn().mockReturnValue(null),
  assertNotTestAccount: jest.fn(),
}));

import { reorderRepertoireAction } from '@/app/actions/repertoire';
import { createClient } from '@/lib/supabase/server';

const STUDENT_A = 'aaaaaaaa-1111-4111-8111-111111111111';
const STUDENT_B = 'aaaaaaaa-2222-4222-8222-222222222222';
const ID_1 = 'aaaaaaaa-3333-4333-8333-000000000001';
const ID_2 = 'aaaaaaaa-3333-4333-8333-000000000002';
const ID_3 = 'aaaaaaaa-3333-4333-8333-000000000003';

interface BuildOpts {
  user?: { id: string } | null;
  lookupRows?: Array<{ id: string; student_id: string }>;
  lookupError?: { message: string } | null;
  perRowErrors?: Array<{ id: string; error: { message: string } }>;
}

function buildClient(opts: BuildOpts) {
  const lookupBuilder = {
    select: jest.fn(() => ({
      in: jest.fn(() =>
        Promise.resolve({
          data: opts.lookupRows ?? [],
          error: opts.lookupError ?? null,
        })
      ),
    })),
  };

  const updateCalls: Array<{ id: string; payload: Record<string, unknown> }> = [];
  const updateBuilder = {
    update: jest.fn((payload: Record<string, unknown>) => ({
      eq: jest.fn((_col: string, id: string) => {
        updateCalls.push({ id, payload });
        const failure = opts.perRowErrors?.find((e) => e.id === id);
        return Promise.resolve({ error: failure?.error ?? null });
      }),
    })),
  };

  let fromCall = 0;
  const fromMock = jest.fn(() => {
    const idx = fromCall++;
    return idx === 0 ? lookupBuilder : updateBuilder;
  });

  // `null` and `undefined` mean different things here:
  //   undefined → caller did not specify, default to teacher session
  //   null      → caller wants the unauthenticated path
  const userValue = 'user' in opts ? opts.user : { id: STUDENT_A };

  (createClient as jest.Mock).mockResolvedValue({
    auth: {
      getUser: jest.fn().mockResolvedValue({
        data: { user: userValue },
        error: null,
      }),
    },
    from: fromMock,
  });

  return { fromMock, updateCalls, updateBuilder };
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe('reorderRepertoireAction', () => {
  it('returns Unauthorized when no user is in session', async () => {
    buildClient({ user: null });
    const result = await reorderRepertoireAction([{ id: ID_1, sort_order: 0 }]);
    expect(result).toEqual({ error: 'Unauthorized' });
  });

  it('blocks the test account in development', async () => {
    const { guardTestAccountMutation } = jest.requireMock('@/lib/auth/test-account-guard');
    guardTestAccountMutation.mockReturnValueOnce({
      success: false,
      error: 'Test account cannot mutate',
    });
    const { fromMock } = buildClient({});
    const result = await reorderRepertoireAction([{ id: ID_1, sort_order: 0 }]);
    expect('error' in result).toBe(true);
    expect(fromMock).not.toHaveBeenCalled();
  });

  it('rejects an empty list', async () => {
    buildClient({});
    const result = await reorderRepertoireAction([]);
    expect('error' in result).toBe(true);
  });

  it('rejects more than 500 items', async () => {
    buildClient({});
    const items = Array.from({ length: 501 }, (_, i) => ({
      id: ID_1,
      sort_order: i,
    }));
    const result = await reorderRepertoireAction(items);
    expect('error' in result).toBe(true);
  });

  it('rejects malformed items (non-uuid id, negative sort_order)', async () => {
    buildClient({});
    expect(await reorderRepertoireAction([{ id: 'not-a-uuid', sort_order: 0 }])).toMatchObject({
      error: expect.any(String),
    });
    expect(await reorderRepertoireAction([{ id: ID_1, sort_order: -1 }])).toMatchObject({
      error: expect.any(String),
    });
  });

  it('returns "not found" when an id is missing from the lookup', async () => {
    buildClient({
      lookupRows: [{ id: ID_1, student_id: STUDENT_A }],
    });
    const result = await reorderRepertoireAction([
      { id: ID_1, sort_order: 0 },
      { id: ID_2, sort_order: 1 },
    ]);
    expect(result).toEqual({ error: 'One or more repertoire entries not found' });
  });

  it('rejects mixed-student input', async () => {
    buildClient({
      lookupRows: [
        { id: ID_1, student_id: STUDENT_A },
        { id: ID_2, student_id: STUDENT_B },
      ],
    });
    const result = await reorderRepertoireAction([
      { id: ID_1, sort_order: 0 },
      { id: ID_2, sort_order: 1 },
    ]);
    expect(result).toEqual({ error: 'Reorder must target a single student' });
  });

  it('halts on the first per-row update error (no partial reorder)', async () => {
    const { updateCalls } = buildClient({
      lookupRows: [
        { id: ID_1, student_id: STUDENT_A },
        { id: ID_2, student_id: STUDENT_A },
        { id: ID_3, student_id: STUDENT_A },
      ],
      perRowErrors: [{ id: ID_2, error: { message: 'rls denied' } }],
    });
    const result = await reorderRepertoireAction([
      { id: ID_1, sort_order: 0 },
      { id: ID_2, sort_order: 1 },
      { id: ID_3, sort_order: 2 },
    ]);
    expect(result).toEqual({ error: 'rls denied' });
    // ID_3 should NOT have been touched.
    expect(updateCalls.map((c) => c.id)).toEqual([ID_1, ID_2]);
  });

  it('happy path: applies all updates with the correct sort_order values', async () => {
    const { updateCalls } = buildClient({
      lookupRows: [
        { id: ID_1, student_id: STUDENT_A },
        { id: ID_2, student_id: STUDENT_A },
        { id: ID_3, student_id: STUDENT_A },
      ],
    });
    const result = await reorderRepertoireAction([
      { id: ID_1, sort_order: 2 },
      { id: ID_2, sort_order: 0 },
      { id: ID_3, sort_order: 1 },
    ]);
    expect(result).toEqual({ success: true, updated: 3 });
    expect(updateCalls).toEqual([
      { id: ID_1, payload: { sort_order: 2 } },
      { id: ID_2, payload: { sort_order: 0 } },
      { id: ID_3, payload: { sort_order: 1 } },
    ]);
  });

  it('surfaces a lookup-side DB error directly', async () => {
    buildClient({
      lookupError: { message: 'connection refused' },
    });
    const result = await reorderRepertoireAction([{ id: ID_1, sort_order: 0 }]);
    expect(result).toEqual({ error: 'connection refused' });
  });
});
