'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Guitar, Music2, ExternalLink, Calendar, Clock, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { SongWithStatus as Song } from '@/components/songs/types';
import { createClient } from '@/lib/supabase/client';
import { logger } from '@/lib/logger';

const difficultyColors = {
  beginner: 'bg-green-500/10 text-green-500 border-green-500/20',
  intermediate: 'bg-primary/10 text-primary border-primary/20',
  advanced: 'bg-destructive/10 text-destructive border-destructive/20',
};

const difficultyLabels = {
  beginner: 'Beginner',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
};

const statusColors: Record<string, string> = {
  to_learn: 'bg-slate-500/10 text-slate-500 border-slate-500/20',
  started: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  remembered: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
  with_author: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
  mastered: 'bg-green-500/10 text-green-500 border-green-500/20',
};

const statusLabels: Record<string, string> = {
  to_learn: 'To Learn',
  started: 'Started',
  remembered: 'Remembered',
  with_author: 'Play Along',
  mastered: 'Mastered',
};

export function StudentSongDetailPageClient() {
  const params = useParams();
  const id = params?.id as string;
  const [song, setSong] = useState<Song | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function fetchSong() {
      if (!id) return;

      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) return;

        // Fetch song details and status
        // We use maybeSingle() because RLS might return no rows if access is denied
        const { data, error } = await supabase
          .from('songs')
          .select(
            `
            *,
            lesson_songs!inner (
              status,
              lessons!inner (
                student_id
              )
            )
          `
          )
          .eq('id', id)
          .eq('lesson_songs.lessons.student_id', user.id)
          .maybeSingle();

        if (error) throw error;

        if (data) {
          // Extract status from the first matching lesson_song
          const userLessonSongs = (
            data.lesson_songs as unknown as { status: string; lessons: { student_id: string } }[]
          ).filter((ls) => ls.lessons.student_id === user.id);
          const status = userLessonSongs.length > 0 ? userLessonSongs[0].status : undefined;

          setSong({
            ...data,
            status,
          });
        } else {
          setSong(null);
        }
      } catch (error) {
        logger.error('Error fetching song:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchSong();
  }, [id, supabase]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!song) {
    return (
      <div className="min-h-screen bg-background p-8 flex flex-col items-center justify-center">
        <h1 className="text-2xl font-bold mb-4">Song not found</h1>
        <p className="text-muted-foreground mb-6">
          You don&apos;t have access to this song or it doesn&apos;t exist.
        </p>
        <Link href="/dashboard/songs">
          <Button>Back to Songs</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div
        className="max-w-4xl mx-auto opacity-0 animate-fade-in"
        style={{ animationFillMode: 'forwards' }}
      >
        <Link
          href="/dashboard/songs"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-primary mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Songs
        </Link>

        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <div className="p-8 border-b border-border">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
              <div className="flex items-start gap-6">
                <div className="w-20 h-20 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <Music2 className="w-10 h-10 text-primary" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold mb-2">{song.title}</h1>
                  <p className="text-xl text-muted-foreground mb-4">{song.author}</p>
                  <div className="flex flex-wrap gap-3">
                    <Badge
                      variant="outline"
                      className={cn('capitalize', difficultyColors[song.level || 'beginner'])}
                    >
                      {difficultyLabels[song.level || 'beginner']}
                    </Badge>
                    <Badge variant="outline" className="bg-secondary/50">
                      <Guitar className="w-3 h-3 mr-1" />
                      Key: {song.key}
                    </Badge>
                    {song.status && (
                      <Badge
                        variant="outline"
                        className={cn(
                          'capitalize',
                          statusColors[song.status] || 'bg-gray-100 text-gray-800'
                        )}
                      >
                        {statusLabels[song.status] || song.status.replace('_', ' ')}
                      </Badge>
                    )}
                    <Badge variant="outline" className="bg-secondary/50">
                      <Calendar className="w-3 h-3 mr-1" />
                      Added:{' '}
                      {song.created_at ? new Date(song.created_at).toLocaleDateString() : 'Unknown'}
                    </Badge>
                  </div>
                </div>
              </div>

              {song.ultimate_guitar_link && (
                <Button asChild className="shrink-0">
                  <a href={song.ultimate_guitar_link} target="_blank" rel="noopener noreferrer">
                    View Tabs <ExternalLink className="w-4 h-4 ml-2" />
                  </a>
                </Button>
              )}
            </div>
          </div>

          <div className="p-8 space-y-8">
            {song.chords && (
              <div>
                <h3 className="text-lg font-semibold mb-4 flex items-center">
                  <Music2 className="w-5 h-5 mr-2 text-primary" />
                  Chords Progression
                </h3>
                <div className="bg-secondary/30 rounded-lg p-6 border border-border">
                  <p className="text-lg font-mono tracking-wide">{song.chords}</p>
                </div>
              </div>
            )}

            {/* Placeholder for future content like lyrics, notes, etc. */}
            <div>
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <Clock className="w-5 h-5 mr-2 text-primary" />
                Practice History
              </h3>
              <div className="text-muted-foreground text-sm italic">
                No practice sessions recorded yet.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
