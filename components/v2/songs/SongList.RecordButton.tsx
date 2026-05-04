'use client';

import { CheckCircle2, Mic, MicOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { deriveState, type RecordingOverride } from './SongList.recording.helpers';

interface RecordButtonProps {
  songId: string;
  recording: RecordingOverride;
  onCycle: (songId: string, current: RecordingOverride) => void;
}

const ARIA_LABEL = {
  idle: 'Add to recording queue',
  queued: 'Mark as recorded',
  recorded: 'Clear recording state',
} as const;

const TOOLTIP = {
  idle: 'Click to queue for recording',
  queued: 'Click to mark as recorded',
  recorded: 'Click to clear',
} as const;

export function RecordButton({ songId, recording, onCycle }: RecordButtonProps) {
  const state = deriveState(recording.recordingQueuedAt, recording.recordedAt);
  return (
    <Button
      type="button"
      variant={state === 'recorded' ? 'secondary' : state === 'queued' ? 'default' : 'outline'}
      size="sm"
      aria-label={ARIA_LABEL[state]}
      title={TOOLTIP[state]}
      onClick={(e) => {
        e.stopPropagation();
        onCycle(songId, recording);
      }}
      className={cn(
        'h-7 px-2',
        state === 'recorded' && 'bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25'
      )}
    >
      {state === 'recorded' ? (
        <CheckCircle2 className="h-3.5 w-3.5" />
      ) : state === 'queued' ? (
        <Mic className="h-3.5 w-3.5" />
      ) : (
        <MicOff className="h-3.5 w-3.5" />
      )}
      <span className="ml-1.5 text-[11px] font-semibold uppercase tracking-wider">
        {state === 'recorded' ? 'Recorded' : state === 'queued' ? 'Queued' : 'Record'}
      </span>
    </Button>
  );
}
