'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Music, Pencil, Trash2, MoreHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { MobilePageShell } from '@/components/v2/primitives/MobilePageShell';
import { BottomActionSheet } from '@/components/v2/primitives/BottomActionSheet';
import { InfoTab } from './SongDetail.InfoTab';
import { LyricsViewer } from './LyricsViewer';
import { VideoPlayer } from './VideoPlayer';
import type { SongDetailV2Props } from './SongDetail';

type Tab = 'info' | 'lyrics' | 'video';

export function SongDetailMobile({ song, isTeacher, onDelete }: SongDetailV2Props) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>('info');
  const [showActions, setShowActions] = useState(false);

  if (!song) {
    return (
      <MobilePageShell title="Song not found">
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
          <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
            <Music className="h-6 w-6 text-muted-foreground" />
          </div>
          <h3 className="text-base font-semibold mb-1">Song not found</h3>
          <p className="text-sm text-muted-foreground mb-6 max-w-xs">
            This song may have been deleted or you do not have permission to view it.
          </p>
          <Button size="sm" onClick={() => router.push('/dashboard/songs')}>
            Back to songs
          </Button>
        </div>
      </MobilePageShell>
    );
  }

  const tabs: { key: Tab; label: string }[] = [
    { key: 'info', label: 'Info' },
    ...(song.lyrics_with_chords ? [{ key: 'lyrics' as Tab, label: 'Lyrics' }] : []),
    ...(song.youtube_url ? [{ key: 'video' as Tab, label: 'Video' }] : []),
  ];

  return (
    <MobilePageShell
      title={song.title || 'Untitled'}
      subtitle={song.author || 'Unknown artist'}
      headerActions={
        isTeacher ? (
          <Button
            variant="ghost"
            size="icon"
            className="min-h-[44px] min-w-[44px]"
            onClick={() => setShowActions(true)}
            aria-label="Song actions"
          >
            <MoreHorizontal className="h-5 w-5" />
          </Button>
        ) : undefined
      }
    >
      {/* Cover image */}
      {song.cover_image_url && (
        <div className="relative w-full aspect-square max-h-48 rounded-xl overflow-hidden bg-muted">
          <Image
            src={song.cover_image_url}
            alt={`${song.title} cover`}
            fill
            className="object-cover"
            priority
          />
        </div>
      )}

      {/* Tab bar */}
      {tabs.length > 1 && (
        <div
          className="flex border-b border-border -mx-4 px-4"
          role="tablist"
          aria-label="Song details"
        >
          {tabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              role="tab"
              id={`tab-${tab.key}`}
              aria-selected={activeTab === tab.key}
              aria-controls={`tabpanel-${tab.key}`}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                'flex-1 py-3 text-sm font-medium text-center transition-colors min-h-[44px]',
                activeTab === tab.key
                  ? 'text-primary border-b-[3px] border-primary'
                  : 'text-muted-foreground border-b border-transparent'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      )}

      {/* Tab content */}
      <div
        role="tabpanel"
        id={`tabpanel-${activeTab}`}
        aria-labelledby={`tab-${activeTab}`}
      >
        {activeTab === 'info' && <InfoTab song={song} />}
        {activeTab === 'lyrics' && <LyricsViewer text={song.lyrics_with_chords ?? ''} />}
        {activeTab === 'video' && <VideoPlayer url={song.youtube_url ?? ''} />}
      </div>

      {/* Actions sheet */}
      {isTeacher && (
        <BottomActionSheet
          open={showActions}
          onOpenChange={setShowActions}
          title="Song Actions"
          subtitle={song.title || 'Untitled'}
          actions={[
            {
              icon: <Pencil className="h-5 w-5" />,
              label: 'Edit Song',
              onClick: () => router.push(`/dashboard/songs/${song.id}/edit`),
            },
            {
              icon: <Trash2 className="h-5 w-5" />,
              label: 'Delete Song',
              onClick: () => onDelete?.(),
              variant: 'destructive',
            },
          ]}
        />
      )}
    </MobilePageShell>
  );
}
