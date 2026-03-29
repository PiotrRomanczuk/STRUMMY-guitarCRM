'use client';

import { useState, useEffect, useMemo, useTransition } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import Image from 'next/image';
import { Search, Music, Loader2, Check, Guitar, Tag } from 'lucide-react';
import { toast } from 'sonner';
import { searchSongsForRepertoireAction, addSongToRepertoireAction } from '@/app/actions/repertoire';

interface AddSongToRepertoireDialogProps {
  studentId: string;
  children: React.ReactNode;
}

type SearchResult = { id: string; title: string; author: string; level: string | null; key: string | null; cover_image_url: string | null };

const LEVEL_COLORS: Record<string, string> = {
  beginner: 'bg-green-500/10 text-green-600 dark:text-green-400',
  intermediate: 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400',
  advanced: 'bg-red-500/10 text-red-600 dark:text-red-400',
};

export function AddSongToRepertoireDialog({ studentId, children }: AddSongToRepertoireDialogProps) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<'search' | 'configure'>('search');
  const [query, setQuery] = useState('');
  const [allSongs, setAllSongs] = useState<SearchResult[]>([]);
  const [selectedSong, setSelectedSong] = useState<SearchResult | null>(null);
  const [priority, setPriority] = useState('normal');
  const [teacherNotes, setTeacherNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, startSaveTransition] = useTransition();

  // Load all available songs when dialog opens
  useEffect(() => {
    if (!open) return;
    setIsLoading(true);
    searchSongsForRepertoireAction('', studentId).then((result) => {
      if ('data' in result) {
        setAllSongs(result.data);
      }
      setIsLoading(false);
    });
  }, [open, studentId]);

  // Filter locally as user types
  const filtered = useMemo(() => {
    if (!query.trim()) return allSongs;
    const q = query.toLowerCase();
    return allSongs.filter(
      (s) =>
        s.title.toLowerCase().includes(q) ||
        s.author.toLowerCase().includes(q) ||
        (s.key?.toLowerCase().includes(q) ?? false)
    );
  }, [allSongs, query]);

  const handleSelectSong = (song: SearchResult) => {
    setSelectedSong(song);
    setStep('configure');
  };

  const handleAdd = () => {
    if (!selectedSong) return;
    startSaveTransition(async () => {
      const result = await addSongToRepertoireAction({
        student_id: studentId,
        song_id: selectedSong.id,
        priority: priority as 'high' | 'normal' | 'low',
        teacher_notes: teacherNotes || undefined,
      });
      if ('error' in result) {
        toast.error(result.error);
        return;
      }
      toast.success(`"${selectedSong.title}" added to repertoire`);
      resetAndClose();
    });
  };

  const resetAndClose = () => {
    setOpen(false);
    setStep('search');
    setQuery('');
    setAllSongs([]);
    setSelectedSong(null);
    setPriority('normal');
    setTeacherNotes('');
  };

  return (
    <Dialog open={open} onOpenChange={(o) => (o ? setOpen(true) : resetAndClose())}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[540px] max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>
            {step === 'search' ? 'Add Song to Repertoire' : `Configure: ${selectedSong?.title}`}
          </DialogTitle>
        </DialogHeader>

        {step === 'search' ? (
          <div className="space-y-3 flex-1 min-h-0 flex flex-col">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Filter by title, artist, or key..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="pl-9"
                autoFocus
              />
            </div>

            <div className="flex-1 overflow-y-auto min-h-0 max-h-[400px] -mx-1 px-1">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-12 gap-2">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  <p className="text-sm text-muted-foreground">Loading songs...</p>
                </div>
              ) : filtered.length === 0 ? (
                <div className="text-center py-12">
                  <Music className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">
                    {query ? 'No matching songs found' : 'All songs are already in repertoire'}
                  </p>
                </div>
              ) : (
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground px-1 pb-1">
                    {filtered.length} song{filtered.length !== 1 ? 's' : ''} available
                  </p>
                  {filtered.map((song) => (
                    <button
                      key={song.id}
                      onClick={() => handleSelectSong(song)}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-muted/50 active:bg-muted transition-colors text-left group"
                    >
                      <div className="w-9 h-9 rounded-lg bg-purple-500/10 flex items-center justify-center shrink-0 overflow-hidden relative">
                        {song.cover_image_url ? (
                          <Image src={song.cover_image_url} alt="" fill className="object-cover" sizes="36px" />
                        ) : (
                          <Music className="h-4 w-4 text-purple-500" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">
                          {song.title}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">{song.author}</p>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {song.key && (
                          <span className="inline-flex items-center gap-0.5 text-[10px] font-mono font-bold text-muted-foreground bg-muted rounded px-1.5 py-0.5">
                            <Guitar className="h-2.5 w-2.5" />
                            {song.key}
                          </span>
                        )}
                        {song.level && (
                          <span className={`inline-flex items-center gap-0.5 text-[10px] font-bold uppercase rounded px-1.5 py-0.5 ${LEVEL_COLORS[song.level.toLowerCase()] ?? 'bg-muted text-muted-foreground'}`}>
                            <Tag className="h-2.5 w-2.5" />
                            {song.level}
                          </span>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
              <div className="w-9 h-9 rounded-lg bg-purple-500/10 flex items-center justify-center shrink-0 overflow-hidden relative">
                {selectedSong?.cover_image_url ? (
                  <Image src={selectedSong.cover_image_url} alt="" fill className="object-cover" sizes="36px" />
                ) : (
                  <Music className="h-4 w-4 text-purple-500" />
                )}
              </div>
              <div className="min-w-0">
                <p className="font-medium text-sm truncate">{selectedSong?.title}</p>
                <p className="text-xs text-muted-foreground truncate">{selectedSong?.author}</p>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <Label className="text-sm">Priority</Label>
                <Select value={priority} onValueChange={setPriority}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-sm">Teacher Notes (optional)</Label>
                <Textarea
                  value={teacherNotes}
                  onChange={(e) => setTeacherNotes(e.target.value)}
                  placeholder="e.g., Focus on strumming pattern..."
                  rows={3}
                  className="mt-1"
                />
              </div>
            </div>

            <div className="flex justify-between pt-2">
              <Button variant="outline" onClick={() => setStep('search')}>
                Back
              </Button>
              <Button onClick={handleAdd} disabled={isSaving} className="gap-1">
                {isSaving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Check className="h-4 w-4" />
                )}
                Add to Repertoire
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
