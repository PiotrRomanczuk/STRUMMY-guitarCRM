'use client';

import { useState, useCallback, useEffect, useTransition } from 'react';
import { Loader2, Music2 } from 'lucide-react';
import { FullScreenSearchPicker } from '@/components/v2/primitives/FullScreenSearchPicker';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import {
  setSongOfTheWeek,
  searchSongsForSotw,
} from '@/app/actions/song-of-the-week';

interface SongResult {
  id: string;
  title: string;
  author: string;
  level: string | null;
}

interface SOTWPickerProps {
  onClose: () => void;
}

/**
 * Full-screen SOTW picker for mobile.
 * Mounts only when open — unmounting resets all state.
 * Step 1: Search + select song via FullScreenSearchPicker.
 * Step 2: Add teacher message + confirm.
 */
export function SOTWPicker({ onClose }: SOTWPickerProps) {
  const [songs, setSongs] = useState<SongResult[]>([]);
  const [isLoadingSongs, setIsLoadingSongs] = useState(true);
  const [selectedSong, setSelectedSong] = useState<SongResult | null>(null);
  const [teacherMessage, setTeacherMessage] = useState('');
  const [isPending, startTransition] = useTransition();

  // Load songs on mount (isLoadingSongs starts as true)
  useEffect(() => {
    let cancelled = false;
    searchSongsForSotw('').then((result) => {
      if (cancelled) return;
      if (!('error' in result)) {
        setSongs(result.songs);
      }
      setIsLoadingSongs(false);
    });
    return () => { cancelled = true; };
  }, []);

  const handleSelect = useCallback((song: SongResult) => {
    setSelectedSong(song);
  }, []);

  const handleSubmit = () => {
    if (!selectedSong) return;

    startTransition(async () => {
      const result = await setSongOfTheWeek({
        song_id: selectedSong.id,
        teacher_message: teacherMessage || undefined,
      });

      if ('error' in result) {
        toast.error(result.error);
      } else {
        toast.success('Song of the week updated!');
        onClose();
      }
    });
  };

  const filterFn = useCallback(
    (song: SongResult, query: string) => {
      const q = query.toLowerCase();
      return (
        song.title.toLowerCase().includes(q) ||
        song.author.toLowerCase().includes(q)
      );
    },
    []
  );

  const renderItem = useCallback(
    (song: SongResult) => (
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
          <Music2 className="h-5 w-5 text-primary" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium truncate">{song.title}</p>
          <p className="text-xs text-muted-foreground truncate">
            {song.author}
            {song.level && ` \u00B7 ${song.level}`}
          </p>
        </div>
      </div>
    ),
    []
  );

  // Step 1: Search + select song
  if (!selectedSong) {
    return (
      <FullScreenSearchPicker
        open
        onOpenChange={(nextOpen) => {
          if (!nextOpen) onClose();
        }}
        placeholder="Search songs..."
        items={songs}
        filterFn={filterFn}
        renderItem={renderItem}
        onSelect={handleSelect}
        keyExtractor={(song) => song.id}
        emptyMessage={isLoadingSongs ? 'Loading songs...' : 'No songs found'}
        title="Select Song of the Week"
      />
    );
  }

  // Step 2: Confirm with message
  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setSelectedSong(null)}
          className="min-h-[44px]"
        >
          Back
        </Button>
        <h2 className="text-sm font-semibold flex-1">Confirm Selection</h2>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="min-h-[44px] text-muted-foreground"
        >
          Cancel
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
        {/* Selected song preview */}
        <div className="bg-card rounded-xl border border-border p-4 flex items-center gap-3">
          <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <Music2 className="h-6 w-6 text-primary" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium truncate">{selectedSong.title}</p>
            <p className="text-xs text-muted-foreground truncate">
              {selectedSong.author}
            </p>
          </div>
        </div>

        {/* Teacher message */}
        <div className="space-y-2">
          <Label htmlFor="sotw-message-v2">
            Message to students (optional)
          </Label>
          <Textarea
            id="sotw-message-v2"
            placeholder="Why should students learn this song?"
            value={teacherMessage}
            onChange={(e) => setTeacherMessage(e.target.value)}
            rows={3}
            maxLength={500}
            className="min-h-[100px]"
          />
          <p className="text-xs text-muted-foreground text-right">
            {teacherMessage.length}/500
          </p>
        </div>
      </div>

      {/* Submit button — sticky bottom */}
      <div className="px-4 py-4 border-t border-border pb-[env(safe-area-inset-bottom)]">
        <Button
          onClick={handleSubmit}
          disabled={isPending}
          className="w-full min-h-[44px]"
        >
          {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Set as Song of the Week
        </Button>
      </div>
    </div>
  );
}
