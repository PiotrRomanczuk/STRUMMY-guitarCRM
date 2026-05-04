'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Music } from 'lucide-react';
import { TableCell, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { LEVEL_STYLES, type RecordingOverride } from './SongList.recording.helpers';
import { RecordButton } from './SongList.RecordButton';
import type { SongListV2Props } from './SongList';

interface SongRowProps {
  song: SongListV2Props['songs'][number];
  selected: boolean;
  onSelect: (id: string | null) => void;
  isTeacher: boolean;
  recording: RecordingOverride;
  onCycleRecording: (songId: string, current: RecordingOverride) => void;
}

export function SongRow({
  song,
  selected,
  onSelect,
  isTeacher,
  recording,
  onCycleRecording,
}: SongRowProps) {
  const router = useRouter();
  return (
    <TableRow
      onClick={() => (selected ? router.push(`/dashboard/songs/${song.id}`) : onSelect(song.id))}
      className={cn(
        'cursor-pointer transition-colors border-transparent',
        selected ? 'bg-primary/5 ring-1 ring-inset ring-primary/20' : 'hover:bg-muted/50'
      )}
    >
      <TableCell>
        <div className="flex items-center gap-3">
          <div className="relative w-10 h-10 rounded-[10px] overflow-hidden shrink-0 bg-muted flex items-center justify-center">
            {song.cover_image_url ? (
              <Image
                src={song.cover_image_url}
                alt={song.title || 'Song'}
                fill
                sizes="40px"
                className="object-cover"
              />
            ) : (
              <Music className="h-4 w-4 text-muted-foreground" />
            )}
          </div>
          <span className="font-semibold text-foreground">{song.title || 'Untitled'}</span>
        </div>
      </TableCell>
      <TableCell className="text-muted-foreground">{song.author || 'Unknown'}</TableCell>
      <TableCell className="text-muted-foreground">{song.category || '-'}</TableCell>
      <TableCell>
        {song.level ? (
          <span
            className={cn(
              'inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider',
              LEVEL_STYLES[song.level] ?? 'bg-muted text-muted-foreground'
            )}
          >
            {song.level}
          </span>
        ) : (
          <span className="text-muted-foreground">-</span>
        )}
      </TableCell>
      <TableCell className="text-muted-foreground">{song.key || '-'}</TableCell>
      {isTeacher && (
        <TableCell className="text-right">
          <RecordButton songId={song.id} recording={recording} onCycle={onCycleRecording} />
        </TableCell>
      )}
    </TableRow>
  );
}
