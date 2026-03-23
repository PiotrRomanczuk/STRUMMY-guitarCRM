import { useTransition } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Music, Settings, Keyboard, ChevronRight, CalendarPlus, Loader2 } from 'lucide-react';
import type { StudentRepertoireWithSong } from '@/types/StudentRepertoire';
import { addSongToNextLessonAction } from '@/app/actions/repertoire';
import { AssessmentComparison } from '@/components/repertoire/AssessmentComparison';
import { SelfRatingStars } from '@/components/repertoire/SelfRatingStars';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { SONG_STATUS_DESCRIPTIONS } from '@/lib/constants';
import { toast } from 'sonner';

const STATUS_COLORS: Record<string, string> = {
  mastered: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
  with_author: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  remembered: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300',
  started: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
  to_learn: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
};

const STATUS_LABELS: Record<string, string> = {
  mastered: 'Mastered',
  with_author: 'Play Along',
  remembered: 'Remembered',
  started: 'Started',
  to_learn: 'To Learn',
};

function AddToNextLessonButton({
  studentId,
  songId,
  songTitle,
}: {
  studentId: string;
  songId: string;
  songTitle: string;
}) {
  const [isPending, startTransition] = useTransition();

  const handleClick = () => {
    startTransition(async () => {
      const result = await addSongToNextLessonAction(studentId, songId);

      if ('error' in result) {
        toast.error(result.error);
      } else if ('noLesson' in result) {
        toast.info('No upcoming lesson scheduled for this student');
      } else if ('alreadyInLesson' in result) {
        const date = new Date(result.scheduledAt).toLocaleDateString('en-US', {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
        });
        toast.info(`"${songTitle}" is already in the next lesson (${date})`);
      } else {
        const date = new Date(result.scheduledAt).toLocaleDateString('en-US', {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
        });
        toast.success(`"${songTitle}" added to lesson on ${date}`);
      }
    });
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      className="h-8 w-8"
      onClick={handleClick}
      disabled={isPending}
      title="Add to next lesson"
    >
      {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CalendarPlus className="h-4 w-4" />}
    </Button>
  );
}

type ViewMode = 'teacher' | 'student';

interface RepertoireCardProps {
  item: StudentRepertoireWithSong;
  studentId: string;
  onEditConfig: () => void;
  viewMode?: ViewMode;
}

export function RepertoireCard({ item, studentId, onEditConfig, viewMode = 'teacher' }: RepertoireCardProps) {
  const hasOverrides = item.preferred_key || item.capo_fret !== null || item.custom_strumming;

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0 flex-1">
            <div className="w-10 h-10 rounded-lg bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center shrink-0 mt-0.5">
              <Music className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <Link
                  href={`/dashboard/songs/${item.song_id}`}
                  className="font-semibold text-sm truncate hover:text-primary transition-colors"
                >
                  {item.song.title}
                </Link>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Badge className={`text-[10px] ${STATUS_COLORS[item.current_status] || ''}`}>
                      {STATUS_LABELS[item.current_status] || item.current_status.replace('_', ' ')}
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent side="top">
                    {SONG_STATUS_DESCRIPTIONS[item.current_status as keyof typeof SONG_STATUS_DESCRIPTIONS] || item.current_status}
                  </TooltipContent>
                </Tooltip>
                {item.priority === 'high' && (
                  <Badge
                    variant="outline"
                    className="text-[10px] border-orange-300 text-orange-600 dark:text-orange-400"
                  >
                    High Priority
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">{item.song.author}</p>

              {hasOverrides && (
                <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
                  {item.preferred_key && (
                    <span className="flex items-center gap-0.5 font-mono bg-muted/50 px-1.5 rounded">
                      <Keyboard className="h-3 w-3" />
                      {item.preferred_key}
                      {item.song.key && item.preferred_key !== item.song.key && (
                        <span className="text-muted-foreground/60 ml-0.5">(song: {item.song.key})</span>
                      )}
                    </span>
                  )}
                  {item.capo_fret !== null && item.capo_fret > 0 && (
                    <span className="bg-muted/50 px-1.5 rounded">Capo {item.capo_fret}</span>
                  )}
                </div>
              )}

              {item.teacher_notes && (
                <p className="text-xs text-muted-foreground mt-1.5 italic line-clamp-1">
                  {item.teacher_notes}
                </p>
              )}

              <div className="mt-1.5">
                {viewMode === 'student' ? (
                  <SelfRatingStars
                    repertoireId={item.id}
                    currentRating={item.self_rating}
                    updatedAt={item.self_rating_updated_at}
                  />
                ) : (
                  <AssessmentComparison
                    teacherStatus={item.current_status}
                    selfRating={item.self_rating}
                    selfRatingUpdatedAt={item.self_rating_updated_at}
                  />
                )}
              </div>

              {item.last_practiced_at && (
                <p className="text-[10px] text-muted-foreground/70 mt-1">
                  Last practiced:{' '}
                  {new Date(item.last_practiced_at).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                  })}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <AddToNextLessonButton
              studentId={studentId}
              songId={item.song_id}
              songTitle={item.song.title}
            />
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={onEditConfig}
              title="Edit configuration"
            >
              <Settings className="h-4 w-4" />
            </Button>
            <Link href={`/dashboard/songs/${item.song_id}`}>
              <ChevronRight className="h-4 w-4 text-muted-foreground/30 hover:text-primary transition-colors" />
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
