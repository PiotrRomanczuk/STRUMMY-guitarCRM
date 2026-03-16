import Link from 'next/link';
import { Music } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SongListEmptyProps {
  isTeacher: boolean;
  hasFilters: boolean;
}

export function SongListEmpty({ isTeacher, hasFilters }: SongListEmptyProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
        <Music className="h-6 w-6 text-muted-foreground" />
      </div>
      <h3 className="text-base font-semibold mb-1">
        {hasFilters ? 'No matching songs' : 'No songs yet'}
      </h3>
      <p className="text-sm text-muted-foreground mb-6 max-w-xs">
        {hasFilters
          ? 'Try adjusting your filters or search term.'
          : isTeacher
            ? 'Add your first song to start building your library.'
            : 'Your teacher has not added any songs yet.'}
      </p>
      {isTeacher && !hasFilters && (
        <Button size="sm" asChild>
          <Link href="/dashboard/songs/new">Add a song</Link>
        </Button>
      )}
    </div>
  );
}
