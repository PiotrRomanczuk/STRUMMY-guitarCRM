'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from '@/components/ui/tooltip';
import { Music2, Guitar, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { SongWithStatus as Song } from '@/components/songs/types';
import { getStatusBadgeClasses } from '@/lib/utils/status-colors';
import { cardEntrance } from '@/lib/animations';
import { useHaptic } from '@/hooks/use-haptic';
import {
  difficultyColors,
  difficultyLabels,
  statusLabels,
  statusLabelsWithEmoji,
  statusDescriptions,
} from './StudentSongs.constants';
import { StudentSongCardResources } from './StudentSongCard.Resources';

const STATUS_KEYS = ['to_learn', 'learning', 'practicing', 'improving', 'mastered'] as const;

interface StudentSongCardProps {
  song: Song;
  onStatusChange: (songId: string, newStatus: string) => void;
  isUpdating: boolean;
}

export function StudentSongCard({ song, onStatusChange, isUpdating }: StudentSongCardProps) {
  const haptic = useHaptic();

  return (
    <motion.div
      variants={cardEntrance}
      initial="hidden"
      animate="visible"
      whileHover={{ y: -4, scale: 1.01 }}
      whileTap={{ scale: 0.98 }}
      className="group bg-card rounded-xl border border-border overflow-hidden hover:border-primary/30 hover:shadow-lg transition-all duration-300"
    >
      <div className="p-4 sm:p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center overflow-hidden relative">
            {song.cover_image_url ? (
              <Image
                src={song.cover_image_url}
                alt={song.title}
                fill
                className="object-cover"
              />
            ) : (
              <Music2 className="w-6 h-6 text-primary" />
            )}
          </div>
          <div className="flex flex-col items-end gap-2">
            <Badge
              variant="outline"
              className={cn('capitalize', difficultyColors[song.level || 'beginner'])}
            >
              {difficultyLabels[song.level || 'beginner']}
            </Badge>
            {song.status && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge
                    variant="outline"
                    className={cn('capitalize cursor-help', getStatusBadgeClasses('song', song.status))}
                  >
                    {statusLabels[song.status] || song.status.replace('_', ' ')}
                  </Badge>
                </TooltipTrigger>
                <TooltipContent side="left" className="max-w-[220px]">
                  {statusDescriptions[song.status] || song.status.replace('_', ' ')}
                </TooltipContent>
              </Tooltip>
            )}
          </div>
        </div>

        {/* Song Info */}
        <h3 className="font-semibold text-lg mb-1 group-hover:text-primary transition-colors truncate">
          {song.title}
        </h3>
        <p className="text-muted-foreground text-sm mb-4 truncate">{song.author}</p>

        {/* Details */}
        <div className="space-y-2 mb-6">
          <div className="flex items-center text-sm text-muted-foreground">
            <Guitar className="w-4 h-4 mr-2" />
            Key: {song.key}
          </div>
          {song.chords && (
            <div className="flex items-center text-sm text-muted-foreground">
              <Music2 className="w-4 h-4 mr-2" />
              Chords: {song.chords}
            </div>
          )}
        </div>

        {/* Status Update */}
        <div className="space-y-2 mb-4">
          <label className="text-xs font-medium text-muted-foreground">
            Learning Progress
          </label>
          <Select
            value={song.status || 'to_learn'}
            onValueChange={(newStatus) => {
              haptic(newStatus === 'mastered' ? 'success' : 'light');
              onStatusChange(song.id, newStatus);
            }}
            disabled={isUpdating}
          >
            <SelectTrigger className="h-11 sm:h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUS_KEYS.map((key) => (
                <SelectItem
                  key={key}
                  value={key}
                  description={statusDescriptions[key]}
                >
                  {statusLabelsWithEmoji[key]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {isUpdating && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Loader2 className="w-3 h-3 animate-spin" />
              Updating...
            </div>
          )}
        </div>

        {/* Resources */}
        <StudentSongCardResources song={song} />
      </div>
    </motion.div>
  );
}
