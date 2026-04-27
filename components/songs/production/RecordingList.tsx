'use client';

import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from '@/components/ui/responsive-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Sliders, Video } from 'lucide-react';
import type { SongVideo, ProductionStatus } from '@/types/SongVideo';
import RecordingQualityForm from './RecordingQualityForm';

const STATUS_TONE: Record<ProductionStatus, string> = {
  idea: 'bg-muted text-muted-foreground',
  recording: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200',
  edited: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200',
  ready: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200',
};

interface Props {
  songId: string;
}

async function fetchRecordings(songId: string): Promise<SongVideo[]> {
  const res = await fetch(`/api/song/${songId}/videos`);
  if (!res.ok) throw new Error('Failed to load recordings');
  return ((await res.json()).videos ?? []) as SongVideo[];
}

export default function RecordingList({ songId }: Props) {
  const { data = [], isLoading } = useQuery({
    queryKey: ['song-videos', songId],
    queryFn: () => fetchRecordings(songId),
  });
  const [editing, setEditing] = useState<SongVideo | null>(null);

  if (isLoading) return <p className="text-sm text-muted-foreground">Loading recordings…</p>;
  if (data.length === 0)
    return (
      <div className="rounded-md border border-dashed border-border/60 bg-muted/20 p-4 text-center">
        <Video className="mx-auto mb-2 h-6 w-6 text-muted-foreground/50" />
        <p className="text-sm text-muted-foreground">No recordings yet — upload one above.</p>
      </div>
    );

  return (
    <>
      <ul className="space-y-2">
        {data.map((rec) => (
          <li
            key={rec.id}
            className="flex items-center justify-between gap-3 rounded-md border border-border/60 bg-card px-3 py-2"
          >
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-medium">{rec.title || rec.filename}</div>
              <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                <Badge className={STATUS_TONE[rec.production_status]}>
                  {rec.production_status}
                </Badge>
                {rec.is_recording_correct && <span>· Take ok</span>}
                {rec.is_well_lit && <span>· Lit</span>}
                {rec.is_audio_mixed && <span>· Mixed</span>}
                {rec.is_video_edited && <span>· Edited</span>}
                {rec.mic_type && <span>· {rec.mic_type}</span>}
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setEditing(rec)}>
              <Sliders className="mr-1 h-4 w-4" />
              Quality
            </Button>
          </li>
        ))}
      </ul>

      <ResponsiveDialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <ResponsiveDialogContent>
          <ResponsiveDialogHeader>
            <ResponsiveDialogTitle>Recording quality</ResponsiveDialogTitle>
          </ResponsiveDialogHeader>
          {editing && (
            <RecordingQualityForm
              songId={songId}
              recording={editing}
              onSaved={() => setEditing(null)}
            />
          )}
        </ResponsiveDialogContent>
      </ResponsiveDialog>
    </>
  );
}
