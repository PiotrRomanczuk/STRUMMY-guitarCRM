'use client';

import { lazy, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { useLayoutMode } from '@/hooks/use-is-widescreen';
import { Button } from '@/components/ui/button';
import { SongDetailMobile } from './SongDetail.Mobile';
import { SongDetailSkeleton } from './SongDetail.Skeleton';
import type { Song } from '@/components/songs/types';

const SongDetailDesktop = lazy(() => import('./SongDetail.Desktop'));

export interface SongDetailV2Props {
  songId: string;
  song: Song | null;
  loading: boolean;
  error: string | null;
  isTeacher: boolean;
  onDelete?: () => void;
}

export function SongDetailV2(props: SongDetailV2Props) {
  const mode = useLayoutMode();

  if (props.loading) return <SongDetailSkeleton />;

  if (props.error) return <SongDetailError error={props.error} />;

  if (mode === 'mobile') return <SongDetailMobile {...props} />;

  return (
    <Suspense fallback={<SongDetailMobile {...props} />}>
      <SongDetailDesktop {...props} />
    </Suspense>
  );
}

function SongDetailError({ error }: { error: string }) {
  const router = useRouter();

  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
        <AlertCircle className="h-6 w-6 text-destructive" />
      </div>
      <h3 className="text-base font-semibold mb-1">Failed to load song</h3>
      <p className="text-sm text-muted-foreground mb-6 max-w-xs">{error}</p>
      <div className="flex items-center gap-3">
        <Button size="sm" variant="outline" onClick={() => router.refresh()}>
          <RefreshCw className="h-4 w-4 mr-1.5" />
          Retry
        </Button>
        <Button size="sm" onClick={() => router.push('/dashboard/songs')}>
          Back to songs
        </Button>
      </div>
    </div>
  );
}
