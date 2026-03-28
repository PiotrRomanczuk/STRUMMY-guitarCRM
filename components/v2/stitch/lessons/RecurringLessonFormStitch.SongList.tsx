'use client';

interface SelectedSong {
  id: string;
  title: string;
  author: string;
}

interface SelectedSongListProps {
  songs: SelectedSong[];
}

export function SelectedSongList({ songs }: SelectedSongListProps) {
  return (
    <>
      {songs.map((song: SelectedSong) => (
        <div
          key={song.id}
          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-stone-100 dark:bg-stone-800 text-sm"
        >
          <span className="flex-1 font-medium text-stone-900 dark:text-stone-100">
            {song.title}
          </span>
          <span className="text-xs text-stone-500">{song.author}</span>
        </div>
      ))}
    </>
  );
}
