'use client';

import { ArrowUpDown, Music } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { EmptyState } from '@/components/ui/empty-state';
import { cn } from '@/lib/utils';
import type { RecordingOverride, SortDir, SortField } from './SongList.recording.helpers';
import { SongRow } from './SongList.Row';
import type { SongListV2Props } from './SongList';

interface SongsTableProps {
  songs: SongListV2Props['songs'];
  sortField: SortField;
  sortDir: SortDir;
  selectedSongId: string | null;
  onSort: (f: SortField) => void;
  onSelect: (id: string | null) => void;
  isTeacher: boolean;
  resolveRecording: (
    id: string,
    queuedFallback: string | null | undefined,
    recordedFallback: string | null | undefined
  ) => RecordingOverride;
  onCycleRecording: (songId: string, current: RecordingOverride) => void;
}

export function SongsTable({
  songs,
  sortField,
  sortDir,
  selectedSongId,
  onSort,
  onSelect,
  isTeacher,
  resolveRecording,
  onCycleRecording,
}: SongsTableProps) {
  const colCount = isTeacher ? 6 : 5;
  return (
    <div className="rounded-xl overflow-hidden bg-card shadow-2xl shadow-black/20">
      <Table>
        <TableHeader>
          <TableRow className="border-transparent">
            <SortHead field="title" current={sortField} dir={sortDir} onSort={onSort}>
              Song
            </SortHead>
            <SortHead field="author" current={sortField} dir={sortDir} onSort={onSort}>
              Artist
            </SortHead>
            <TableHead className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              Category
            </TableHead>
            <SortHead field="level" current={sortField} dir={sortDir} onSort={onSort}>
              Level
            </SortHead>
            <SortHead field="key" current={sortField} dir={sortDir} onSort={onSort}>
              Key
            </SortHead>
            {isTeacher && (
              <TableHead className="w-[110px] text-[10px] font-bold uppercase tracking-widest text-muted-foreground text-right">
                Record
              </TableHead>
            )}
          </TableRow>
        </TableHeader>
        <TableBody>
          {songs.length === 0 ? (
            <TableRow>
              <TableCell colSpan={colCount} className="p-0">
                <EmptyState
                  icon={Music}
                  title="No songs found"
                  message="Try adjusting your search or add a new song."
                />
              </TableCell>
            </TableRow>
          ) : (
            songs.map((song) => (
              <SongRow
                key={song.id}
                song={song}
                selected={song.id === selectedSongId}
                onSelect={onSelect}
                isTeacher={isTeacher}
                recording={resolveRecording(song.id, song.recording_queued_at, song.recorded_at)}
                onCycleRecording={onCycleRecording}
              />
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}

function SortHead({
  field,
  current,
  dir,
  onSort,
  children,
}: {
  field: SortField;
  current: SortField;
  dir: SortDir;
  onSort: (f: SortField) => void;
  children: React.ReactNode;
}) {
  const isActive = current === field;
  return (
    <TableHead>
      <button
        type="button"
        onClick={() => onSort(field)}
        className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors"
      >
        {children}
        <ArrowUpDown
          className={cn('h-3.5 w-3.5 transition-opacity', isActive ? 'opacity-100' : 'opacity-40')}
          style={isActive && dir === 'desc' ? { transform: 'scaleY(-1)' } : undefined}
        />
      </button>
    </TableHead>
  );
}
