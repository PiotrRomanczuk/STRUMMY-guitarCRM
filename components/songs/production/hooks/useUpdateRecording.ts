'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { SongVideo } from '@/types/SongVideo';
import type { z } from 'zod';
import { UpdateSongVideoInputSchema } from '@/schemas/SongVideoSchema';

export type UpdateRecordingInput = z.infer<typeof UpdateSongVideoInputSchema>;

export function useUpdateRecording(songId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ videoId, input }: { videoId: string; input: UpdateRecordingInput }) => {
      const res = await fetch(`/api/song/${songId}/videos/${videoId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? 'Failed to update recording');
      return (await res.json()).video as SongVideo;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['song-videos', songId] });
      toast.success('Recording updated');
    },
    onError: (err: Error) => toast.error(err.message),
  });
}
