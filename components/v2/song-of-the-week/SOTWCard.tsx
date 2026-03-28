'use client';

import { useState, useTransition } from 'react';
import { motion } from 'framer-motion';
import { Star, Music2, Loader2, RefreshCw, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cardEntrance } from '@/lib/animations/variants';
import { toast } from 'sonner';
import { deactivateSongOfTheWeek } from '@/app/actions/song-of-the-week';
import type { SongOfTheWeekWithSong } from '@/types/SongOfTheWeek';
import { SOTWCardContent } from './SOTWCard.Content';
import { SOTWPicker } from './SOTWPicker';

interface SOTWCardProps {
  sotw: SongOfTheWeekWithSong | null;
  sotwInRepertoire?: boolean;
  isAdmin?: boolean;
  isStudent?: boolean;
}

export function SOTWCard({
  sotw,
  sotwInRepertoire = false,
  isAdmin = false,
  isStudent = false,
}: SOTWCardProps) {
  const [pickerOpen, setPickerOpen] = useState(false);

  if (!sotw && !isAdmin) return null;

  return (
    <>
      <motion.div
        variants={cardEntrance}
        initial="hidden"
        animate="visible"
        className="bg-gradient-to-br from-primary/5 to-transparent rounded-xl shadow-sm overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 pt-4 pb-2">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-md bg-primary/10">
              <Star className="h-4 w-4 text-primary fill-primary" />
            </div>
            <h3 className="text-sm font-semibold">Song of the Week</h3>
          </div>
          {isAdmin && sotw && (
            <AdminControls
              sotwId={sotw.id}
              onChangeSong={() => setPickerOpen(true)}
            />
          )}
        </div>

        {sotw ? (
          <SOTWCardContent
            sotw={sotw}
            isStudent={isStudent}
            sotwInRepertoire={sotwInRepertoire}
          />
        ) : (
          <EmptyState onSelectSong={() => setPickerOpen(true)} />
        )}
      </motion.div>

      {isAdmin && pickerOpen && (
        <SOTWPicker onClose={() => setPickerOpen(false)} />
      )}
    </>
  );
}

function AdminControls({
  sotwId,
  onChangeSong,
}: {
  sotwId: string;
  onChangeSong: () => void;
}) {
  const [isPending, startTransition] = useTransition();

  const handleRemove = () => {
    startTransition(async () => {
      const result = await deactivateSongOfTheWeek(sotwId);
      if ('error' in result) {
        toast.error(result.error);
      } else {
        toast.success('Song of the week removed');
      }
    });
  };

  return (
    <div className="flex gap-1">
      <button
        type="button"
        onClick={onChangeSong}
        className="p-2.5 rounded-lg hover:bg-muted/50 transition-colors"
        aria-label="Change song"
      >
        <RefreshCw className="h-4 w-4 text-muted-foreground" />
      </button>
      <button
        type="button"
        onClick={handleRemove}
        disabled={isPending}
        className="p-2.5 rounded-lg hover:bg-destructive/10 transition-colors"
        aria-label="Remove song of the week"
      >
        {isPending ? (
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        ) : (
          <X className="h-4 w-4 text-muted-foreground" />
        )}
      </button>
    </div>
  );
}

function EmptyState({ onSelectSong }: { onSelectSong: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
      <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
        <Music2 className="h-6 w-6 text-muted-foreground" />
      </div>
      <p className="text-sm text-muted-foreground mb-4">
        No song of the week selected yet.
      </p>
      <Button size="sm" className="min-h-[44px]" onClick={onSelectSong}>
        Select a Song
      </Button>
    </div>
  );
}
