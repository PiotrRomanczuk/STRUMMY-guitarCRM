'use client';

import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { cycleSongRecordingState, type RecordingState } from '@/app/actions/songs';
import {
  buildOptimisticOverride,
  deriveState,
  nextRecordingState,
  recordingStateLabel,
  type RecordingOverride,
} from './SongList.recording.helpers';

export interface UseSongRecording {
  resolveRecording: (
    id: string,
    queuedFallback: string | null | undefined,
    recordedFallback: string | null | undefined
  ) => RecordingOverride;
  cycleRecording: (songId: string, current: RecordingOverride) => void;
  overrides: Record<string, RecordingOverride>;
}

export function useSongRecording(): UseSongRecording {
  const [overrides, setOverrides] = useState<Record<string, RecordingOverride>>({});
  const [, startTransition] = useTransition();

  const resolveRecording: UseSongRecording['resolveRecording'] = (id, queued, recorded) => {
    const override = overrides[id];
    if (override) return override;
    return { recordingQueuedAt: queued ?? null, recordedAt: recorded ?? null };
  };

  const cycleRecording: UseSongRecording['cycleRecording'] = (songId, current) => {
    const currentState = deriveState(current.recordingQueuedAt, current.recordedAt);
    const next: RecordingState = nextRecordingState(currentState);
    const optimistic = buildOptimisticOverride(next);

    setOverrides((prev) => ({ ...prev, [songId]: optimistic }));

    startTransition(async () => {
      const result = await cycleSongRecordingState(songId);
      if (!result.success) {
        setOverrides((prev) => ({ ...prev, [songId]: current }));
        toast.error(result.error || 'Failed to update recording state');
        return;
      }
      setOverrides((prev) => ({
        ...prev,
        [songId]: { recordingQueuedAt: result.recordingQueuedAt, recordedAt: result.recordedAt },
      }));
      toast.success(recordingStateLabel(result.state));
    });
  };

  return { resolveRecording, cycleRecording, overrides };
}
