import { parseChordsColumn } from '@/lib/music-theory/chord-parser';
import type { Song } from '@/components/songs/types';
import type {
  RelatedSongRow,
  SongLearner,
  SongUsageStats,
} from '@/lib/services/song-detail-queries';

import { SongChordsCardEditorial } from './SongChordsCardEditorial';
import { SongHeroEditorial } from './SongHeroEditorial';
import { LearnersCard, RelatedCard, UsageCard } from './SongSidebarEditorial';

type Props = {
  song: Song;
  stats: SongUsageStats;
  learners: SongLearner[];
  related: RelatedSongRow[];
};

const chordTokensFromSong = (song: Song): string[] => {
  const parsed = parseChordsColumn(song.chords);
  const seen = new Set<string>();
  const tokens: string[] = [];
  for (const c of parsed) {
    if (seen.has(c.raw)) continue;
    seen.add(c.raw);
    tokens.push(c.raw);
  }
  return tokens;
};

export const SongDetailEditorial = ({ song, stats, learners, related }: Props) => {
  const chordTokens = chordTokensFromSong(song);

  return (
    <div
      style={{
        background: 'var(--ivory)',
        color: 'var(--ink)',
        fontSize: 13,
        lineHeight: 1.4,
        minHeight: '100%',
        padding: '0 0 60px',
      }}
    >
      <SongHeroEditorial song={song} chordTokens={chordTokens} />
      <div
        style={{
          padding: '24px 32px 0',
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1.5fr) minmax(0, 1fr)',
          gap: 24,
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20, minWidth: 0 }}>
          <SongChordsCardEditorial title={song.title ?? 'this song'} chordTokens={chordTokens} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <UsageCard stats={stats} />
          <LearnersCard learners={learners} />
          <RelatedCard related={related} />
        </div>
      </div>
    </div>
  );
};
