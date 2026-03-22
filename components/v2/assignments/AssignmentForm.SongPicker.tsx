'use client';

import { useState, useEffect } from 'react';
import { Check, ChevronsUpDown, Loader2, Music, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Label } from '@/components/ui/label';
import { logger } from '@/lib/logger';

interface Song {
  id: string;
  title: string;
  author: string;
}

interface SongPickerProps {
  value: string;
  onChange: (songId: string) => void;
}

export function SongPicker({ value, onChange }: SongPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [songs, setSongs] = useState<Song[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchValue, setSearchValue] = useState('');

  useEffect(() => {
    let mounted = true;

    const fetchSongs = async () => {
      setIsLoading(true);
      try {
        const response = await fetch('/api/song/admin-songs');
        if (!response.ok) throw new Error('Failed to fetch songs');
        const items: Song[] = await response.json();
        if (mounted) setSongs(items);
      } catch (err) {
        logger.error('Failed to fetch songs for picker:', err);
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    void fetchSongs();
    return () => { mounted = false; };
  }, []);

  const selectedSong = songs.find((s) => s.id === value);

  const filtered = songs.filter((s) => {
    const query = searchValue.toLowerCase();
    return s.title.toLowerCase().includes(query) || s.author.toLowerCase().includes(query);
  });

  const handleSelect = (songId: string) => {
    onChange(songId === value ? '' : songId);
    setIsOpen(false);
    setSearchValue('');
  };

  return (
    <div className="space-y-2">
      <Label>Song (optional)</Label>
      <div className="flex items-center gap-2">
        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={isOpen}
              className={cn(
                'w-full justify-between font-normal min-h-[44px]',
                !value && 'text-muted-foreground'
              )}
            >
              <span className="flex items-center gap-2 truncate">
                <Music className="h-4 w-4 shrink-0" />
                {selectedSong ? `${selectedSong.title} - ${selectedSong.author}` : 'Link a song...'}
              </span>
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-full p-0" align="start">
            <Command shouldFilter={false}>
              <CommandInput
                placeholder="Search songs..."
                value={searchValue}
                onValueChange={setSearchValue}
              />
              {isLoading ? (
                <div className="flex items-center justify-center py-6">
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <>
                  <CommandEmpty>No songs found.</CommandEmpty>
                  <CommandGroup className="max-h-60 overflow-y-auto">
                    {filtered.map((song) => (
                      <CommandItem key={song.id} value={song.id} onSelect={handleSelect}>
                        <Check className={cn('mr-2 h-4 w-4', value === song.id ? 'opacity-100' : 'opacity-0')} />
                        <span className="flex-1 truncate">{song.title}</span>
                        <span className="ml-2 text-xs text-muted-foreground truncate">{song.author}</span>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </>
              )}
            </Command>
          </PopoverContent>
        </Popover>
        {value && (
          <Button type="button" variant="ghost" size="icon" className="shrink-0" onClick={() => onChange('')}>
            <X className="h-4 w-4" />
            <span className="sr-only">Clear song</span>
          </Button>
        )}
      </div>
    </div>
  );
}
