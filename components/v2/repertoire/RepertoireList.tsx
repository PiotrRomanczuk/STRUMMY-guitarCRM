'use client';

import { lazy, Suspense, useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Music, Plus } from 'lucide-react';
import { useLayoutMode } from '@/hooks/use-is-widescreen';
import { staggerContainer, listItem } from '@/lib/animations/variants';
import { groupRepertoireItems } from '@/components/users/details/repertoire.helpers';
import type { StudentRepertoireWithSong } from '@/types/StudentRepertoire';
import { CollapsibleFilterBar } from '@/components/v2/primitives/CollapsibleFilterBar';
import { FloatingActionButton } from '@/components/v2/primitives/FloatingActionButton';
import { RepertoireCard } from './RepertoireCard';
import { Button } from '@/components/ui/button';

const DesktopView = lazy(() => import('./RepertoireList.Desktop'));

const FILTER_OPTIONS = [
  { value: 'to_learn', label: 'To Learn' },
  { value: 'started', label: 'Started' },
  { value: 'remembered', label: 'Remembered' },
  { value: 'with_author', label: 'With Author' },
  { value: 'mastered', label: 'Mastered' },
];

interface RepertoireListProps {
  repertoire: StudentRepertoireWithSong[];
  userId: string;
  viewMode?: 'teacher' | 'student';
  onAddSong?: () => void;
}

export function RepertoireList({
  repertoire,
  userId,
  viewMode = 'teacher',
  onAddSong,
}: RepertoireListProps) {
  const mode = useLayoutMode();

  if (mode !== 'mobile') {
    return (
      <Suspense
        fallback={
          <MobileRepertoireList
            repertoire={repertoire}
            userId={userId}
            viewMode={viewMode}
            onAddSong={onAddSong}
          />
        }
      >
        <DesktopView
          repertoire={repertoire}
          userId={userId}
          viewMode={viewMode}
          onAddSong={onAddSong}
        />
      </Suspense>
    );
  }

  return (
    <MobileRepertoireList
      repertoire={repertoire}
      userId={userId}
      viewMode={viewMode}
      onAddSong={onAddSong}
    />
  );
}

function MobileRepertoireList({
  repertoire,
  userId: _userId,
  viewMode,
  onAddSong,
}: RepertoireListProps) {
  const [filter, setFilter] = useState<string | null>(null);

  const filtered = useMemo(() => {
    if (!filter) return repertoire;
    return repertoire.filter((r) => r.current_status === filter);
  }, [repertoire, filter]);

  const grouped = useMemo(() => {
    return groupRepertoireItems(filtered, 'priority');
  }, [filtered]);

  return (
    <div className="px-4 space-y-4">
      <CollapsibleFilterBar
        filters={FILTER_OPTIONS}
        active={filter}
        onChange={setFilter}
      />

      {/* Grouped list */}
      {grouped.length === 0 || (grouped.length === 1 && grouped[0].items.length === 0) ? (
        <EmptyState onAddSong={onAddSong} viewMode={viewMode} />
      ) : (
        <div className="space-y-6">
          {grouped.map((group) => (
            <div key={group.label}>
              {group.label !== 'ungrouped' && (
                <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-2">
                  {group.label}
                  <span className="text-xs font-normal">({group.items.length})</span>
                </h3>
              )}
              <motion.div
                variants={staggerContainer}
                initial="hidden"
                animate="visible"
                className="space-y-2"
              >
                {group.items.map((item) => (
                  <motion.div key={item.id} variants={listItem}>
                    <RepertoireCard item={item} viewMode={viewMode} />
                  </motion.div>
                ))}
              </motion.div>
            </div>
          ))}
        </div>
      )}

      {/* FAB for adding songs (teacher view) */}
      {viewMode === 'teacher' && onAddSong && (
        <FloatingActionButton
          onClick={onAddSong}
          label="Add song to repertoire"
        />
      )}
    </div>
  );
}

function EmptyState({
  onAddSong,
  viewMode,
}: {
  onAddSong?: () => void;
  viewMode?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
        <Music className="h-6 w-6 text-muted-foreground" />
      </div>
      <h3 className="text-base font-semibold mb-1">No songs in repertoire</h3>
      <p className="text-sm text-muted-foreground mb-6 max-w-xs">
        {viewMode === 'teacher'
          ? 'Add songs to start tracking this student\'s progress.'
          : 'Your teacher hasn\'t added any songs yet.'}
      </p>
      {viewMode === 'teacher' && onAddSong && (
        <Button size="sm" onClick={onAddSong} className="gap-1">
          <Plus className="h-4 w-4" />
          Add Song
        </Button>
      )}
    </div>
  );
}

export default RepertoireList;
