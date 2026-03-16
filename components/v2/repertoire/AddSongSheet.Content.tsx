'use client';

import { useState, useTransition } from 'react';
import { Search, Music, Loader2, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  searchSongsForRepertoireAction,
  addSongToRepertoireAction,
} from '@/app/actions/repertoire';
import { toast } from 'sonner';

type SearchResult = {
  id: string;
  title: string;
  author: string;
  level: string | null;
  key: string | null;
};

interface AddSongContentProps {
  studentId: string;
  onClose: () => void;
}

export function AddSongContent({ studentId, onClose }: AddSongContentProps) {
  const [step, setStep] = useState<'search' | 'configure'>('search');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [selectedSong, setSelectedSong] = useState<SearchResult | null>(null);
  const [priority, setPriority] = useState('normal');
  const [teacherNotes, setTeacherNotes] = useState('');
  const [isSearching, startSearchTransition] = useTransition();
  const [isSaving, startSaveTransition] = useTransition();

  const handleSearch = () => {
    startSearchTransition(async () => {
      const result = await searchSongsForRepertoireAction(query, studentId);
      if ('error' in result) { toast.error(result.error); return; }
      setResults(result.data);
    });
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
      if ('error' in result) { toast.error(result.error); return; }
      toast.success(`"${selectedSong.title}" added to repertoire`);
      onClose();
    });
  };

  if (step === 'search') {
    return (
      <div className="space-y-4 pb-4">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by title or artist..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="pl-9 min-h-[44px] text-base"
            />
          </div>
          <Button onClick={handleSearch} disabled={isSearching} className="min-h-[44px]">
            {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Search'}
          </Button>
        </div>
        <div className="max-h-[40vh] overflow-y-auto space-y-1">
          {results.length === 0 && !isSearching && query && (
            <p className="text-sm text-muted-foreground text-center py-6">
              No songs found. Try a different search.
            </p>
          )}
          {results.map((song) => (
            <button
              key={song.id}
              onClick={() => { setSelectedSong(song); setStep('configure'); }}
              className={cn(
                'w-full flex items-center gap-3 p-3 rounded-lg',
                'hover:bg-muted/50 active:bg-muted/50 transition-colors text-left min-h-[44px]'
              )}
            >
              <div className="w-10 h-10 rounded-md bg-purple-500/10 flex items-center justify-center shrink-0">
                <Music className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{song.title}</p>
                <p className="text-xs text-muted-foreground">{song.author}</p>
              </div>
              {song.level && (
                <span className="text-[11px] uppercase font-medium text-muted-foreground">{song.level}</span>
              )}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-4">
      <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
        <Music className="h-5 w-5 text-purple-600 dark:text-purple-400" />
        <div>
          <p className="font-medium text-sm">{selectedSong?.title}</p>
          <p className="text-xs text-muted-foreground">{selectedSong?.author}</p>
        </div>
      </div>
      <div className="space-y-4">
        <div>
          <Label className="text-sm">Priority</Label>
          <Select value={priority} onValueChange={setPriority}>
            <SelectTrigger className="mt-1 min-h-[44px] text-base"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="high" className="min-h-[44px]">High</SelectItem>
              <SelectItem value="normal" className="min-h-[44px]">Normal</SelectItem>
              <SelectItem value="low" className="min-h-[44px]">Low</SelectItem>
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
            className="mt-1 text-base"
          />
        </div>
      </div>
      <div className="flex justify-between pt-2">
        <Button variant="outline" className="min-h-[44px]" onClick={() => setStep('search')}>Back</Button>
        <Button onClick={handleAdd} disabled={isSaving} className="gap-1 min-h-[44px]">
          {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
          Add to Repertoire
        </Button>
      </div>
    </div>
  );
}
