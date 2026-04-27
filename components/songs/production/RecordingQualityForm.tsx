'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { SongVideo, MicType, ProductionStatus } from '@/types/SongVideo';
import { useUpdateRecording } from './hooks/useUpdateRecording';

const PRODUCTION_STATUSES: { value: ProductionStatus; label: string }[] = [
  { value: 'idea', label: 'Idea' },
  { value: 'recording', label: 'Recording' },
  { value: 'edited', label: 'Edited' },
  { value: 'ready', label: 'Ready to post' },
];

interface Props {
  songId: string;
  recording: SongVideo;
  onSaved?: () => void;
}

export default function RecordingQualityForm({ songId, recording, onSaved }: Props) {
  const [status, setStatus] = useState<ProductionStatus>(recording.production_status);
  const [recordingOk, setRecordingOk] = useState(recording.is_recording_correct);
  const [wellLit, setWellLit] = useState(recording.is_well_lit);
  const [audioMixed, setAudioMixed] = useState(recording.is_audio_mixed);
  const [edited, setEdited] = useState(recording.is_video_edited);
  const [micType, setMicType] = useState<MicType | ''>(recording.mic_type ?? '');
  const update = useUpdateRecording(songId);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    update.mutate(
      {
        videoId: recording.id,
        input: {
          production_status: status,
          is_recording_correct: recordingOk,
          is_well_lit: wellLit,
          is_audio_mixed: audioMixed,
          is_video_edited: edited,
          mic_type: micType === '' ? null : (micType as MicType),
        },
      },
      { onSuccess: () => onSaved?.() }
    );
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label>Production status</Label>
        <Select value={status} onValueChange={(v) => setStatus(v as ProductionStatus)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PRODUCTION_STATUSES.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Toggle label="Take is keepable" checked={recordingOk} onCheckedChange={setRecordingOk} />
        <Toggle label="Well lit" checked={wellLit} onCheckedChange={setWellLit} />
        <Toggle label="Audio mixed" checked={audioMixed} onCheckedChange={setAudioMixed} />
        <Toggle label="Video edited" checked={edited} onCheckedChange={setEdited} />
      </div>

      <div className="space-y-2">
        <Label>Microphone</Label>
        <Select value={micType} onValueChange={(v) => setMicType(v as MicType | '')}>
          <SelectTrigger>
            <SelectValue placeholder="Not set" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="iphone">iPhone</SelectItem>
            <SelectItem value="external">External</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Button type="submit" disabled={update.isPending} className="w-full sm:w-auto">
        {update.isPending ? 'Saving…' : 'Save'}
      </Button>
    </form>
  );
}

function Toggle({
  label,
  checked,
  onCheckedChange,
}: {
  label: string;
  checked: boolean;
  onCheckedChange: (v: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-2 rounded-md border border-border/60 px-3 py-2 cursor-pointer hover:bg-muted/40 dark:hover:bg-muted/20">
      <Checkbox checked={checked} onCheckedChange={(v) => onCheckedChange(!!v)} />
      <span className="text-sm">{label}</span>
    </label>
  );
}
