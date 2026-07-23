import { Card, CardHeader } from './primitives';

export const LessonNotesCard = ({ notes }: { notes: string | null }) => (
  <Card>
    <CardHeader eyebrow="Lesson record" title="Notes" />
    <div
      style={{
        padding: '20px 24px 24px',
        fontFamily: 'var(--serif)',
        fontSize: 14,
        lineHeight: 1.65,
        color: 'var(--ink-2)',
        whiteSpace: 'pre-wrap',
      }}
    >
      {notes ?? (
        <span style={{ fontStyle: 'italic', color: 'var(--ink-4)' }}>
          No notes captured from this lesson yet. Add them from the edit view.
        </span>
      )}
    </div>
  </Card>
);
