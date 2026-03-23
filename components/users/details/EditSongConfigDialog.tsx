'use client';

import { useState, useTransition } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
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
import { Loader2, Save, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { updateRepertoireEntryAction, removeFromRepertoireAction } from '@/app/actions/repertoire';
import type { StudentRepertoireWithSong, SongProgressStatus, RepertoirePriority } from '@/types/StudentRepertoire';

const MUSIC_KEYS = [
  'C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B',
  'Cm', 'C#m', 'Dm', 'D#m', 'Em', 'Fm', 'F#m', 'Gm', 'G#m', 'Am', 'A#m', 'Bm',
];

const STATUS_OPTIONS: { value: SongProgressStatus; label: string }[] = [
  { value: 'to_learn', label: 'To Learn' },
  { value: 'started', label: 'Started' },
  { value: 'remembered', label: 'Remembered' },
  { value: 'with_author', label: 'Play Along' },
  { value: 'mastered', label: 'Mastered' },
];

interface EditSongConfigDialogProps {
  item: StudentRepertoireWithSong;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditSongConfigDialog({ item, open, onOpenChange }: EditSongConfigDialogProps) {
  const [preferredKey, setPreferredKey] = useState(item.preferred_key || '');
  const [capoFret, setCapoFret] = useState(item.capo_fret?.toString() || '');
  const [customStrumming, setCustomStrumming] = useState(item.custom_strumming || '');
  const [status, setStatus] = useState<SongProgressStatus>(item.current_status);
  const [priority, setPriority] = useState<RepertoirePriority>(item.priority);
  const [teacherNotes, setTeacherNotes] = useState(item.teacher_notes || '');
  const [studentNotes, setStudentNotes] = useState(item.student_notes || '');
  const [difficultyRating, setDifficultyRating] = useState(item.difficulty_rating?.toString() || '');
  const [isSaving, startSaveTransition] = useTransition();
  const [isRemoving, startRemoveTransition] = useTransition();

  const handleSave = () => {
    startSaveTransition(async () => {
      const result = await updateRepertoireEntryAction(item.id, {
        preferred_key: preferredKey || null,
        capo_fret: capoFret ? parseInt(capoFret) : null,
        custom_strumming: customStrumming || null,
        current_status: status,
        priority,
        teacher_notes: teacherNotes || null,
        student_notes: studentNotes || null,
        difficulty_rating: difficultyRating ? parseInt(difficultyRating) : null,
      });

      if ('error' in result) {
        toast.error(result.error);
        return;
      }

      toast.success('Song configuration updated');
      onOpenChange(false);
    });
  };

  const handleRemove = () => {
    if (!confirm(`Remove "${item.song.title}" from repertoire?`)) return;

    startRemoveTransition(async () => {
      const result = await removeFromRepertoireAction(item.id);
      if ('error' in result) {
        toast.error(result.error);
        return;
      }
      toast.success(`"${item.song.title}" removed from repertoire`);
      onOpenChange(false);
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            Edit: {item.song.title}
            <span className="text-sm font-normal text-muted-foreground ml-2">by {item.song.author}</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Status & Priority Row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-sm">Status</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as SongProgressStatus)}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-sm">Priority</Label>
              <Select value={priority} onValueChange={(v) => setPriority(v as RepertoirePriority)}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Key & Capo Row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-sm">
                Preferred Key
                {item.song.key && (
                  <span className="text-muted-foreground ml-1">(song: {item.song.key})</span>
                )}
              </Label>
              <Select value={preferredKey} onValueChange={setPreferredKey}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Use default" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Use default</SelectItem>
                  {MUSIC_KEYS.map((k) => (
                    <SelectItem key={k} value={k}>
                      {k}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-sm">Capo Position</Label>
              <Input
                type="number"
                min={0}
                max={20}
                value={capoFret}
                onChange={(e) => setCapoFret(e.target.value)}
                placeholder="None"
                className="mt-1"
              />
            </div>
          </div>

          {/* Strumming */}
          <div>
            <Label className="text-sm">Strumming Pattern</Label>
            <Input
              value={customStrumming}
              onChange={(e) => setCustomStrumming(e.target.value)}
              placeholder="e.g., D-DU-UDU"
              className="mt-1"
            />
          </div>

          {/* Difficulty */}
          <div>
            <Label className="text-sm">Difficulty Rating (1-5)</Label>
            <Select value={difficultyRating} onValueChange={setDifficultyRating}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Not rated" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Not rated</SelectItem>
                <SelectItem value="1">1 - Easy</SelectItem>
                <SelectItem value="2">2 - Fairly Easy</SelectItem>
                <SelectItem value="3">3 - Medium</SelectItem>
                <SelectItem value="4">4 - Challenging</SelectItem>
                <SelectItem value="5">5 - Very Hard</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Notes */}
          <div>
            <Label className="text-sm">Teacher Notes</Label>
            <Textarea
              value={teacherNotes}
              onChange={(e) => setTeacherNotes(e.target.value)}
              placeholder="Notes for the teacher..."
              rows={2}
              className="mt-1"
            />
          </div>

          <div>
            <Label className="text-sm">Student Notes</Label>
            <Textarea
              value={studentNotes}
              onChange={(e) => setStudentNotes(e.target.value)}
              placeholder="Student's own notes..."
              rows={2}
              className="mt-1"
            />
          </div>
        </div>

        <DialogFooter className="flex justify-between sm:justify-between gap-2 pt-2">
          <Button
            variant="destructive"
            size="sm"
            onClick={handleRemove}
            disabled={isRemoving}
            className="gap-1"
          >
            {isRemoving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
            Remove
          </Button>
          <Button onClick={handleSave} disabled={isSaving} className="gap-1">
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
