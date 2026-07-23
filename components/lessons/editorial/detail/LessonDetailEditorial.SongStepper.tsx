'use client';

import { useState, useTransition } from 'react';

import { updateLessonSongStatus } from '@/app/dashboard/lessons/actions';
import { STAGES, STAGE_COLOR, type StageKey } from '@/components/songs/editorial/primitives';

const isStageKey = (value: string | null): value is StageKey =>
  value != null && STAGES.some((stage) => stage.key === value);

type Props = {
  lessonId: string;
  songId: string;
  initialStatus: string | null;
  readOnly: boolean;
};

/**
 * Per-song progress stepper. Reuses the shared editorial STAGES + the existing
 * `updateLessonSongStatus` server action (RLS-scoped, Zod-validated). Teachers
 * click a segment to advance the stage; students see it read-only.
 */
export const LessonSongStepper = ({ lessonId, songId, initialStatus, readOnly }: Props) => {
  const [status, setStatus] = useState<StageKey | null>(
    isStageKey(initialStatus) ? initialStatus : null
  );
  const [isPending, startTransition] = useTransition();

  const activeIdx = status ? STAGES.findIndex((stage) => stage.key === status) : -1;
  const activeColor = status ? STAGE_COLOR[status] : 'var(--rule)';

  const commit = (key: StageKey) => {
    if (readOnly || key === status) return;
    const previous = status;
    setStatus(key);
    startTransition(async () => {
      try {
        await updateLessonSongStatus(lessonId, songId, key);
      } catch {
        setStatus(previous);
      }
    });
  };

  const label = status ? STAGES[activeIdx]?.label : 'Not started';

  return (
    <div style={{ opacity: isPending ? 0.6 : 1, transition: 'opacity .15s' }}>
      <div style={{ display: 'flex', gap: 3, alignItems: 'center', width: '100%' }}>
        {STAGES.map((stage, i) => {
          const filled = i <= activeIdx;
          const segStyle = {
            flex: 1,
            height: 8,
            borderRadius: 2,
            padding: 0,
            border: 'none',
            background: filled ? activeColor : 'var(--rule)',
          };
          return readOnly ? (
            <div key={stage.key} title={stage.label} style={segStyle} />
          ) : (
            <button
              key={stage.key}
              type="button"
              onClick={() => commit(stage.key)}
              disabled={isPending}
              aria-label={`Set status to ${stage.label}`}
              title={stage.label}
              style={{ ...segStyle, cursor: isPending ? 'wait' : 'pointer' }}
            />
          );
        })}
      </div>
      <div
        style={{
          marginTop: 6,
          fontFamily: 'var(--mono)',
          fontSize: 10,
          color: 'var(--ink-4)',
          textTransform: 'uppercase',
          letterSpacing: '.1em',
        }}
      >
        {label}
      </div>
    </div>
  );
};
