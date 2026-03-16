'use client';

import {
  CheckCircle2,
  XCircle,
  Loader2,
} from 'lucide-react';
import Image from 'next/image';
import { SwipeableListItem } from '@/components/v2/primitives';
import { Button } from '@/components/ui/button';
import type { SpotifyMatch } from '@/components/dashboard/admin/spotify/types';

type TabValue = 'pending' | 'approved' | 'rejected';

function ConfidenceIndicator({ score }: { score: number }) {
  const color =
    score >= 70
      ? 'bg-green-500/10 text-green-600 dark:text-green-400'
      : score >= 50
        ? 'bg-primary/10 text-primary'
        : 'bg-destructive/10 text-destructive';

  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${color}`}
    >
      {score}% match
    </span>
  );
}

interface ActionLoading {
  matchId: string;
  action: 'approve' | 'reject';
}

export function MatchCard({
  match,
  activeTab,
  actionLoading,
  onApprove,
  onReject,
}: {
  match: SpotifyMatch;
  activeTab: TabValue;
  actionLoading: ActionLoading | null;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
}) {
  const isActionable = activeTab === 'pending';
  const isApproving = actionLoading?.matchId === match.id && actionLoading.action === 'approve';
  const isRejecting = actionLoading?.matchId === match.id && actionLoading.action === 'reject';
  const isLoading = isApproving || isRejecting;

  const content = (
    <div className="bg-card rounded-xl border border-border p-4 active:bg-muted/50 transition-colors">
      <div className="flex items-start gap-3">
        {match.spotify_cover_image_url && (
          <Image
            src={match.spotify_cover_image_url}
            alt={match.spotify_track_name}
            width={48}
            height={48}
            className="rounded-lg shrink-0"
          />
        )}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground truncate">
            {match.songs.title}
          </p>
          <p className="text-xs text-muted-foreground truncate">
            {match.spotify_track_name} - {match.spotify_artist_name}
          </p>
          <div className="flex items-center gap-2 mt-1">
            <ConfidenceIndicator score={match.confidence_score} />
          </div>
        </div>
      </div>
      {isActionable && (
        <div className="flex gap-2 mt-3">
          <Button
            size="sm"
            className="flex-1 min-h-[44px]"
            onClick={() => onApprove(match.id)}
            disabled={isLoading}
          >
            {isApproving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4 mr-1" />
                Approve
              </>
            )}
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="flex-1 min-h-[44px]"
            onClick={() => onReject(match.id)}
            disabled={isLoading}
          >
            {isRejecting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <XCircle className="h-4 w-4 mr-1" />
                Reject
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );

  if (!isActionable) return content;

  return (
    <SwipeableListItem
      onEdit={() => onApprove(match.id)}
      onDelete={() => onReject(match.id)}
    >
      {content}
    </SwipeableListItem>
  );
}
