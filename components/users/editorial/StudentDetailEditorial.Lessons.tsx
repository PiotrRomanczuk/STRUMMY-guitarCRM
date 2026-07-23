import Link from 'next/link';

import type { StudentRecentLesson } from '@/lib/services/student-detail-queries';
import { Card, CardHeader, Empty, formatDate } from './StudentDetailEditorial.shared';

type Props = { lessons: StudentRecentLesson[] };

/** Recent lessons list — one row per lesson, linking to the lesson detail. */
export const LessonsCard = ({ lessons }: Props) => (
  <Card>
    <CardHeader eyebrow="Recent" title="Lessons" />
    {lessons.length === 0 ? (
      <Empty>No lessons yet.</Empty>
    ) : (
      <div>
        {lessons.map((lesson, i) => (
          <Link
            key={lesson.id}
            href={`/dashboard/lessons/${lesson.id}`}
            className="ed-row"
            style={{
              display: 'block',
              padding: '12px 22px',
              borderBottom: i < lessons.length - 1 ? '1px solid var(--rule)' : 'none',
              textDecoration: 'none',
              color: 'inherit',
            }}
          >
            <div
              style={{
                fontFamily: 'var(--mono)',
                fontSize: 10,
                color: 'var(--ink-4)',
                textTransform: 'uppercase',
                letterSpacing: '.08em',
              }}
            >
              {formatDate(lesson.scheduledAt)} · {lesson.status}
            </div>
            <div
              style={{
                fontFamily: 'var(--serif)',
                fontStyle: 'italic',
                fontSize: 13,
                marginTop: 2,
              }}
            >
              {lesson.title ?? 'Untitled lesson'}
            </div>
          </Link>
        ))}
      </div>
    )}
  </Card>
);
