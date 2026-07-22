import { parseChordsColumn } from '@/lib/music-theory/chord-parser';
import type { Song } from '@/components/songs/types';
import type {
  RelatedSongRow,
  SongLearner,
  SongUsageStats,
} from '@/lib/services/song-detail-queries';

import { SongChordsCardEditorial } from './SongChordsCardEditorial';
import { SongDetailTabs } from './SongDetailTabs';
import { SongHeroEditorial } from './SongHeroEditorial';
import { LearnersCard, RelatedCard, UsageCard, YourProgressCard } from './SongSidebarEditorial';

type Props = {
  song: Song;
  stats: SongUsageStats;
  learners: SongLearner[];
  related: RelatedSongRow[];
  /** Teacher/admin only — gates the Production tab. Students never see it. */
  canSeeProduction: boolean;
  /** Teacher/admin only — shows the "Edit song" link in the hero. */
  canEdit?: boolean;
};

const upperCaseChordRoots = (chords: string | null | undefined): string => {
  if (!chords) return '';
  return chords.replace(/(^|[,\s{])([a-g])/g, (_, sep, c) => `${sep}${c.toUpperCase()}`);
};

const chordTokensFromSong = (song: Song): string[] => {
  const parsed = parseChordsColumn(upperCaseChordRoots(song.chords));
  const seen = new Set<string>();
  const tokens: string[] = [];
  for (const c of parsed) {
    if (seen.has(c.raw)) continue;
    seen.add(c.raw);
    tokens.push(c.raw);
  }
  return tokens;
};

export const SongDetailEditorial = ({
  song,
  stats,
  learners,
  related,
  canSeeProduction,
  canEdit = false,
}: Props) => {
  const chordTokens = chordTokensFromSong(song);

  // Students get their own progress, not studio analytics phrased for staff.
  const isStaffViewer = canSeeProduction;

  const overview = (
    <div className="ed-grid-hero" style={{ padding: '24px 32px 0' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20, minWidth: 0 }}>
        <SongChordsCardEditorial title={song.title ?? 'this song'} chordTokens={chordTokens} />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {isStaffViewer ? (
          <>
            <UsageCard stats={stats} />
            <LearnersCard learners={learners} />
          </>
        ) : (
          <YourProgressCard learner={learners[0] ?? null} />
        )}
        <RelatedCard related={related} />
      </div>
    </div>
  );

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
      <SongHeroEditorial song={song} chordTokens={chordTokens} canEdit={canEdit} />
      {canSeeProduction ? <SongDetailTabs songId={song.id} overview={overview} /> : overview}
    </div>
  );
};
