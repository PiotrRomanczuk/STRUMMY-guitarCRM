/**
 * Checklist toggle server action tests.
 *
 * Mirrors app/actions/__tests__/assignments.test.ts. Verifies the write-path
 * split (student → SECURITY DEFINER RPC, teacher/admin → owned update),
 * ownership/existence guards, and the pure toggle merge.
 *
 * @see app/actions/assignment-checklist.ts
 */

import { applyChecklistToggle, toggleChecklistItemAction } from '../assignment-checklist';

const mockGetUserWithRolesSSR = jest.fn();
jest.mock('@/lib/getUserWithRolesSSR', () => ({
  getUserWithRolesSSR: () => mockGetUserWithRolesSSR(),
}));

const mockSingle = jest.fn();
const mockRpc = jest.fn();
const mockUpdate = jest.fn();

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(() =>
    Promise.resolve({
      from: () => ({
        select: () => ({ eq: () => ({ is: () => ({ single: () => mockSingle() }) }) }),
        update: (data: unknown) => {
          mockUpdate(data);
          return { eq: () => Promise.resolve({ error: null }) };
        },
      }),
      rpc: (name: string, args: unknown) => {
        mockRpc(name, args);
        return Promise.resolve({ error: null });
      },
    })
  ),
}));

const mockRevalidatePath = jest.fn();
jest.mock('next/cache', () => ({ revalidatePath: (p: string) => mockRevalidatePath(p) }));

const STUDENT_ID = '123e4567-e89b-12d3-a456-426614174000';
const TEACHER_ID = '223e4567-e89b-12d3-a456-426614174111';
const ASSIGNMENT_ID = '323e4567-e89b-12d3-a456-426614174001';

const CHECKLIST = [
  { id: 'a', text: 'Learn intro', done: false },
  { id: 'b', text: 'Play at 80 bpm', done: false },
];

const asStudent = {
  user: { id: STUDENT_ID },
  isAdmin: false,
  isTeacher: false,
  isStudent: true,
  isDevelopment: false,
};
const asTeacher = {
  user: { id: TEACHER_ID },
  isAdmin: false,
  isTeacher: true,
  isStudent: false,
  isDevelopment: false,
};

const fetchRow = (over: Record<string, unknown> = {}) =>
  mockSingle.mockResolvedValue({
    data: {
      id: ASSIGNMENT_ID,
      teacher_id: TEACHER_ID,
      student_id: STUDENT_ID,
      checklist: CHECKLIST,
      ...over,
    },
    error: null,
  });

describe('applyChecklistToggle', () => {
  it('flips exactly one item and preserves text and order', () => {
    const out = applyChecklistToggle(CHECKLIST, 'b', true);
    expect(out).toEqual([
      { id: 'a', text: 'Learn intro', done: false },
      { id: 'b', text: 'Play at 80 bpm', done: true },
    ]);
  });
});

describe('toggleChecklistItemAction', () => {
  beforeEach(() => jest.clearAllMocks());

  it('routes an owning student through the SECURITY DEFINER RPC (not a plain update)', async () => {
    mockGetUserWithRolesSSR.mockResolvedValue(asStudent);
    fetchRow();

    const result = await toggleChecklistItemAction(ASSIGNMENT_ID, 'a', true);

    expect(result).toEqual({ success: true });
    expect(mockRpc).toHaveBeenCalledWith('student_toggle_checklist_item', {
      p_assignment_id: ASSIGNMENT_ID,
      p_item_id: 'a',
      p_done: true,
    });
    expect(mockUpdate).not.toHaveBeenCalled();
    expect(mockRevalidatePath).toHaveBeenCalledWith(`/dashboard/assignments/${ASSIGNMENT_ID}`);
  });

  it('routes an owning teacher through a plain update with the flipped item', async () => {
    mockGetUserWithRolesSSR.mockResolvedValue(asTeacher);
    fetchRow();

    const result = await toggleChecklistItemAction(ASSIGNMENT_ID, 'a', true);

    expect(result).toEqual({ success: true });
    expect(mockUpdate).toHaveBeenCalledWith({
      checklist: [
        { id: 'a', text: 'Learn intro', done: true },
        { id: 'b', text: 'Play at 80 bpm', done: false },
      ],
    });
    expect(mockRpc).not.toHaveBeenCalled();
  });

  it('rejects a toggle of an item that does not exist', async () => {
    mockGetUserWithRolesSSR.mockResolvedValue(asStudent);
    fetchRow();

    const result = await toggleChecklistItemAction(ASSIGNMENT_ID, 'missing', true);

    expect(result).toEqual({ error: 'Checklist item not found' });
    expect(mockRpc).not.toHaveBeenCalled();
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it('rejects a non-owner', async () => {
    mockGetUserWithRolesSSR.mockResolvedValue({
      user: { id: 'someone-else' },
      isAdmin: false,
      isTeacher: false,
      isStudent: true,
      isDevelopment: false,
    });
    fetchRow();

    const result = await toggleChecklistItemAction(ASSIGNMENT_ID, 'a', true);

    expect(result).toEqual({ error: 'You cannot change this assignment' });
    expect(mockRpc).not.toHaveBeenCalled();
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it('rejects an unauthenticated user', async () => {
    mockGetUserWithRolesSSR.mockResolvedValue({
      user: null,
      isAdmin: false,
      isTeacher: false,
      isStudent: false,
      isDevelopment: false,
    });

    const result = await toggleChecklistItemAction(ASSIGNMENT_ID, 'a', true);
    expect(result).toEqual({ error: 'Unauthorized' });
  });

  it('rejects test-account mutations', async () => {
    mockGetUserWithRolesSSR.mockResolvedValue({ ...asStudent, isDevelopment: true });

    const result = await toggleChecklistItemAction(ASSIGNMENT_ID, 'a', true);
    expect(result).toHaveProperty('error');
    expect(mockRpc).not.toHaveBeenCalled();
    expect(mockUpdate).not.toHaveBeenCalled();
  });
});
