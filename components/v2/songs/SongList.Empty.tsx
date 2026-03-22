import Link from 'next/link';
import { Music } from 'lucide-react';

interface SongListEmptyProps {
  isTeacher: boolean;
  hasFilters: boolean;
}

export function SongListEmpty({ isTeacher, hasFilters }: SongListEmptyProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="w-12 h-12 rounded-full bg-card flex items-center justify-center mb-4">
        <Music className="h-6 w-6 text-muted-foreground" />
      </div>
      <h3 className="text-base font-semibold text-foreground mb-2">
        {hasFilters ? 'No matching songs' : 'No songs yet'}
      </h3>
      <p className="text-sm text-muted-foreground mb-8 max-w-[280px] leading-relaxed">
        {hasFilters
          ? 'Try adjusting your filters or search term.'
          : isTeacher
            ? 'Add your first song to start building your library.'
            : 'Your teacher has not added any songs yet.'}
      </p>
      {isTeacher && !hasFilters && (
        <Link
          href="/dashboard/songs/new"
          className="inline-flex items-center h-11 px-10 rounded-[10px] bg-gradient-to-br from-primary to-primary/80 text-primary-foreground font-bold shadow-lg shadow-primary/10 active:scale-95 transition-transform"
        >
          New Song
        </Link>
      )}
    </div>
  );
}
