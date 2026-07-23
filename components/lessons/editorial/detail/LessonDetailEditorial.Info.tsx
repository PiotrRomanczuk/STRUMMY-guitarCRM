import Link from 'next/link';

import type { LessonDetail } from '@/lib/services/lesson-detail-queries';

import { Card, CardHeader, InfoRow, formatLong } from './primitives';

const mono13 = { fontFamily: 'var(--mono)', fontSize: 13 } as const;

export const LessonInfoCard = ({
  lesson,
  studentDisplay,
  studentFirstName,
}: {
  lesson: LessonDetail;
  studentDisplay: string;
  studentFirstName: string;
}) => (
  <Card>
    <CardHeader eyebrow="Details" title="Lesson info" />
    <div style={{ padding: '18px 24px 22px', display: 'flex', flexDirection: 'column', gap: 14 }}>
      <InfoRow label="Scheduled">
        <span style={mono13}>{formatLong(lesson.scheduledAt)}</span>
      </InfoRow>
      <InfoRow label="Student">
        <Link
          href={`/dashboard/users/${lesson.studentId}`}
          style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}
        >
          <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink-2)' }}>
            {studentDisplay}
          </div>
          {lesson.studentName && lesson.studentEmail && (
            <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--ink-4)' }}>
              {lesson.studentEmail}
            </div>
          )}
        </Link>
      </InfoRow>
      <InfoRow label="Teacher">
        <span style={{ fontSize: 13, color: 'var(--ink-2)' }}>{lesson.teacherName ?? '—'}</span>
      </InfoRow>
      <InfoRow label="Sequence">
        <span style={mono13}>
          {lesson.lessonTeacherNumber != null
            ? `Lesson #${lesson.lessonTeacherNumber} with ${studentFirstName}`
            : `With ${studentFirstName}`}
        </span>
      </InfoRow>
    </div>
  </Card>
);
