'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { ContentPost } from '@/types/ContentPost';
import { useUpdatePostMetrics } from './hooks/useContentPosts';

interface Props {
  songId: string;
  post: ContentPost;
  onSaved?: () => void;
}

export default function PostMetricsForm({ songId, post, onSaved }: Props) {
  const [views, setViews] = useState(post.views_count);
  const [likes, setLikes] = useState(post.likes_count);
  const [comments, setComments] = useState(post.comments_count);
  const [shares, setShares] = useState(post.shares_count);
  const [saves, setSaves] = useState(post.saves_count);
  const update = useUpdatePostMetrics(songId);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    update.mutate(
      {
        id: post.id,
        input: {
          views_count: views,
          likes_count: likes,
          comments_count: comments,
          shares_count: shares,
          saves_count: saves,
        },
      },
      { onSuccess: () => onSaved?.() }
    );
  };

  const fields: { l: string; v: number; set: (n: number) => void }[] = [
    { l: 'Views', v: views, set: setViews },
    { l: 'Likes', v: likes, set: setLikes },
    { l: 'Comments', v: comments, set: setComments },
    { l: 'Shares', v: shares, set: setShares },
    { l: 'Saves', v: saves, set: setSaves },
  ];

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {fields.map((f) => (
          <div key={f.l} className="space-y-1">
            <Label>{f.l}</Label>
            <Input
              type="number"
              min={0}
              value={f.v}
              onChange={(e) => f.set(Number(e.target.value || 0))}
            />
          </div>
        ))}
      </div>
      <div className="flex justify-end">
        <Button type="submit" disabled={update.isPending}>
          {update.isPending ? 'Saving…' : 'Save metrics'}
        </Button>
      </div>
    </form>
  );
}
