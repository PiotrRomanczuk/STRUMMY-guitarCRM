'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Music, Search, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { MobilePageShell } from '@/components/v2/primitives/MobilePageShell';
import { CollapsibleFilterBar } from '@/components/v2/primitives/CollapsibleFilterBar';
import { SwipeableListItem } from '@/components/v2/primitives/SwipeableListItem';
import { fastStaggerContainer, listItem, safeVariants } from '@/lib/animations/variants';
import type { SongListV2Props } from './SongList';
import type { SongWithStatus } from '@/components/songs/types';
import { SongListEmpty } from './SongList.Empty';

const LEVEL_FILTERS = [
  { label: 'Beginner', value: 'beginner' },
  { label: 'Intermediate', value: 'intermediate' },
  { label: 'Advanced', value: 'advanced' },
];

const LEVEL_BADGE: Record<string, string> = {
  beginner: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  intermediate: 'bg-primary/10 text-primary',
  advanced: 'bg-destructive/10 text-red-600 dark:text-red-400',
};

export function SongListMobile({ songs, isTeacher }: SongListV2Props) {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [levelFilter, setLevelFilter] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let result = songs;
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      result = result.filter((s) => s.title?.toLowerCase().includes(q) || s.author?.toLowerCase().includes(q));
    }
    if (levelFilter) result = result.filter((s) => s.level === levelFilter);
    return result;
  }, [songs, search, levelFilter]);

  return (
    <MobilePageShell
      title="Songs"
      subtitle={`${songs.length} song${songs.length !== 1 ? 's' : ''}`}
      showBack={false}
      headerActions={
        isTeacher ? (
          <button
            type="button"
            onClick={() => router.push('/dashboard/songs/new')}
            className="w-9 h-9 rounded-full bg-foreground text-background flex items-center justify-center"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
        ) : undefined
      }
    >
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search songs..." value={search} onChange={(e) => setSearch(e.target.value)}
          className="pl-9 min-h-[44px] text-base bg-card border-border" />
      </div>

      <CollapsibleFilterBar filters={LEVEL_FILTERS} active={levelFilter} onChange={setLevelFilter} />

      {filtered.length === 0 ? (
        <SongListEmpty isTeacher={isTeacher} hasFilters={!!search || !!levelFilter} />
      ) : (
        <motion.div variants={safeVariants(fastStaggerContainer)} initial="hidden" animate="visible" className="space-y-2">
          {filtered.map((song) => (
            <motion.div key={song.id} variants={safeVariants(listItem)}>
              <SongCard song={song} isTeacher={isTeacher} />
            </motion.div>
          ))}
        </motion.div>
      )}
    </MobilePageShell>
  );
}

function SongCard({ song, isTeacher }: { song: SongWithStatus; isTeacher: boolean }) {
  const router = useRouter();
  return (
    <SwipeableListItem onEdit={isTeacher ? () => router.push(`/dashboard/songs/${song.id}/edit`) : undefined}>
      <Link
        href={`/dashboard/songs/${song.id}`}
        className="flex items-center gap-3 p-3.5 bg-card border border-border rounded-[10px] active:bg-muted/30 transition-colors"
      >
        {/* Key/cover tile */}
        <div className="relative w-12 h-12 rounded-md overflow-hidden shrink-0 bg-gradient-to-br from-primary/40 to-primary flex items-center justify-center shadow-[inset_0_-1px_0_rgba(0,0,0,.2)]">
          {song.cover_image_url ? (
            <Image src={song.cover_image_url} alt="" fill sizes="48px" className="object-cover" />
          ) : (
            <span className="font-serif text-sm font-medium text-primary-foreground">
              {song.key || song.title?.charAt(0) || '♪'}
            </span>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <p className="font-serif text-[15px] font-medium italic truncate">{song.title || 'Untitled'}</p>
          <p className="text-xs text-muted-foreground font-mono truncate mt-0.5">
            {song.author || 'Unknown artist'}
            {song.key && <> · {song.key}</>}
          </p>
        </div>

        {song.level && (
          <span className={cn(
            'inline-flex items-center rounded px-2 py-0.5 text-[10px] font-medium uppercase tracking-[.06em] shrink-0',
            LEVEL_BADGE[song.level] ?? 'bg-muted text-muted-foreground'
          )}>
            {song.level}
          </span>
        )}
      </Link>
    </SwipeableListItem>
  );
}
