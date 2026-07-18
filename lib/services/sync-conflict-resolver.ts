/**
 * Google Calendar Sync Conflict Resolution
 *
 * Handles conflicts when the same lesson/event is modified in both
 * Strummy and Google Calendar simultaneously.
 *
 * Strategy: Last-write-wins with configurable threshold
 */

import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';

type SupabaseClient = Awaited<ReturnType<typeof createClient>>;

export interface LessonData {
  id: string;
  title: string;
  scheduled_at: string;
  notes?: string | null;
  updated_at: string;
  google_event_id?: string | null;
}

export interface GoogleEventData {
  id: string;
  summary: string;
  description?: string;
  start: { dateTime: string };
  updated: string; // ISO timestamp from Google
}

export interface ConflictInfo {
  lessonId: string;
  lessonUpdated: Date;
  eventUpdated: Date;
  timeDifferenceMs: number;
  fields: {
    title?: { local: string; remote: string };
    scheduled_at?: { local: string; remote: string };
    notes?: { local: string | null; remote: string | null };
  };
}

export type ConflictResolution = 'use_local' | 'use_remote' | 'manual_review';

/**
 * Configuration for conflict detection
 */
export interface ConflictConfig {
  /**
   * Time threshold in milliseconds
   * Updates within this window are considered simultaneous
   * Default: 60000 (1 minute)
   */
  simultaneousThresholdMs: number;

  /**
   * Whether to enable manual review for close conflicts
   * Default: true
   */
  enableManualReview: boolean;
}

export const DEFAULT_CONFLICT_CONFIG: ConflictConfig = {
  simultaneousThresholdMs: 60000, // 1 minute
  enableManualReview: true,
};

/**
 * Detect if there's a conflict between local lesson and remote event
 */
export function detectConflict(
  lesson: LessonData,
  event: GoogleEventData,
  _config: ConflictConfig = DEFAULT_CONFLICT_CONFIG
): ConflictInfo | null {
  const lessonUpdated = new Date(lesson.updated_at);
  const eventUpdated = new Date(event.updated);

  // Check if fields differ
  const titleDiffers = lesson.title !== event.summary;
  const timeDiffers = lesson.scheduled_at !== event.start.dateTime;
  const notesDiffer = (lesson.notes || '') !== (event.description || '');

  // No conflict if nothing differs
  if (!titleDiffers && !timeDiffers && !notesDiffer) {
    return null;
  }

  // Calculate time difference
  const timeDifferenceMs = Math.abs(eventUpdated.getTime() - lessonUpdated.getTime());

  // Build conflict info
  const conflictInfo: ConflictInfo = {
    lessonId: lesson.id,
    lessonUpdated,
    eventUpdated,
    timeDifferenceMs,
    fields: {},
  };

  if (titleDiffers) {
    conflictInfo.fields.title = { local: lesson.title, remote: event.summary };
  }

  if (timeDiffers) {
    conflictInfo.fields.scheduled_at = {
      local: lesson.scheduled_at,
      remote: event.start.dateTime,
    };
  }

  if (notesDiffer) {
    conflictInfo.fields.notes = { local: lesson.notes || null, remote: event.description || null };
  }

  return conflictInfo;
}

/**
 * Resolve conflict using last-write-wins strategy
 */
export function resolveConflict(
  conflictInfo: ConflictInfo,
  config: ConflictConfig = DEFAULT_CONFLICT_CONFIG
): ConflictResolution {
  const { lessonUpdated, eventUpdated, timeDifferenceMs } = conflictInfo;

  // If updates are very close in time (within threshold), flag for manual review
  if (config.enableManualReview && timeDifferenceMs < config.simultaneousThresholdMs) {
    return 'manual_review';
  }

  // Last-write-wins: Use the most recently updated version
  return lessonUpdated > eventUpdated ? 'use_local' : 'use_remote';
}

/**
 * Apply conflict resolution to lesson
 */
