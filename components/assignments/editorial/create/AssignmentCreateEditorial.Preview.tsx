'use client';

import { FormAvatar } from '@/components/_editorial/FormAvatar';
import type { SongOption, StudentOption } from '@/lib/services/lesson-form-data';

type Props = {
  student?: StudentOption;
  song?: SongOption;
  dueDate: string;
};

const formatDue = (iso: string): string => {
  if (!iso) return 'No due date yet';
  const d = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(d.getTime())) return 'No due date yet';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

/** Live-preview sidebar content for the assignment form. */
export const AssignmentCreateEditorialPreview = ({ student, song, dueDate }: Props) => (
  <>
    <div
      style={{
        fontFamily: 'var(--serif)',
        fontStyle: 'italic',
        fontSize: 20,
        fontWeight: 500,
        marginBottom: 6,
      }}
    >
      {song ? song.title : '—'}
    </div>
    <div style={{ fontSize: 12, color: 'var(--ink-3)', marginBottom: 14 }}>
      {song?.author ?? ''}
    </div>

    {student && (
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
        <FormAvatar name={student.name} email={student.email} size={22} />
        <span style={{ fontSize: 12 }}>{student.name ?? student.email}</span>
      </div>
    )}

    <div
      style={{
        paddingTop: 12,
        borderTop: '1px solid var(--rule)',
        fontSize: 12,
        color: 'var(--ink-3)',
      }}
    >
      Due <strong style={{ color: 'var(--ink-2)' }}>{formatDue(dueDate)}</strong>
    </div>
  </>
);
