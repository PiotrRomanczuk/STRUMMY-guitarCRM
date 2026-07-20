/**
 * Unit tests for `resolveStudent` — the lesson form's student-selection resolver.
 *
 * @see app/actions/lesson-edit.helpers.ts
 *
 * Previously uncovered: `lesson-edit.test.ts` mocks this module wholesale, so the
 * real implementation never executed.
 */

import { resolveStudent } from '../lesson-edit.helpers';
import { matchStudentByEmail, createShadowStudent } from '@/lib/services/import-utils';
import { createAdminClient } from '@/lib/supabase/admin';

jest.mock('@/lib/supabase/admin', () => ({
  createAdminClient: jest.fn(() => ({ __admin: true })),
}));

jest.mock('@/lib/services/import-utils', () => ({
  matchStudentByEmail: jest.fn(),
  createShadowStudent: jest.fn(),
}));

const mockMatch = matchStudentByEmail as jest.Mock;
const mockCreateShadow = createShadowStudent as jest.Mock;

const STUDENT_ID = '123e4567-e89b-12d3-a456-426614174000';
const SHADOW_ID = '123e4567-e89b-12d3-a456-426614174009';

const candidate = (id: string) => ({
  id,
  email: 'emma.stone@example.com',
  firstName: 'Emma',
  lastName: 'Stone',
  user_id: null,
});

describe('resolveStudent', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockMatch.mockResolvedValue({ status: 'NONE', candidates: [] });
    mockCreateShadow.mockResolvedValue({ success: true, profileId: SHADOW_ID });
  });

  it('returns an explicit studentId without touching the database', async () => {
    expect(await resolveStudent(STUDENT_ID, 'ignored@example.com')).toEqual({
      ok: true,
      studentId: STUDENT_ID,
    });
    expect(createAdminClient).not.toHaveBeenCalled();
    expect(mockMatch).not.toHaveBeenCalled();
  });

  it.each([
    ['undefined', undefined],
    ['empty', ''],
    ['whitespace only', '   '],
  ])('rejects a missing student when the email is %s', async (_label, email) => {
    expect(await resolveStudent(undefined, email)).toEqual({
      ok: false,
      error: 'Select a student or enter an email',
    });
    expect(createAdminClient).not.toHaveBeenCalled();
  });

  it('normalizes the email before matching', async () => {
    await resolveStudent(undefined, '  Emma.Stone@Example.COM  ');

    expect(mockMatch).toHaveBeenCalledWith('emma.stone@example.com', { __admin: true });
  });

  it('returns the matched profile id', async () => {
    mockMatch.mockResolvedValue({ status: 'MATCHED', candidates: [candidate(STUDENT_ID)] });

    expect(await resolveStudent(undefined, 'emma.stone@example.com')).toEqual({
      ok: true,
      studentId: STUDENT_ID,
    });
    expect(mockCreateShadow).not.toHaveBeenCalled();
  });

  it('falls through to shadow creation when MATCHED carries no candidate', async () => {
    mockMatch.mockResolvedValue({ status: 'MATCHED', candidates: [] });

    expect(await resolveStudent(undefined, 'emma.stone@example.com')).toEqual({
      ok: true,
      studentId: SHADOW_ID,
    });
    expect(mockCreateShadow).toHaveBeenCalled();
  });

  it('reports ambiguity without creating a profile', async () => {
    mockMatch.mockResolvedValue({
      status: 'AMBIGUOUS',
      candidates: [candidate(STUDENT_ID), candidate(SHADOW_ID)],
    });

    expect(await resolveStudent(undefined, 'emma.stone@example.com')).toEqual({
      ok: false,
      ambiguous: true,
      error: 'Several students share that email — pick the existing student instead.',
    });
    expect(mockCreateShadow).not.toHaveBeenCalled();
  });

  it('derives first and last name from a dotted local part', async () => {
    await resolveStudent(undefined, 'emma.jane.stone@example.com');

    expect(mockCreateShadow).toHaveBeenCalledWith(
      'emma.jane.stone@example.com',
      'emma',
      'jane stone',
      { __admin: true }
    );
  });

  it('substitutes a placeholder when the local part starts with a separator', async () => {
    await resolveStudent(undefined, '.emma@example.com');

    expect(mockCreateShadow).toHaveBeenCalledWith('.emma@example.com', 'New', 'emma', {
      __admin: true,
    });
  });

  it('handles a local part with no separator', async () => {
    await resolveStudent(undefined, 'emma@example.com');

    expect(mockCreateShadow).toHaveBeenCalledWith('emma@example.com', 'emma', '', {
      __admin: true,
    });
  });

  it('returns the shadow-create error when creation fails', async () => {
    mockCreateShadow.mockResolvedValue({ success: false, error: 'duplicate email' });

    expect(await resolveStudent(undefined, 'emma@example.com')).toEqual({
      ok: false,
      error: 'duplicate email',
    });
  });

  it('falls back to a generic message when creation fails without a reason', async () => {
    mockCreateShadow.mockResolvedValue({ success: false });

    expect(await resolveStudent(undefined, 'emma@example.com')).toEqual({
      ok: false,
      error: 'Could not create student',
    });
  });

  it('rejects a successful create that returns no profile id', async () => {
    mockCreateShadow.mockResolvedValue({ success: true, profileId: undefined });

    expect(await resolveStudent(undefined, 'emma@example.com')).toEqual({
      ok: false,
      error: 'Could not create student',
    });
  });
});
