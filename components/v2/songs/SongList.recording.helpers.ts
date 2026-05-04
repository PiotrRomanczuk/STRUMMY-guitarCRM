import type { RecordingState } from '@/app/actions/songs';

export const ALL_CATEGORIES_VALUE = '__all__';
export const RECORDING_FILTER_ALL = 'all';
export const RECORDING_FILTER_QUEUED = 'queued';
export const RECORDING_FILTER_RECORDED = 'recorded';

export type RecordingFilter =
  | typeof RECORDING_FILTER_ALL
  | typeof RECORDING_FILTER_QUEUED
  | typeof RECORDING_FILTER_RECORDED;

export type SortField = 'title' | 'author' | 'level' | 'key';
export type SortDir = 'asc' | 'desc';

export interface RecordingOverride {
  recordingQueuedAt: string | null;
  recordedAt: string | null;
}

export const LEVEL_STYLES: Record<string, string> = {
  beginner: 'bg-emerald-500/10 text-emerald-400',
  intermediate: 'bg-primary/15 text-primary',
  advanced: 'bg-destructive/10 text-red-400',
};

export function deriveState(queuedAt: string | null, recordedAt: string | null): RecordingState {
  if (recordedAt) return 'recorded';
  if (queuedAt) return 'queued';
  return 'idle';
}

export function nextRecordingState(current: RecordingState): RecordingState {
  return current === 'idle' ? 'queued' : current === 'queued' ? 'recorded' : 'idle';
}

export function buildOptimisticOverride(next: RecordingState): RecordingOverride {
  const now = new Date().toISOString();
  if (next === 'idle') return { recordingQueuedAt: null, recordedAt: null };
  if (next === 'queued') return { recordingQueuedAt: now, recordedAt: null };
  return { recordingQueuedAt: null, recordedAt: now };
}

export function recordingStateLabel(state: RecordingState): string {
  if (state === 'queued') return 'Added to recording queue';
  if (state === 'recorded') return 'Marked as recorded';
  return 'Cleared recording state';
}
