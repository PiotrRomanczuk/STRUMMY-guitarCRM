'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { HashtagSet } from '@/types/HashtagSet';
import type { CreateHashtagSetInput, UpdateHashtagSetInput } from '@/schemas/HashtagSetSchema';

const KEY = ['hashtag-sets'] as const;

async function fetchSets(): Promise<HashtagSet[]> {
  const res = await fetch('/api/content/hashtag-sets');
  if (!res.ok) throw new Error('Failed to load hashtag sets');
  return ((await res.json()).hashtagSets ?? []) as HashtagSet[];
}

export function useHashtagSets() {
  return useQuery({ queryKey: KEY, queryFn: fetchSets });
}

export function useCreateHashtagSet() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateHashtagSetInput) => {
      const res = await fetch('/api/content/hashtag-sets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? 'Failed');
      return (await res.json()).hashtagSet as HashtagSet;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY });
      toast.success('Hashtag set created');
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useUpdateHashtagSet() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, input }: { id: string; input: UpdateHashtagSetInput }) => {
      const res = await fetch(`/api/content/hashtag-sets/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? 'Failed');
      return (await res.json()).hashtagSet as HashtagSet;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY });
      toast.success('Hashtag set updated');
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useDeleteHashtagSet() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/content/hashtag-sets/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error((await res.json()).error ?? 'Failed');
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY });
      toast.success('Hashtag set deleted');
    },
    onError: (err: Error) => toast.error(err.message),
  });
}
