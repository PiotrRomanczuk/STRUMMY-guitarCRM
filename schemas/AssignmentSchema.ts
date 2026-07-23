import * as z from 'zod';
import { IdField } from './CommonSchema';

// Assignment status enum (matches database enum)
export const AssignmentStatusEnum = z.enum([
  'not_started',
  'in_progress',
  'completed',
  'overdue',
  'cancelled',
]);

// How the student is expected to prove the work — the submission-type *selector*
// (matches the assignments_submission_type_check DB constraint). This declares
// the expected proof only; actual audio/video upload is a later wave.
export const SubmissionTypeEnum = z.enum(['self_report', 'audio', 'video', 'note']);
export type SubmissionType = z.infer<typeof SubmissionTypeEnum>;

// Human-readable labels for each submission type (form toggle + detail display).
export const SUBMISSION_TYPE_LABELS: Record<SubmissionType, string> = {
  self_report: 'Self-report',
  audio: 'Audio recording',
  video: 'Video',
  note: 'Note',
};

// The daily-target options offered in the form (minutes/day). NULL = no target.
export const DAILY_TARGET_OPTIONS = [5, 10, 15, 20] as const;

// A single homework checklist item. `id` is client-generated (nanoid/uuid);
// students may only ever flip `done` (enforced in the DB via a SECURITY DEFINER
// RPC — see supabase/migrations/*_assignment_checklist.sql), never text/order.
export const ChecklistItemSchema = z.object({
  id: z.string().min(1).max(64),
  text: z.string().min(1, 'Item text is required').max(200),
  done: z.boolean().default(false),
});

export const ChecklistSchema = z.array(ChecklistItemSchema).max(20).default([]);

// Truly-optional variant for create/update inputs: an absent checklist stays
// absent (no default injected), so payloads only carry it when authored.
export const ChecklistInputSchema = z.array(ChecklistItemSchema).max(20).optional();

export type ChecklistItem = z.infer<typeof ChecklistItemSchema>;

/** Trim item text and drop blank rows before persisting an authored checklist. */
export const sanitizeChecklist = (items: ChecklistItem[]): ChecklistItem[] =>
  items.map((i) => ({ ...i, text: i.text.trim() })).filter((i) => i.text.length > 0);

/** Flip exactly one item's `done` flag; text, order and membership preserved. */
export const applyChecklistToggle = (
  checklist: ChecklistItem[],
  itemId: string,
  done: boolean
): ChecklistItem[] => checklist.map((item) => (item.id === itemId ? { ...item, done } : item));

/** Derived progress from a checklist: done / total (0 when empty). */
export const checklistProgress = (
  checklist: ChecklistItem[]
): { done: number; total: number; pct: number } => {
  const total = checklist.length;
  const done = checklist.filter((i) => i.done).length;
  return { done, total, pct: total === 0 ? 0 : done / total };
};

// A chord drill: a teacher-authored set of chord IDs (keys into the static
// CHORD_VOICINGS library — see lib/music-theory/chord-voicings). The student
// runs them through the chord quiz; the score is captured on the assignment.
export const ChordDrillSchema = z.object({
  chord_ids: z.array(z.string().min(1).max(64)).min(1, 'Pick at least one chord').max(30),
});

// The captured drill result — written server-side by the
// student_complete_chord_drill RPC, never authored on the client.
export const ChordDrillResultSchema = z.object({
  score: z.number().int().min(0),
  total: z.number().int().min(1),
  completed_at: z.string(),
});

export type ChordDrill = z.infer<typeof ChordDrillSchema>;
export type ChordDrillResult = z.infer<typeof ChordDrillResultSchema>;

// Assignment schema for validation
export const AssignmentSchema = z.object({
  id: IdField, // UUID, auto-generated
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().max(2000).optional(),
  due_date: z.string().datetime().optional(), // ISO date string
  teacher_id: z.string().uuid(),
  student_id: z.string().uuid(),
  lesson_id: z.string().uuid().optional().nullable(), // Optional link to lesson
  song_id: z.string().uuid().optional().nullable(), // Optional link to song
  status: AssignmentStatusEnum.default('not_started'),
  checklist: ChecklistSchema,
  chord_drill: ChordDrillSchema.nullable().optional(), // teacher-authored drill config
  chord_drill_result: ChordDrillResultSchema.nullable().optional(), // student-captured score
  daily_target_minutes: z.number().int().positive().nullable().optional(), // NULL = no target
  submission_type: SubmissionTypeEnum.default('self_report'), // expected proof mode
  created_at: z.string().datetime().optional(),
  updated_at: z.string().datetime().optional(),
});

