'use client';

import { useState } from 'react';

import type { PracticeDay } from '@/lib/services/student-health.helpers';
import type {
  StudentRecentLesson,
  StudentRepertoireRow,
} from '@/lib/services/student-detail-queries';
import type {
  LatestNote,
  NextLesson,
  PracticeSessionRow,
} from '@/lib/services/student-health-queries';

import { LessonsCard } from './StudentDetailEditorial.Lessons';
import { NextLessonCard } from './StudentDetailEditorial.NextLesson';
import { TeacherNoteCard } from './StudentDetailEditorial.Note';
import { PracticeChart } from './StudentDetailEditorial.PracticeChart';
import { PracticeLogCard } from './StudentDetailEditorial.PracticeLog';
import { StudentDetailEditorialRepertoire } from './StudentDetailEditorial.Repertoire';
import { Card, CardHeader } from './StudentDetailEditorial.shared';

const TABS = [
  { key: 'overview', label: 'Overview' },
  { key: 'lessons', label: 'Lessons' },
  { key: 'repertoire', label: 'Repertoire' },
  { key: 'practice', label: 'Practice Log' },
] as const;

type TabKey = (typeof TABS)[number]['key'];

type Props = {
  repertoire: StudentRepertoireRow[];
  lessons: StudentRecentLesson[];
  practiceHistory: PracticeDay[];
  practiceSessions: PracticeSessionRow[];
  nextLesson: NextLesson;
  latestNote: LatestNote;
  goalMin: number;
  canEdit: boolean;
};

/**
 * Tabbed body of the student-detail view. The only client-stateful piece —
 * everything it renders is presentational and receives server-computed props,
 * so no server-only module reaches the client bundle.
 */
export const StudentDetailBody = ({
  repertoire,
  lessons,
  practiceHistory,
  practiceSessions,
  nextLesson,
  latestNote,
  goalMin,
  canEdit,
}: Props) => {
  const [tab, setTab] = useState<TabKey>('overview');

  return (
    <div>
      <div className="ed-tabs" role="tablist" aria-label="Student detail sections">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            role="tab"
            aria-selected={tab === t.key}
            className={`ed-tab${tab === t.key ? ' is-active' : ''}`}
            onClick={() => setTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <div className="ed-detail-grid">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <PracticeChart days={practiceHistory} goalMin={goalMin} />
            <LessonsCard lessons={lessons.slice(0, 4)} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <NextLessonCard lesson={nextLesson} />
            <TeacherNoteCard note={latestNote} />
          </div>
        </div>
      )}

      {tab === 'lessons' && <LessonsCard lessons={lessons} />}

      {tab === 'repertoire' && (
        <Card>
          <CardHeader eyebrow="Repertoire" title="Songs the student is learning" />
          <StudentDetailEditorialRepertoire repertoire={repertoire} canEdit={canEdit} />
        </Card>
      )}

      {tab === 'practice' && <PracticeLogCard sessions={practiceSessions} />}
    </div>
  );
};
