'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, RefreshCcw, Music2 } from 'lucide-react';
import { toast } from 'sonner';
import { MobilePageShell, CollapsibleFilterBar } from '@/components/v2/primitives';
import { Button } from '@/components/ui/button';
import { staggerContainer, listItem, fadeIn } from '@/lib/animations/variants';
import type { SpotifyMatch, PaginationInfo } from '@/components/dashboard/admin/spotify/types';
import { MatchCard } from './SpotifyQueue.MatchCard';

type TabValue = 'pending' | 'approved' | 'rejected';

const TAB_FILTERS = [
  { label: 'Pending', value: 'pending' },
  { label: 'Approved', value: 'approved' },
  { label: 'Rejected', value: 'rejected' },
];

/** v2 SpotifyQueue -- mobile-first swipeable song match queue. */
export function SpotifyQueueV2() {
  const [matches, setMatches] = useState<SpotifyMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<{
    matchId: string;
    action: 'approve' | 'reject';
  } | null>(null);
  const [activeTab, setActiveTab] = useState<TabValue>('pending');
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 20,
    total: 0,
    hasNext: false,
    hasPrev: false,
  });

  const fetchMatches = useCallback(
    async (status: string = 'pending', page: number = 1) => {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/spotify/matches?status=${status}&page=${page}&limit=20`
        );
        if (!res.ok) throw new Error('Failed to fetch');
        const data = await res.json();
        setMatches(data.matches || []);
        setPagination(data.pagination);
      } catch {
        toast.error('Failed to load Spotify matches');
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    fetchMatches(activeTab, 1);
  }, [activeTab, fetchMatches]);

  const handleAction = async (
    matchId: string,
    action: 'approve' | 'reject'
  ) => {
    setActionLoading({ matchId, action });
    try {
      const res = await fetch('/api/spotify/matches/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ matchId, action }),
      });
      if (!res.ok) throw new Error('Failed');
      toast.success(
        `Match ${action === 'approve' ? 'approved' : 'rejected'}`
      );
      setMatches((prev) => prev.filter((m) => m.id !== matchId));
      setPagination((prev) => ({
        ...prev,
        total: Math.max(0, prev.total - 1),
      }));
    } catch {
      toast.error(`Failed to ${action} match`);
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <MobilePageShell
      title="Spotify Queue"
      subtitle={`${pagination.total} ${activeTab} matches`}
      headerActions={
        <Button
          variant="ghost"
          size="icon"
          className="min-h-[44px] min-w-[44px]"
          onClick={() => fetchMatches(activeTab, pagination.page)}
          disabled={loading}
          aria-label="Refresh queue"
        >
          <RefreshCcw
            className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`}
          />
        </Button>
      }
    >
      <CollapsibleFilterBar
        filters={TAB_FILTERS}
        active={activeTab}
        onChange={(v) => setActiveTab((v as TabValue) ?? 'pending')}
        allLabel=""
      />

      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div
            key="loading"
            variants={fadeIn}
            initial="hidden"
            animate="visible"
            className="flex items-center justify-center py-12"
          >
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </motion.div>
        ) : matches.length === 0 ? (
          <motion.div
            key="empty"
            variants={fadeIn}
            initial="hidden"
            animate="visible"
            className="flex flex-col items-center justify-center py-16 px-4 text-center"
          >
            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
              <Music2 className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="text-base font-semibold mb-1">
              No {activeTab} matches
            </h3>
            <p className="text-sm text-muted-foreground max-w-xs">
              {activeTab === 'pending'
                ? 'All caught up! No matches need review.'
                : `${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} matches will appear here.`}
            </p>
          </motion.div>
        ) : (
          <motion.div
            key="list"
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="space-y-2"
          >
            {matches.map((match) => (
              <motion.div key={match.id} variants={listItem}>
                <MatchCard
                  match={match}
                  activeTab={activeTab}
                  actionLoading={actionLoading?.matchId === match.id ? actionLoading : null}
                  onApprove={(id) => handleAction(id, 'approve')}
                  onReject={(id) => handleAction(id, 'reject')}
                />
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {(pagination.hasNext || pagination.hasPrev) && (
        <div className="flex items-center justify-between pt-2">
          <Button
            variant="outline"
            size="sm"
            className="min-h-[44px]"
            onClick={() => fetchMatches(activeTab, pagination.page - 1)}
            disabled={!pagination.hasPrev || loading}
          >
            Previous
          </Button>
          <span className="text-xs text-muted-foreground">
            Page {pagination.page} of{' '}
            {Math.ceil(pagination.total / pagination.limit)}
          </span>
          <Button
            variant="outline"
            size="sm"
            className="min-h-[44px]"
            onClick={() => fetchMatches(activeTab, pagination.page + 1)}
            disabled={!pagination.hasNext || loading}
          >
            Next
          </Button>
        </div>
      )}
    </MobilePageShell>
  );
}
