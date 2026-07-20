/**
 * AssignmentSchema Tests
 *
 * Tests validation for assignment-related Zod schemas:
 * - AssignmentSchema (full assignment validation)
 * - AssignmentInputSchema (create operations)
 * - AssignmentUpdateSchema (partial updates)
 * - AssignmentStatusEnum (status values)
 * - AssignmentFilterSchema (filtering)
 * - calculateAssignmentStatus (status helper)
 * - validateStatusTransition (status state machine)
 *
 * @see schemas/AssignmentSchema.ts
 */

import {
  AssignmentSchema,
  AssignmentInputSchema,
  AssignmentUpdateSchema,
  AssignmentStatusEnum,
  AssignmentFilterSchema,
  AssignmentSortSchema,
  AssignmentWithProfilesSchema,
  calculateAssignmentStatus,
  validateStatusTransition,
  VALID_STATUS_TRANSITIONS,
  type AssignmentStatus,
} from '../AssignmentSchema';

describe('AssignmentSchema', () => {
  const validTeacherId = '550e8400-e29b-41d4-a716-446655440001';
  const validStudentId = '550e8400-e29b-41d4-a716-446655440002';

  describe('AssignmentStatusEnum', () => {
    const validStatuses = ['not_started', 'in_progress', 'completed', 'overdue', 'cancelled'];

    it('should accept all valid statuses', () => {
      for (const status of validStatuses) {
        const result = AssignmentStatusEnum.safeParse(status);
        expect(result.success).toBe(true);
      }
    });

    it('should reject invalid status', () => {
      const result = AssignmentStatusEnum.safeParse('invalid');
      expect(result.success).toBe(false);
    });

    it('should reject uppercase status', () => {
      const result = AssignmentStatusEnum.safeParse('COMPLETED');
      expect(result.success).toBe(false);
    });
  });

  describe('AssignmentInputSchema', () => {
    const validAssignmentInput = {
      title: 'Practice chord transitions',
      teacher_id: validTeacherId,
      student_id: validStudentId,
    };

    it('should validate a valid assignment input', () => {
      const result = AssignmentInputSchema.safeParse(validAssignmentInput);
      expect(result.success).toBe(true);
    });

    it('should require title', () => {
      const result = AssignmentInputSchema.safeParse({
        ...validAssignmentInput,
        title: '',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Title is required');
      }
    });

    it('should validate title max length', () => {
      const result = AssignmentInputSchema.safeParse({
        ...validAssignmentInput,
        title: 'a'.repeat(201),
      });
      expect(result.success).toBe(false);
    });

    it('should validate teacher_id is UUID', () => {
      const result = AssignmentInputSchema.safeParse({
        ...validAssignmentInput,
        teacher_id: 'not-a-uuid',
      });
      expect(result.success).toBe(false);
    });

    it('should validate student_id is UUID', () => {
      const result = AssignmentInputSchema.safeParse({
        ...validAssignmentInput,
        student_id: 'not-a-uuid',
      });
      expect(result.success).toBe(false);
    });

    it('should accept optional description', () => {
      const result = AssignmentInputSchema.safeParse({
        ...validAssignmentInput,
        description: 'Focus on smooth transitions between C and G chords',
      });
      expect(result.success).toBe(true);
    });

    it('should validate description max length', () => {
      const result = AssignmentInputSchema.safeParse({
        ...validAssignmentInput,
        description: 'a'.repeat(2001),
      });
      expect(result.success).toBe(false);
    });

    it('should accept optional due_date', () => {
      const result = AssignmentInputSchema.safeParse({
        ...validAssignmentInput,
        due_date: '2024-01-20T00:00:00Z',
      });
      expect(result.success).toBe(true);
    });

    it('should validate due_date is datetime', () => {
      const result = AssignmentInputSchema.safeParse({
        ...validAssignmentInput,
        due_date: 'not-a-date',
      });
      expect(result.success).toBe(false);
    });

    it('should accept optional lesson_id', () => {
      const result = AssignmentInputSchema.safeParse({
        ...validAssignmentInput,
        lesson_id: '550e8400-e29b-41d4-a716-446655440003',
      });
      expect(result.success).toBe(true);
    });

    it('should accept null lesson_id', () => {
      const result = AssignmentInputSchema.safeParse({
        ...validAssignmentInput,
        lesson_id: null,
      });
      expect(result.success).toBe(true);
    });

    it('should accept optional status', () => {
      const result = AssignmentInputSchema.safeParse({
        ...validAssignmentInput,
        status: 'in_progress',
      });
      expect(result.success).toBe(true);
    });
  });

  describe('AssignmentUpdateSchema', () => {
    const validAssignmentId = '550e8400-e29b-41d4-a716-446655440000';

    it('should require id for updates', () => {
      const result = AssignmentUpdateSchema.safeParse({
        title: 'Updated Title',
      });
      expect(result.success).toBe(false);
    });

    it('should allow partial updates with id', () => {
      const result = AssignmentUpdateSchema.safeParse({
        id: validAssignmentId,
        title: 'Updated Title',
      });
      expect(result.success).toBe(true);
    });

    it('should validate id is UUID', () => {
      const result = AssignmentUpdateSchema.safeParse({
        id: 'not-a-uuid',
        title: 'Updated Title',
      });
      expect(result.success).toBe(false);
    });

    it('should allow status-only update', () => {
      const result = AssignmentUpdateSchema.safeParse({
        id: validAssignmentId,
        status: 'completed',
      });
      expect(result.success).toBe(true);
    });
  });

  describe('AssignmentSchema', () => {
    it('should validate a complete assignment', () => {
      const result = AssignmentSchema.safeParse({
        id: '550e8400-e29b-41d4-a716-446655440000',
        title: 'Practice Assignment',
        description: 'Complete the exercises',
        teacher_id: validTeacherId,
        student_id: validStudentId,
        status: 'not_started',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      });
      expect(result.success).toBe(true);
    });

    it('should default status to not_started', () => {
      const result = AssignmentSchema.safeParse({
        title: 'Practice Assignment',
        teacher_id: validTeacherId,
        student_id: validStudentId,
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.status).toBe('not_started');
      }
    });
  });

  describe('AssignmentFilterSchema', () => {
    it('should validate empty filter', () => {
      const result = AssignmentFilterSchema.safeParse({});
      expect(result.success).toBe(true);
    });

    it('should validate filter by teacher_id', () => {
      const result = AssignmentFilterSchema.safeParse({
        teacher_id: validTeacherId,
      });
      expect(result.success).toBe(true);
    });

    it('should validate filter by student_id', () => {
      const result = AssignmentFilterSchema.safeParse({
        student_id: validStudentId,
      });
      expect(result.success).toBe(true);
    });

    it('should validate filter by status', () => {
      const result = AssignmentFilterSchema.safeParse({
        status: 'completed',
      });
      expect(result.success).toBe(true);
    });

    it('should validate date range filter', () => {
      const result = AssignmentFilterSchema.safeParse({
        due_date_from: '2024-01-01T00:00:00Z',
        due_date_to: '2024-01-31T23:59:59Z',
      });
      expect(result.success).toBe(true);
    });

    it('should validate search string', () => {
      const result = AssignmentFilterSchema.safeParse({
        search: 'chord practice',
      });
      expect(result.success).toBe(true);
    });

    it('should validate multiple filters', () => {
      const result = AssignmentFilterSchema.safeParse({
        teacher_id: validTeacherId,
        student_id: validStudentId,
        status: 'in_progress',
        search: 'guitar',
      });
      expect(result.success).toBe(true);
    });
  });

  describe('AssignmentSortSchema', () => {
    it('should validate sort by due_date', () => {
      const result = AssignmentSortSchema.safeParse({
        field: 'due_date',
        direction: 'asc',
      });
      expect(result.success).toBe(true);
    });

    it('should default field to due_date', () => {
      const result = AssignmentSortSchema.safeParse({});
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.field).toBe('due_date');
      }
    });

    it('should default direction to asc', () => {
      const result = AssignmentSortSchema.safeParse({});
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.direction).toBe('asc');
      }
    });

    it('should accept all valid sort fields', () => {
      const fields = ['due_date', 'created_at', 'updated_at', 'title', 'status'];
      for (const field of fields) {
        const result = AssignmentSortSchema.safeParse({ field });
        expect(result.success).toBe(true);
      }
    });

    it('should reject invalid sort field', () => {
      const result = AssignmentSortSchema.safeParse({
        field: 'invalid_field',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('AssignmentWithProfilesSchema', () => {
    const baseAssignment = {
      title: 'Practice Assignment',
      teacher_id: validTeacherId,
      student_id: validStudentId,
      status: 'not_started',
    };

    it('should validate assignment with profiles', () => {
      const result = AssignmentWithProfilesSchema.safeParse({
        ...baseAssignment,
        teacher_profile: {
          id: validTeacherId,
          email: 'teacher@example.com',
          full_name: 'Teacher Name',
        },
        student_profile: {
          id: validStudentId,
          email: 'student@example.com',
          full_name: 'Student Name',
        },
      });
      expect(result.success).toBe(true);
    });

    it('should validate assignment with lesson', () => {
      const result = AssignmentWithProfilesSchema.safeParse({
        ...baseAssignment,
        lesson: {
          id: '550e8400-e29b-41d4-a716-446655440003',
          lesson_teacher_number: 5,
          scheduled_at: '2024-01-15T10:00:00Z',
        },
      });
      expect(result.success).toBe(true);
    });

    it('should allow null lesson', () => {
      const result = AssignmentWithProfilesSchema.safeParse({
        ...baseAssignment,
        lesson: null,
      });
      expect(result.success).toBe(true);
    });
  });

  describe('calculateAssignmentStatus', () => {
    it('should keep completed status', () => {
      const result = calculateAssignmentStatus('2024-01-01T00:00:00Z', 'completed');
      expect(result).toBe('completed');
    });

    it('should keep cancelled status', () => {
      const result = calculateAssignmentStatus('2024-01-01T00:00:00Z', 'cancelled');
      expect(result).toBe('cancelled');
    });

    it('should return overdue for past due_date', () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 7);
      const result = calculateAssignmentStatus(pastDate.toISOString(), 'not_started');
      expect(result).toBe('overdue');
    });

    it('should keep current status for future due_date', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);
      const result = calculateAssignmentStatus(futureDate.toISOString(), 'in_progress');
      expect(result).toBe('in_progress');
    });

    it('should return not_started for null due_date with no status', () => {
      const result = calculateAssignmentStatus(null, 'not_started');
      expect(result).toBe('not_started');
    });

    it('should keep in_progress for null due_date', () => {
      const result = calculateAssignmentStatus(null, 'in_progress');
      expect(result).toBe('in_progress');
    });

    describe('defensive fallbacks for a missing current status', () => {
      // Callers hand this helper raw `status` values coming from the database /
      // API payloads, so the `currentStatus || 'not_started'` guards are
      // reachable at runtime even though the TS signature forbids it.
      const missingStatus = undefined as unknown as AssignmentStatus;

      beforeEach(() => {
        jest.useFakeTimers({ doNotFake: ['nextTick'] });
        jest.setSystemTime(new Date('2026-07-20T12:00:00.000Z'));
      });

      afterEach(() => {
        jest.useRealTimers();
      });

      it('should fall back to not_started when due_date is null and status is missing', () => {
        expect(calculateAssignmentStatus(null, missingStatus)).toBe('not_started');
      });

      it('should fall back to not_started when due_date is in the future and status is missing', () => {
        expect(calculateAssignmentStatus('2026-07-21T12:00:00.000Z', missingStatus)).toBe(
          'not_started'
        );
      });

      it('should still report overdue when due_date is in the past and status is missing', () => {
        expect(calculateAssignmentStatus('2026-07-19T12:00:00.000Z', missingStatus)).toBe(
          'overdue'
        );
      });
    });
  });

  describe('VALID_STATUS_TRANSITIONS', () => {
    it('should define transitions for every status enum member', () => {
      expect(Object.keys(VALID_STATUS_TRANSITIONS).sort()).toEqual(
        [...AssignmentStatusEnum.options].sort()
      );
    });

    it('should mark completed and cancelled as terminal states', () => {
      expect(VALID_STATUS_TRANSITIONS.completed).toEqual([]);
      expect(VALID_STATUS_TRANSITIONS.cancelled).toEqual([]);
    });
  });

  describe('validateStatusTransition', () => {
    it('should allow a no-op transition to the same status', () => {
      expect(validateStatusTransition('completed', 'completed')).toEqual({ valid: true });
      expect(validateStatusTransition('not_started', 'not_started')).toEqual({ valid: true });
    });

    it.each([
      ['not_started', 'in_progress'],
      ['not_started', 'cancelled'],
      ['in_progress', 'completed'],
      ['in_progress', 'cancelled'],
      ['overdue', 'in_progress'],
      ['overdue', 'completed'],
      ['overdue', 'cancelled'],
    ])('should allow %s -> %s', (from, to) => {
      expect(validateStatusTransition(from, to)).toEqual({ valid: true });
    });

    it('should reject an unknown current status', () => {
      const result = validateStatusTransition('archived', 'completed');
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Unknown current status: archived');
    });

    it('should reject a disallowed transition and list the allowed targets', () => {
      const result = validateStatusTransition('not_started', 'completed');
      expect(result.valid).toBe(false);
      expect(result.error).toBe(
        'Invalid status transition: not_started → completed. Allowed: in_progress, cancelled'
      );
    });

    it('should reject leaving the terminal completed state', () => {
      const result = validateStatusTransition('completed', 'in_progress');
      expect(result.valid).toBe(false);
      expect(result.error).toBe(
        'Invalid status transition: completed → in_progress. Allowed: none (terminal state)'
      );
    });

    it('should reject leaving the terminal cancelled state', () => {
      const result = validateStatusTransition('cancelled', 'not_started');
      expect(result.valid).toBe(false);
      expect(result.error).toBe(
        'Invalid status transition: cancelled → not_started. Allowed: none (terminal state)'
      );
    });

    it('should reject transitioning to an unknown target status', () => {
      const result = validateStatusTransition('in_progress', 'archived');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Invalid status transition: in_progress → archived');
    });
  });
});
