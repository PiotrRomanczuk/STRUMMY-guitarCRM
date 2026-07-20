/**
 * Assignment Status Server Action Tests
 *
 * Tests the updateAssignmentStatus server action:
 * - Auth checks (student only)
 * - Ownership validation
 * - Status transition validation
 * - Test account guard
 *
 * @see app/actions/assignments.ts
 */

import { updateAssignmentStatus } from '../assignments';

// Delegates to the real state machine unless a test injects an override —
// only the defensive `?? 'Invalid status transition'` fallback needs one.
let validateOverride: { valid: boolean; error?: string } | null = null;
jest.mock('@/schemas/AssignmentSchema', () => {
  const actual = jest.requireActual('@/schemas/AssignmentSchema');
  return {
    ...actual,
    validateStatusTransition: (cur: string, next: string) =>
      validateOverride ?? actual.validateStatusTransition(cur, next),
  };
});

// Mock getUserWithRolesSSR
const mockGetUserWithRolesSSR = jest.fn();
jest.mock('@/lib/getUserWithRolesSSR', () => ({
  getUserWithRolesSSR: () => mockGetUserWithRolesSSR(),
}));

// Logger spies are resolved lazily inside the factory: the action calls
// createLogger() at module scope, so an eagerly-captured jest.fn() would TDZ.
const mockLogError = jest.fn();
jest.mock('@/lib/logger', () => ({
  createLogger: () => ({
    error: (...args: unknown[]) => mockLogError(...args),
    warn: jest.fn(),
    info: jest.fn(),
    debug: jest.fn(),
  }),
}));

// Mock Supabase client
const mockUpdate = jest.fn();
const mockUpdateResult = jest.fn();
const mockFrom = jest.fn();
const mockSelectEqIsSingle = jest.fn();

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(() =>
    Promise.resolve({
      from: (table: string) => {
        mockFrom(table);
        return {
          select: () => ({
            eq: () => ({
              is: () => ({
                single: () => mockSelectEqIsSingle(),
              }),
            }),
          }),
          update: (data: unknown) => {
            mockUpdate(data);
            return {
              eq: () => mockUpdateResult(),
            };
          },
        };
      },
    })
  ),
}));

// Mock revalidatePath
const mockRevalidatePath = jest.fn();
jest.mock('next/cache', () => ({
  revalidatePath: (path: string) => mockRevalidatePath(path),
}));

const STUDENT_ID = '123e4567-e89b-12d3-a456-426614174000';
const ASSIGNMENT_ID = '223e4567-e89b-12d3-a456-426614174001';