// Assignment input schema for creating assignments
export const AssignmentInputSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().max(2000).optional(),
  due_date: z.string().datetime().optional(), // ISO date string
  teacher_id: z.string().uuid(),
  student_id: z.string().uuid(),
  lesson_id: z.string().uuid().optional().nullable(), // Optional link to lesson
  song_id: z.string().uuid().optional().nullable(), // Optional link to song
  status: AssignmentStatusEnum.optional(),
  checklist: ChecklistInputSchema, // only carried when authored (no default injected)
  chord_drill: ChordDrillSchema.nullable().optional(), // only carried when a drill is authored
  daily_target_minutes: z.number().int().positive().nullable().optional(), // NULL = no target
  submission_type: SubmissionTypeEnum.optional(), // defaults to self_report in the DB
});

// Assignment update schema (partial of input)
export const AssignmentUpdateSchema = AssignmentInputSchema.partial().extend({
  id: z.string().uuid(),
});

// Assignment with profile information
export const AssignmentWithProfilesSchema = AssignmentSchema.extend({
  teacher_profile: z
    .object({
      id: z.string().uuid(),
      email: z.string().email(),
      full_name: z.string().optional().nullable(),
    })
    .optional(),
  student_profile: z
    .object({
      id: z.string().uuid(),
      email: z.string().email(),
      full_name: z.string().optional().nullable(),
    })
    .optional(),
  lesson: z
    .object({
      id: z.string().uuid(),
      lesson_teacher_number: z.number().int().positive(),
      scheduled_at: z.string().datetime(),
    })
    .optional()
    .nullable(),
  song: z
    .object({
      id: z.string().uuid(),
      title: z.string(),
      author: z.string(),
    })
    .optional()
    .nullable(),
});
// Assignment filter schema
export const AssignmentFilterSchema = z.object({
  teacher_id: z.string().uuid().optional(),
  student_id: z.string().uuid().optional(),
  lesson_id: z.string().uuid().optional(),
  song_id: z.string().uuid().optional(),
  status: AssignmentStatusEnum.optional(),
  search: z.string().optional(),
  due_date_from: z.string().datetime().optional(),
  due_date_to: z.string().datetime().optional(),
});

// Assignment sort schema
export const AssignmentSortSchema = z.object({
  field: z.enum(['due_date', 'created_at', 'updated_at', 'title', 'status']).default('due_date'),
  direction: z.enum(['asc', 'desc']).default('asc'),
});

// Assignment status calculation helper
export const calculateAssignmentStatus = (
  dueDate: string | null,
  currentStatus: z.infer<typeof AssignmentStatusEnum>
): z.infer<typeof AssignmentStatusEnum> => {
  // If already completed or cancelled, keep that status
  if (currentStatus === 'completed' || currentStatus === 'cancelled') {
    return currentStatus;
  }

  // If no due date, return current status
  if (!dueDate) return currentStatus || 'not_started';

  const now = new Date();
  const due = new Date(dueDate);

  // If overdue
  if (due < now) {
    return 'overdue';
  }

  return currentStatus || 'not_started';
};

// Valid status transitions (state machine)
export const VALID_STATUS_TRANSITIONS: Record<string, string[]> = {
  not_started: ['in_progress', 'cancelled'],
  in_progress: ['completed', 'cancelled'],
  overdue: ['in_progress', 'completed', 'cancelled'],
  completed: [], // terminal state
  cancelled: [], // terminal state
};

/**
 * Validate that a status transition is allowed
 */
export function validateStatusTransition(
  currentStatus: string,
  newStatus: string
): { valid: boolean; error?: string } {
  if (currentStatus === newStatus) {
    return { valid: true }; // No-op transition is always allowed
  }

  const allowedTransitions = VALID_STATUS_TRANSITIONS[currentStatus];
  if (!allowedTransitions) {
    return { valid: false, error: `Unknown current status: ${currentStatus}` };
  }

  if (!allowedTransitions.includes(newStatus)) {
    return {
      valid: false,
      error: `Invalid status transition: ${currentStatus} → ${newStatus}. Allowed: ${allowedTransitions.join(', ') || 'none (terminal state)'}`,
    };
  }

  return { valid: true };
}

// Types
export type Assignment = z.infer<typeof AssignmentSchema>;
export type AssignmentInput = z.infer<typeof AssignmentInputSchema>;
export type AssignmentUpdate = z.infer<typeof AssignmentUpdateSchema>;
export type AssignmentWithProfiles = z.infer<typeof AssignmentWithProfilesSchema>;
export type AssignmentFilter = z.infer<typeof AssignmentFilterSchema>;
export type AssignmentSort = z.infer<typeof AssignmentSortSchema>;
export type AssignmentStatus = z.infer<typeof AssignmentStatusEnum>;
