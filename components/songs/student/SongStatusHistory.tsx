'use client';
 

import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { History, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { logger } from '@/lib/logger';

interface StatusChange {
  id: string;
  previous_status: string | null;
  new_status: string;
  changed_at: string;
  notes: string | null;
}

interface SongStatusHistoryProps {
  songId: string;
  className?: string;
}

const statusLabels: Record<string, string> = {
  to_learn: '📝 To Learn',
  learning: '🎵 Learning',
  practicing: '🎸 Practicing',
  improving: '📈 Improving',
  mastered: '🎯 Mastered',
  // Legacy statuses
  started: '▶️ Started',
  remembered: '🧠 Remembered',
  with_author: '🎵 Play Along',
};

const statusColors: Record<string, string> = {
  to_learn: 'bg-muted text-muted-foreground border-border',
  learning: 'bg-primary/10 text-primary border-primary/20',
  practicing: 'bg-warning/10 text-warning border-warning/20',
  improving: 'bg-warning/10 text-warning border-warning/20',
  mastered: 'bg-success/10 text-success border-success/20',
  // Legacy statuses
  started: 'bg-primary/10 text-primary border-primary/20',
  remembered: 'bg-warning/10 text-warning border-warning/20',
  with_author: 'bg-primary/10 text-primary border-primary/20',
};

export function SongStatusHistory({ songId, className }: SongStatusHistoryProps) {
  const [history, setHistory] = useState<StatusChange[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      if (!songId) return;

      try {
        const response = await fetch(`/api/student/song-status?songId=${songId}`);
        if (response.ok) {
          const result = await response.json();
          setHistory(result.data || []);
        }
      } catch (error) {
        logger.error('Failed to fetch status history:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [songId]);

  if (loading) {
    return (
      <Card className={cn('animate-pulse', className)}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Progress History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-4">
                <div className="w-20 h-6 bg-muted rounded"></div>
                <div className="w-4 h-4 bg-muted rounded-full"></div>
                <div className="w-20 h-6 bg-muted rounded"></div>
                <div className="flex-1 h-4 bg-muted rounded"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (history.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Progress History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No status changes yet</p>
            <p className="text-sm">
              Your progress history will appear here as you update your learning status.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="h-5 w-5" />
          Progress History ({history.length} changes)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {history.map((change, _index) => (
            <div
              key={change.id}
              className="flex items-start gap-4 pb-4 border-b last:border-b-0 last:pb-0"
            >
              <div className="flex-shrink-0 w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center">
                <div className="w-2 h-2 bg-primary rounded-full"></div>
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-2">
                  <div className="flex items-center gap-2">
                    {change.previous_status && (
                      <>
                        <Badge
                          variant="outline"
                          className={cn(
                            'text-xs font-medium',
                            statusColors[change.previous_status] || statusColors.to_learn
                          )}
                        >
                          {statusLabels[change.previous_status] || change.previous_status}
                        </Badge>
                        <span className="text-muted-foreground">→</span>
                      </>
                    )}
                    <Badge
                      variant="outline"
                      className={cn(
                        'text-xs font-medium',
                        statusColors[change.new_status] || statusColors.to_learn
                      )}
                    >
                      {statusLabels[change.new_status] || change.new_status}
                    </Badge>
                  </div>

                  <time className="text-xs text-muted-foreground">
                    {format(new Date(change.changed_at), "MMM d, yyyy 'at' h:mm a")}
                  </time>
                </div>

                {change.notes && (
                  <p className="text-sm text-muted-foreground bg-muted/50 rounded-md p-2 mt-2">
                    {change.notes}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
