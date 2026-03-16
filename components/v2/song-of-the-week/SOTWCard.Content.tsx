'use client';

import { useState, useTransition } from 'react';
import Image from 'next/image';
import {
  Music2,
  Guitar,
  Youtube,
  Play,
  FileText,
  Plus,
  Check,
  Loader2,
  ChevronDown,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { addSotwToRepertoire } from '@/app/actions/song-of-the-week';
import type { SongOfTheWeekWithSong } from '@/types/SongOfTheWeek';

/** Design system STATUS_STYLES pattern (section 8 of V2_DESIGN_SYSTEM.md) */
const DIFFICULTY_STYLES: Record<string, string> = {
  beginner: 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20',
  intermediate: 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20',
  advanced: 'bg-destructive/10 text-destructive border-destructive/20',
} as const;

interface SOTWCardContentProps {
  sotw: SongOfTheWeekWithSong;
  isStudent: boolean;
  sotwInRepertoire: boolean;
}

export function SOTWCardContent({ sotw, isStudent, sotwInRepertoire }: SOTWCardContentProps) {
  const { song } = sotw;
  const hasResources = song.youtube_url || song.spotify_link_url || song.ultimate_guitar_link;

  return (
    <div className="px-4 pb-4 space-y-3">
      {/* Song hero — large art + info */}
      <div className="flex items-start gap-3">
        <div className="w-16 h-16 rounded-lg bg-primary/10 flex items-center justify-center overflow-hidden relative shrink-0">
          {song.cover_image_url ? (
            <Image src={song.cover_image_url} alt={song.title} fill className="object-cover" />
          ) : (
            <Music2 className="h-7 w-7 text-primary" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <h4 className="text-sm font-medium truncate">{song.title}</h4>
          <p className="text-xs text-muted-foreground truncate">{song.author}</p>
          <span
            className={cn(
              'inline-flex items-center rounded-full px-2 py-0.5 mt-1.5',
              'text-[11px] font-medium border capitalize',
              DIFFICULTY_STYLES[song.level || 'beginner']
            )}
          >
            {song.level || 'Beginner'}
          </span>
        </div>
      </div>

      {/* Teacher message (expandable) */}
      {sotw.teacher_message && <ExpandableMessage message={sotw.teacher_message} />}

      {/* Song details row */}
      <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <Guitar className="h-3.5 w-3.5" />
          Key: {song.key}
        </span>
        {song.chords && (
          <span className="flex items-center gap-1">
            <Music2 className="h-3.5 w-3.5" />
            {song.chords}
          </span>
        )}
        {song.capo_fret != null && song.capo_fret > 0 && <span>Capo: fret {song.capo_fret}</span>}
        {song.tempo && <span>{song.tempo} BPM</span>}
      </div>

      {/* Resource links */}
      {hasResources && (
        <div className="flex flex-wrap gap-2">
          {song.youtube_url && (
            <ResourceLink href={song.youtube_url} icon={Youtube} label="YouTube" className="bg-red-500 dark:bg-red-600 hover:bg-red-600 dark:hover:bg-red-700" />
          )}
          {song.ultimate_guitar_link && (
            <ResourceLink href={song.ultimate_guitar_link} icon={FileText} label="Tabs" className="bg-yellow-500 dark:bg-yellow-600 hover:bg-yellow-600 dark:hover:bg-yellow-700" />
          )}
          {song.spotify_link_url && (
            <ResourceLink href={song.spotify_link_url} icon={Play} label="Spotify" className="bg-green-500 dark:bg-green-600 hover:bg-green-600 dark:hover:bg-green-700" />
          )}
        </div>
      )}

      {/* Student add-to-repertoire button */}
      {isStudent && <AddToRepertoireButton alreadyAdded={sotwInRepertoire} />}
    </div>
  );
}

function ExpandableMessage({ message }: { message: string }) {
  const [expanded, setExpanded] = useState(false);
  const isTruncatable = message.length > 120;

  return (
    <button
      type="button"
      onClick={() => isTruncatable && setExpanded(!expanded)}
      className={cn(
        'w-full text-left border-l-2 border-primary/30 pl-3 py-1',
        isTruncatable && 'cursor-pointer'
      )}
    >
      <p className={cn('text-xs text-muted-foreground italic', !expanded && isTruncatable && 'line-clamp-2')}>
        {message}
      </p>
      {isTruncatable && (
        <ChevronDown
          className={cn('h-3.5 w-3.5 text-muted-foreground mt-0.5 transition-transform', expanded && 'rotate-180')}
        />
      )}
    </button>
  );
}

function ResourceLink({
  href,
  icon: Icon,
  label,
  className,
}: {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  className: string;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        'flex items-center gap-1.5 min-h-[44px] px-3 text-xs font-medium text-white rounded-md transition-colors',
        className
      )}
    >
      <Icon className="h-3.5 w-3.5" />
      {label}
    </a>
  );
}

function AddToRepertoireButton({ alreadyAdded }: { alreadyAdded: boolean }) {
  const [isPending, startTransition] = useTransition();

  if (alreadyAdded) {
    return (
      <Button variant="outline" disabled className="w-full min-h-[44px]">
        <Check className="h-4 w-4 mr-2" />
        Already in My Songs
      </Button>
    );
  }

  const handleAdd = () => {
    startTransition(async () => {
      const result = await addSotwToRepertoire();
      if ('error' in result) {
        toast.error(result.error);
      } else {
        toast.success('Song added to your repertoire!');
      }
    });
  };

  return (
    <Button onClick={handleAdd} disabled={isPending} className="w-full min-h-[44px]">
      {isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
      Add to My Songs
    </Button>
  );
}
