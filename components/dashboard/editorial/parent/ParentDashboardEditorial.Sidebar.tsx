import type { UpcomingLesson } from '@/lib/services/student-health-queries';

import { Card, CardHeader, ComingSoonBody } from '../primitives';
import { Badge, formatLessonDate } from './ParentDashboardEditorial.shared';

const LessonRow = ({
  lesson,
  isNext,
  isLast,
}: {
  lesson: UpcomingLesson;
  isNext: boolean;
  isLast: boolean;
}) => {
  const { mo, day, time, weekday } = formatLessonDate(lesson.scheduledAt);
  return (
    <div
      className="ed-row"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        padding: '14px 22px',
        borderBottom: isLast ? 'none' : '1px solid var(--rule-2)',
        background: isNext ? 'var(--gold-tint)' : 'transparent',
      }}
    >
      <div style={{ width: 52, textAlign: 'center', flexShrink: 0 }}>
        <div
          style={{
            fontFamily: 'var(--mono)',
            fontSize: 10,
            color: 'var(--ink-4)',
            letterSpacing: '.08em',
          }}
        >
          {mo}
        </div>
        <div
          style={{
            fontFamily: 'var(--serif)',
            fontSize: 24,
            fontWeight: 500,
            lineHeight: 1,
            color: isNext ? 'var(--gold-2)' : 'var(--ink)',
          }}
        >
          {day}
        </div>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 500 }}>{lesson.title ?? 'Guitar lesson'}</div>
        <div style={{ fontSize: 12, color: 'var(--ink-4)' }}>
          {weekday} · {time}
          {lesson.teacherName ? ` · ${lesson.teacherName}` : ''}
        </div>
      </div>
      {isNext && <Badge tone="gold">Next</Badge>}
    </div>
  );
};

export const ParentUpcomingLessonsCard = ({ lessons }: { lessons: UpcomingLesson[] }) => (
  <Card>
    <CardHeader eyebrow="Schedule" title="Upcoming lessons" />
    {lessons.length === 0 ? (
      <ComingSoonBody note="No lessons scheduled yet. Your teacher will add them here." />
    ) : (
      <div>
        {lessons.map((lesson, i) => (
          <LessonRow
            key={lesson.id}
            lesson={lesson}
            isNext={i === 0}
            isLast={i === lessons.length - 1}
          />
        ))}
      </div>
    )}
  </Card>
);

/**
 * Billing is parked (out of scope): render a friendly placeholder rather than
 * wiring up Stripe/invoice logic. Keeps the mockup's slot without faking data.
 */
export const ParentBillingCard = () => (
  <Card>
    <CardHeader eyebrow="Payments" title="Billing" />
    <ComingSoonBody note="Invoices and auto-pay are coming soon. For now your teacher handles billing directly." />
  </Card>
);
