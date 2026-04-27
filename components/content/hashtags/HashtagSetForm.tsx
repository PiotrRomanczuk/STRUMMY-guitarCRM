'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import type { HashtagSet } from '@/types/HashtagSet';
import {
  useCreateHashtagSet,
  useUpdateHashtagSet,
} from '@/components/songs/production/hooks/useHashtagSets';

interface Props {
  set?: HashtagSet | null;
  onSaved?: () => void;
}

function parseHashtags(raw: string): string[] {
  return raw
    .split(/[\s,]+/)
    .map((t) => t.trim())
    .filter(Boolean);
}

export default function HashtagSetForm({ set, onSaved }: Props) {
  const [name, setName] = useState(set?.name ?? '');
  const [description, setDescription] = useState(set?.description ?? '');
  const [tagsText, setTagsText] = useState((set?.hashtags ?? []).join(' '));
  const [active, setActive] = useState(set?.is_active ?? true);
  const create = useCreateHashtagSet();
  const update = useUpdateHashtagSet();
  const pending = create.isPending || update.isPending;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const hashtags = parseHashtags(tagsText);
    if (set) {
      update.mutate(
        {
          id: set.id,
          input: { name, description: description || null, hashtags, is_active: active },
        },
        { onSuccess: () => onSaved?.() }
      );
    } else {
      create.mutate(
        { name, description, hashtags, is_active: active },
        { onSuccess: () => onSaved?.() }
      );
    }
  };

  return (
    <form onSubmit={submit} className="space-y-3">
      <div className="space-y-1">
        <Label>Name</Label>
        <Input value={name} onChange={(e) => setName(e.target.value)} required />
      </div>
      <div className="space-y-1">
        <Label>Description</Label>
        <Input value={description} onChange={(e) => setDescription(e.target.value)} />
      </div>
      <div className="space-y-1">
        <Label>Hashtags (space or comma separated)</Label>
        <Textarea
          value={tagsText}
          onChange={(e) => setTagsText(e.target.value)}
          rows={3}
          placeholder="#acoustic #guitar #fyp"
        />
      </div>
      <div className="flex items-center gap-2">
        <Switch checked={active} onCheckedChange={setActive} id="active" />
        <Label htmlFor="active">Active</Label>
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <Button type="submit" disabled={pending}>
          {pending ? 'Saving…' : set ? 'Save' : 'Create'}
        </Button>
      </div>
    </form>
  );
}
