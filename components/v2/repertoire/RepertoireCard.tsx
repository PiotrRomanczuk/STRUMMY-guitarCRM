'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Music, Keyboard, ChevronRight, Edit } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { SONG_STATUS_DESCRIPTIONS } from '@/lib/constants';
import type { StudentRepertoireWithSong } from '@/types/StudentRepertoire';
import { SelfRating } from './SelfRating';

const STATUS_STYLES: Record<string, string> = {
  mastered: 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20',
  with_author: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
  remembered: 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20',
  started: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
  to_learn: 'bg-muted text-muted-foreground border-border',
};

const STATUS_LABELS: Record<string, string> = {
  mastered: 'Mastered',
  with_author: 'Play Along',
  remembered: 'Remembered',
  started: 'Started',
  to_learn: 'To Learn',
};

const PRIORITY_STYLES: Record<string, string> = {
  high: 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20',
};

interface RepertoireCardProps {
  item: StudentRepertoireWithSong;
  viewMode?: 'teacher' | 'student';
}

/**
 * Rich repertoire card for mobile.
 * Shows song title, author, status, key/capo, priority, self-rating, and last practiced.
 */
export function RepertoireCard({ item, viewMode = 'teacher' }: RepertoireCardProps) {
  const router = useRouter();
  const hasKeyOverride = item.preferred_key && item.preferred_key !== item.song.key;
  const hasCapo = item.capo_fret !== null && item.capo_fret > 0;

  return (
    <div className="bg-card rounded-xl border border-border p-4 space-y-3 active:bg-muted/50 transition-colors">
      {/* Row 1: Song info + status */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center shrink-0">
            <Music className="h-5 w-5 text-purple-600 dark:text-purple-400" />
          </div>
          <div className="min-w-0 flex-1">
            <Link
              href={`/dashboard/songs/${item.song_id}`}
              className="text-sm font-medium truncate block hover:text-primary transition-colors"
            >
              {item.song.title}
            </Link>
            <p className="text-xs text-muted-foreground truncate">{item.song.author}</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {item.priority === 'high' && (
            <span
              className={cn(
                'inline-flex items-center rounded-full px-2 py-0.5',
                'text-[11px] font-medium border',
                PRIORITY_STYLES.high
              )}
            >
              High
            </span>
          )}
          <Tooltip>
            <TooltipTrigger asChild>
              <span
                className={cn(
                  'inline-flex items-center rounded-full px-2.5 py-0.5',
                  'text-[11px] font-medium border cursor-default',
                  STATUS_STYLES[item.current_status] ?? STATUS_STYLES.to_learn
                )}
              >
                {STATUS_LABELS[item.current_status] ?? item.current_status}
              </span>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              {SONG_STATUS_DESCRIPTIONS[item.current_status as keyof typeof SONG_STATUS_DESCRIPTIONS] || item.current_status}
            </TooltipContent>
          </Tooltip>
        </div>
      </div>

      {/* Row 2: Key/Capo/Level info */}
      {(hasKeyOverride || hasCapo || item.song.level) && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
          {item.song.level && (
            <span className="bg-muted/50 px-1.5 py-0.5 rounded text-[11px] uppercase font-medium">
              {item.song.level}
            </span>
          )}
          {(item.preferred_key || item.song.key) && (
            <span className="flex items-center gap-0.5 bg-muted/50 px-1.5 py-0.5 rounded font-mono text-[11px]">
              <Keyboard className="h-3 w-3" />
              {item.preferred_key || item.song.key}
              {hasKeyOverride && (
                <span className="text-muted-foreground/60 ml-0.5">
                  (orig: {item.song.key})
                </span>
              )}
            </span>
          )}
          {hasCapo && (
            <span className="bg-muted/50 px-1.5 py-0.5 rounded text-[11px]">
              Capo {item.capo_fret}
            </span>
          )}
        </div>
      )}

      {/* Row 3: Teacher notes */}
      {item.teacher_notes && (
        <p className="text-xs text-muted-foreground italic line-clamp-2">
          {item.teacher_notes}
        </p>
      )}

      {/* Row 4: Self-rating (student view) or actions (teacher view) */}
      {viewMode === 'student' ? (
        <SelfRating
          repertoireId={item.id}
          currentRating={item.self_rating}
          updatedAt={item.self_rating_updated_at}
        />
      ) : (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            {item.self_rating !== null && (
              <SelfRating
                repertoireId={item.id}
                currentRating={item.self_rating}
                updatedAt={item.self_rating_updated_at}
                isReadOnly
              />
            )}
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <Button
              variant="ghost"
              size="icon"
              className="min-h-[44px] min-w-[44px]"
              onClick={() => router.push(`/dashboard/songs/${item.song_id}`)}
              aria-label={`Edit ${item.song.title} in repertoire`}
            >
              <Edit className="h-4 w-4 text-muted-foreground" />
            </Button>
            <Link
              href={`/dashboard/songs/${item.song_id}`}
              className="p-2.5 rounded-lg hover:bg-muted/50 transition-colors"
              aria-label={`View ${item.song.title}`}
            >
              <ChevronRight className="h-5 w-5 text-muted-foreground/40" />
            </Link>
          </div>
        </div>
      )}

      {/* Row 5: Last practiced */}
      {item.last_practiced_at && (
        <p className="text-[11px] text-muted-foreground/70">
          Last practiced:{' '}
          {new Date(item.last_practiced_at).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
          })}
        </p>
      )}
    </div>
  );
}

export default RepertoireCard;
