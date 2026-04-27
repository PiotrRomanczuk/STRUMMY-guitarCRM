'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Clapperboard, Send } from 'lucide-react';
import RecordingList from './RecordingList';
import PostList from './PostList';

interface Props {
  songId: string;
}

export default function ProductionTab({ songId }: Props) {
  return (
    <div className="space-y-4">
      <Card className="bg-card border-border/50 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Clapperboard className="h-5 w-5 text-primary" />
            Recordings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <RecordingList songId={songId} />
        </CardContent>
      </Card>

      <Card className="bg-card border-border/50 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Send className="h-5 w-5 text-primary" />
            Content posts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <PostList songId={songId} />
        </CardContent>
      </Card>
    </div>
  );
}
