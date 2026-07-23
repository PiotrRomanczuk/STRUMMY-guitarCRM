import type {
  StudentPreferences,
  StudentProfile,
  StudentRecentLesson,
  StudentRepertoireRow,
} from '@/lib/services/student-detail-queries';
import { totalPracticeMinutes } from '@/lib/services/student-detail-queries';
import type { PracticeDay } from '@/lib/services/student-health.helpers';
import {
  DEFAULT_DAILY_GOAL_MIN,
  computeHealth,
  latestPracticedAt,
} from '@/lib/services/student-health.helpers';
import type {
  LatestNote,
  NextLesson,
  PracticeSessionRow,
} from '@/lib/services/student-health-queries';

import { StudentDetailBody } from './StudentDetailEditorial.Body';
import { StudentDetailHeader } from './StudentDetailEditorial.Header';

export { Empty, formatMinutes } from './StudentDetailEditorial.shared';

type Props = {
  profile: StudentProfile;
  repertoire: StudentRepertoireRow[];
  lessons: StudentRecentLesson[];
  preferences: StudentPreferences | null; // IDA-4 — null when onboarding was never completed
  practiceHistory: PracticeDay[];
  practiceSessions: PracticeSessionRow[];
  nextLesson: NextLesson;
  latestNote: LatestNote;
  /** True when the viewer is staff (admin/teacher) and may edit repertoire status. */
  canEdit?: boolean;
};

export const StudentDetailEditorial = ({
  profile,
  repertoire,
  lessons,
  preferences,
  practiceHistory,
  practiceSessions,
  nextLesson,
  latestNote,
  canEdit = false,
}: Props) => {
  const totalMins = totalPracticeMinutes(repertoire);
  const mastered = repertoire.filter((r) => r.status === 'mastered').length;
  const active = repertoire.filter((r) => r.status !== 'to_learn').length;
  const health = computeHealth(latestPracticedAt(repertoire), new Date());

  return (
    <div
      style={{
        background: 'var(--ivory)',
        color: 'var(--ink)',
        fontSize: 13,
        lineHeight: 1.4,
        minHeight: '100%',
        padding: '28px 32px 64px',
      }}
    >
      <StudentDetailHeader
        profile={profile}
        preferences={preferences}
        health={health}
        stats={{ active, mastered, totalMins }}
      />
      <StudentDetailBody
        repertoire={repertoire}
        lessons={lessons}
        practiceHistory={practiceHistory}
        practiceSessions={practiceSessions}
        nextLesson={nextLesson}
        latestNote={latestNote}
        goalMin={DEFAULT_DAILY_GOAL_MIN}
        canEdit={canEdit}
      />
    </div>
  );
};
