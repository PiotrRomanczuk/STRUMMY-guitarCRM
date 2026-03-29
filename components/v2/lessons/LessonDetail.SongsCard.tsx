'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Music, ChevronDown, Pencil } from 'lucide-react';
import { cn } from '@/lib/utils';
import { staggerContainer, listItem } from '@/lib/animations/variants';
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from '@/components/ui/collapsible';
import { getSongStatusStyle, getSongStatusLabel } from './lesson.helpers';
import { SongProgress } from './LessonDetail.SongProgress';
import type { LessonSongItem } from './LessonDetail.types';

interface SongsCardProps {
  lessonSongs: LessonSongItem[];
  studentId: string;
}

export function SongsCard({ lessonSongs, studentId }: SongsCardProps) {
  const router = useRouter();
  const validSongs = lessonSongs.filter((ls) => ls.song !== null);

  return (
    <div className="bg-card rounded-xl p-6">
      <div className="flex items-center gap-2 mb-4">
        <Music className="h-4 w-4 text-primary/60" />
        <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
          Songs ({lessonSongs.length})
        </h3>
      </div>
      {validSongs.length > 0 ? (
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="space-y-2"
        >
          {validSongs.map((ls) => (
            <SongRow
              key={ls.id}
              lessonSong={ls}
              studentId={studentId}
              onNavigate={() => router.push(`/dashboard/songs/${ls.song!.id}`)}
              onEdit={() => router.push(`/dashboard/songs/${ls.song!.id}/edit`)}
            />
          ))}
        </motion.div>
      ) : (
        <p className="text-sm text-muted-foreground italic">No songs assigned.</p>
      )}
    </div>
  );
}

function SongRow({
  lessonSong,
  studentId,
  onNavigate,
  onEdit,
}: {
  lessonSong: LessonSongItem;
  studentId: string;
  onNavigate: () => void;
  onEdit: () => void;
}) {
  const [open, setOpen] = useState(false);
  const song = lessonSong.song!;

  return (
    <motion.div variants={listItem}>
      <Collapsible open={open} onOpenChange={setOpen}>
        <div
          className={cn(
            'bg-muted/50 hover:bg-muted transition-colors rounded-lg',
            open && 'bg-muted'
          )}
        >
          <div className="flex items-center px-4 py-3">
            <button
              type="button"
              onClick={onNavigate}
              className="min-w-0 flex-1 text-left"
            >
              <p className="text-sm font-medium truncate">{song.title}</p>
              <p className="text-xs text-muted-foreground truncate">{song.author}</p>
            </button>
            <span
              className={cn(
                'inline-flex items-center rounded-full px-2.5 py-0.5 shrink-0 ml-3',
                'text-xs font-medium border',
                getSongStatusStyle(lessonSong.status)
              )}
            >
              {getSongStatusLabel(lessonSong.status)}
            </span>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onEdit(); }}
              className="ml-2 p-1 rounded-md hover:bg-background/50 transition-colors"
              aria-label="Edit song"
            >
              <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
            </button>
            <CollapsibleTrigger asChild>
              <button
                type="button"
                className="ml-1 p-1 rounded-md hover:bg-background/50 transition-colors"
                aria-label="Toggle song history"
              >
                <ChevronDown
                  className={cn(
                    'h-4 w-4 text-muted-foreground transition-transform duration-200',
                    open && 'rotate-180'
                  )}
                />
              </button>
            </CollapsibleTrigger>
          </div>
          <CollapsibleContent>
            <div className="border-t border-border/50">
              <SongProgress songId={song.id} studentId={studentId} />
            </div>
          </CollapsibleContent>
        </div>
      </Collapsible>
    </motion.div>
  );
}
