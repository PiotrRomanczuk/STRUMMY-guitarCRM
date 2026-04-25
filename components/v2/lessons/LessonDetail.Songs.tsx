'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { StageStepper } from '@/components/v2/primitives/StageStepper';
import { updateLessonSongStatus, updateLessonSongNotes } from '@/app/dashboard/lessons/actions';
import { Button } from '@/components/ui/button';
import type { LessonSongItem } from './LessonDetail';

interface LessonDetailSongsProps {
  lessonId: string;
  songs: LessonSongItem[];
  canEdit: boolean;
}

export function LessonDetailSongs({ lessonId, songs, canEdit }: LessonDetailSongsProps) {
  const router = useRouter();
  const [expandedSong, setExpandedSong] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [localStatuses, setLocalStatuses] = useState<Record<string, string>>({});

  const handleStatusChange = (songId: string, status: string) => {
    setLocalStatuses((prev) => ({ ...prev, [songId]: status }));
    startTransition(async () => {
      await updateLessonSongStatus(lessonId, songId, status);
    });
  };

  const handleNoteBlur = (songId: string, notes: string) => {
    startTransition(async () => {
      await updateLessonSongNotes(lessonId, songId, notes);
    });
  };

  return (
    <DetailCard
      eyebrow="Repertoire"
      title={<>Songs <span className="text-muted-foreground text-sm font-normal">· {songs.length}</span></>}
      action={canEdit ? <Button variant="outline" size="sm"><Plus className="h-3 w-3" /> Add song</Button> : undefined}
    >
      <div className="px-6 pb-5">
        {songs.length === 0 && (
          <div className="py-7 text-center text-muted-foreground italic font-serif text-base">
            No songs attached to this lesson.
          </div>
        )}
        {songs.filter((ls) => ls.song).map((ls, i) => {
          const song = ls.song!;
          const isOpen = expandedSong === ls.id;
          const currentStatus = localStatuses[song.id] ?? ls.status ?? 'to_learn';

          return (
            <div key={ls.id} className={cn('py-4', i > 0 && 'border-t border-border')}>
              <div className="flex items-start gap-3.5">
                {/* Key tile */}
                <div className="w-[42px] h-[42px] rounded-md bg-gradient-to-br from-primary/60 to-primary flex items-center justify-center font-serif text-sm font-medium text-primary-foreground shrink-0 shadow-[inset_0_-1px_0_rgba(0,0,0,.2)]">
                  {song.title.charAt(0)}
                </div>

                <div className="flex-1 min-w-0">
                  <button
                    type="button"
                    onClick={() => router.push(`/dashboard/songs/${song.id}`)}
                    className="font-serif text-[17px] font-medium italic tracking-[-0.01em] hover:text-primary transition-colors text-left"
                  >
                    {song.title}
                  </button>
                  <div className="text-muted-foreground text-xs font-mono mt-0.5">
                    {song.author}
                  </div>

                  {/* Stage stepper */}
                  <div className="mt-3">
                    <StageStepper
                      status={currentStatus}
                      onStatusChange={canEdit ? (s) => handleStatusChange(song.id, s) : undefined}
                      readOnly={!canEdit || isPending}
                    />
                  </div>

                  {/* Expand toggle */}
                  <button
                    type="button"
                    onClick={() => setExpandedSong(isOpen ? null : ls.id)}
                    className="mt-2.5 text-muted-foreground text-[11px] font-mono uppercase tracking-[.12em] hover:text-foreground transition-colors inline-flex items-center gap-1"
                  >
                    {isOpen ? 'Hide notes' : (ls.notes ? 'Notes' : 'Add note')}
                  </button>

                  {/* Expanded notes */}
                  {isOpen && (
                    <div className="mt-3">
                      <textarea
                        defaultValue={ls.notes ?? ''}
                        onBlur={(e) => canEdit && handleNoteBlur(song.id, e.target.value)}
                        readOnly={!canEdit}
                        placeholder="Per-lesson note on this song..."
                        className="w-full min-h-[72px] p-2.5 border border-border rounded-md bg-background text-foreground/80 text-[13px] leading-relaxed resize-y font-sans"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </DetailCard>
  );
}

export function DetailCard({ eyebrow, title, action, children }: {
  eyebrow: string;
  title: React.ReactNode;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-card border border-border rounded-[10px] shadow-sm overflow-hidden">
      <div className="px-6 pt-5 pb-3 flex items-end justify-between">
        <div>
          <div className="font-mono text-[10px] text-muted-foreground uppercase tracking-[.14em] font-medium">{eyebrow}</div>
          <div className="font-serif text-xl font-normal tracking-[-0.01em] mt-0.5">{title}</div>
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}
