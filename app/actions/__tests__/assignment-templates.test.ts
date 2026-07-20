/**
 * Assignment Templates Server Actions Tests
 *
 * Tests the assignment template CRUD operations:
 * - createAssignmentTemplate
 * - updateAssignmentTemplate
 * - deleteAssignmentTemplate
 *
 * @see app/actions/assignment-templates.ts
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import {
  createAssignmentTemplate,
  updateAssignmentTemplate,
  deleteAssignmentTemplate,
} from '../assignment-templates';

// Mock getUserWithRolesSSR
const mockGetUserWithRolesSSR = jest.fn();
jest.mock('@/lib/getUserWithRolesSSR', () => ({
  getUserWithRolesSSR: () => mockGetUserWithRolesSSR(),
}));

// Mock Supabase client
const mockInsert = jest.fn();
const mockUpdate = jest.fn();
const mockDelete = jest.fn();
const mockEq = jest.fn();
const mockSelect = jest.fn();
const mockSingle = jest.fn();
const mockFrom = jest.fn();
// Shared terminal result for insert/update/delete so a test can fail any of
// the three write paths the same way.
const mockWriteResult = jest.fn();

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(() =>
    Promise.resolve({
      from: (table: string) => {
        mockFrom(table);
        return {
          insert: (data: unknown) => {
            mockInsert(data);
            return mockWriteResult();
          },
          update: (data: unknown) => {
            mockUpdate(data);
            return {
              eq: (field: string, value: string) => {
                mockEq(field, value);
                return mockWriteResult();
              },
            };
          },
          delete: () => {
            mockDelete();
            return {
              eq: (field: string, value: string) => {
                mockEq(field, value);
                return mockWriteResult();
              },
            };
          },
          select: (fields: string) => {
            mockSelect(fields);
            return {
              eq: (field: string, value: string) => {
                mockEq(field, value);
                return {
                  single: () => mockSingle(),
                };
              },
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

// This action uses the bare `logger` singleton (not createLogger). The arrow
// indirection keeps the spy resolution lazy.
const mockLogError = jest.fn();
jest.mock('@/lib/logger', () => ({
  logger: {
    error: (...args: unknown[]) => mockLogError(...args),
    warn: jest.fn(),
    info: jest.fn(),
    debug: jest.fn(),
  },
}));

describe('createAssignmentTemplate', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockWriteResult.mockResolvedValue({ error: null });
  });

  it('should create template when user is teacher', async () => {
    const teacherId = '123e4567-e89b-12d3-a456-426614174000';
    mockGetUserWithRolesSSR.mockResolvedValue({
      user: { id: teacherId },
      isAdmin: false,
      isTeacher: true,
      isStudent: false,
      isDevelopment: false,
    });

    const templateData = {
      title: 'Scale Practice',
      description: 'Practice major scales',
      teacher_id: teacherId,
    };

    await createAssignmentTemplate(templateData);

    expect(mockInsert).toHaveBeenCalledWith({
      ...templateData,
      teacher_id: teacherId,
    });
    expect(mockRevalidatePath).toHaveBeenCalledWith('/dashboard/assignments/templates');
  });

  it('passes an authored checklist through to insert', async () => {
    const teacherId = '123e4567-e89b-12d3-a456-426614174000';
    mockGetUserWithRolesSSR.mockResolvedValue({
      user: { id: teacherId },
      isAdmin: false,
      isTeacher: true,
      isStudent: false,
      isDevelopment: false,
    });

    const checklist = [{ id: 'a', text: 'C major', done: false }];
    await createAssignmentTemplate({
      title: 'Scale week',
      description: 'Majors',
      teacher_id: teacherId,
      checklist,
    });

    expect(mockInsert).toHaveBeenCalledWith({
      title: 'Scale week',
      description: 'Majors',
      teacher_id: teacherId,
      checklist,
    });
  });

  it('should create template when user is admin', async () => {
    const adminId = '223e4567-e89b-12d3-a456-426614174001';
    mockGetUserWithRolesSSR.mockResolvedValue({
      user: { id: adminId },
      isAdmin: true,
      isTeacher: false,
      isStudent: false,
      isDevelopment: false,
    });

    const templateData = {
      title: 'Chord Progressions',
      description: 'Practice common progressions',
      teacher_id: adminId,
    };

    await createAssignmentTemplate(templateData);

    expect(mockInsert).toHaveBeenCalledWith({
      ...templateData,
      teacher_id: adminId,
    });
  });

  it('should reject when user is student', async () => {
    const studentId = '323e4567-e89b-12d3-a456-426614174002';
    mockGetUserWithRolesSSR.mockResolvedValue({
      user: { id: studentId },
      isAdmin: false,
      isTeacher: false,
      isStudent: true,
      isDevelopment: false,
    });

    await expect(
      createAssignmentTemplate({
        title: 'Test',
        description: 'Test',
        teacher_id: studentId,
      })
    ).rejects.toThrow('Unauthorized');

    expect(mockInsert).not.toHaveBeenCalled();
  });

  it('should reject when user is not authenticated', async () => {
    mockGetUserWithRolesSSR.mockResolvedValue({
      user: null,
      isAdmin: false,
      isTeacher: false,
      isStudent: false,
      isDevelopment: false,
    });

    await expect(
      createAssignmentTemplate({
        title: 'Test',
        description: 'Test',
        teacher_id: '423e4567-e89b-12d3-a456-426614174003',
      })
    ).rejects.toThrow('Unauthorized');
  });

  it('should validate input data', async () => {
    mockGetUserWithRolesSSR.mockResolvedValue({
      user: { id: '523e4567-e89b-12d3-a456-426614174004' },
      isAdmin: false,
      isTeacher: true,
      isStudent: false,
      isDevelopment: false,
    });

    await expect(
      createAssignmentTemplate({
        title: '',
        description: '',
        teacher_id: '',
      } as any)
    ).rejects.toThrow('Invalid data');
  });

  it('should reject demo/test accounts before touching the database', async () => {
    const teacherId = '123e4567-e89b-12d3-a456-426614174000';
    mockGetUserWithRolesSSR.mockResolvedValue({
      user: { id: teacherId },
      isAdmin: false,
      isTeacher: true,
      isStudent: false,
      isDevelopment: true,
    });

    await expect(
      createAssignmentTemplate({
        title: 'Scale Practice',
        description: 'Practice major scales',
        teacher_id: teacherId,
      })
    ).rejects.toThrow('This action is not available on test accounts');

    expect(mockInsert).not.toHaveBeenCalled();
  });

  it('should throw a generic error and log details when the insert fails', async () => {
    const teacherId = '123e4567-e89b-12d3-a456-426614174000';
    mockGetUserWithRolesSSR.mockResolvedValue({
      user: { id: teacherId },
      isAdmin: false,
      isTeacher: true,
      isStudent: false,
      isDevelopment: false,
    });

    const dbError = { message: 'duplicate key value violates unique constraint' };
    mockWriteResult.mockResolvedValue({ error: dbError });

    await expect(
      createAssignmentTemplate({
        title: 'Scale Practice',
        description: 'Practice major scales',
        teacher_id: teacherId,
      })
    ).rejects.toThrow('Failed to create assignment template');

    expect(mockLogError).toHaveBeenCalledWith('Error creating assignment template:', dbError);
    // A failed write must not bust the cache.
    expect(mockRevalidatePath).not.toHaveBeenCalled();
  });
});

describe('updateAssignmentTemplate', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockWriteResult.mockResolvedValue({ error: null });
  });

  it('should allow teacher to update own template', async () => {
    const teacherId = '123e4567-e89b-12d3-a456-426614174000';
    const templateId = '523e4567-e89b-12d3-a456-426614174004';

    mockGetUserWithRolesSSR.mockResolvedValue({
      user: { id: teacherId },
      isAdmin: false,
      isTeacher: true,
      isStudent: false,
      isDevelopment: false,
    });

    mockSingle.mockResolvedValue({
      data: { teacher_id: teacherId },
    });

    const updateData = {
      id: templateId,
      title: 'Updated Title',
      description: 'Updated Description',
    };

    await updateAssignmentTemplate(updateData);

    expect(mockUpdate).toHaveBeenCalledWith(updateData);
    expect(mockRevalidatePath).toHaveBeenCalledWith('/dashboard/assignments/templates');
  });

  it('should allow admin to update any template', async () => {
    const adminId = '223e4567-e89b-12d3-a456-426614174001';
    const templateId = '623e4567-e89b-12d3-a456-426614174005';

    mockGetUserWithRolesSSR.mockResolvedValue({
      user: { id: adminId },
      isAdmin: true,
      isTeacher: false,
      isStudent: false,
      isDevelopment: false,
    });

    const updateData = {
      id: templateId,
      title: 'Admin Update',
      description: 'Updated by admin',
    };

    await updateAssignmentTemplate(updateData);

    expect(mockSelect).not.toHaveBeenCalled();
    expect(mockUpdate).toHaveBeenCalledWith(updateData);
  });

  it("should reject teacher updating another teacher's template", async () => {
    const teacher1Id = '723e4567-e89b-12d3-a456-426614174006';
    const teacher2Id = '823e4567-e89b-12d3-a456-426614174007';
    const templateId = '923e4567-e89b-12d3-a456-426614174008';

    mockGetUserWithRolesSSR.mockResolvedValue({
      user: { id: teacher1Id },
      isAdmin: false,
      isTeacher: true,
      isStudent: false,
      isDevelopment: false,
    });

    mockSingle.mockResolvedValue({
      data: { teacher_id: teacher2Id },
    });

    await expect(
      updateAssignmentTemplate({
        id: templateId,
        title: 'Updated',
        description: 'Test',
      })
    ).rejects.toThrow('Unauthorized');

    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it('should reject when template not found', async () => {
    const teacherId = '123e4567-e89b-12d3-a456-426614174000';
    const templateId = 'a23e4567-e89b-12d3-a456-426614174009';

    mockGetUserWithRolesSSR.mockResolvedValue({
      user: { id: teacherId },
      isAdmin: false,
      isTeacher: true,
      isStudent: false,
      isDevelopment: false,
    });

    mockSingle.mockResolvedValue({
      data: null,
    });

    await expect(
      updateAssignmentTemplate({
        id: templateId,
        title: 'Updated',
        description: 'Test',
      })
    ).rejects.toThrow('Unauthorized');
  });

  it('should reject student attempting to update', async () => {
    mockGetUserWithRolesSSR.mockResolvedValue({
      user: { id: 'student-id' },
      isAdmin: false,
      isTeacher: false,
      isStudent: true,
      isDevelopment: false,
    });

    await expect(
      updateAssignmentTemplate({
        id: 'template-id',
        title: 'Updated',
        description: 'Test',
      })
    ).rejects.toThrow('Unauthorized');
  });

  it('should validate update data', async () => {
    mockGetUserWithRolesSSR.mockResolvedValue({
      user: { id: 'teacher-id' },
      isAdmin: false,
      isTeacher: true,
      isStudent: false,
      isDevelopment: false,
    });

    await expect(
      updateAssignmentTemplate({
        id: '',
        title: '',
      } as any)
    ).rejects.toThrow('Invalid data');
  });

  it('should throw a generic error and log details when the update fails', async () => {
    const adminId = '223e4567-e89b-12d3-a456-426614174001';
    const templateId = '623e4567-e89b-12d3-a456-426614174005';

    mockGetUserWithRolesSSR.mockResolvedValue({
      user: { id: adminId },
      isAdmin: true,
      isTeacher: false,
      isStudent: false,
      isDevelopment: false,
    });

    const dbError = { message: 'row is locked' };
    mockWriteResult.mockResolvedValue({ error: dbError });

    await expect(
      updateAssignmentTemplate({
        id: templateId,
        title: 'Updated',
        description: 'Test',
      })
    ).rejects.toThrow('Failed to update assignment template');

    expect(mockLogError).toHaveBeenCalledWith('Error updating assignment template:', dbError);
    expect(mockRevalidatePath).not.toHaveBeenCalled();
  });
});

describe('deleteAssignmentTemplate', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockWriteResult.mockResolvedValue({ error: null });
  });

  it('should allow teacher to delete own template', async () => {
    mockGetUserWithRolesSSR.mockResolvedValue({
      user: { id: 'teacher-id' },
      isAdmin: false,
      isTeacher: true,
      isStudent: false,
      isDevelopment: false,
    });

    mockSingle.mockResolvedValue({
      data: { teacher_id: 'teacher-id' },
    });

    await deleteAssignmentTemplate('template-id');

    expect(mockDelete).toHaveBeenCalled();
    expect(mockRevalidatePath).toHaveBeenCalledWith('/dashboard/assignments/templates');
  });

  it('should allow admin to delete any template', async () => {
    mockGetUserWithRolesSSR.mockResolvedValue({
      user: { id: 'admin-id' },
      isAdmin: true,
      isTeacher: false,
      isStudent: false,
      isDevelopment: false,
    });

    await deleteAssignmentTemplate('template-id');

    expect(mockSelect).not.toHaveBeenCalled();
    expect(mockDelete).toHaveBeenCalled();
  });

  it("should reject teacher deleting another teacher's template", async () => {
    mockGetUserWithRolesSSR.mockResolvedValue({
      user: { id: 'teacher-1' },
      isAdmin: false,
      isTeacher: true,
      isStudent: false,
      isDevelopment: false,
    });

    mockSingle.mockResolvedValue({
      data: { teacher_id: 'teacher-2' },
    });

    await expect(deleteAssignmentTemplate('template-id')).rejects.toThrow('Unauthorized');

    expect(mockDelete).not.toHaveBeenCalled();
  });

  it('should reject when template not found', async () => {
    mockGetUserWithRolesSSR.mockResolvedValue({
      user: { id: 'teacher-id' },
      isAdmin: false,
      isTeacher: true,
      isStudent: false,
      isDevelopment: false,
    });

    mockSingle.mockResolvedValue({
      data: null,
    });

    await expect(deleteAssignmentTemplate('nonexistent-id')).rejects.toThrow('Unauthorized');
  });

  it('should reject student attempting to delete', async () => {
    mockGetUserWithRolesSSR.mockResolvedValue({
      user: { id: 'student-id' },
      isAdmin: false,
      isTeacher: false,
      isStudent: true,
      isDevelopment: false,
    });

    await expect(deleteAssignmentTemplate('template-id')).rejects.toThrow('Unauthorized');
  });

  it('should reject unauthenticated user', async () => {
    mockGetUserWithRolesSSR.mockResolvedValue({
      user: null,
      isAdmin: false,
      isTeacher: false,
      isStudent: false,
      isDevelopment: false,
    });

    await expect(deleteAssignmentTemplate('template-id')).rejects.toThrow('Unauthorized');
  });

  it('should throw a generic error and log details when the delete fails', async () => {
    mockGetUserWithRolesSSR.mockResolvedValue({
      user: { id: 'admin-id' },
      isAdmin: true,
      isTeacher: false,
      isStudent: false,
      isDevelopment: false,
    });

    const dbError = { message: 'foreign key violation' };
    mockWriteResult.mockResolvedValue({ error: dbError });

    await expect(deleteAssignmentTemplate('template-id')).rejects.toThrow(
      'Failed to delete assignment template'
    );

    expect(mockLogError).toHaveBeenCalledWith('Error deleting assignment template:', dbError);
    expect(mockRevalidatePath).not.toHaveBeenCalled();
  });
});
