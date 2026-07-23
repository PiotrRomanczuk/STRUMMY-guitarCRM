import type { LatestNote } from '@/lib/services/student-health-queries';

import { Card, StudentInitials } from '../primitives';
import { Badge, formatNoteDate } from './ParentDashboardEditorial.shared';

const firstName = (fullName: string): string => fullName.trim().split(/\s+/)[0] || fullName;

export const ParentNoteCard = ({
  note,
  childName,
}: {
  note: LatestNote | null;
  childName: string;
}) => (
  <Card>
    <div style={{ padding: '20px 24px' }}>
      {note ? (
        <>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <StudentInitials name={note.teacherName} email={null} size={40} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: 'var(--serif)', fontSize: 19, fontWeight: 500 }}>
                Latest note{note.teacherName ? ` from ${firstName(note.teacherName)}` : ''}
              </div>
              <div style={{ fontSize: 12, color: 'var(--ink-4)' }}>
                After the lesson on {formatNoteDate(note.lessonDate)}
              </div>
            </div>
            <Badge tone="gold">New</Badge>
          </div>
          <p
            style={{
              fontSize: 16,
              color: 'var(--ink-2)',
              lineHeight: 1.65,
              margin: 0,
              fontFamily: 'var(--serif)',
              maxWidth: 820,
            }}
          >
            {note.note}
          </p>
        </>
      ) : (
        <div
          style={{
            fontFamily: 'var(--serif)',
            fontStyle: 'italic',
            fontSize: 14,
            color: 'var(--ink-4)',
          }}
        >
          No notes from {firstName(childName)}’s teacher yet. They’ll appear here after lessons.
        </div>
      )}
    </div>
  </Card>
);
