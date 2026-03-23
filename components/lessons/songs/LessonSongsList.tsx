import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { SONG_STATUS_DESCRIPTIONS } from '@/lib/constants';
import { LessonSongSelector } from './LessonSongSelector';
import { LessonSongStatusSelect } from './LessonSongStatusSelect';
import { Database } from '@/database.types';

type LessonSongStatus = Database['public']['Enums']['lesson_song_status'];

interface Song {
  id: string;
  title: string;
  author: string;
}

interface LessonSong {
  id: string;
  status: LessonSongStatus;
  song: Song | null;
}

interface LessonSongsListProps {
  lessonId: string;
  lessonSongs: LessonSong[];
  canEdit: boolean;
}

const statusConfig: Record<LessonSongStatus, { label: string; className: string }> = {
  to_learn: {
    label: 'To Learn',
    className: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  },
  started: {
    label: 'Started',
    className: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
  },
  remembered: {
    label: 'Remembered',
    className: 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300',
  },
  with_author: {
    label: 'Play Along',
    className: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300',
  },
  mastered: {
    label: 'Mastered',
    className: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
  },
};

function SongStatusBadge({ status }: { status: LessonSongStatus }) {
  const config = statusConfig[status] || statusConfig.to_learn;
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          className={cn(
            'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium cursor-default',
            config.className
          )}
        >
          {config.label}
        </span>
      </TooltipTrigger>
      <TooltipContent side="top">
        {SONG_STATUS_DESCRIPTIONS[status as keyof typeof SONG_STATUS_DESCRIPTIONS] || status}
      </TooltipContent>
    </Tooltip>
  );
}

export function LessonSongsList({ lessonId, lessonSongs, canEdit }: LessonSongsListProps) {
  const initialSelectedSongIds = lessonSongs
    .filter((ls) => ls.song !== null)
    .map((ls) => ls.song!.id);

  return (
    <div className="bg-card rounded-lg shadow-md p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-foreground">Lesson Songs</h2>
        {canEdit && (
          <LessonSongSelector lessonId={lessonId} initialSelectedSongIds={initialSelectedSongIds} />
        )}
      </div>

      {lessonSongs && lessonSongs.length > 0 ? (
        <ul className="divide-y divide-border">
          {lessonSongs.map((ls, index) =>
            ls.song ? (
              <li key={`${ls.song.id}-${index}`} className="py-3 flex justify-between items-center gap-4">
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-foreground truncate">{ls.song.title}</p>
                  <p className="text-sm text-muted-foreground truncate">{ls.song.author}</p>
                </div>
                <div className="flex items-center gap-2 sm:gap-4">
                  {canEdit ? (
                    <LessonSongStatusSelect
                      lessonId={lessonId}
                      songId={ls.song.id}
                      currentStatus={ls.status}
                    />
                  ) : (
                    <SongStatusBadge status={ls.status} />
                  )}
                  <Link
                    href={`/dashboard/songs/${ls.song.id}`}
                    className="text-primary hover:text-primary/80 text-sm"
                  >
                    View
                  </Link>
                </div>
              </li>
            ) : null
          )}
        </ul>
      ) : (
        <p className="text-muted-foreground italic">No songs assigned to this lesson.</p>
      )}
    </div>
  );
}
