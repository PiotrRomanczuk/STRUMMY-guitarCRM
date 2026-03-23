'use client';

import { useEffect, useState } from 'react';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { getStudentRepertoireSongs } from '@/app/actions/practice';
import { Loader2 } from 'lucide-react';

export const NO_SONG_VALUE = '__none__';

interface RepertoireSongOption {
  songId: string;
  title: string;
  author: string | null;
}

interface SongPickerProps {
  value: string;
  onChange: (songId: string) => void;
}

/**
 * Dropdown to select a song from the student's repertoire.
 * Fetches songs on mount via server action.
 */
export function SongPicker({ value, onChange }: SongPickerProps) {
  const [songs, setSongs] = useState<RepertoireSongOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadSongs() {
      const result = await getStudentRepertoireSongs();
      if ('songs' in result) {
        setSongs(result.songs);
      }
      setIsLoading(false);
    }
    loadSongs();
  }, []);

  return (
    <div className="space-y-2">
      <Label htmlFor="practice-song">Song (optional)</Label>
      {isLoading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground h-9">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading songs...
        </div>
      ) : (
        <Select value={value} onValueChange={onChange}>
          <SelectTrigger id="practice-song" className="w-full">
            <SelectValue placeholder="General practice" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={NO_SONG_VALUE}>General practice</SelectItem>
            {songs.map((song) => (
              <SelectItem key={song.songId} value={song.songId}>
                {song.title}{song.author ? ` - ${song.author}` : ''}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </div>
  );
}
