import { useQuery } from '@tanstack/react-query';
import type { SongStatsTeaching } from '@/types/SongStatsEngagement';

async function fetchTeachingStats(): Promise<SongStatsTeaching> {
  const res = await fetch('/api/song/stats/engagement');
  if (!res.ok) throw new Error('Failed to fetch teaching stats');
  return res.json();
}

export function useSongStatsEngagement() {
  return useQuery<SongStatsTeaching>({
    queryKey: ['song-stats-engagement'],
    queryFn: fetchTeachingStats,
    staleTime: 5 * 60 * 1000,
  });
}
