'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { ContentPost } from '@/types/ContentPost';
import type {
  CreateContentPostInput,
  UpdateContentPostInput,
  CreateContentPostMetricInput,
} from '@/schemas/ContentPostSchema';

export const contentPostsKey = (songId?: string) =>
  songId ? (['content-posts', { songId }] as const) : (['content-posts'] as const);

async function fetchPosts(songId?: string): Promise<ContentPost[]> {
  const url = songId ? `/api/content/posts?song_id=${songId}` : '/api/content/posts';
  const res = await fetch(url);
  if (!res.ok) throw new Error((await res.json()).error ?? 'Failed to load posts');
  const json = await res.json();
  return json.posts as ContentPost[];
}

export function useContentPosts(songId?: string) {
  return useQuery({
    queryKey: contentPostsKey(songId),
    queryFn: () => fetchPosts(songId),
  });
}

export function useCreateContentPost(songId?: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateContentPostInput) => {
      const res = await fetch('/api/content/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? 'Failed to create post');
      return (await res.json()).post as ContentPost;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['content-posts'] });
      qc.invalidateQueries({ queryKey: ['content-calendar'] });
      if (songId) qc.invalidateQueries({ queryKey: contentPostsKey(songId) });
      toast.success('Post scheduled');
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useUpdateContentPost(songId?: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, input }: { id: string; input: UpdateContentPostInput }) => {
      const res = await fetch(`/api/content/posts/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? 'Failed to update post');
      return (await res.json()).post as ContentPost;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['content-posts'] });
      qc.invalidateQueries({ queryKey: ['content-calendar'] });
      if (songId) qc.invalidateQueries({ queryKey: contentPostsKey(songId) });
      toast.success('Post updated');
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useDeleteContentPost(songId?: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/content/posts/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error((await res.json()).error ?? 'Failed to delete post');
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['content-posts'] });
      qc.invalidateQueries({ queryKey: ['content-calendar'] });
      if (songId) qc.invalidateQueries({ queryKey: contentPostsKey(songId) });
      toast.success('Post deleted');
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useUpdatePostMetrics(songId?: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, input }: { id: string; input: CreateContentPostMetricInput }) => {
      const res = await fetch(`/api/content/posts/${id}/metrics`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? 'Failed to update metrics');
      return (await res.json()).post as ContentPost;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['content-posts'] });
      qc.invalidateQueries({ queryKey: ['content-calendar'] });
      if (songId) qc.invalidateQueries({ queryKey: contentPostsKey(songId) });
      toast.success('Metrics saved');
    },
    onError: (err: Error) => toast.error(err.message),
  });
}
