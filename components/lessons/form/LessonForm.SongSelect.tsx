'use client';

import { useState, useMemo } from 'react';
import { useSongs } from '../hooks/useSongs';
import { useStudentSongProgress } from '../hooks/useStudentSongProgress';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Loader2, Music, X, Search, ArrowUpDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  SongProgressBadge,
  getSongProgressHintClass,
  getProgressSortOrder,
} from './SongProgressBadge';

interface SongSelectProps {
  selectedSongIds: string[];
  onChange: (songIds: string[]) => void;
  error?: string;
  studentId?: string;
}

export function SongSelect({ selectedSongIds, onChange, error, studentId }: SongSelectProps) {
  const { songs, loading, error: songsError } = useSongs();
  const { progressMap, isLoading: isProgressLoading } = useStudentSongProgress(studentId);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSortedByProgress, setIsSortedByProgress] = useState(false);

  const hasProgress = studentId && Object.keys(progressMap).length > 0;

  const handleToggle = (songId: string) => {
    const newSelection = selectedSongIds.includes(songId)
      ? selectedSongIds.filter((id) => id !== songId)
      : [...selectedSongIds, songId];
    onChange(newSelection);
  };

  const handleRemove = (songId: string) => {
    onChange(selectedSongIds.filter((id) => id !== songId));
  };

  const selectedSongs = songs.filter((song) => selectedSongIds.includes(song.id));

  const filteredAndSortedSongs = useMemo(() => {
    let result = songs.filter((song) => {
      if (!searchQuery) return true;
      const query = searchQuery.toLowerCase();
      return (
        song.title.toLowerCase().includes(query) ||
        (song.author && song.author.toLowerCase().includes(query))
      );
    });

    if (isSortedByProgress && hasProgress) {
      result = [...result].sort((a, b) => {
        const orderA = getProgressSortOrder(progressMap[a.id]?.current_status);
        const orderB = getProgressSortOrder(progressMap[b.id]?.current_status);
        return orderA - orderB;
      });
    }

    return result;
  }, [songs, searchQuery, isSortedByProgress, hasProgress, progressMap]);

  if (loading) {
    return (
      <div className="space-y-2">
        <Label>Songs</Label>
        <div className="flex items-center gap-2 text-sm text-muted-foreground p-4 border border-border rounded-lg">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Loading songs...</span>
        </div>
      </div>
    );
  }

  if (songsError) {
    return (
      <div className="space-y-2">
        <Label>Songs</Label>
        <div className="text-sm text-destructive p-4 border border-destructive/20 bg-destructive/10 rounded-lg">
          Error loading songs: {songsError}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Label>Songs (Optional)</Label>
          {isProgressLoading && (
            <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
          )}
        </div>
        <div className="flex items-center gap-2">
          {hasProgress && (
            <Button
              type="button"
              variant={isSortedByProgress ? 'secondary' : 'ghost'}
              size="sm"
              className="h-7 text-xs gap-1"
              onClick={() => setIsSortedByProgress((prev) => !prev)}
            >
              <ArrowUpDown className="h-3 w-3" />
              <span className="hidden sm:inline">By progress</span>
            </Button>
          )}
          {selectedSongIds.length > 0 && (
            <span className="text-xs text-muted-foreground">{selectedSongIds.length} selected</span>
          )}
        </div>
      </div>

      {/* Selected Songs Display */}
      {selectedSongs.length > 0 && (
        <div className="flex flex-wrap gap-2 p-3 bg-muted/50 rounded-lg border border-border">
          {selectedSongs.map((song) => (
            <Badge key={song.id} variant="secondary" className="gap-1.5 pr-1 text-xs sm:text-sm">
              <Music className="h-3 w-3" />
              <span className="max-w-[150px] truncate">{song.title}</span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-4 w-4 p-0 hover:bg-transparent"
                onClick={() => handleRemove(song.id)}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          ))}
        </div>
      )}

      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Search songs by title or author..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Song Selection List */}
      <div className="border border-border rounded-lg">
        <ScrollArea className="h-[240px] sm:h-[280px]">
          <div className="p-2 space-y-1">
            {filteredAndSortedSongs.length === 0 ? (
              <div className="text-center py-8 text-sm text-muted-foreground">
                {searchQuery
                  ? 'No songs match your search.'
                  : 'No songs available. Create songs first.'}
              </div>
            ) : (
              filteredAndSortedSongs.map((song) => {
                const progress = progressMap[song.id];
                return (
                  <label
                    key={song.id}
                    className={cn(
                      'flex items-center gap-3 p-2.5 sm:p-3 rounded-md hover:bg-muted/50 cursor-pointer transition-colors group',
                      getSongProgressHintClass(progress)
                    )}
                  >
                    <Checkbox
                      checked={selectedSongIds.includes(song.id)}
                      onCheckedChange={() => handleToggle(song.id)}
                      className="shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate group-hover:text-primary transition-colors">
                        {song.title}
                      </div>
                      {song.author && (
                        <div className="text-xs text-muted-foreground truncate">{song.author}</div>
                      )}
                    </div>
                    {progress && <SongProgressBadge progress={progress} />}
                  </label>
                );
              })
            )}
          </div>
        </ScrollArea>
      </div>

      {error && (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}
      <p className="text-xs text-muted-foreground">
        {hasProgress
          ? 'Student progress shown next to each song'
          : 'Select songs that will be covered in this lesson'}
      </p>
    </div>
  );
}
