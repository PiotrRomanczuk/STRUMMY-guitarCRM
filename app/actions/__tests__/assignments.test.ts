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

// Mock getUserWithRolesSSR
const mockGetUserWithRolesSSR = jest.fn();
jest.mock('@/lib/getUserWithRolesSSR', () => ({
  getUserWithRolesSSR: () => mockGetUserWithRolesSSR(),
}));

// Mock Supabase client
const mockUpdate = jest.fn();
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
              eq: () => Promise.resolve({ error: null }),
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
    expect(mockRevalidatePath).toHaveBeenCalledWith(
      `/dashboard/assignments/${ASSIGNMENT_ID}`
    );
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
    expect((result as { error: string }).error).toContain(
      'Invalid status transition'
    );
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
    expect((result as { error: string }).error).toContain(
      'Invalid status transition'
    );
    expect(mockUpdate).not.toHaveBeenCalled();
  });
});