export async function applyConflictResolution(
  supabase: SupabaseClient,
  lessonId: string,
  eventData: GoogleEventData,
  resolution: ConflictResolution
): Promise<void> {
  if (resolution === 'manual_review') {
    // Store conflict for manual review
    await storeConflictForReview(supabase, lessonId, eventData);
    return;
  }

  if (resolution === 'use_remote') {
    // Update local lesson with remote data
    await supabase
      .from('lessons')
      .update({
        title: eventData.summary,
        scheduled_at: eventData.start.dateTime,
        notes: eventData.description || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', lessonId);

    // Remote data applied
  } else if (resolution === 'use_local') {
    // Local data wins - no update needed locally
    // The next sync will push local changes to remote
  }
}

/**
 * Store conflict for manual review
 */
async function storeConflictForReview(
  supabase: SupabaseClient,
  lessonId: string,
  eventData: GoogleEventData
): Promise<void> {
  const { error } = await supabase.from('sync_conflicts').insert({
    lesson_id: lessonId,
    google_event_id: eventData.id,
    conflict_data: {
      remote_title: eventData.summary,
      remote_scheduled_at: eventData.start.dateTime,
      remote_notes: eventData.description,
      remote_updated: eventData.updated,
    },
    status: 'pending',
    created_at: new Date().toISOString(),
  });

  if (error) {
    logger.error('Failed to store conflict for review:', error);
  }
}

/**
 * Get pending conflicts for a user
 */
interface PendingConflict {
  id: string;
  lesson_id: string;
  conflict_data: Record<string, unknown>;
  created_at: string;
  lesson?: {
    teacher_id: string;
    title: string;
    scheduled_at: string;
    notes: string | null;
    updated_at: string;
  };
}

export async function getPendingConflicts(
  supabase: SupabaseClient,
  userId: string
): Promise<PendingConflict[]> {
  const { data, error } = await supabase
    .from('sync_conflicts')
    .select(
      `
      id,
      lesson_id,
      conflict_data,
      created_at,
      lesson:lessons!sync_conflicts_lesson_id_fkey(
        teacher_id,
        title,
        scheduled_at,
        notes,
        updated_at
      )
    `
    )
    .eq('status', 'pending')
    .eq('lesson.teacher_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    logger.error('Failed to fetch pending conflicts:', error);
    return [];
  }

  // The `lesson:...!fkey(...)` embed is a to-one relation at runtime (each
  // conflict has exactly one lesson); the generated types can't express that
  // cardinality for this FK, so PostgREST's array-shaped inference is cast away.
  return (data ?? []) as unknown as PendingConflict[];
}

/**
 * Resolve a conflict manually
 */
export async function resolveConflictManually(
  supabase: SupabaseClient,
  conflictId: string,
  resolution: 'use_local' | 'use_remote'
): Promise<{ success: boolean; error?: string }> {
  // Get conflict details
  const { data: conflict, error: fetchError } = await supabase
    .from('sync_conflicts')
    .select('*, lesson:lessons(*)')
    .eq('id', conflictId)
    .single();

  if (fetchError || !conflict) {
    return { success: false, error: 'Conflict not found' };
  }

  if (resolution === 'use_remote') {
    // Apply remote changes to local lesson
    const remoteData = conflict.conflict_data as {
      remote_title?: string;
      remote_scheduled_at?: string;
      remote_notes?: string;
    };

    const { error: updateError } = await supabase
      .from('lessons')
      .update({
        title: remoteData.remote_title,
        scheduled_at: remoteData.remote_scheduled_at,
        notes: remoteData.remote_notes,
      })
      .eq('id', conflict.lesson_id);

    if (updateError) {
      return { success: false, error: updateError.message };
    }
  }

  // Mark conflict as resolved
  const { error: resolveError } = await supabase
    .from('sync_conflicts')
    .update({
      status: 'resolved',
      resolution: resolution,
      resolved_at: new Date().toISOString(),
    })
    .eq('id', conflictId);

  if (resolveError) {
    return { success: false, error: resolveError.message };
  }

  return { success: true };
}

/**
 * Auto-resolve old conflicts (older than 7 days)
 * Uses local data by default for old conflicts
 */
export async function autoResolveOldConflicts(
  supabase: SupabaseClient
): Promise<{ resolved: number; failed: number }> {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const { data: oldConflicts, error } = await supabase
    .from('sync_conflicts')
    .select('id')
    .eq('status', 'pending')
    .lt('created_at', sevenDaysAgo.toISOString());

  if (error || !oldConflicts) {
    return { resolved: 0, failed: 0 };
  }

  let resolved = 0;
  let failed = 0;

  for (const conflict of oldConflicts) {
    const result = await resolveConflictManually(supabase, conflict.id, 'use_local');
    if (result.success) {
      resolved++;
    } else {
      failed++;
    }
  }

  return { resolved, failed };
}
