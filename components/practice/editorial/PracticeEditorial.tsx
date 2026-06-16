import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PracticeLogForm, type RepertoireSongOption } from './PracticeLogForm';
import { PracticeHistoryList } from './PracticeHistoryList';
import type { PracticeSessionWithSong } from '@/app/actions/practice';

interface PracticeEditorialProps {
  sessions: PracticeSessionWithSong[];
  songs: RepertoireSongOption[];
  /** Students log + undo; staff viewing a student see read-only history. */
  isOwnPractice: boolean;
}

/**
 * Editorial practice surface (spec 05). Log form + session history with
 * same-day undo. Server component — interactivity lives in the leaf
 * client components.
 */
export function PracticeEditorial({ sessions, songs, isOwnPractice }: PracticeEditorialProps) {
  const totalMinutes = sessions.reduce((sum, s) => sum + s.duration_minutes, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Practice</h1>
        <p className="text-sm text-muted-foreground">
          {sessions.length} session{sessions.length === 1 ? '' : 's'} · {totalMinutes} minutes
          logged
        </p>
      </div>

      {isOwnPractice && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Log a session</CardTitle>
          </CardHeader>
          <CardContent>
            <PracticeLogForm songs={songs} />
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">History</CardTitle>
        </CardHeader>
        <CardContent>
          <PracticeHistoryList sessions={sessions} canUndo={isOwnPractice} />
        </CardContent>
      </Card>
    </div>
  );
}
