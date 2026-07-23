import Link from 'next/link';

import type { LatestNote } from '@/lib/services/student-health-queries';
import { Card, CardHeader, Empty, formatDate } from './StudentDetailEditorial.shared';

type Props = { note: LatestNote };

/**
 * Latest teacher note. Sourced from the most recent lesson's `notes` — there is
 * no dedicated per-student notes store yet, so this is read-only.
 */
export const TeacherNoteCard = ({ note }: Props) => (
  <Card>
    <CardHeader eyebrow="From the studio" title="Teacher notes" />
    {!note ? (
      <Empty>No teacher notes yet.</Empty>
    ) : (
      <div style={{ padding: '18px 24px 20px' }}>
        <div
          style={{
            fontFamily: 'var(--serif)',
            fontSize: 15,
            lineHeight: 1.5,
            fontStyle: 'italic',
            color: 'var(--ink-2)',
          }}
        >
          “{note.note}”
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            marginTop: 12,
          }}
        >
          <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--ink-4)' }}>
            After {note.lessonTitle ?? 'lesson'} · {formatDate(note.scheduledAt)}
          </div>
          <Link
            href={`/dashboard/lessons/${note.lessonId}`}
            style={{
              fontFamily: 'var(--sans)',
              fontSize: 12,
              fontWeight: 500,
              color: 'var(--gold-2)',
              textDecoration: 'none',
            }}
          >
            Open lesson →
          </Link>
        </div>
      </div>
    )}
  </Card>
);
