'use client';

import { useState } from 'react';
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from '@/components/ui/responsive-dialog';
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
import type { ContentPlatform, ContentPost, ContentPostStatus } from '@/types/ContentPost';
import HashtagSetPicker from './HashtagSetPicker';
import { useCreateContentPost, useUpdateContentPost } from './hooks/useContentPosts';

interface Props {
  songId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  post?: ContentPost | null;
}

const PLATFORMS: { v: ContentPlatform; l: string }[] = [
  { v: 'tiktok', l: 'TikTok' },
  { v: 'instagram', l: 'Instagram' },
  { v: 'youtube_shorts', l: 'YouTube Shorts' },
];

const STATUSES: { v: ContentPostStatus; l: string }[] = [
  { v: 'planned', l: 'Planned' },
  { v: 'scheduled', l: 'Scheduled' },
  { v: 'published', l: 'Published' },
  { v: 'archived', l: 'Archived' },
];

export default function PostFormDialog({ songId, open, onOpenChange, post }: Props) {
  const [platform, setPlatform] = useState<ContentPlatform>(post?.platform ?? 'tiktok');
  const [status, setStatus] = useState<ContentPostStatus>(post?.status ?? 'planned');
  const [scheduledAt, setScheduledAt] = useState(post?.scheduled_at?.slice(0, 16) ?? '');
  const [hook, setHook] = useState(post?.hook ?? '');
  const [caption, setCaption] = useState(post?.caption ?? '');
  const [extra, setExtra] = useState((post?.extra_hashtags ?? []).join(' '));
  const [setIds, setSetIds] = useState<string[]>(post?.hashtag_set_ids ?? []);
  const [externalUrl, setExternalUrl] = useState(post?.external_url ?? '');

  const create = useCreateContentPost(songId);
  const update = useUpdateContentPost(songId);
  const isEdit = !!post;
  const pending = create.isPending || update.isPending;

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const extraTokens = extra
      .split(/\s+/)
      .map((t) => t.trim())
      .filter(Boolean);
    const payload = {
      platform,
      status,
      scheduled_at: scheduledAt ? new Date(scheduledAt).toISOString() : undefined,
      hook: hook || undefined,
      caption: caption || undefined,
      hashtag_set_ids: setIds,
      extra_hashtags: extraTokens,
      external_url: externalUrl || undefined,
    };
    if (isEdit && post) {
      update.mutate({ id: post.id, input: payload }, { onSuccess: () => onOpenChange(false) });
    } else {
      create.mutate({ song_id: songId, ...payload }, { onSuccess: () => onOpenChange(false) });
    }
  };

  return (
    <ResponsiveDialog open={open} onOpenChange={onOpenChange}>
      <ResponsiveDialogContent className="max-w-lg">
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle>{isEdit ? 'Edit post' : 'Schedule post'}</ResponsiveDialogTitle>
        </ResponsiveDialogHeader>
        <form onSubmit={onSubmit} className="space-y-4 px-1 pb-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <Label>Platform</Label>
              <Select value={platform} onValueChange={(v) => setPlatform(v as ContentPlatform)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PLATFORMS.map((p) => (
                    <SelectItem key={p.v} value={p.v}>
                      {p.l}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Status</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as ContentPostStatus)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUSES.map((s) => (
                    <SelectItem key={s.v} value={s.v}>
                      {s.l}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1">
            <Label>Scheduled at</Label>
            <Input
              type="datetime-local"
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
            />
          </div>

          <div className="space-y-1">
            <Label>Hook (first 3 sec)</Label>
            <Input value={hook} onChange={(e) => setHook(e.target.value)} maxLength={280} />
          </div>

          <div className="space-y-1">
            <Label>Caption</Label>
            <Textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              rows={3}
              maxLength={2200}
            />
          </div>

          <div className="space-y-1">
            <Label>Hashtag sets</Label>
            <HashtagSetPicker selectedIds={setIds} onChange={setSetIds} />
          </div>

          <div className="space-y-1">
            <Label>Extra hashtags (space-separated)</Label>
            <Input
              value={extra}
              onChange={(e) => setExtra(e.target.value)}
              placeholder="#fyp #acoustic"
            />
          </div>

          <div className="space-y-1">
            <Label>External URL</Label>
            <Input
              value={externalUrl}
              onChange={(e) => setExternalUrl(e.target.value)}
              placeholder="https://www.tiktok.com/@…"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? 'Saving…' : isEdit ? 'Save' : 'Schedule'}
            </Button>
          </div>
        </form>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}
