'use client';

import { FullScreenSearchPicker } from '@/components/v2/primitives';

interface StudentPickerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  students: { id: string; full_name: string | null; email: string }[];
  onSelect: (student: { id: string; full_name: string | null; email: string }) => void;
}

export function StudentPicker({ open, onOpenChange, students, onSelect }: StudentPickerProps) {
  return (
    <FullScreenSearchPicker
      open={open}
      onOpenChange={onOpenChange}
      placeholder="Search students..."
      items={students}
      filterFn={(s, q) => {
        const lower = q.toLowerCase();
        return (
          (s.full_name?.toLowerCase().includes(lower) ?? false) ||
          s.email.toLowerCase().includes(lower)
        );
      }}
      renderItem={(s) => (
        <div>
          <p className="text-sm font-medium">{s.full_name || s.email}</p>
          {s.full_name && (
            <p className="text-xs text-muted-foreground">{s.email}</p>
          )}
        </div>
      )}
      onSelect={onSelect}
      keyExtractor={(s) => s.id}
      emptyMessage="No students found"
      title="Select Student"
    />
  );
}

interface SongPickerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  songs: { id: string; title: string; author: string }[];
  selectedSongIds: string[];
  onSelect: (song: { id: string; title: string; author: string }) => void;
}

export function SongPicker({
  open,
  onOpenChange,
  songs,
  selectedSongIds,
  onSelect,
}: SongPickerProps) {
  return (
    <FullScreenSearchPicker
      open={open}
      onOpenChange={onOpenChange}
      placeholder="Search songs..."
      items={songs}
      filterFn={(s, q) => {
        const lower = q.toLowerCase();
        return (
          s.title.toLowerCase().includes(lower) ||
          s.author.toLowerCase().includes(lower)
        );
      }}
      renderItem={(s) => (
        <div className="flex items-center justify-between w-full">
          <div>
            <p className="text-sm font-medium">{s.title}</p>
            <p className="text-xs text-muted-foreground">{s.author}</p>
          </div>
          {selectedSongIds.includes(s.id) && (
            <span className="text-primary text-xs font-medium">Selected</span>
          )}
        </div>
      )}
      onSelect={onSelect}
      keyExtractor={(s) => s.id}
      emptyMessage="No songs found"
      title="Select Songs"
    />
  );
}