describe('updateAssignmentStatus', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    validateOverride = null;
    mockUpdateResult.mockResolvedValue({ error: null });
  });

  it('should update status when student owns the assignment', async () => {
    mockGetUserWithRolesSSR.mockResolvedValue({
      user: { id: STUDENT_ID },
      isAdmin: false,
      isTeacher: false,
      isStudent: true,
      isDevelopment: false,
    });

    mockSelectEqIsSingle.mockResolvedValue({
      data: {
        id: ASSIGNMENT_ID,
        student_id: STUDENT_ID,
        status: 'not_started',
      },
      error: null,
    });

    const result = await updateAssignmentStatus(ASSIGNMENT_ID, 'in_progress');

    expect(result).toEqual({
      success: true,
      assignmentId: ASSIGNMENT_ID,
      newStatus: 'in_progress',
    });
    expect(mockUpdate).toHaveBeenCalledWith({ status: 'in_progress' });
    expect(mockRevalidatePath).toHaveBeenCalledWith('/dashboard/assignments');
    expect(mockRevalidatePath).toHaveBeenCalledWith(`/dashboard/assignments/${ASSIGNMENT_ID}`);
  });

  it('should allow in_progress to completed transition', async () => {
    mockGetUserWithRolesSSR.mockResolvedValue({
      user: { id: STUDENT_ID },
      isAdmin: false,
      isTeacher: false,
      isStudent: true,
      isDevelopment: false,
    });

    mockSelectEqIsSingle.mockResolvedValue({
      data: {
        id: ASSIGNMENT_ID,
        student_id: STUDENT_ID,
        status: 'in_progress',
      },
      error: null,
    });

    const result = await updateAssignmentStatus(ASSIGNMENT_ID, 'completed');

    expect(result).toEqual({
      success: true,
      assignmentId: ASSIGNMENT_ID,
      newStatus: 'completed',
    });
    expect(mockUpdate).toHaveBeenCalledWith({ status: 'completed' });
  });

  it('should reject unauthenticated user', async () => {
    mockGetUserWithRolesSSR.mockResolvedValue({
      user: null,
      isAdmin: false,
      isTeacher: false,
      isStudent: false,
      isDevelopment: false,
    });

    const result = await updateAssignmentStatus(ASSIGNMENT_ID, 'in_progress');

    expect(result).toEqual({ error: 'Unauthorized' });
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it('should reject non-student user', async () => {
    mockGetUserWithRolesSSR.mockResolvedValue({
      user: { id: 'teacher-id' },
      isAdmin: false,
      isTeacher: true,
      isStudent: false,
      isDevelopment: false,
    });

    const result = await updateAssignmentStatus(ASSIGNMENT_ID, 'in_progress');

    expect(result).toEqual({ error: 'Only students can use this action' });
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it('should reject when assignment not found', async () => {
    mockGetUserWithRolesSSR.mockResolvedValue({
      user: { id: STUDENT_ID },
      isAdmin: false,
      isTeacher: false,
      isStudent: true,
      isDevelopment: false,
    });

    mockSelectEqIsSingle.mockResolvedValue({
      data: null,
      error: { message: 'not found' },
    });

    const result = await updateAssignmentStatus(ASSIGNMENT_ID, 'in_progress');

    expect(result).toEqual({ error: 'Assignment not found' });
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it('should reject when student does not own the assignment', async () => {
    const otherStudentId = '323e4567-e89b-12d3-a456-426614174002';

    mockGetUserWithRolesSSR.mockResolvedValue({
      user: { id: STUDENT_ID },
      isAdmin: false,
      isTeacher: false,
      isStudent: true,
      isDevelopment: false,
    });

    mockSelectEqIsSingle.mockResolvedValue({
      data: {
        id: ASSIGNMENT_ID,
        student_id: otherStudentId,
        status: 'not_started',
      },
      error: null,
    });

    const result = await updateAssignmentStatus(ASSIGNMENT_ID, 'in_progress');

    expect(result).toEqual({
      error: 'You can only update your own assignments',
    });
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it('should reject invalid status transition', async () => {
    mockGetUserWithRolesSSR.mockResolvedValue({
      user: { id: STUDENT_ID },
      isAdmin: false,
      isTeacher: false,
      isStudent: true,
      isDevelopment: false,
    });

    mockSelectEqIsSingle.mockResolvedValue({
      data: {
        id: ASSIGNMENT_ID,
        student_id: STUDENT_ID,
        status: 'completed',
      },
      error: null,
    });

    const result = await updateAssignmentStatus(ASSIGNMENT_ID, 'in_progress');

    expect(result).toHaveProperty('error');
    expect((result as { error: string }).error).toContain('Invalid status transition');
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it('should reject test account mutations', async () => {
    mockGetUserWithRolesSSR.mockResolvedValue({
      user: { id: STUDENT_ID },
      isAdmin: false,
      isTeacher: false,
      isStudent: true,
      isDevelopment: true,
    });

    const result = await updateAssignmentStatus(ASSIGNMENT_ID, 'in_progress');

    expect(result).toEqual({
      error: 'This action is not available on test accounts',
    });
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it('should allow overdue to completed transition', async () => {
    mockGetUserWithRolesSSR.mockResolvedValue({
      user: { id: STUDENT_ID },
      isAdmin: false,
      isTeacher: false,
      isStudent: true,
      isDevelopment: false,
    });

    mockSelectEqIsSingle.mockResolvedValue({
      data: {
        id: ASSIGNMENT_ID,
        student_id: STUDENT_ID,
        status: 'overdue',
      },
      error: null,
    });

    const result = await updateAssignmentStatus(ASSIGNMENT_ID, 'completed');

    expect(result).toEqual({
      success: true,
      assignmentId: ASSIGNMENT_ID,
      newStatus: 'completed',
    });
    expect(mockUpdate).toHaveBeenCalledWith({ status: 'completed' });
  });

  it('should reject not_started to completed transition', async () => {
    mockGetUserWithRolesSSR.mockResolvedValue({
      user: { id: STUDENT_ID },
      isAdmin: false,
      isTeacher: false,
      isStudent: true,
      isDevelopment: false,
    });

    mockSelectEqIsSingle.mockResolvedValue({
      data: {
        id: ASSIGNMENT_ID,
        student_id: STUDENT_ID,
        status: 'not_started',
      },
      error: null,
    });

    const result = await updateAssignmentStatus(ASSIGNMENT_ID, 'completed');

    expect(result).toHaveProperty('error');
    expect((result as { error: string }).error).toContain('Invalid status transition');
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it('should fall back to a generic message when the validator omits an error', async () => {
    // Defensive branch: validateStatusTransition always sets `error` today, but
    // the action must not surface `undefined` if that contract ever loosens.
    mockGetUserWithRolesSSR.mockResolvedValue({
      user: { id: STUDENT_ID },
      isAdmin: false,
      isTeacher: false,
      isStudent: true,
      isDevelopment: false,
    });

    mockSelectEqIsSingle.mockResolvedValue({
      data: {
        id: ASSIGNMENT_ID,
        student_id: STUDENT_ID,
        status: 'not_started',
      },
      error: null,
    });

    validateOverride = { valid: false };

    const result = await updateAssignmentStatus(ASSIGNMENT_ID, 'in_progress');

    expect(result).toEqual({ error: 'Invalid status transition' });
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it('should surface a generic error and log details when the update fails', async () => {
    mockGetUserWithRolesSSR.mockResolvedValue({
      user: { id: STUDENT_ID },
      isAdmin: false,
      isTeacher: false,
      isStudent: true,
      isDevelopment: false,
    });

    mockSelectEqIsSingle.mockResolvedValue({
      data: {
        id: ASSIGNMENT_ID,
        student_id: STUDENT_ID,
        status: 'not_started',
      },
      error: null,
    });

    mockUpdateResult.mockResolvedValue({ error: { message: 'row is locked' } });

    const result = await updateAssignmentStatus(ASSIGNMENT_ID, 'in_progress');

    expect(result).toEqual({ error: 'Failed to update assignment status' });
    expect(mockUpdate).toHaveBeenCalledWith({ status: 'in_progress' });
    expect(mockLogError).toHaveBeenCalledWith('Failed to update assignment status', {
      assignmentId: ASSIGNMENT_ID,
      newStatus: 'in_progress',
      error: { message: 'row is locked' },
    });
    // A failed write must not bust the cache.
    expect(mockRevalidatePath).not.toHaveBeenCalled();
  });
});
